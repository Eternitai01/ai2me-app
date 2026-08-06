import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/v1/conversations/sync
 *
 * Proxy for agent skills to sync conversation turns to the backend.
 * Agents call this with their API key as Bearer token (not JWT).
 * This proxy simply forwards the request as-is to the backend.
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { detail: "Missing Authorization header" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const backendUrl = process.env.BACKEND_URL || "http://ai2me-backend:8000";

    const response = await fetch(`${backendUrl}/v1/conversations/sync`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { detail: data.detail || "Sync failed" },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Conversations sync proxy error:", error);
    return NextResponse.json(
      { detail: "Internal server error" },
      { status: 500 }
    );
  }
}
