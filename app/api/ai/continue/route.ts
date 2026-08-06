import { NextRequest, NextResponse } from "next/server";

// Allow up to 300s for AI code generation (Bedrock can take 2-3 min)
export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const AI_SERVICE_URL = process.env.AI_SERVICE_INTERNAL_URL || process.env.AI_SERVICE_URL || "http://localhost:8001";
    const body = await request.json();

    const token = request.cookies.get("auth-token")?.value;
    const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
    const bearerFromHeader = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const apiKey = request.headers.get("x-api-key") || request.headers.get("X-API-Key");

    if (!token && !bearerFromHeader && !apiKey) {
      return NextResponse.json({ detail: "Authentication required. Please log in." }, { status: 401 });
    }

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const resolvedToken = token || bearerFromHeader;
    if (resolvedToken) headers["Authorization"] = `Bearer ${resolvedToken}`;
    else if (apiKey) headers["X-API-Key"] = apiKey;

    // Use an independent AbortController — do NOT tie to request.signal
    // so that client navigating away does not kill the generation mid-flight
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 290_000); // 290s

    let response: Response;
    try {
      response = await fetch(`${AI_SERVICE_URL}/v1/ai/continue`, {
        method: "POST", headers, body: JSON.stringify(body), cache: "no-cache",
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    const text = await response.text();
    let data: unknown;
    try { data = JSON.parse(text); } catch {
      return NextResponse.json({ detail: "Invalid response from AI service: " + text.substring(0, 200) }, { status: 502 });
    }

    if (!response.ok) {
      const detail = (data as any)?.detail || (data as any)?.message || "Failed to continue";
      return NextResponse.json({ detail }, { status: response.status });
    }

    return NextResponse.json(data as object);
  } catch (error) {
    const err = error as Error;
    console.error("[/api/ai/continue] unhandled:", err.message);
    // If client disconnected or aborted — don't surface as user-visible error
    if (err.name === "AbortError" || err.message?.includes("aborted") || err.message?.includes("The operation was aborted")) {
      return NextResponse.json({ detail: "Request timed out. The AI is still processing — please check back or try again." }, { status: 504 });
    }
    return NextResponse.json({ detail: "Internal server error: " + err.message }, { status: 500 });
  }
}
