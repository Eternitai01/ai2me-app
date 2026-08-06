import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/v1";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: consentId } = await params;

    if (!consentId) {
      return NextResponse.json(
        { detail: "Consent ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { consentData, privacyPolicyVersion } = body;

    // Fallback to headers if IP/user-agent not provided in body
    const forwardedFor = request.headers.get("x-forwarded-for");
    const clientIp = forwardedFor?.split(",")[0]?.trim() || "unknown";
    const clientUserAgent = request.headers.get("user-agent") || "unknown";

    // Forward the request to the backend
    const response = await fetch(`${BACKEND_URL}/cookie-consent/${consentId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-For": clientIp,
        "User-Agent": clientUserAgent,
      },
      body: JSON.stringify({
        consent_data: consentData,
        ip_address: clientIp,
        user_agent: clientUserAgent,
        privacy_policy_version: privacyPolicyVersion,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { detail: errorData.detail || "Failed to update consent data" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Cookie consent update API error:", error);
    return NextResponse.json(
      { detail: "Internal server error" },
      { status: 500 }
    );
  }
}

