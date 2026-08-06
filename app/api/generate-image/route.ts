import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const backendUrl =
      process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
    const authToken = request.cookies.get("auth-token")?.value;
    if (!authToken) {
      return NextResponse.json(
        { detail: "Authentication required. Please log in." },
        { status: 401 }
      );
    }
    const body = await request.json();

    const response = await fetch(`${backendUrl}/v1/generate-image/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(body),
      cache: "no-cache",
    });

    const text = await response.text();
    let data: unknown;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      console.error("[generate-image] Invalid JSON from backend:", text?.slice(0, 200));
      return NextResponse.json(
        { detail: "Invalid response from backend." },
        { status: 502 }
      );
    }

    if (!response.ok) {
      const detail =
        (data as { detail?: string })?.detail ||
        (data as { error?: string })?.error ||
        "Image generation failed";
      console.error(
        "[generate-image] Backend error: status=%s detail=%s",
        response.status,
        detail
      );
      return NextResponse.json(
        {
          ...(typeof data === "object" && data !== null ? data : {}),
          detail,
          database_inserted: false,
          database_error: detail,
        },
        { status: response.status }
      );
    }

    const out = data as Record<string, unknown> & { database_inserted?: boolean; database_record?: object };
    if (out.database_inserted === true && out.database_record) {
      console.info("[generate-image] Database insert SUCCESS. Record:", out.database_record);
    } else if (out.database_inserted === false) {
      console.warn("[generate-image] Database insert failed or unknown.", out);
    }
    const { database_inserted: _di, database_record: _dr, ...rest } = out;
    return NextResponse.json(rest);
  } catch (error) {
    const err = error as Error;
    console.error("Generate image API error:", err);
    return NextResponse.json(
      { detail: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}