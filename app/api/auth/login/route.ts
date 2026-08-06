import { NextRequest, NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/backend-api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const backendUrl = getBackendUrl();

    const backendRes = await fetch(`${backendUrl}/v1/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        // Add User-Agent to identify server-to-server requests
        "User-Agent": "Next.js-Server/1.0",
        // Forward the original request's origin if available (for debugging)
        "X-Forwarded-Origin": request.headers.get("origin") || request.headers.get("referer") || "server-request",
      },
      body: JSON.stringify(body),
    });

    const raw = await backendRes.text();

    let data: any = null;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      data = null;
    }

    if (!backendRes.ok) {
      const errorMessage =
        data?.message ||
        data?.detail ||
        raw ||
        `Login failed (${backendRes.status})`;

      return NextResponse.json({ detail: errorMessage }, { status: backendRes.status });
    }

    return NextResponse.json(data ?? {});
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json({ detail: "Internal server error" }, { status: 500 });
  }
}
