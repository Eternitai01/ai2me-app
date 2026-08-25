import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const INTERNAL_BETA_MODE = process.env.INTERNAL_BETA_MODE === "true";

const BETA_ALLOWLIST: string[] = [
  "cc@eternitaigroup.com",
  "sc@eternitai.com",
  "nelson@eternitai.com",
  "nc@eternitai.com",
];

/**
 * GET /api/beta/check
 *
 * Server-side endpoint: returns whether the currently authenticated user
 * has full platform access or is beta-restricted.
 *
 * Reads email from the httpOnly auth-user cookie — never from a client header.
 */
export async function GET() {
  if (!INTERNAL_BETA_MODE) {
    return NextResponse.json({ betaMode: false, hasAccess: true }, {
      headers: { "Cache-Control": "no-store" },
    });
  }

  const cookieStore = cookies();
  let email: string | null = null;

  const authUserCookie = cookieStore.get("auth-user");
  if (authUserCookie?.value) {
    try {
      const user = JSON.parse(authUserCookie.value);
      if (user?.email) email = user.email.toLowerCase();
    } catch { /* malformed */ }
  }

  const hasAccess = email !== null && BETA_ALLOWLIST.includes(email);

  return NextResponse.json(
    { betaMode: true, hasAccess },
    { headers: { "Cache-Control": "no-store" } }
  );
}
