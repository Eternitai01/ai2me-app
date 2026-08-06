import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL || "http://ai2me-backend:8000";

function getToken(request: NextRequest) {
  return (
    request.cookies.get("auth-token")?.value ||
    request.headers.get("authorization")?.replace("Bearer ", "")
  );
}

// GET /api/v1/workspace/[itemId]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const token = getToken(request);
  if (!token) return NextResponse.json({ detail: "Authentication required" }, { status: 401 });

  const { itemId } = await params;

  try {
    const res = await fetch(`${BACKEND}/v1/workspace/${itemId}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json({ detail: "Internal server error" }, { status: 500 });
  }
}


// GET /api/v1/workspace/[itemId]/download-url
// Note: this is handled by the nested /[itemId]/download-url/route.ts
