import { NextRequest, NextResponse } from "next/server";

// Allow up to 300s for AI generation
export const maxDuration = 300;
export const dynamic = "force-dynamic";


const AI_SERVICE_URL = process.env.AI_SERVICE_INTERNAL_URL || process.env.AI_SERVICE_URL || "http://localhost:8001";

/**
 * POST /api/ai/new-project
 * Pre-creates a session (Web Builder, AI Sheets, etc.), returns session_id.
 * Body may include agent_id / title; defaults agent_id to ai-builder.
 */
export async function POST(request: NextRequest) {
  try {
    const authToken = request.cookies.get("auth-token")?.value;
    const apiKey = request.headers.get("x-api-key") || request.headers.get("X-API-Key");

    if (!authToken && !apiKey) {
      return NextResponse.json({ detail: "Authentication required." }, { status: 401 });
    }

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
    else if (apiKey) headers["X-API-Key"] = apiKey;

    const body = await request.json().catch(() => ({}));
    const response = await fetch(`${AI_SERVICE_URL}/v1/ai/new-project`, {
      method: "POST",
      headers,
      body: JSON.stringify({ agent_id: "ai-builder", ...body }),
      cache: "no-cache",
    });

    const text = await response.text();
    let data: unknown;
    try { data = JSON.parse(text); } catch {
      return NextResponse.json({ detail: "Invalid JSON from AI service" }, { status: 502 });
    }
    if (!response.ok) {
      return NextResponse.json(
        { detail: (data as { detail?: string })?.detail || "Failed" },
        { status: response.status }
      );
    }
    return NextResponse.json(data as object);
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ detail: "Internal error: " + err.message }, { status: 500 });
  }
}
