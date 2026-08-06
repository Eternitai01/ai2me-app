import { NextRequest, NextResponse } from "next/server";

const backendUrl =
  process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  try {
    const authToken = request.cookies.get("auth-token")?.value;
    if (!authToken) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }
    const res = await fetch(`${backendUrl}/v1/api/videos`, {
      method: "GET",
      headers: { Authorization: `Bearer ${authToken}` },
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { success: false, message: (data as { detail?: string })?.detail ?? "Failed to fetch videos" },
        { status: res.status }
      );
    }
    return NextResponse.json(data);
  } catch (e) {
    console.error("[media/videos]", e);
    return NextResponse.json(
      { success: false, message: (e as Error)?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
