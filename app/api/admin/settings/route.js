import { NextResponse } from "next/server";
import { setSetting } from "@/lib/db";
import { getConfig } from "@/lib/config";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Acces interzis." }, { status: 403 });
  return NextResponse.json({ config: await getConfig() });
}

export async function POST(req) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Acces interzis." }, { status: 403 });

  const body = await req.json();
  const allowed = ["brand", "systemPrompt", "limits", "prices", "announcement", "faqs"];
  for (const key of allowed) {
    if (key in body) await setSetting(key, body[key]);
  }
  return NextResponse.json({ ok: true, config: await getConfig() });
}
