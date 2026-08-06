import { NextRequest, NextResponse } from "next/server";

// For server-side API routes, use internal Docker network URL
const AI_SERVICE_URL = process.env.AI_SERVICE_INTERNAL_URL || process.env.AI_SERVICE_URL
  || process.env.NEXT_PUBLIC_AI_SERVICE_URL
  || "http://localhost:8001";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string; filePath: string[] }> }
) {
  try {
    const { sessionId, filePath } = await params;
    const authToken = request.cookies.get("auth-token")?.value;
    const apiKey = request.headers.get("x-api-key") || request.headers.get("X-API-Key");
    const envApiKey = process.env.AI_SERVICE_API_KEY;

    if (!authToken && !apiKey && !envApiKey) {
      return NextResponse.json(
        { detail: "Authentication required. Please log in." },
        { status: 401 }
      );
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    } else if (apiKey) {
      headers["X-API-Key"] = apiKey;
    } else if (envApiKey) {
      headers["X-API-Key"] = envApiKey;
    }

    // Join the file path segments
    const filePathStr = filePath.join("/");

    const response = await fetch(
      `${AI_SERVICE_URL}/v1/chat/projects/${sessionId}/files/${encodeURIComponent(filePathStr)}`,
      {
        method: "GET",
        headers,
        cache: "no-cache",
      }
    );

    const text = await response.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { detail: "Invalid JSON from backend" },
        { status: 502 }
      );
    }

    if (!response.ok) {
      const detail =
        (data as { detail?: string } | undefined)?.detail ||
        "Failed to fetch file content";
      return NextResponse.json({ detail }, { status: response.status });
    }

    return NextResponse.json(data as object);
  } catch (error) {
    const err = error as Error;
    console.error("File content API error:", err);
    return NextResponse.json(
      { detail: "Internal server error: " + (err.message || "Unknown error") },
      { status: 500 }
    );
  }
}
