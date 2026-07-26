import { one, run, logError } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getConfig } from "@/lib/config";
import { streamCompletion, estimateTokens, isAIConfigured } from "@/lib/ai";
import { guestKeyFromRequest, checkLimit, incrementUsage } from "@/lib/usage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_HISTORY = 24; // keep the last N turns to bound cost
const MAX_LEN = 8000; // per-message character cap
const MAX_IMAGES = 4; // images attached to a single turn
const MAX_IMAGE_CHARS = 8_000_000; // ~6MB base64 per image cap

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req) {
  const user = await getSession();
  const userKey = user ? `user:${user.id}` : guestKeyFromRequest(req);

  // --- AI availability guard (honest failure, no simulated reply) ---
  if (!isAIConfigured()) {
    return json(
      {
        error:
          "Serviciul AI nu este configurat momentan. Adaugă cheia OPENAI_API_KEY în fișierul .env.local și repornește aplicația.",
        code: "AI_NOT_CONFIGURED",
      },
      503
    );
  }

  // --- Rate limiting / usage guard ---
  const limit = await checkLimit(userKey, user);
  if (!limit.allowed) {
    return json(
      {
        error: user
          ? "Ai atins limita zilnică de mesaje pentru planul tău. Revino mâine sau treci la Premium."
          : "Ai atins limita de mesaje pentru vizitatori. Creează un cont gratuit pentru a continua.",
        code: "RATE_LIMIT",
        limit: limit.limit,
      },
      429
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Cerere invalidă." }, 400);
  }

  let { messages, conversationId, images } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return json({ error: "Lipsește mesajul." }, 400);
  }

  // Validate + sanitise text history
  messages = messages
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_LEN) }));

  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser) return json({ error: "Lipsește întrebarea." }, 400);

  // Validate images (data URLs) attached to the current turn
  const validImages = Array.isArray(images)
    ? images
        .filter(
          (u) => typeof u === "string" && u.startsWith("data:image/") && u.length <= MAX_IMAGE_CHARS
        )
        .slice(0, MAX_IMAGES)
    : [];

  // Build the payload sent to the model: attach images to the last user turn
  // as a multimodal content array (real vision), while the DB keeps text only.
  const aiMessages = messages.map((m) => ({ ...m }));
  if (validImages.length) {
    for (let i = aiMessages.length - 1; i >= 0; i--) {
      if (aiMessages[i].role === "user") {
        aiMessages[i] = {
          role: "user",
          content: [
            { type: "text", text: aiMessages[i].content },
            ...validImages.map((url) => ({ type: "image_url", image_url: { url } })),
          ],
        };
        break;
      }
    }
  }

  // --- Persist for logged-in users ---
  let convId = null;
  if (user) {
    try {
      if (conversationId) {
        const owned = await one("SELECT id FROM conversations WHERE id = ? AND user_id = ?", [
          conversationId,
          user.id,
        ]);
        if (owned) convId = owned.id;
      }
      if (!convId) {
        const title = lastUser.content.slice(0, 60);
        const info = await run("INSERT INTO conversations (user_id, title) VALUES (?, ?)", [
          user.id,
          title || "Conversație nouă",
        ]);
        convId = info.lastInsertRowid;
      }
      await run("INSERT INTO messages (conversation_id, role, content, tokens) VALUES (?, 'user', ?, ?)", [
        convId,
        lastUser.content,
        estimateTokens(lastUser.content),
      ]);
      await run("UPDATE conversations SET updated_at = datetime('now') WHERE id = ?", [convId]);
    } catch (e) {
      await logError("persist user message", e.message);
    }
  }

  await incrementUsage(userKey);

  // --- Stream the assistant reply ---
  const { systemPrompt } = await getConfig();
  const signal = req.signal;
  let source;
  try {
    source = streamCompletion({ messages: aiMessages, systemPrompt, signal });
  } catch (e) {
    await logError("streamCompletion init", e.message);
    return json({ error: "Nu am putut genera răspunsul. Te rugăm să încerci din nou." }, 500);
  }

  let acc = "";
  const reader = source.getReader();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          // Persist assistant message on completion
          if (user && convId && acc.trim()) {
            try {
              await run(
                "INSERT INTO messages (conversation_id, role, content, tokens) VALUES (?, 'assistant', ?, ?)",
                [convId, acc, estimateTokens(acc)]
              );
              await run("UPDATE conversations SET updated_at = datetime('now') WHERE id = ?", [convId]);
            } catch (e) {
              await logError("persist assistant message", e.message);
            }
          }
          controller.close();
          return;
        }
        acc += new TextDecoder().decode(value);
        controller.enqueue(value);
      } catch (e) {
        await logError("chat stream", e.message);
        // Surface a graceful, specific in-stream error so the UI can show it.
        const msg = String(e?.message || "");
        let text = "\n\n_⚠️ Nu am putut genera răspunsul. Te rugăm să încerci din nou._";
        if (/Upstream 429|insufficient_quota/i.test(msg)) {
          text =
            "\n\n_⚠️ Serviciul AI nu are momentan credit disponibil (cotă depășită). Administratorul trebuie să adauge credit/plan în contul OpenAI._";
        } else if (/Upstream 401|invalid_api_key|Incorrect API key/i.test(msg)) {
          text = "\n\n_⚠️ Cheia API pentru serviciul AI este invalidă. Verifică OPENAI_API_KEY._";
        }
        controller.enqueue(encoder.encode(text));
        controller.close();
      }
    },
    cancel() {
      // Client hit "stop" — save the partial answer for logged-in users.
      if (user && convId && acc.trim()) {
        run(
          "INSERT INTO messages (conversation_id, role, content, tokens) VALUES (?, 'assistant', ?, ?)",
          [convId, acc, estimateTokens(acc)]
        ).catch(() => {});
      }
      reader.cancel().catch(() => {});
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "x-conversation-id": convId ? String(convId) : "",
      "x-usage-remaining": String(Math.max(0, limit.remaining - 1)),
    },
  });
}
