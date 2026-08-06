import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { consentData, ipAddress, userAgent, privacyPolicyVersion } = body;

    console.log("🍪 Cookie consent request:", { consentData, ipAddress, userAgent, privacyPolicyVersion });

    // Fallback to headers if IP/user-agent not provided in body
    const forwardedFor = request.headers.get("x-forwarded-for");
    const clientIp =
      ipAddress || forwardedFor?.split(",")[0]?.trim() || "127.0.0.1";
    const clientUserAgent =
      userAgent || request.headers.get("user-agent") || "Mozilla/5.0";

    // Forward the request to the backend with IP and user agent
    const backendPayload = {
      consent_data: consentData,
      ip_address: clientIp,
      user_agent: clientUserAgent,
      privacy_policy_version: privacyPolicyVersion || "1.0",
    };

    console.log("🍪 Sending to backend:", BACKEND_URL, backendPayload);

    const response = await fetch(`${BACKEND_URL}/v1/cookie-consent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-For": clientIp,
        "User-Agent": clientUserAgent,
      },
      body: JSON.stringify(backendPayload),
    });

    if (!response.ok) {
      // Try to parse as JSON, but handle HTML error pages
      const contentType = response.headers.get("content-type");
      let errorMessage = "Failed to store consent data";
      
      if (contentType?.includes("application/json")) {
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorMessage;
          console.error("🍪 Backend error:", errorData);
        } catch (e) {
          console.error("🍪 Failed to parse error response:", e);
        }
      } else {
        const textResponse = await response.text();
        console.error("🍪 Backend returned non-JSON response:", textResponse.substring(0, 200));
      }
      
      return NextResponse.json(
        { detail: errorMessage },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Cookie consent API error:", error);
    return NextResponse.json(
      { detail: "Internal server error" },
      { status: 500 }
    );
  }
}
