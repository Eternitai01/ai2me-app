import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Get auth token from cookies or header
    const token = request.cookies.get("auth-token")?.value ||
      request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { detail: "Authentication required" },
        { status: 401 }
      );
    }

    // Get query params
    const url = new URL(request.url);
    const planName = url.searchParams.get("plan_name");
    const billingCycle = url.searchParams.get("billing_cycle") || "monthly";
    const credits = url.searchParams.get("credits");

    if (!planName) {
      return NextResponse.json(
        { detail: "Plan name is required" },
        { status: 400 }
      );
    }

    // Forward request to backend API
    const backendUrl = process.env.BACKEND_URL || "http://ai2me-backend:8000";
    const creditsParam = credits ? `&credits=${credits}` : "";
    const response = await fetch(
      `${backendUrl}/v1/subscriptions/checkout?plan_name=${planName}&billing_cycle=${billingCycle}${creditsParam}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { detail: data.detail || "Failed to create checkout session" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Checkout API error:", error);
    return NextResponse.json(
      { detail: "Internal server error" },
      { status: 500 }
    );
  }
}

