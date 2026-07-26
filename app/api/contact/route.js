import { NextResponse } from "next/server";
import { run } from "@/lib/db";
import { isValidEmail } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const { name, email, subject, message } = await req.json();
    if (!name || !isValidEmail(email) || !subject || !message) {
      return NextResponse.json({ error: "Completează toate câmpurile corect." }, { status: 400 });
    }
    await run("INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)", [
      String(name).slice(0, 120),
      String(email).slice(0, 160),
      String(subject).slice(0, 160),
      String(message).slice(0, 4000),
    ]);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Mesajul nu a putut fi trimis." }, { status: 500 });
  }
}
