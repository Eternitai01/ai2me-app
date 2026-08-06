import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.API_URL ||
    "http://backend:8000";

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid form data" },
      { status: 400 }
    );
  }

  const file = form.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Forward auth token from cookie or header
  const authCookie = req.cookies.get("auth-token")?.value || "";
  const authHeader = req.headers.get("authorization") || "";
  const token = authCookie || authHeader;
  const bearerToken = token
    ? token.startsWith("Bearer ")
      ? token
      : `Bearer ${token}`
    : "";

  const backendForm = new FormData();
  backendForm.append("file", file);

  const headers: Record<string, string> = {};
  if (bearerToken) {
    headers["Authorization"] = bearerToken;
  }

  let resp: Response;
  try {
    resp = await fetch(`${apiUrl}/api/v1/generate/upload-reference`, {
      method: "POST",
      headers,
      body: backendForm,
    });
  } catch (err) {
    console.error("[upload-reference] Backend unreachable:", err);
    return NextResponse.json(
      { error: "Backend unreachable" },
      { status: 502 }
    );
  }

  const body = await resp.text();
  let data: unknown;
  try {
    data = JSON.parse(body);
  } catch {
    data = { error: body || "Unexpected response" };
  }

  return NextResponse.json(data, { status: resp.status });
}
