import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Get auth token from cookies
    const token = request.cookies.get("auth-token")?.value;

    if (!token) {
      return NextResponse.json(
        { detail: "Authentication required" },
        { status: 401 }
      );
    }

    // Forward request to backend API with caching
    // Default to Docker internal service name if backend URL is not set
    const backendUrl = process.env.BACKEND_URL || "http://ai2me-backend:8000";
    const response = await fetch(`${backendUrl}/v1/credits/balance`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      // Add cache control
      cache: "no-store", // Disable Next.js caching, but we'll add our own
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { detail: data.detail || "Failed to get credit balance" },
        { status: response.status }
      );
    }

    // Return with no-cache headers to ensure fresh data
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("Credit balance API error:", error);
    // Log more details if it's a fetch error to help debugging
    if (error instanceof TypeError && error.message.includes("fetch")) {
      console.error(`Failed to connect to backend at ${process.env.BACKEND_URL || "http://ai2me-backend:8000"}`);
    }
    return NextResponse.json(
      { detail: "Internal server error" },
      { status: 500 }
    );
  }
}
