import { signIn as nextAuthSignIn } from "next-auth/react";

/**
 * Sign in with Google OAuth provider (NextAuth v5)
 * In v5, OAuth signIn always redirects — redirect:false is not supported for OAuth
 */
export async function signInWithGoogle(options?: { redirect?: boolean; callbackUrl?: string }): Promise<{ ok: boolean; error?: string; data?: any; url?: string }> {
    try {
        await nextAuthSignIn("google", { callbackUrl: options?.callbackUrl || "/landing?oauth_callback=true" });
        return { ok: true, data: { redirect: true } };
    } catch (error: any) {
        return { ok: false, error: error?.message || "Google sign in error" };
    }
}

export async function signInWithGitHub(options?: { redirect?: boolean; callbackUrl?: string }): Promise<{ ok: boolean; error?: string; data?: any; url?: string }> {
    try {
        await nextAuthSignIn("github", { callbackUrl: options?.callbackUrl || "/landing?oauth_callback=true" });
        return { ok: true, data: { redirect: true } };
    } catch (error: any) {
        return { ok: false, error: error?.message || "GitHub sign in error" };
    }
}

export async function signInWithApple(options?: { redirect?: boolean; callbackUrl?: string }): Promise<{ ok: boolean; error?: string; data?: any; url?: string }> {
    try {
        await nextAuthSignIn("apple", { callbackUrl: options?.callbackUrl || "/landing?oauth_callback=true" });
        return { ok: true, data: { redirect: true } };
    } catch (error: any) {
        return { ok: false, error: error?.message || "Apple sign in error" };
    }
}
