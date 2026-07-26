import crypto from "crypto";
import { one, run } from "./db";
import { getConfig } from "./config";

function today() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
}

export function guestKeyFromRequest(req) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "0.0.0.0";
  const hash = crypto.createHash("sha256").update(ip).digest("hex").slice(0, 16);
  return `guest:${hash}`;
}

export async function limitFor(user) {
  const { limits } = await getConfig();
  if (!user) return limits.guest;
  return user.plan === "premium" ? limits.premium : limits.free;
}

export async function getUsage(userKey) {
  const row = await one("SELECT count FROM usage WHERE user_key = ? AND day = ?", [userKey, today()]);
  return row ? row.count : 0;
}

// Returns { allowed, used, limit, remaining }
export async function checkLimit(userKey, user) {
  const limit = await limitFor(user);
  const used = await getUsage(userKey);
  return { allowed: used < limit, used, limit, remaining: Math.max(0, limit - used) };
}

export async function incrementUsage(userKey) {
  await run(
    `INSERT INTO usage (user_key, day, count) VALUES (?, ?, 1)
     ON CONFLICT(user_key, day) DO UPDATE SET count = count + 1`,
    [userKey, today()]
  );
}
