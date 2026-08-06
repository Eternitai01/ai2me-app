import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Code generation runs npm install + npm run build server-side; it genuinely takes minutes.
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

  let upstream: Response | null = null;
  let lastError: string | null = null;

  // Retry up to 3× with backoff — the AI task briefly goes to 0 during rolling deploys.
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 2500 * attempt));
    try {
      const resp = await fetch(`${AI_SERVICE_URL}/v1/ai/continue/stream`, {
        method: "POST",
        headers,
        body,
        cache: "no-cache",
      });
      // 502/503 = transient (deploy in progress) — retry; anything else pass through.
      if (resp.status === 502 || resp.status === 503) {
        lastError = `upstream ${resp.status}`;
        continue;
      }
      upstream = resp;
      break;
    } catch (error) {
      lastError = (error as Error).message;
    }
  }

  if (!upstream) {
    return NextResponse.json(
      { detail: "AI service temporarily unavailable — please retry in a moment. (" + lastError + ")" },
      { status: 503 }
    );
  }

  // Raw ReadableStream passthrough — do NOT await upstream.text(), that would buffer the
  // whole stream and defeat the point.
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
