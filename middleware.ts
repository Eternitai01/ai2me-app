import { NextRequest, NextResponse } from 'next/server'
import { INTERNAL_BETA_MODE, getUserEmailFromCookies, isAllowlisted } from '@/app/lib/betaConfig'

/**
 * Protected API path prefixes.
 * Any request to these paths is blocked server-side for non-allowlisted
 * users when INTERNAL_BETA_MODE is true.
 *
 * This prevents bypass via direct URL or API calls — the frontend modal
 * is the UX layer; this middleware is the security layer.
 */
const PROTECTED_API_PREFIXES = [
  '/api/chat',
  '/api/tools',
  '/api/builder',
  '/api/web-builder',
  '/api/app-builder',
  '/api/slides',
  '/api/sheets',
  '/api/docs',
  '/api/research',
  '/api/generate',
  '/api/completions',
  '/api/agent',
  '/api/project',
  '/api/workspace',
]

/**
 * Public paths that are always accessible — auth, beta check, static assets.
 */
const PUBLIC_PREFIXES = [
  '/api/beta',
  '/api/auth',
  '/_next',
  '/favicon',
  '/public',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only enforce on API routes when beta mode is active
  if (!INTERNAL_BETA_MODE) return NextResponse.next()

  // Always allow public/auth endpoints
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Enforce on protected API routes
  const isProtectedApi = PROTECTED_API_PREFIXES.some((p) => pathname.startsWith(p))
  if (!isProtectedApi) return NextResponse.next()

  const userEmail = getUserEmailFromCookies(request.cookies)

  if (!isAllowlisted(userEmail)) {
    return NextResponse.json(
      {
        error: 'internal_beta',
        message:
          'AI2me is currently in internal beta testing. ' +
          'Your account is registered and you will receive access in early September.',
      },
      { status: 403 }
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all API routes. Public pages and static assets are
     * handled by the PUBLIC_PREFIXES check above.
     */
    '/api/:path*',
  ],
}
