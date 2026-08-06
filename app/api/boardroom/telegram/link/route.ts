import { NextRequest, NextResponse } from "next/server";

const AI_SERVICE_URL =
  process.env.AI_SERVICE_URL ||
  process.env.NEXT_PUBLIC_AI_SERVICE_URL ||
  "http://localhost:8001";
const BASE = `${AI_SERVICE_URL}/v1/boardroom/telegram/link`;

function getAuthHeaders(request: NextRequest): Record<string, string> {
  const authToken = request.cookies.get("auth-token")?.value;
  const apiKey = request.headers.get("x-api-key") || request.headers.get("X-API-Key");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
  else if (apiKey) headers["X-API-Key"] = apiKey;
  return headers;
}

export async function GET(request: NextRequest) {
  try {
    const headers = getAuthHeaders(request);
    if (!headers["Authorization"] && !headers["X-API-Key"]) {
      return NextResponse.json(
        { detail: "Authentication required. Please log in." },
        { status: 401 }
      );
    }
    const res = await fetch(BASE, { method: "GET", headers, cache: "no-cache" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { detail: (data as { detail?: string }).detail || "Failed to get Telegram link" },
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
    const data = await res.json().catch(() => ({})) as { detail?: string | { msg?: string }[] };
    if (!res.ok) {
      let detail = "Failed to link Telegram";
      if (data?.detail) {
        if (typeof data.detail === "string") detail = data.detail;
        else if (Array.isArray(data.detail) && data.detail[0]?.msg) detail = data.detail[0].msg;
      }
      return NextResponse.json(
        { detail },
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

export async function DELETE(request: NextRequest) {
  try {
    const headers = getAuthHeaders(request);
    if (!headers["Authorization"] && !headers["X-API-Key"]) {
      return NextResponse.json(
        { detail: "Authentication required. Please log in." },
        { status: 401 }
      );
    }
    const res = await fetch(BASE, { method: "DELETE", headers, cache: "no-cache" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { detail: (data as { detail?: string }).detail || "Failed to unlink Telegram" },
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
