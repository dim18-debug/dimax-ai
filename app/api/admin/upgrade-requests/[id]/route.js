import { NextResponse } from "next/server";
import { one, run } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";

// PATCH { status: 'approved' | 'rejected' }
// Approving upgrades the user's plan to premium (real effect on limits/features).
export async function PATCH(req, { params }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Acces interzis." }, { status: 403 });

  const request = await one("SELECT * FROM upgrade_requests WHERE id = ?", [params.id]);
  if (!request) return NextResponse.json({ error: "Cererea nu există." }, { status: 404 });

  const { status } = await req.json();
  if (!["approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Stare invalidă." }, { status: 400 });
  }

  await run("UPDATE upgrade_requests SET status = ? WHERE id = ?", [status, request.id]);
  if (status === "approved") {
    await run("UPDATE users SET plan = 'premium' WHERE id = ?", [request.user_id]);
    await run("INSERT INTO subscriptions (user_id, plan, status, price) VALUES (?, 'premium', 'active', 0)", [
      request.user_id,
    ]);
  }
  return NextResponse.json({ ok: true });
}
