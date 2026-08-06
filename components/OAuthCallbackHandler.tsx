"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useAuth } from "@/context/AuthContext";

/**
 * Component to handle OAuth callback after Google login
 * This checks for NextAuth session and sets cookies, then redirects to landing
 */
export function OAuthCallbackHandler() {
    const { data: session, status, update: updateSession } = useSession();
    const { user, loading: authLoading, refreshSession } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const hasHandled = useRef(false);
    const retryCount = useRef(0);
    const maxRetries = 5;

    useEffect(() => {
        // Only handle once
        if (hasHandled.current) return;

        // Wait for NextAuth session to be loaded — the recovery check below needs
        // to know the real session status, not "loading".
        if (status === "loading") {
            return;
        }

        const isOAuthCallback = searchParams.get("oauth_callback") === "true";

        // Apple returns its callback as a cross-site POST (response_mode=form_post),
        // which drops the SameSite=Lax callback-url cookie. Auth.js then falls back to
        // the bare origin, so the user lands on "/" with no oauth_callback marker and
        // no auth-token cookie — signed in to NextAuth but logged out of the app.
        // Detect that state and finish the sign-in anyway.
        const hasAuthToken =
            typeof document !== "undefined" &&
            document.cookie.split("; ").some((c) => c.startsWith("auth-token="));
        const needsTokenSync = status === "authenticated" && !hasAuthToken;

        if (!isOAuthCallback && !needsTokenSync) {
            // Nothing to do on this page load
            hasHandled.current = true;
            return;
        }

        // Check if we have a NextAuth session with backend token
        if (status === "authenticated" && session) {
            // If we don't have backendToken yet, try updating the session
            if (!(session as any).backendToken && retryCount.current < maxRetries) {
                retryCount.current++;
                // Update session to trigger a refresh
                updateSession().then(() => {
                    // The useEffect will run again with the updated session
                }).catch(() => {
                    // Session update failed, will try fallback
                });
                return;
            }

            if (!(session as any).backendToken) {

                // Fallback: Try to get backend token directly from backend API
                // This can happen if the NextAuth signIn callback failed to get the token
                const idToken = (session as any).id_token;
                if (session.user) {
                    const userEmail = session.user.email;
                    const userName = session.user.name;
                    const userImage = session.user.image;

                    if (!userEmail) {
                        hasHandled.current = true;
                        return;
                    }

                    // Use async IIFE to handle await
                    (async () => {
                        try {
                            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://us.be.ai2me.com";

                            // Try with id_token first if available
                            let requestBody: any = {
                                email: userEmail,
                                name: userName,
                                image: userImage,
                            };

                            if (idToken) {
                                requestBody.id_token = idToken;
                            }

                            // Detect provider from session — provider is now explicitly stored
                            const providerName = (session as any)?.provider ||
                              ((session as any)?.id_token ? "apple" : "google");
                            const response = await fetch(`${backendUrl}/v1/auth/${providerName}`, {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                },
                                body: JSON.stringify(requestBody),
                            });

                            if (response.ok) {
                                const data = await response.json();
                                if (data.access_token) {
                                    // Set cookies directly
                                    const cookieDomain = typeof window !== 'undefined' ? '.' + window.location.hostname.split('.').slice(-2).join('.') : '.ai2me.com';
                                    document.cookie = `auth-token=${data.access_token}; path=/; domain=${cookieDomain}; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;

                                    const backendUser = data.user || data.data;
                                    if (backendUser) {
                                        document.cookie = `auth-user=${JSON.stringify(backendUser)}; path=/; domain=${cookieDomain}; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;

                                        if (backendUser.id) localStorage.setItem("user_id", backendUser.id);
                                        if (backendUser.email) localStorage.setItem("user_email", backendUser.email);
                                        if (backendUser.organization_id) localStorage.setItem("organization_id", backendUser.organization_id);
                                    }

                                    // Refresh AuthContext and redirect
                                    refreshSession().then(() => {
                                        const destination = "/landing";
                                        setTimeout(() => {
                                            router.replace(destination);
                                        }, 300);
                                    }).catch(() => {
                                        const destination = "/landing";
                                        setTimeout(() => {
                                            router.replace(destination);
                                        }, 300);
                                    });

                                    hasHandled.current = true;
                                    return;
                                }
                            }
                        } catch (error) {
                            // Fallback API call failed, user will need to try again
                        }
                    })();
                }

                hasHandled.current = true;
                return;
            }

            const backendToken = (session as any).backendToken;
            const backendUser = (session as any).backendUser;

            // Set cookies to match the existing auth flow
            if (typeof document !== "undefined" && backendToken) {
                // Set auth-token cookie
                const cookieDomain = typeof window !== 'undefined' ? '.' + window.location.hostname.split('.').slice(-2).join('.') : '.ai2me.com';
                document.cookie = `auth-token=${backendToken}; path=/; domain=${cookieDomain}; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;

                if (backendUser) {
                    // Set auth-user cookie
                    document.cookie = `auth-user=${JSON.stringify(backendUser)}; path=/; domain=${cookieDomain}; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;

                    // Save to localStorage
                    if (backendUser.id) {
                        localStorage.setItem("user_id", backendUser.id);
                    }
                    if (backendUser.email) {
                        localStorage.setItem("user_email", backendUser.email);
                    }
                    if (backendUser.organization_id) {
                        localStorage.setItem("organization_id", backendUser.organization_id);
                    }
                }

                hasHandled.current = true;

                // Refresh AuthContext to pick up the new cookies
                refreshSession().then(() => {
                    const destination = "/landing";

                    setTimeout(() => {
                        router.replace(destination);
                    }, 300);
                }).catch(() => {
                    const destination = "/landing";
                    setTimeout(() => {
                        router.replace(destination);
                    }, 300);
                });
            } else {
                hasHandled.current = true;
            }
        } else if (status === "unauthenticated") {
            // Only mark as handled if we're sure we're not in an OAuth callback
            if (!isOAuthCallback) {
                hasHandled.current = true;
            }
        }
    }, [session, status, router, searchParams, authLoading, user, refreshSession, updateSession]);

    return null; // This component doesn't render anything
}

