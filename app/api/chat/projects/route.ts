import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const AI_SERVICE_URL = process.env.AI_SERVICE_INTERNAL_URL || process.env.AI_SERVICE_URL || "http://localhost:8001";

export async function GET(request: NextRequest) {
  try {
    // Token priority: auth-token cookie (email/password users) → Bearer header → NextAuth (OAuth fallback)
    // NEVER put NextAuth first — it causes foreign OAuth accounts (e.g. team@eternitai.com)
    // to shadow the real logged-in user when a stale next-auth.session-token is present.
    const cookieToken = request.cookies.get("auth-token")?.value;
    const authHeader = request.headers.get("Authorization");
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    // NextAuth only as last resort (OAuth-only users who have no auth-token cookie)
    let nextAuthToken: string | null = null;
    if (!cookieToken && !bearerToken) {
      const session = await auth();
      nextAuthToken = (session as any)?.backendToken ?? null;
    }

    const effectiveToken = cookieToken || bearerToken || nextAuthToken;

    if (!effectiveToken) {
      return NextResponse.json({ detail: "Authentication required" }, { status: 401 });
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${effectiveToken}`,
    };

    const response = await fetch(`${AI_SERVICE_URL}/v1/chat/projects`, {
      method: "GET", headers, cache: "no-cache",
    });

    const text = await response.text();
    let data: unknown;
    try { data = JSON.parse(text); } catch {
      return NextResponse.json({ detail: "Invalid response from AI service" }, { status: 502 });
    }

    if (!response.ok) {
      return NextResponse.json(
        { detail: (data as { detail?: string })?.detail || "Failed to fetch projects" },
        { status: response.status }
      );
    }

    return NextResponse.json(data as object);
  } catch (error) {
    const err = error as Error;
    console.error("[/api/chat/projects] error:", err.message);
    return NextResponse.json({ detail: "Internal server error" }, { status: 500 });
  }
}
