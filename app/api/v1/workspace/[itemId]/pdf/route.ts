import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL || "http://ai2me-backend:8000";

function getToken(request: NextRequest) {
  return (
    request.cookies.get("auth-token")?.value ||
    request.headers.get("authorization")?.replace("Bearer ", "")
  );
}

// GET /api/v1/workspace/[itemId]/pdf
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const token = getToken(request);
  if (!token) return NextResponse.json({ detail: "Authentication required" }, { status: 401 });

  const { itemId } = await params;

  try {
    const res = await fetch(`${BACKEND}/v1/workspace/${itemId}/pdf`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({ detail: "PDF generation failed" }, { status: res.status });
    }

    const blob = await res.blob();
    const contentDisposition = res.headers.get("content-disposition") ?? 'attachment; filename="document.pdf"';

    return new NextResponse(blob, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": contentDisposition,
      },
    });
  } catch (e) {
    return NextResponse.json({ detail: "Internal server error" }, { status: 500 });
  }
}
