import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { INTERNAL_BETA_MODE, getUserEmailFromCookies, isAllowlisted } from '@/app/lib/betaConfig'

/**
 * GET /api/beta/check
 *
 * Returns whether the current user has platform access.
 * Used by the frontend beta gate context — called once on mount
 * and re-checked before every protected action.
 */
export async function GET() {
  const cookieStore = cookies()
  const userEmail = getUserEmailFromCookies(cookieStore)
  const hasAccess = isAllowlisted(userEmail)

  return NextResponse.json(
    {
      betaMode: INTERNAL_BETA_MODE,
      hasAccess,
      // email is intentionally omitted from the response for privacy
    },
    {
      headers: {
        // Do not cache — access status can change
        'Cache-Control': 'no-store',
      },
    }
  )
}
