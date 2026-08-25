/**
 * Beta Gate Configuration — AI2me Internal Beta
 *
 * INTERNAL_BETA_MODE=true  → only allowlisted accounts can use platform tools
 * INTERNAL_BETA_MODE=false → all registered users have full access
 *
 * Flip the flag on September 1 to open the platform.
 * No other changes required.
 */

export const INTERNAL_BETA_MODE = process.env.INTERNAL_BETA_MODE === 'true'

/** Accounts that always bypass the beta restriction. */
export const BETA_ALLOWLIST: string[] = [
  'cc@eternitaigroup.com',
  'sc@eternitai.com',
  'nelson@eternitai.com',
  'nc@eternitai.com',
]

/**
 * Returns true if the user should have full access.
 * - Always true when INTERNAL_BETA_MODE is false.
 * - Always true for allowlisted accounts regardless of mode.
 */
export function isAllowlisted(email: string | null | undefined): boolean {
  if (!INTERNAL_BETA_MODE) return true
  if (!email) return false
  return BETA_ALLOWLIST.map((e) => e.toLowerCase()).includes(email.toLowerCase())
}

/**
 * Extract the authenticated user's email from request cookies.
 *
 * AUTH INTEGRATION POINT:
 * Replace or extend this function when you add your auth provider.
 *
 * - NextAuth:   import { getToken } from 'next-auth/jwt'; const t = await getToken({ req }); return t?.email ?? null
 * - Supabase:   decode the `sb-<project>-auth-token` cookie JWT (see helper below)
 * - Custom JWT: decode your session cookie and return the email claim
 */
export function getUserEmailFromCookies(
  cookies: { get(name: string): { value: string } | undefined }
): string | null {
  // Direct email cookie (can be set by any auth layer)
  const direct = cookies.get('ai2me-user-email')
  if (direct?.value) return direct.value

  // Supabase: try to decode the auth token JWT
  for (const name of ['sb-auth-token', 'supabase-auth-token']) {
    const cookie = cookies.get(name)
    if (!cookie?.value) continue
    try {
      // JWT is base64url: header.payload.signature
      const payload = cookie.value.split('.')[1]
      if (!payload) continue
      const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
      const email =
        decoded?.email ||
        decoded?.user_metadata?.email ||
        decoded?.app_metadata?.email ||
        null
      if (email) return email
    } catch {
      // malformed token — skip
    }
  }

  return null
}
