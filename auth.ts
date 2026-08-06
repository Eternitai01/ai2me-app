import NextAuth from "next-auth";
import jwt from "jsonwebtoken";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import AppleProvider from "next-auth/providers/apple";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "https://us.be.ai2me.com";

async function syncWithBackend(provider: string, account: any, user: any) {
  try {
    const body: Record<string, string> = {
      email: user.email ?? "",
      name: user.name ?? "",
      image: user.image ?? "",
    };
    if (provider === "google" && account?.id_token) {
      body.id_token = account.id_token;
      body.access_token = account.access_token ?? "";
    } else if (provider === "github") {
      body.access_token = account?.access_token ?? "";
      body.provider_id = String(account?.providerAccountId ?? "");
    } else if (provider === "apple") {
      body.id_token = account?.id_token ?? "";
    }
    const res = await fetch(`${BACKEND_URL}/v1/auth/${provider}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.access_token) return data as { access_token?: string; user?: Record<string, unknown> };
    }
  } catch (_) {}
  // Backend call failed — return null so OAuthCallbackHandler can retry directly
  return null;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "ai2me-nextauth-secret-2026-eternitai-prod-xK9mPqR7vL2nW5jY",
  trustHost: true,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: { prompt: "login", access_type: "offline", response_type: "code" },
      },
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || process.env.GITHUB_OAUTH_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || process.env.GITHUB_OAUTH_CLIENT_SECRET || "",
    }),
    // Apple Sign In — supports APPLE_SECRET (pre-generated JWT) or APPLE_PRIVATE_KEY (.p8 key)
    ...(process.env.APPLE_ID && (process.env.APPLE_SECRET || (process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY))
      ? [
          AppleProvider({
            clientId: process.env.APPLE_ID,
            clientSecret: process.env.APPLE_SECRET || (() => {
              const now = Math.floor(Date.now() / 1000);
              const privateKey = (process.env.APPLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
              return jwt.sign(
                {
                  iss: process.env.APPLE_TEAM_ID,
                  iat: now,
                  exp: now + 15777000, // ~6 months
                  aud: "https://appleid.apple.com",
                  sub: process.env.APPLE_ID,
                },
                privateKey,
                {
                  algorithm: "ES256",
                  keyid: process.env.APPLE_KEY_ID,
                } as any
              );
            })(),
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account }: any) {
      const data = await syncWithBackend(account?.provider ?? "", account, user);
      if (data?.access_token) {
        (user as any).backendToken = data.access_token;
        (user as any).backendUser = data.user;
      }
      if (account?.id_token) (user as any).id_token = account.id_token;
      return true;
    },
    async jwt({ token, user, account }: any) {
      // On sign-in: store tokens from OAuth
      if (user?.backendToken) token.backendToken = user.backendToken;
      if (user?.backendUser) token.backendUser = user.backendUser;
      if (account?.id_token) token.id_token = account.id_token;
      if (user?.id_token) token.id_token = user.id_token;
      // Store provider so OAuthCallbackHandler can detect it
      if (account?.provider) token.provider = account.provider;

      // Re-issue backendToken only if a valid one already exists and is approaching expiry (>23h old)
      // Never generate a fake token if syncWithBackend failed — that causes silent logged-out state
      const now = Math.floor(Date.now() / 1000);
      const tokenAge = token.backendTokenIssuedAt ? now - (token.backendTokenIssuedAt as number) : Infinity;
      if (token.backendToken && tokenAge > 82800) {
        try {
          const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "";
          const email = (token.email as string) ?? "";
          if (secret && email) {
            token.backendToken = jwt.sign(
              { sub: email, email, type: "access", provider: (token.provider as string) || "google" },
              secret,
              { algorithm: "HS256", expiresIn: "24h" }
            );
            token.backendTokenIssuedAt = now;
          }
        } catch (_) { /* ignore */ }
      }

      return token;
    },
    async session({ session, token }: any) {
      if (token.backendToken) (session as any).backendToken = token.backendToken;
      if (token.backendUser) (session as any).backendUser = token.backendUser;
      if (token.id_token) (session as any).id_token = token.id_token;
      if (token.provider) (session as any).provider = token.provider;
      return session;
    },
    async redirect({ url, baseUrl }: any) {
      try {
        // Relative URL (e.g. "/" from signOut callbackUrl) — return as absolute
        if (url.startsWith('/')) return `${baseUrl}${url}`;
        // Absolute URL on same origin — return as-is
        if (url.startsWith(baseUrl)) return url;
        // External OAuth provider callback without explicit callbackUrl — send to OAuth handler
        return `${baseUrl}/landing?oauth_callback=true`;
      } catch {
        return `${baseUrl}/landing?oauth_callback=true`;
      }
    },
  },
  pages: { signIn: "/", error: "/" },
  session: { strategy: "jwt" as const },
});
