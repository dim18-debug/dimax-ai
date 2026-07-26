import { NextResponse } from "next/server";
import { run } from "@/lib/db";
import { getSession, clearSessionCookie } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Update profile preferences: name, language, theme.
export async function PATCH(req) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Autentificare necesară." }, { status: 401 });
  const { name, language, theme } = await req.json();
  if (typeof name === "string") {
    await run("UPDATE users SET name = ? WHERE id = ?", [name.trim().slice(0, 80) || null, user.id]);
  }
  if (["ro", "en", "ru"].includes(language)) {
    await run("UPDATE users SET language = ? WHERE id = ?", [language, user.id]);
  }
  if (["dark", "light"].includes(theme)) {
    await run("UPDATE users SET theme = ? WHERE id = ?", [theme, user.id]);
  }
  return NextResponse.json({ ok: true });
}

// Delete all conversations (+ their messages) owned by the user.
async function deleteUserConversations(userId) {
  await run(
    "DELETE FROM messages WHERE conversation_id IN (SELECT id FROM conversations WHERE user_id = ?)",
    [userId]
  );
  await run("DELETE FROM conversations WHERE user_id = ?", [userId]);
}

// DELETE with ?scope=conversations to wipe only chats, otherwise delete account.
export async function DELETE(req) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Autentificare necesară." }, { status: 401 });
  const scope = new URL(req.url).searchParams.get("scope");

  if (scope === "conversations") {
    await deleteUserConversations(user.id);
    return NextResponse.json({ ok: true });
  }

  // Full account deletion — explicit cascade (no reliance on FK enforcement).
  await deleteUserConversations(user.id);
  await run("DELETE FROM subscriptions WHERE user_id = ?", [user.id]);
  await run("DELETE FROM upgrade_requests WHERE user_id = ?", [user.id]);
  await run("DELETE FROM usage WHERE user_key = ?", [`user:${user.id}`]);
  await run("DELETE FROM users WHERE id = ?", [user.id]);
  clearSessionCookie();
  return NextResponse.json({ ok: true, deleted: true });
}
