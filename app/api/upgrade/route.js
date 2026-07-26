import { NextResponse } from "next/server";
import { one, run } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET: does the current user already have a pending upgrade request?
export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ pending: false });
  const row = await one("SELECT id FROM upgrade_requests WHERE user_id = ? AND status = 'pending'", [
    user.id,
  ]);
  return NextResponse.json({ pending: !!row, plan: user.plan });
}

// POST { action: 'request' | 'cancel' }
// 'request' records a real Premium upgrade request (an admin approves it).
// 'cancel' is a real self-service downgrade to the free plan.
export async function POST(req) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Autentificare necesară." }, { status: 401 });

  const { action } = await req.json().catch(() => ({}));

  if (action === "cancel") {
    await run("UPDATE users SET plan = 'free' WHERE id = ?", [user.id]);
    await run("UPDATE subscriptions SET status = 'canceled' WHERE user_id = ? AND status = 'active'", [
      user.id,
    ]);
    return NextResponse.json({ ok: true, plan: "free" });
  }

  if (action === "request") {
    if (user.plan === "premium") {
      return NextResponse.json({ ok: true, already: true });
    }
    const existing = await one("SELECT id FROM upgrade_requests WHERE user_id = ? AND status = 'pending'", [
      user.id,
    ]);
    if (!existing) {
      await run("INSERT INTO upgrade_requests (user_id, email) VALUES (?, ?)", [user.id, user.email]);
    }
    return NextResponse.json({ ok: true, pending: true });
  }

  return NextResponse.json({ error: "Acțiune necunoscută." }, { status: 400 });
}
