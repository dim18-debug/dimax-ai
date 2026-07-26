import { NextResponse } from "next/server";
import { providerStatus } from "@/lib/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Lets the login UI show only the social buttons that actually work.
export async function GET() {
  return NextResponse.json(providerStatus());
}
