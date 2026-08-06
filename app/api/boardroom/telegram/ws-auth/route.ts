import { NextRequest, NextResponse } from "next/server";

/**
 * Returns a token for WebSocket auth when the user is logged in via cookie.
 * The client uses this to authenticate with the backend WebSocket (v1/boardroom/telegram/ws)
 * when it cannot send cookies cross-origin.
 */
export async function GET(request: NextRequest) {
  try {
    const authToken = request.cookies.get("auth-token")?.value;
    if (!authToken) {
      return NextResponse.json(
        { detail: "Not authenticated." },
        { status: 401 }
      );
    }
    return NextResponse.json({ token: authToken });
  } catch (e) {
    const err = e as Error;
    return NextResponse.json(
      { detail: "Internal server error: " + (err.message || "Unknown error") },
      { status: 500 }
    );
  }
}
