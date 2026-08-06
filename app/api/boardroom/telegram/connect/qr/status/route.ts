import { NextRequest, NextResponse } from "next/server";

const AI_SERVICE_URL =
  process.env.AI_SERVICE_URL ||
  process.env.NEXT_PUBLIC_AI_SERVICE_URL ||
  "http://localhost:8001";

export async function GET(request: NextRequest) {
  try {
    const authToken = request.cookies.get("auth-token")?.value;
    const apiKey = request.headers.get("x-api-key") || request.headers.get("X-API-Key");
    if (!authToken && !apiKey) {
      return NextResponse.json(
        { detail: "Authentication required. Please log in." },
        { status: 401 }
      );
    }
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get("request_id");
    if (!requestId) {
      return NextResponse.json(
        { detail: "request_id is required" },
        { status: 400 }
      );
    }
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
    else if (apiKey) headers["X-API-Key"] = apiKey;

    const res = await fetch(
      `${AI_SERVICE_URL}/v1/boardroom/telegram/connect/qr/status?request_id=${encodeURIComponent(requestId)}`,
      { method: "GET", headers, cache: "no-cache" }
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { detail: (data as { detail?: string }).detail || "Failed to get status" },
        { status: res.status }
      );
    }
    return NextResponse.json(data);
  } catch (e) {
    const err = e as Error;
    return NextResponse.json(
      { detail: "Internal server error: " + (err.message || "Unknown error") },
      { status: 500 }
    );
  }
}
