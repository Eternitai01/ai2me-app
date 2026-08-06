import { NextRequest, NextResponse } from "next/server";

// Allow up to 300s for AI generation
export const maxDuration = 300;
export const dynamic = "force-dynamic";


export async function POST(request: NextRequest) {
  try {
    const AI_SERVICE_URL = process.env.AI_SERVICE_INTERNAL_URL || process.env.AI_SERVICE_URL || "http://localhost:8001";
    const body = await request.json();

    const token = request.cookies.get("auth-token")?.value;
    const apiKey = request.headers.get("x-api-key") || request.headers.get("X-API-Key");
    const authHeader = request.headers.get("Authorization");

    // Use token from cookie, Authorization header, or API key - in that order
    const effectiveToken = token || (authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null);

    console.log("[/api/ai/start] auth check:", {
      hasCookie: !!token,
      hasAuthHeader: !!authHeader,
      hasApiKey: !!apiKey,
      AI_SERVICE_URL,
    });

    if (!effectiveToken && !apiKey) {
      return NextResponse.json({ detail: "Authentication required. Please log in." }, { status: 401 });
    }

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (effectiveToken) headers["Authorization"] = `Bearer ${effectiveToken}`;
    else if (apiKey) headers["X-API-Key"] = apiKey;
    console.log("[/api/ai/start] calling:", `${AI_SERVICE_URL}/v1/ai/start`);

    const response = await fetch(`${AI_SERVICE_URL}/v1/ai/start`, {
      method: "POST", headers, body: JSON.stringify(body), cache: "no-cache",
    });

    const text = await response.text();
    console.log("[/api/ai/start] upstream status:", response.status, text.substring(0, 200));

    let data: unknown;
    try { data = JSON.parse(text); } catch {
      return NextResponse.json({ detail: "Invalid response from AI service: " + text.substring(0, 200) }, { status: 502 });
    }

    if (!response.ok) {
      const d = data as any;
      // AI service 402: { success:false, error: { code:402, message: { error:"Insufficient Credits", ... } } }
      const nestedMsg = d?.error?.message;
      const detail =
        d?.detail ||
        d?.message ||
        (typeof nestedMsg === "string" ? nestedMsg : nestedMsg?.error) ||
        "Failed to start session";
      console.error("[/api/ai/start] error:", response.status, detail);
      return NextResponse.json({ detail, status_code: response.status }, { status: response.status });
    }

    return NextResponse.json(data as object);
  } catch (error) {
    const err = error as Error;
    console.error("[/api/ai/start] unhandled exception:", err.message, err.stack?.substring(0, 300));
    return NextResponse.json({ detail: "Internal server error: " + err.message }, { status: 500 });
  }
}
