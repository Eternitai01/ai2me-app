// middleware.ts
import { NextResponse, NextRequest } from "next/server";
const AUTH_PAGES = ["/login", "/signup", "/forgot-password"];
const PROTECTED_PREFIXES = ["/dashboard", "/landing" ,"/boardroom"];
const TOKEN_EXPIRY_WARNING_SECONDS = 3600; // Warn if < 1 hour remains (PRODUCTION)

/**
 * Decode JWT payload (no verification, just to check expiry)
 */
function decodeJWT(token: string): { exp?: number; [key: string]: any } | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        
        const payload = parts[1];
        // Base64 decode
        const decoded = Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString();
        return JSON.parse(decoded);
    } catch {
        return null;
    }
}

/**
 * Check token expiry and return warning header if expiring soon
 */
function checkTokenExpiry(token: string): { expired: boolean; expiringSoon: boolean; expiresIn: number } {
    const payload = decodeJWT(token);
    
    if (!payload || !payload.exp) {
        return { expired: true, expiringSoon: false, expiresIn: 0 };
    }
    
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = payload.exp - now;
    
    return {
        expired: expiresIn <= 0,
        expiringSoon: expiresIn > 0 && expiresIn < TOKEN_EXPIRY_WARNING_SECONDS,
        expiresIn
    };
}

function isAuthenticated(req: NextRequest) {
    // Also accept NextAuth session token — set automatically after OAuth (Apple/Google/GitHub)
    // This allows /landing to load after OAuth so OAuthCallbackHandler can set auth-token
    const nextAuthToken = req.cookies.get('next-auth.session-token') ||
                          req.cookies.get('__Secure-next-auth.session-token');
    if (nextAuthToken && nextAuthToken.value) {
        return true;
    }

    const authToken = req.cookies.get('auth-token');
    const authUser = req.cookies.get('auth-user');

    // Check if both required cookies exist and have values
    if (authToken && authToken.value && authUser && authUser.value) {
        if (authToken.value.startsWith('eyJ')) {
            // Check if token is expired
            const { expired } = checkTokenExpiry(authToken.value);
            if (expired) {
                return false;
            }
            return true;
        }
    }

    return false;
}

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Skip middleware for static assets and API routes
    if (
        pathname.startsWith('/_next/') ||
        pathname.startsWith('/api/') ||
        pathname.includes('.')
    ) {
        return NextResponse.next();
    }

    // Redirect /login and /signup to home page for all users
    if (pathname === '/login' || pathname === '/signup') {
        const url = req.nextUrl.clone();
        url.pathname = "/";
        url.search = "";
        return NextResponse.redirect(url);
    }

    const authed = isAuthenticated(req);
    
    // Check token expiry and add warning header if expiring soon
    let response = NextResponse.next();
    
    if (authed) {
        const authToken = req.cookies.get('auth-token');
        if (authToken && authToken.value) {
            const { expiringSoon, expiresIn } = checkTokenExpiry(authToken.value);
            if (expiringSoon) {
                response.headers.set('X-Token-Expires-In', expiresIn.toString());
                response.headers.set('X-Token-Expiring-Soon', 'true');
            }
        }
    }

    // 1) If authenticated and trying to access auth pages (forgot-password), redirect to home
    if (authed && AUTH_PAGES.includes(pathname)) {
        const url = req.nextUrl.clone();
        url.pathname = "/";
        url.search = "";
        return NextResponse.redirect(url);
    }

    // 2) If NOT authenticated and trying to access protected areas, redirect to home
    // Exception: allow OAuth callback through so OAuthCallbackHandler can set cookies
    const isOAuthCallback = req.nextUrl.searchParams.get("oauth_callback") === "true";
    if (!authed && PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
        if (isOAuthCallback) {
            // Let the page load so OAuthCallbackHandler can set auth cookies
            return NextResponse.next();
        }
        const url = req.nextUrl.clone();
        url.pathname = "/";
        url.search = "";
        return NextResponse.redirect(url);
    }

    return response;
}

// Specific matcher to catch the routes you care about
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!api|_next/static|_next/image|favicon.ico).*)",
    ],
};
