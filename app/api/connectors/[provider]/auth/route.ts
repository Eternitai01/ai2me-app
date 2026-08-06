import { NextRequest, NextResponse } from "next/server";

// ── Provider configuration map ────────────────────────────────────────────────

interface ProviderConfig {
  authUrl: string;
  clientIdVar: string;
  clientSecretVar: string;
  scopes: string[];
  tokenUrl: string;
  userinfoUrl?: string;
  extraParams?: Record<string, string>;
  tokenEncoding?: "json" | "basic"; // Notion uses 'basic'
}

const PROVIDER_CONFIGS: Record<string, ProviderConfig> = {
  gmail: {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    clientIdVar: "GOOGLE_DRIVE_CLIENT_ID",
    clientSecretVar: "GOOGLE_DRIVE_CLIENT_SECRET",
    scopes: [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
    tokenUrl: "https://oauth2.googleapis.com/token",
    userinfoUrl: "https://www.googleapis.com/oauth2/v2/userinfo",
    extraParams: { access_type: "offline", prompt: "consent" },
  },
  "google-calendar": {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    clientIdVar: "GOOGLE_DRIVE_CLIENT_ID",
    clientSecretVar: "GOOGLE_DRIVE_CLIENT_SECRET",
    scopes: [
      "https://www.googleapis.com/auth/calendar.readonly",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
    tokenUrl: "https://oauth2.googleapis.com/token",
    userinfoUrl: "https://www.googleapis.com/oauth2/v2/userinfo",
    extraParams: { access_type: "offline", prompt: "consent" },
  },
  github: {
    authUrl: "https://github.com/login/oauth/authorize",
    clientIdVar: "GITHUB_OAUTH_CLIENT_ID",
    clientSecretVar: "GITHUB_OAUTH_CLIENT_SECRET",
    scopes: ["read:user", "repo"],
    tokenUrl: "https://github.com/login/oauth/access_token",
    userinfoUrl: "https://api.github.com/user",
    extraParams: {},
  },
  slack: {
    authUrl: "https://slack.com/oauth/v2/authorize",
    clientIdVar: "SLACK_CLIENT_ID",
    clientSecretVar: "SLACK_CLIENT_SECRET",
    scopes: ["channels:read", "channels:history", "files:read", "users:read"],
    tokenUrl: "https://slack.com/api/oauth.v2.access",
    extraParams: { user_scope: "identity.basic,identity.email" },
  },
  notion: {
    authUrl: "https://api.notion.com/v1/oauth/authorize",
    clientIdVar: "NOTION_CLIENT_ID",
    clientSecretVar: "NOTION_CLIENT_SECRET",
    scopes: [],
    tokenUrl: "https://api.notion.com/v1/oauth/token",
    extraParams: { response_type: "code", owner: "user" },
    tokenEncoding: "basic",
  },
  outlook: {
    authUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    clientIdVar: "MICROSOFT_CLIENT_ID",
    clientSecretVar: "MICROSOFT_CLIENT_SECRET",
    scopes: ["Mail.Read", "Calendars.Read", "User.Read", "offline_access"],
    tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    userinfoUrl: "https://graph.microsoft.com/v1.0/me",
    extraParams: { response_type: "code" },
  },
};

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const config = PROVIDER_CONFIGS[provider];

  if (!config) {
    return NextResponse.json(
      { error: `Unknown provider: ${provider}` },
      { status: 400 }
    );
  }

  const clientId = process.env[config.clientIdVar];
  if (!clientId) {
    return NextResponse.json(
      { error: `${provider} OAuth not configured (missing ${config.clientIdVar})` },
      { status: 500 }
    );
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://www.ai2me.com";
  const redirectUri = `${appUrl}/api/connectors/${provider}/callback`;

  const params_ = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    state: `${provider}_connect`,
    ...(config.scopes.length > 0 ? { scope: config.scopes.join(" ") } : {}),
    ...(config.extraParams ?? {}),
  });

  // Notion uses redirect_uri differently (already in extraParams handled via standard flow)
  const authUrl = `${config.authUrl}?${params_.toString()}`;

  return NextResponse.json({ auth_url: authUrl });
}

export { PROVIDER_CONFIGS };
