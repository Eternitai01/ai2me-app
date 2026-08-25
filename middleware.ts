// middleware.ts
import { NextResponse, NextRequest } from "next/server";

// ============================================================
// Internal Beta Gate — active until September 1 launch
// Set INTERNAL_BETA_MODE=false to open platform to all users.
// ============================================================
const INTERNAL_BETA_MODE = process.env.INTERNAL_BETA_MODE === "true";

const BETA_ALLOWLIST: string[] = [
  "cc@eternitaigroup.com",
  "sc@eternitai.com",
  "nelson@eternitai.com",
  "nc@eternitai.com",
];

/**
 * AI tool API routes blocked for non-allowlisted users in beta mode.
 * Sign-up, auth, session, and user-profile endpoints are always allowed.
 */
const BETA_PROTECTED_API_PREFIXES = [
  "/api/ai/",
  "/api/account/",
  "/api/agentos247",
  "/api/api-keys",
  "/api/blockchain",
  "/api/integrations",
];

/** Extract the verified user email from httpOnly cookies set by the auth system. */
function getUserEmailFromRequest(req: NextRequest): string | null {
  // Primary: auth-user cookie = JSON.stringify(BackendUser) — has .email field
  const authUserCookie = req.cookies.get("auth-user");
  if (authUserCookie?.value) {
    try {
      const user = JSON.parse(authUserCookie.value);
      if (user?.email) return (user.email as string).toLowerCase();
    } catch { /* malformed */ }
  }
  // Fallback: decode auth-token JWT payload for email claim
  const authToken = req.cookies.get("auth-token");
  if (authToken?.value && authToken.value.startsWith("eyJ")) {
    const payload = decodeJWT(authToken.value);
    const email = payload?.email || payload?.user_email;
    if (email && typeof email === "string" && email.includes("@")) {
      return email.toLowerCase();
    }
  }
  return null;
}

function isBetaAllowlisted(email: string | null): boolean {
  if (!INTERNAL_BETA_MODE) return true;
  if (!email) return false;
  return BETA_ALLOWLIST.includes(email);
}

// ============================================================
// Existing auth helpers (unchanged)
// ============================================================
const AUTH_PAGES = ["/login", "/signup", "/forgot-password"];
const PROTECTED_PREFIXES = ["/dashboard", "/landing", "/boardroom"];
const TOKEN_EXPIRY_WARNING_SECONDS = 3600;

function decodeJWT(token: string): { exp?: number; [key: string]: any } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = Buffer.from(
      payload.replace(/-/g, "+").replace(/_/g, "/"),
      "base64"
    ).toString();
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function checkTokenExpiry(token: string): {
  expired: boolean;
  expiringSoon: boolean;
  expiresIn: number;
} {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    return { expired: true, expiringSoon: false, expiresIn: 0 };
  }
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = payload.exp - now;
  return {
    expired: expiresIn <= 0,
    expiringSoon: expiresIn > 0 && expiresIn < TOKEN_EXPIRY_WARNING_SECONDS,
    expiresIn,
  };
}

function isAuthenticated(req: NextRequest) {
  const nextAuthToken =
    req.cookies.get("next-auth.session-token") ||
    req.cookies.get("__Secure-next-auth.session-token");
  if (nextAuthToken?.value) return true;

  const authToken = req.cookies.get("auth-token");
  const authUser = req.cookies.get("auth-user");
  if (authToken?.value && authUser?.value && authToken.value.startsWith("eyJ")) {
    const { expired } = checkTokenExpiry(authToken.value);
    return !expired;
  }
  return false;
}

// ============================================================
// Middleware
// ============================================================
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Beta gate: intercept protected AI API routes BEFORE the /api pass-through ──
  if (
    INTERNAL_BETA_MODE &&
    BETA_PROTECTED_API_PREFIXES.some((p) => pathname.startsWith(p))
  ) {
    const userEmail = getUserEmailFromRequest(req);
    if (!isBetaAllowlisted(userEmail)) {
      return NextResponse.json(
        {
          error: "internal_beta",
          message:
            "AI2me is currently completing internal beta testing. " +
            "You are on the list and will receive access in early September.",
        },
        { status: 403 }
      );
    }
  }

  // Pass through static assets and ALL other API routes
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Redirect /login and /signup to home
  if (pathname === "/login" || pathname === "/signup") {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  const authed = isAuthenticated(req);
  let response = NextResponse.next();

  if (authed) {
    const authToken = req.cookies.get("auth-token");
    if (authToken?.value) {
      const { expiringSoon, expiresIn } = checkTokenExpiry(authToken.value);
      if (expiringSoon) {
        response.headers.set("X-Token-Expires-In", expiresIn.toString());
        response.headers.set("X-Token-Expiring-Soon", "true");
      }
    }
  }

  if (authed && AUTH_PAGES.includes(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  const isOAuthCallback =
    req.nextUrl.searchParams.get("oauth_callback") === "true";
  if (
    !authed &&
    PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  ) {
    if (isOAuthCallback) {
      return NextResponse.next();
    }
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
