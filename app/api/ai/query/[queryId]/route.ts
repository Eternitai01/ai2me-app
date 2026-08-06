import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ queryId: string }> }
) {
  try {
    const { queryId } = await params;
    const AI_SERVICE_URL = process.env.AI_SERVICE_INTERNAL_URL || process.env.AI_SERVICE_URL || "http://localhost:8001";

    const token = request.cookies.get("auth-token")?.value;
    const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
    const bearerFromHeader = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const resolvedToken = token || bearerFromHeader;

    if (!resolvedToken) {
      return NextResponse.json({ detail: "Authentication required." }, { status: 401 });
    }

    const response = await fetch(`${AI_SERVICE_URL}/v1/ai/query/${queryId}`, {
      headers: {
        "Authorization": `Bearer ${resolvedToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-cache",
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }
    return NextResponse.json(data);
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ detail: "Failed to get query status: " + err.message }, { status: 500 });
  }
}
