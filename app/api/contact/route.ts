import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const message = typeof body?.message === "string" ? body.message.trim() : "";

    const emailRe = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }
    if (!emailRe.test(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }
    if (message.length < 10) {
      return NextResponse.json(
        { success: false, error: "Message must be at least 10 characters" },
        { status: 400 }
      );
    }
    if (message.length > 1000) {
      return NextResponse.json(
        { success: false, error: "Message must be at most 1000 characters" },
        { status: 400 }
      );
    }

    let res: Response;
    try {
      res = await fetch(`${BACKEND_URL}/v1/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, message }),
      });
    } catch (fetchErr) {
      const msg =
        fetchErr instanceof Error ? fetchErr.message : "Backend request failed";
      console.error("Contact API: backend unreachable", fetchErr);
      return NextResponse.json(
        {
          success: false,
          error: `Backend unavailable (${msg}). Ensure backend is running and BACKEND_URL is correct.`,
        },
        { status: 503 }
      );
    }

    const data = await res.json().catch(() => ({}));
    console.log("Contact API: response data", data);
    if (!res.ok) {
      const detail = data?.detail;
      const err =
        Array.isArray(detail) ? detail[0]?.msg : detail ??
        (typeof detail === "string" ? detail : null) ??
        data?.error ??
        (res.status === 404
          ? "Contact endpoint not found. Run backend migrations (contact_messages table)."
          : "Failed to send message");
      return NextResponse.json(
        { success: false, error: typeof err === "string" ? err : JSON.stringify(err) },
        { status: res.status }
      );
    }
    return NextResponse.json({ success: true, message: "Stored" });
  } catch (e) {
    console.error("Contact API error:", e);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
