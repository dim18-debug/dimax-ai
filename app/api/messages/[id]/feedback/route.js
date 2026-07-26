import { NextResponse } from "next/server";
import { one, run } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

// Ensure the message belongs to a conversation owned by the user.
function ownsMessage(messageId, userId) {
  return one(
    `SELECT m.id FROM messages m
     JOIN conversations c ON c.id = m.conversation_id
     WHERE m.id = ? AND c.user_id = ?`,
    [messageId, userId]
  );
}

export async function POST(req, { params }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Autentificare necesară." }, { status: 401 });
  if (!(await ownsMessage(params.id, user.id))) {
    return NextResponse.json({ error: "Mesajul nu există." }, { status: 404 });
  }
  const { feedback, reported } = await req.json();
  if (feedback === 1 || feedback === -1 || feedback === 0) {
    await run("UPDATE messages SET feedback = ? WHERE id = ?", [feedback, params.id]);
  }
  if (reported === true) {
    await run("UPDATE messages SET reported = 1 WHERE id = ?", [params.id]);
  }
  return NextResponse.json({ ok: true });
}
