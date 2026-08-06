import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
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

  const body = await request.text();

  let upstream: Response;
  try {
    upstream = await fetch(`${AI_SERVICE_URL}/v1/ai/docs/continue/stream`, {
      method: "POST",
      headers,
      body,
      cache: "no-cache",
    });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ detail: "Failed to reach AI service: " + err.message }, { status: 502 });
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
