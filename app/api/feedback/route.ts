import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_URL ? `${process.env.BACKEND_URL}/v1` : "http://localhost:8000/v1";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const apiKey =
      request.headers.get("x-api-key") || request.headers.get("X-API-Key");

    if (!apiKey) {
      return NextResponse.json(
        { detail: "Missing X-API-Key header" },
        { status: 401 }
      );
    }

    const response = await fetch(`${BACKEND_URL}/feedback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Feedback API error:", error);
    return NextResponse.json(
      { detail: "Internal server error" },
      { status: 500 }
    );
  }
}
