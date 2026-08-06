import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL || "http://ai2me-backend:8000";

function getToken(request: NextRequest) {
  return (
    request.cookies.get("auth-token")?.value ||
    request.headers.get("authorization")?.replace("Bearer ", "")
  );
}

// GET /api/v1/workspace?item_type=&search=&page=&page_size=
export async function GET(request: NextRequest) {
  const token = getToken(request);
  if (!token) return NextResponse.json({ detail: "Authentication required" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const params = new URLSearchParams();
  const item_type = searchParams.get("item_type");
  const search    = searchParams.get("search");
  const page      = searchParams.get("page") ?? "1";
  const page_size = searchParams.get("page_size") ?? "20";

  if (item_type && item_type !== "all") {
    if (item_type === "file") {
      params.set("item_type_prefix", "file");
    } else {
      params.set("item_type", item_type);
    }
  }
  if (search?.trim()) params.set("search", search.trim());
  params.set("page", page);
  params.set("page_size", page_size);

  try {
    const res = await fetch(`${BACKEND}/v1/workspace/?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json({ detail: "Internal server error" }, { status: 500 });
  }
}
