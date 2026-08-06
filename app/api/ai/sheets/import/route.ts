import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AI_SERVICE_URL =
  process.env.AI_SERVICE_INTERNAL_URL ||
  process.env.AI_SERVICE_URL ||
  "http://localhost:8001";

function authHeaders(request: NextRequest): Record<string, string> | null {
  const token = request.cookies.get("auth-token")?.value;
  const authHeader =
    request.headers.get("authorization") || request.headers.get("Authorization");
  const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const apiKey =
    request.headers.get("x-api-key") || request.headers.get("X-API-Key");
  const resolved = token || bearer;
  if (!resolved && !apiKey) return null;
  const headers: Record<string, string> = {};
  if (resolved) headers["Authorization"] = `Bearer ${resolved}`;
  else if (apiKey) headers["X-API-Key"] = apiKey;
  return headers;
}

/** POST /api/ai/sheets/import → AI service /v1/sheets/workbooks/import */
export async function POST(request: NextRequest) {
  const headers = authHeaders(request);
  if (!headers) {
    return NextResponse.json(
      { detail: "Authentication required. Please log in." },
      { status: 401 }
    );
  }

  try {
    const formData = await request.formData();
    const upstream = await fetch(
      `${AI_SERVICE_URL}/v1/sheets/workbooks/import`,
      {
        method: "POST",
        headers,
        body: formData,
        cache: "no-cache",
      }
    );
    const text = await upstream.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { detail: "Invalid JSON from AI service" },
        { status: 502 }
      );
    }
    return NextResponse.json(data as object, { status: upstream.status });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json(
      { detail: "Failed to reach AI service: " + err.message },
      { status: 502 }
    );
  }
}
