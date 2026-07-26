import crypto from "crypto";
import { one, run } from "./db";

// Which social providers are fully configured (real credentials present).
export function providerStatus() {
  return {
    google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    apple: !!(
      process.env.APPLE_SERVICE_ID &&
      process.env.APPLE_TEAM_ID &&
      process.env.APPLE_KEY_ID &&
      process.env.APPLE_PRIVATE_KEY
    ),
  };
}

// Absolute base URL of the deployment, from env or the incoming request.
export function baseUrl(req) {
  if (process.env.APP_BASE_URL) return process.env.APP_BASE_URL.replace(/\/$/, "");
  const proto = req.headers.get("x-forwarded-proto") || "http";
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  return `${proto}://${host}`;
}

export function redirectUri(req, provider) {
  const envKey = provider === "google" ? "GOOGLE_REDIRECT_URI" : "APPLE_REDIRECT_URI";
  if (process.env[envKey]) return process.env[envKey];
  return `${baseUrl(req)}/api/auth/${provider}/callback`;
}

export function randomState() {
  return crypto.randomBytes(16).toString("hex");
}

// Find or create a user coming from a verified social identity, return the id.
export async function upsertSocialUser({ email, name, provider }) {
  const normEmail = String(email).toLowerCase().trim();
  const existing = await one("SELECT id, blocked FROM users WHERE email = ?", [normEmail]);
  if (existing) {
    if (existing.blocked) throw new Error("BLOCKED");
    return existing.id;
  }
  const isAdmin =
    process.env.ADMIN_EMAIL &&
    normEmail === String(process.env.ADMIN_EMAIL).toLowerCase().trim();
  const info = await run("INSERT INTO users (email, name, provider, role) VALUES (?, ?, ?, ?)", [
    normEmail,
    name ? String(name).slice(0, 80) : null,
    provider,
    isAdmin ? "admin" : "user",
  ]);
  return info.lastInsertRowid;
}
