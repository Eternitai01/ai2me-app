import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const token =
      request.cookies.get("auth-token")?.value ||
      request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ detail: "Authentication required" }, { status: 401 });

    const backendUrl = process.env.BACKEND_URL || "http://ai2me-backend:8000";
    const res = await fetch(`${backendUrl}/v1/conversations/agents`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ detail: `Backend error ${res.status}: ${text}` }, { status: res.status });
    }
    return NextResponse.json(await res.json(), {
      headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
    });
  } catch (e) {
    return NextResponse.json({ detail: "Internal server error" }, { status: 500 });
  }
}
