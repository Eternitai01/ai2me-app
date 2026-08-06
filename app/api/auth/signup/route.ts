import { NextRequest, NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/backend-api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const backendUrl = getBackendUrl();
    const backendRes = await fetch(`${backendUrl}/v1/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(body),
    });

    const raw = await backendRes.text();

    let data: any = null;
    try { data = raw ? JSON.parse(raw) : null; } catch { }

    if (!backendRes.ok) {
      const msg =
        data?.message ||
        data?.detail ||
        raw ||
        `Signup failed (${backendRes.status})`;

      return NextResponse.json({ detail: msg }, { status: backendRes.status });
    }

    return NextResponse.json(data ?? {});
  } catch (error) {
    console.error("Signup API error:", error);
    return NextResponse.json({ detail: "Internal server error" }, { status: 500 });
  }
}
