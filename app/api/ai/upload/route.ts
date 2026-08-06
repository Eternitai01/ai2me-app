import { NextRequest, NextResponse } from "next/server";

const AI_SERVICE_URL = process.env.AI_SERVICE_INTERNAL_URL || process.env.AI_SERVICE_URL || "http://localhost:8001";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value;
    const apiKey = request.headers.get("x-api-key") || request.headers.get("X-API-Key");

    if (!token && !apiKey) {
      return NextResponse.json({ detail: "Authentication required. Please log in." }, { status: 401 });
    }

    const formData = await request.formData();
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    else if (apiKey) headers["X-API-Key"] = apiKey;

    const response = await fetch(`${AI_SERVICE_URL}/v1/ai/upload`, {
      method: "POST", headers, body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ detail: data.detail || "Upload failed" }, { status: response.status });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error("[/api/ai/upload] error:", error);
    return NextResponse.json({ detail: "Internal server error" }, { status: 500 });
  }
}
