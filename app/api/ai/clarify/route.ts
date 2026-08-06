import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * Proxy to AI service POST /v1/ai/clarify
 * Free clarification questionnaire — does not charge credits.
 */
export async function POST(request: NextRequest) {
  try {
    const AI_SERVICE_URL =
      process.env.AI_SERVICE_INTERNAL_URL ||
      process.env.AI_SERVICE_URL ||
      "http://localhost:8001";
    const body = await request.json();

    const token = request.cookies.get("auth-token")?.value;
    const apiKey =
      request.headers.get("x-api-key") || request.headers.get("X-API-Key");
    const authHeader = request.headers.get("Authorization");
    const effectiveToken =
      token ||
      (authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null);

    if (!effectiveToken && !apiKey) {
      return NextResponse.json(
        { detail: "Authentication required. Please log in." },
        { status: 401 }
      );
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (effectiveToken) headers["Authorization"] = `Bearer ${effectiveToken}`;
    else if (apiKey) headers["X-API-Key"] = apiKey;

    const response = await fetch(`${AI_SERVICE_URL}/v1/ai/clarify`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      cache: "no-cache",
    });

    const text = await response.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        {
          detail:
            "Invalid response from AI service: " + text.substring(0, 200),
        },
        { status: 502 }
      );
    }

    if (!response.ok) {
      const d = data as { detail?: string; message?: string };
      return NextResponse.json(
        { detail: d?.detail || d?.message || "Clarify request failed" },
        { status: response.status }
      );
    }

    return NextResponse.json(data as object);
  } catch (error) {
    const err = error as Error;
    console.error("[/api/ai/clarify]", err.message);
    return NextResponse.json(
      { detail: "Internal server error: " + err.message },
      { status: 500 }
    );
  }
}
