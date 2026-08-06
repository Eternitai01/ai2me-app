import { NextRequest, NextResponse } from "next/server";

const defaultBackend =
  process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const authToken = request.cookies.get("auth-token")?.value;
    if (!authToken) {
      return NextResponse.json(
        { success: false, status: "error", error: "Authentication required. Please log in." },
        { status: 401 }
      );
    }
    const body = await request.json();
    const response = await fetch(`${defaultBackend}/v1/generate-video/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(body),
      cache: "no-cache",
    });

    const text = await response.text();
    let data: Record<string, unknown>;
    try {
      data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
    } catch {
      return NextResponse.json(
        { success: false, status: "error", error: "Invalid response from backend." },
        { status: 502 }
      );
    }

    if (!response.ok) {
      const error =
        (data.error as string) || (data.detail as string) || "Video generation failed";
      return NextResponse.json(
        { success: false, status: "error", error, ...data },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    const err = error as Error;
    console.error("Generate video API error:", err);
    return NextResponse.json(
      { success: false, status: "error", error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
