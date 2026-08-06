import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// On-demand attachment redirect. The chip links here (same-origin, so the auth-token
// cookie rides along); we mint a fresh presigned URL via the AI service and 302 the
// browser to it — so transcript links never expire.
export async function GET(request: NextRequest) {
  const AI_SERVICE_URL =
    process.env.AI_SERVICE_INTERNAL_URL || process.env.AI_SERVICE_URL || "http://localhost:8001";

  const key = request.nextUrl.searchParams.get("key");
  if (!key) {
    return NextResponse.json({ detail: "Missing attachment key" }, { status: 400 });
  }

  const token = request.cookies.get("auth-token")?.value;
  const apiKey = request.headers.get("x-api-key") || request.headers.get("X-API-Key");
  if (!token && !apiKey) {
    return NextResponse.json({ detail: "Authentication required. Please log in." }, { status: 401 });
  }

  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  else if (apiKey) headers["X-API-Key"] = apiKey;

  try {
    const upstream = await fetch(
      `${AI_SERVICE_URL}/v1/ai/attachment?key=${encodeURIComponent(key)}`,
      { method: "GET", headers, cache: "no-store" }
    );

    if (!upstream.ok) {
      return NextResponse.json(
        { detail: "Attachment unavailable" },
        { status: upstream.status }
      );
    }

    const data = (await upstream.json()) as { url?: string };
    if (!data?.url) {
      return NextResponse.json({ detail: "Attachment unavailable" }, { status: 502 });
    }

    // Redirect the browser straight to the fresh presigned S3 URL (inline preview).
    return NextResponse.redirect(data.url, 302);
  } catch (error) {
    console.error("[/api/ai/attachment] error:", error);
    return NextResponse.json({ detail: "Internal server error" }, { status: 500 });
  }
}
