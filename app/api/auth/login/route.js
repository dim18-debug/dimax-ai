import { NextResponse } from "next/server";
import { one } from "@/lib/db";
import { verifyPassword, isValidEmail, setSessionCookie } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    if (!isValidEmail(email) || !password) {
      return NextResponse.json({ error: "Date de autentificare invalide." }, { status: 400 });
    }
    const normEmail = String(email).toLowerCase().trim();
    const user = await one("SELECT * FROM users WHERE email = ?", [normEmail]);
    if (!user || !(await verifyPassword(String(password), user.password_hash))) {
      return NextResponse.json({ error: "Email sau parolă incorecte." }, { status: 401 });
    }
    if (user.blocked) {
      return NextResponse.json({ error: "Acest cont a fost blocat." }, { status: 403 });
    }
    await setSessionCookie(user.id);
    return NextResponse.json({ ok: true, role: user.role });
  } catch {
    return NextResponse.json({ error: "Autentificarea a eșuat." }, { status: 500 });
  }
}
