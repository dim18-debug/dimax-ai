import { NextResponse } from "next/server";
import { one, many, run } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function own(id, userId) {
  return one("SELECT * FROM conversations WHERE id = ? AND user_id = ?", [id, userId]);
}

export async function GET(_req, { params }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Autentificare necesară." }, { status: 401 });
  const conv = await own(params.id, user.id);
  if (!conv) return NextResponse.json({ error: "Conversația nu există." }, { status: 404 });
  const messages = await many(
    "SELECT id, role, content, feedback, reported FROM messages WHERE conversation_id = ? ORDER BY id ASC",
    [conv.id]
  );
  return NextResponse.json({ conversation: conv, messages });
}

export async function PATCH(req, { params }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Autentificare necesară." }, { status: 401 });
  const conv = await own(params.id, user.id);
  if (!conv) return NextResponse.json({ error: "Conversația nu există." }, { status: 404 });

  const { title, saved } = await req.json();
  if (typeof title === "string" && title.trim()) {
    await run("UPDATE conversations SET title = ? WHERE id = ?", [title.trim().slice(0, 120), conv.id]);
  }
  if (typeof saved === "boolean") {
    await run("UPDATE conversations SET saved = ? WHERE id = ?", [saved ? 1 : 0, conv.id]);
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req, { params }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Autentificare necesară." }, { status: 401 });
  const conv = await own(params.id, user.id);
  if (!conv) return NextResponse.json({ error: "Conversația nu există." }, { status: 404 });
  // Explicit cascade (no reliance on FK enforcement).
  await run("DELETE FROM messages WHERE conversation_id = ?", [conv.id]);
  await run("DELETE FROM conversations WHERE id = ?", [conv.id]);
  return NextResponse.json({ ok: true });
}
