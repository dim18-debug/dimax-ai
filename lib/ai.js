const enc = new TextEncoder();
const dec = new TextDecoder();

export function isAIConfigured() {
  return !!process.env.OPENAI_API_KEY;
}

/**
 * Streams the assistant reply as plain text chunks.
 * `messages` = [{ role, content }] where content may be a string OR a
 * multimodal array ([{type:'text',...},{type:'image_url',...}]).
 * `systemPrompt` is supplied by the caller (from getConfig()).
 * Returns a ReadableStream<Uint8Array>. Throws if the API key is missing.
 */
export function streamCompletion({ messages, systemPrompt, signal }) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const baseUrl = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");

  if (!apiKey) {
    // No simulated fallback — surface an honest, explicit failure.
    throw new Error("AI_NOT_CONFIGURED");
  }

  const fullMessages = [{ role: "system", content: systemPrompt }, ...messages];

  return new ReadableStream({
    async start(controller) {
      try {
        const res = await fetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: fullMessages,
            stream: true,
            temperature: 0.7,
          }),
          signal,
        });

        if (!res.ok || !res.body) {
          const detail = await res.text().catch(() => "");
          throw new Error(`Upstream ${res.status}: ${detail.slice(0, 300)}`);
        }

        const reader = res.body.getReader();
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += dec.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const data = trimmed.slice(5).trim();
            if (data === "[DONE]") {
              controller.close();
              return;
            }
            try {
              const json = JSON.parse(data);
              const delta = json.choices?.[0]?.delta?.content;
              if (delta) controller.enqueue(enc.encode(delta));
            } catch {
              /* ignore malformed keep-alive lines */
            }
          }
        }
        controller.close();
      } catch (err) {
        if (signal?.aborted) {
          controller.close();
          return;
        }
        controller.error(err);
      }
    },
  });
}

// Rough token/cost estimate for the admin dashboard.
export function estimateTokens(text) {
  return Math.ceil((text || "").length / 4);
}
export function estimateCost(tokens) {
  // Approx. gpt-4o-mini blended price (~$0.60 / 1M tokens) for a ballpark figure.
  return (tokens / 1_000_000) * 0.6;
}
