import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hours = searchParams.get("hours") || "24";

    // Handle both cases: API_BASE_URL with or without /v1
    const baseUrl = API_BASE_URL.endsWith("/v1")
      ? API_BASE_URL
      : `${API_BASE_URL}/v1`;
    const url = `${baseUrl}/status/?hours=${hours}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend error response:", errorText);
      throw new Error(
        `API request failed: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Status API error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch status data",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
