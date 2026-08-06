import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.ai2me.com";

  // User denied OAuth
  if (error) {
    return NextResponse.redirect(`${appUrl}/connectors?error=google_drive_denied`);
  }

  if (!code) {
    return NextResponse.redirect(`${appUrl}/connectors?error=google_drive_no_code`);
  }

  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET!;
  const redirectUri =
    process.env.GOOGLE_DRIVE_REDIRECT_URI ||
    `${appUrl}/api/connectors/google-drive/callback`;

  try {
    // 1. Exchange authorization code for tokens
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      console.error("Google token exchange failed:", errBody);
      return NextResponse.redirect(`${appUrl}/connectors?error=google_drive_token_exchange`);
    }

    const tokenData = await tokenRes.json();
    const { access_token, refresh_token, expires_in, scope } = tokenData;

    // 2. Get user info from Google
    const userInfoRes = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    let providerEmail: string | undefined;
    let providerUserId: string | undefined;

    if (userInfoRes.ok) {
      const userInfo = await userInfoRes.json();
      providerEmail = userInfo.email;
      providerUserId = userInfo.id;
    }

    // 3. Calculate token expiry
    const tokenExpiry = expires_in
      ? new Date(Date.now() + expires_in * 1000).toISOString()
      : undefined;

    // 4. Get the auth token from cookies to call the FastAPI backend
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token")?.value;

    if (!authToken) {
      return NextResponse.redirect(`${appUrl}/connectors?error=google_drive_not_authenticated`);
    }

    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";

    // 5. Store tokens in FastAPI backend
    const storeRes = await fetch(`${backendUrl}/v1/google-drive/tokens`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        access_token,
        refresh_token: refresh_token || null,
        token_expiry: tokenExpiry || null,
        scope: scope || null,
        provider_user_id: providerUserId || null,
        provider_email: providerEmail || null,
      }),
    });

    if (!storeRes.ok) {
      const storeErr = await storeRes.text();
      console.error("Failed to store Google Drive tokens:", storeErr);
      return NextResponse.redirect(`${appUrl}/connectors?error=google_drive_store_failed`);
    }

    // 6. Redirect back to connectors page with success
    return NextResponse.redirect(`${appUrl}/connectors?connected=google_drive`);
  } catch (err) {
    console.error("Google Drive OAuth callback error:", err);
    return NextResponse.redirect(`${appUrl}/connectors?error=google_drive_callback_error`);
  }
}
