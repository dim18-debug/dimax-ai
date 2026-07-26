import { NextResponse } from "next/server";
import { many, run } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ conversations: [] });
  const rows = await many(
    `SELECT c.id, c.title, c.saved, c.updated_at,
            (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) AS message_count
     FROM conversations c WHERE c.user_id = ? ORDER BY c.updated_at DESC`,
    [user.id]
  );
  return NextResponse.json({ conversations: rows });
}

export async function POST() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Autentificare necesară." }, { status: 401 });
  const info = await run("INSERT INTO conversations (user_id, title) VALUES (?, 'Conversație nouă')", [
    user.id,
  ]);
  return NextResponse.json({ id: info.lastInsertRowid });
}
