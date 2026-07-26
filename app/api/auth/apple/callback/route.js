import { NextResponse } from "next/server";
import { SignJWT, importPKCS8, jwtVerify, createRemoteJWKSet } from "jose";
import { logError } from "@/lib/db";
import { setSessionOnResponse } from "@/lib/auth";
import { redirectUri, upsertSocialUser } from "@/lib/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const APPLE_ISS = "https://appleid.apple.com";
const appleJwks = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));

async function appleClientSecret() {
  const pem = process.env.APPLE_PRIVATE_KEY.replace(/\\n/g, "\n");
  const key = await importPKCS8(pem, "ES256");
  return new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: process.env.APPLE_KEY_ID })
    .setIssuer(process.env.APPLE_TEAM_ID)
    .setIssuedAt()
    .setExpirationTime("5m")
    .setAudience(APPLE_ISS)
    .setSubject(process.env.APPLE_SERVICE_ID)
    .sign(key);
}

// Step 2: Apple posts the code here (form_post). Exchange + verify + session.
export async function POST(req) {
  const fail = (reason) => NextResponse.redirect(new URL(`/login?error=${reason}`, req.url), 303);

  let form;
  try {
    form = await req.formData();
  } catch {
    return fail("apple_form");
  }
  const code = form.get("code");
  const state = form.get("state");
  const cookieState = req.cookies.get("oauth_state")?.value;
  const userField = form.get("user"); // JSON with name, only on first consent

  if (!code) return fail("apple_no_code");
  if (!state || (cookieState && state !== cookieState)) return fail("apple_state");

  try {
    const clientSecret = await appleClientSecret();
    const tokenRes = await fetch("https://appleid.apple.com/auth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.APPLE_SERVICE_ID,
        client_secret: clientSecret,
        redirect_uri: redirectUri(req, "apple"),
        grant_type: "authorization_code",
      }),
    });
    if (!tokenRes.ok) {
      logError("apple token", (await tokenRes.text()).slice(0, 200));
      return fail("apple_token");
    }
    const { id_token } = await tokenRes.json();
    if (!id_token) return fail("apple_no_idtoken");

    const { payload } = await jwtVerify(id_token, appleJwks, {
      issuer: APPLE_ISS,
      audience: process.env.APPLE_SERVICE_ID,
    });
    if (!payload.email) return fail("apple_email");

    let name = null;
    try {
      if (userField) {
        const u = JSON.parse(userField);
        name = [u?.name?.firstName, u?.name?.lastName].filter(Boolean).join(" ") || null;
      }
    } catch {}

    const userId = await upsertSocialUser({ email: payload.email, name, provider: "apple" });
    const res = NextResponse.redirect(new URL("/chat", req.url), 303);
    res.cookies.set("oauth_state", "", { path: "/", maxAge: 0 });
    return setSessionOnResponse(res, userId);
  } catch (e) {
    if (e.message === "BLOCKED") return fail("blocked");
    logError("apple callback", e.message);
    return fail("apple_failed");
  }
}
