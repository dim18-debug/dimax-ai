import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { one } from "./db";

const COOKIE = "smartai_session";
const encoder = new TextEncoder();

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET lipsește din variabilele de mediu.");
  return encoder.encode(s);
}

export async function hashPassword(pw) {
  return bcrypt.hash(pw, 10);
}

export async function verifyPassword(pw, hash) {
  if (!hash) return false;
  return bcrypt.compare(pw, hash);
}

export async function createSessionToken(userId) {
  return new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());
}

export async function setSessionCookie(userId) {
  const token = await createSessionToken(userId);
  cookies().set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearSessionCookie() {
  cookies().set(COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

// Attach a session cookie directly to a Response (used by OAuth redirects).
export async function setSessionOnResponse(res, userId) {
  const token = await createSessionToken(userId);
  res.cookies.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

// Returns the logged-in user row (without password hash) or null.
export async function getSession() {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const user = await one(
      "SELECT id, email, name, provider, role, plan, blocked, language, theme, created_at FROM users WHERE id = ?",
      [payload.uid]
    );
    if (!user || user.blocked) return null;
    return user;
  } catch {
    return null;
  }
}

export async function requireAdmin() {
  const user = await getSession();
  if (!user || user.role !== "admin") return null;
  return user;
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ""));
}
