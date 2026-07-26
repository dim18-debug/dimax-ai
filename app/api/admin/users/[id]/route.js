import { NextResponse } from "next/server";
import { one, run } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";

export async function PATCH(req, { params }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Acces interzis." }, { status: 403 });

  const target = await one("SELECT * FROM users WHERE id = ?", [params.id]);
  if (!target) return NextResponse.json({ error: "Utilizatorul nu există." }, { status: 404 });

  const { blocked, plan, role } = await req.json();
  if (typeof blocked === "boolean") {
    await run("UPDATE users SET blocked = ? WHERE id = ?", [blocked ? 1 : 0, target.id]);
  }
  if (["free", "premium"].includes(plan)) {
    await run("UPDATE users SET plan = ? WHERE id = ?", [plan, target.id]);
  }
  if (["user", "admin"].includes(role)) {
    await run("UPDATE users SET role = ? WHERE id = ?", [role, target.id]);
  }
  return NextResponse.json({ ok: true });
}
