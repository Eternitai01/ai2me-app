import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const AI_SERVICE_URL =
    process.env.AI_SERVICE_INTERNAL_URL || process.env.AI_SERVICE_URL || "http://localhost:8001";

  const token = request.cookies.get("auth-token")?.value;
  const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
  const bearerFromHeader = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const apiKey = request.headers.get("x-api-key") || request.headers.get("X-API-Key");

  const resolvedToken = token || bearerFromHeader;
  if (!resolvedToken && !apiKey) {
    return NextResponse.json({ detail: "Authentication required. Please log in." }, { status: 401 });
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (resolvedToken) headers["Authorization"] = `Bearer ${resolvedToken}`;
  else if (apiKey) headers["X-API-Key"] = apiKey;

  const { sessionId } = await params;
  const body = await request.text();

  let upstream: Response;
  try {
    upstream = await fetch(`${AI_SERVICE_URL}/v1/ai/docs/${sessionId}/document`, {
      method: "PATCH",
      headers,
      body,
      cache: "no-cache",
    });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ detail: "Failed to reach AI service: " + err.message }, { status: 502 });
  }

  const text = await upstream.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return NextResponse.json({ detail: "Invalid JSON from backend" }, { status: 502 });
  }

  if (!upstream.ok) {
    const detail = (data as { detail?: string } | undefined)?.detail || "Failed to save document";
    return NextResponse.json({ detail }, { status: upstream.status });
  }

  return NextResponse.json(data as object);
}
