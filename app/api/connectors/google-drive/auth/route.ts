import { NextResponse } from "next/server";

const GOOGLE_OAUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

export async function GET() {
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_DRIVE_REDIRECT_URI || 
    `${process.env.NEXT_PUBLIC_APP_URL}/api/connectors/google-drive/callback`;

  if (!clientId) {
    return NextResponse.json(
      { error: "Google Drive OAuth not configured" },
      { status: 500 }
    );
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: [
      "https://www.googleapis.com/auth/drive.readonly",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ].join(" "),
    access_type: "offline",   // get refresh_token
    prompt: "consent",        // always show consent to ensure refresh_token
    state: "google_drive_connect",
  });

  const authUrl = `${GOOGLE_OAUTH_URL}?${params.toString()}`;

  return NextResponse.json({ auth_url: authUrl });
}
