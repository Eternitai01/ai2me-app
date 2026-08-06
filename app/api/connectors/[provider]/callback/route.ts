import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// ── Re-use provider config (same map as auth/route.ts, co-located for clarity) ─

interface ProviderConfig {
  authUrl: string;
  clientIdVar: string;
  clientSecretVar: string;
  scopes: string[];
  tokenUrl: string;
  userinfoUrl?: string;
  extraParams?: Record<string, string>;
  tokenEncoding?: "json" | "basic";
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
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.ai2me.com";

  const config = PROVIDER_CONFIGS[provider];
  if (!config) {
    return NextResponse.redirect(
      `${appUrl}/connectors?error=${provider}_unknown_provider`
    );
  }

  // User denied OAuth
  if (error) {
    return NextResponse.redirect(`${appUrl}/connectors?error=${provider}_denied`);
  }

  if (!code) {
    return NextResponse.redirect(`${appUrl}/connectors?error=${provider}_no_code`);
  }

  const clientId = process.env[config.clientIdVar]!;
  const clientSecret = process.env[config.clientSecretVar]!;
  const redirectUri = `${appUrl}/api/connectors/${provider}/callback`;

  try {
    // ── 1. Exchange authorisation code for tokens ────────────────────────────
    let tokenRes: Response;

    if (config.tokenEncoding === "basic") {
      // Notion: Basic auth + JSON body
      const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
      tokenRes = await fetch(config.tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${credentials}`,
        },
        body: JSON.stringify({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
        }),
      });
    } else if (provider === "github") {
      // GitHub: form-encoded but needs Accept: application/json
      tokenRes = await fetch(config.tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
        }),
      });
    } else {
      // Standard form-encoded (Google, Slack, Microsoft)
      tokenRes = await fetch(config.tokenUrl, {
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
    }

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      console.error(`[${provider}] token exchange failed:`, errBody);
      return NextResponse.redirect(
        `${appUrl}/connectors?error=${provider}_token_exchange`
      );
    }

    const tokenData = await tokenRes.json();
    const { access_token, refresh_token, expires_in, scope } = tokenData;

    if (!access_token) {
      console.error(`[${provider}] no access_token in response:`, tokenData);
      return NextResponse.redirect(
        `${appUrl}/connectors?error=${provider}_no_access_token`
      );
    }

    // ── 2. Get user info from provider ───────────────────────────────────────
    let providerEmail: string | undefined;
    let providerUserId: string | undefined;

    if (config.userinfoUrl) {
      try {
        const userinfoRes = await fetch(config.userinfoUrl, {
          headers: { Authorization: `Bearer ${access_token}` },
        });
        if (userinfoRes.ok) {
          const userInfo = await userinfoRes.json();
          // Google/Microsoft → id/email; GitHub → id/email; Slack handled differently
          providerEmail = userInfo.email ?? userInfo.mail ?? undefined;
          providerUserId = userInfo.id
            ? String(userInfo.id)
            : userInfo.sub ?? undefined;
        }
      } catch (e) {
        console.warn(`[${provider}] userinfo fetch failed:`, e);
      }
    }

    // Slack: user identity is nested in authed_user
    if (provider === "slack" && tokenData.authed_user) {
      providerUserId = tokenData.authed_user.id ?? undefined;
    }

    // Notion: bot_id as provider user id
    if (provider === "notion" && tokenData.bot_id) {
      providerUserId = tokenData.bot_id;
      // Notion owner.user.person.email (if available)
      providerEmail = tokenData.owner?.user?.person?.email ?? undefined;
    }

    // ── 3. Calculate token expiry ────────────────────────────────────────────
    const tokenExpiry = expires_in
      ? new Date(Date.now() + expires_in * 1000).toISOString()
      : undefined;

    // ── 4. Get auth token from cookies ───────────────────────────────────────
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token")?.value;

    if (!authToken) {
      return NextResponse.redirect(
        `${appUrl}/connectors?error=${provider}_not_authenticated`
      );
    }

    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";

    // ── 5. Store tokens in FastAPI backend ───────────────────────────────────
    const storeRes = await fetch(
      `${backendUrl}/v1/oauth/${provider}/tokens`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          access_token,
          refresh_token: refresh_token ?? null,
          token_expiry: tokenExpiry ?? null,
          scope: scope ?? null,
          provider_user_id: providerUserId ?? null,
          provider_email: providerEmail ?? null,
        }),
      }
    );

    if (!storeRes.ok) {
      const storeErr = await storeRes.text();
      console.error(`[${provider}] failed to store tokens:`, storeErr);
      return NextResponse.redirect(
        `${appUrl}/connectors?error=${provider}_store_failed`
      );
    }

    // ── 6. Redirect back to connectors page with success ─────────────────────
    return NextResponse.redirect(`${appUrl}/connectors?connected=${provider}`);
  } catch (err) {
    console.error(`[${provider}] OAuth callback error:`, err);
    return NextResponse.redirect(
      `${appUrl}/connectors?error=${provider}_callback_error`
    );
  }
}
