import { NextRequest, NextResponse } from "next/server";

// For server-side API routes, use internal Docker network URL
const AI_SERVICE_URL = process.env.AI_SERVICE_INTERNAL_URL || process.env.AI_SERVICE_URL
  || process.env.NEXT_PUBLIC_AI_SERVICE_URL
  || "http://localhost:8001";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const authToken = request.cookies.get("auth-token")?.value;
    const apiKey = request.headers.get("x-api-key") || request.headers.get("X-API-Key");
    const authHeader = request.headers.get("Authorization");
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const effectiveToken = authToken || bearerToken;

    if (!effectiveToken && !apiKey) {
      return NextResponse.json(
        { detail: "Authentication required. Please log in." },
        { status: 401 }
      );
    }

    const { sessionId } = await params;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (effectiveToken) {
      headers["Authorization"] = `Bearer ${effectiveToken}`;
    } else if (apiKey) {
      headers["X-API-Key"] = apiKey;
    }

    const response = await fetch(
      `${AI_SERVICE_URL}/v1/chat/sessions/${sessionId}`,
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
        "Failed to fetch chat history";
      return NextResponse.json({ detail }, { status: response.status });
    }

    return NextResponse.json(data as object);
  } catch (error) {
    const err = error as Error;
    console.error("Chat history API error:", err);
    return NextResponse.json(
      { detail: "Internal server error: " + (err.message || "Unknown error") },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const authToken = request.cookies.get("auth-token")?.value;
    const apiKey = request.headers.get("x-api-key") || request.headers.get("X-API-Key");
    const authHeader = request.headers.get("Authorization");
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const effectiveToken = authToken || bearerToken;

    if (!effectiveToken && !apiKey) {
      return NextResponse.json(
        { detail: "Authentication required. Please log in." },
        { status: 401 }
      );
    }

    const { sessionId } = await params;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (effectiveToken) {
      headers["Authorization"] = `Bearer ${effectiveToken}`;
    } else if (apiKey) {
      headers["X-API-Key"] = apiKey;
    }

    const response = await fetch(
      `${AI_SERVICE_URL}/v1/chat/sessions/${sessionId}`,
      {
        method: "DELETE",
        headers,
        cache: "no-cache",
      }
    );

    if (!response.ok) {
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
      const detail =
        (data as { detail?: string } | undefined)?.detail ||
        "Failed to delete chat session";
      return NextResponse.json({ detail }, { status: response.status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Chat session delete API error:", error);
    return NextResponse.json(
      { detail: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const authToken = request.cookies.get("auth-token")?.value;
    const apiKey = request.headers.get("x-api-key") || request.headers.get("X-API-Key");
    const authHeader = request.headers.get("Authorization");
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const effectiveToken = authToken || bearerToken;

    if (!effectiveToken && !apiKey) {
      return NextResponse.json(
        { detail: "Authentication required. Please log in." },
        { status: 401 }
      );
    }

    const { sessionId } = await params;
    const body = await request.json();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (effectiveToken) {
      headers["Authorization"] = `Bearer ${effectiveToken}`;
    } else if (apiKey) {
      headers["X-API-Key"] = apiKey;
    }

    const response = await fetch(
      `${AI_SERVICE_URL}/v1/chat/sessions/${sessionId}/title`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify(body),
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
        "Failed to rename chat session";
      return NextResponse.json({ detail }, { status: response.status });
    }

    return NextResponse.json(data as object);
  } catch (error) {
    console.error("Chat session rename API error:", error);
    return NextResponse.json(
      { detail: "Internal server error" },
      { status: 500 }
    );
  }
}
