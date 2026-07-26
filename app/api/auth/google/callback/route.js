import { NextResponse } from "next/server";
import { logError } from "@/lib/db";
import { setSessionOnResponse } from "@/lib/auth";
import { redirectUri, upsertSocialUser } from "@/lib/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Step 2: exchange the code, fetch the profile, create the session.
export async function GET(req) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = req.cookies.get("oauth_state")?.value;

  const fail = (reason) => NextResponse.redirect(new URL(`/login?error=${reason}`, req.url));

  if (!code) return fail("google_no_code");
  if (!state || state !== cookieState) return fail("google_state");

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri(req, "google"),
        grant_type: "authorization_code",
      }),
    });
    if (!tokenRes.ok) {
      logError("google token", (await tokenRes.text()).slice(0, 200));
      return fail("google_token");
    }
    const { access_token } = await tokenRes.json();

    const profileRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (!profileRes.ok) return fail("google_profile");
    const profile = await profileRes.json();
    if (!profile.email || !profile.email_verified) return fail("google_email");

    const userId = await upsertSocialUser({
      email: profile.email,
      name: profile.name,
      provider: "google",
    });
    const res = NextResponse.redirect(new URL("/chat", req.url));
    res.cookies.set("oauth_state", "", { path: "/", maxAge: 0 });
    return setSessionOnResponse(res, userId);
  } catch (e) {
    if (e.message === "BLOCKED") return fail("blocked");
    logError("google callback", e.message);
    return fail("google_failed");
  }
}
