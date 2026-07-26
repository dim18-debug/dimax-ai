import { NextResponse } from "next/server";
import { one, run } from "@/lib/db";
import { hashPassword, isValidEmail, setSessionCookie } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const { email, password, name } = await req.json();

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Email invalid." }, { status: 400 });
    }
    if (!password || String(password).length < 6) {
      return NextResponse.json(
        { error: "Parola trebuie să aibă cel puțin 6 caractere." },
        { status: 400 }
      );
    }

    const normEmail = String(email).toLowerCase().trim();
    const existing = await one("SELECT id FROM users WHERE email = ?", [normEmail]);
    if (existing) {
      return NextResponse.json({ error: "Există deja un cont cu acest email." }, { status: 409 });
    }

    const isAdmin =
      process.env.ADMIN_EMAIL &&
      normEmail === String(process.env.ADMIN_EMAIL).toLowerCase().trim();

    const hash = await hashPassword(String(password));
    const info = await run(
      "INSERT INTO users (email, password_hash, name, provider, role) VALUES (?, ?, ?, 'email', ?)",
      [normEmail, hash, String(name || "").trim() || null, isAdmin ? "admin" : "user"]
    );

    await setSessionCookie(info.lastInsertRowid);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Înregistrarea a eșuat." }, { status: 500 });
  }
}
