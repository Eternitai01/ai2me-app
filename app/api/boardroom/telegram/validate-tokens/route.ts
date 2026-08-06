import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://ai2me-backend:8000";
const BASE = `${BACKEND_URL}/v1/boardroom/telegram/validate-tokens`;

function getAuthHeaders(request: NextRequest): Record<string, string> {
  const authToken = request.cookies.get("auth-token")?.value;
  const apiKey = request.headers.get("x-api-key") || request.headers.get("X-API-Key");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
  else if (apiKey) headers["X-API-Key"] = apiKey;
  return headers;
}

export async function POST(request: NextRequest) {
  try {
    const headers = getAuthHeaders(request);
    if (!headers["Authorization"] && !headers["X-API-Key"]) {
      return NextResponse.json(
        { detail: "Authentication required. Please log in." },
        { status: 401 }
      );
    }
    const body = await request.json().catch(() => ({}));
    const res = await fetch(BASE, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      cache: "no-cache",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { detail: (data as { detail?: string }).detail || "Failed to validate tokens" },
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
