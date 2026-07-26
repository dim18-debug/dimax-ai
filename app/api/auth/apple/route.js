import { NextResponse } from "next/server";
import { providerStatus, redirectUri, randomState } from "@/lib/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Step 1: send the user to Apple's consent screen (form_post response).
export async function GET(req) {
  if (!providerStatus().apple) {
    return NextResponse.redirect(new URL("/login?error=apple_unavailable", req.url));
  }
  const state = randomState();
  const params = new URLSearchParams({
    client_id: process.env.APPLE_SERVICE_ID,
    redirect_uri: redirectUri(req, "apple"),
    response_type: "code",
    scope: "name email",
    response_mode: "form_post",
    state,
  });
  const res = NextResponse.redirect(
    `https://appleid.apple.com/auth/authorize?${params.toString()}`
  );
  // Apple posts the callback cross-site, so the state cookie must be SameSite=None.
  res.cookies.set("oauth_state", state, {
    httpOnly: true,
    sameSite: "none",
    secure: true,
    path: "/",
    maxAge: 600,
  });
  return res;
}
