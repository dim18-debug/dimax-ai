import { NextResponse } from "next/server";
import { providerStatus, redirectUri, randomState } from "@/lib/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Step 1: send the user to Google's consent screen.
export async function GET(req) {
  if (!providerStatus().google) {
    return NextResponse.redirect(new URL("/login?error=google_unavailable", req.url));
  }
  const state = randomState();
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri(req, "google"),
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });
  const res = NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );
  res.cookies.set("oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
  return res;
}
