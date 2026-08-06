"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { setCookie, deleteCookie, getCookie } from "@/utility/cookies";
import { toast } from "sonner";

export type BackendUser = {
  id: string;
  email: string;
  full_name: string;
  company_name: string;
  status: string;
  role: string;
  is_primary: boolean;
  is_active: boolean;
  is_verified: boolean;
  organization_id: string;
  organization_status: string;
  organization_country: string | null;
};

// Removed PlanStatus type - now using credit-based system

type AuthContextType = {
  user: BackendUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  updateUser: (updates: Partial<BackendUser>) => void;
  signIn: (args: {
    email: string;
    password: string;
    remember?: boolean;
  }) => Promise<void | { error: string }>;
  signOut: () => Promise<void>;
  signUp: (signupData: Record<string, unknown>) => Promise<any>;
  confirmSignUp: (args: { email: string; code: string }) => Promise<void | { error: string }>;
  resendSignUpCode: (email: string) => Promise<any>;
  forgotPassword: (email: string) => Promise<any>;
  forgotPasswordSubmit: (args: {
    email: string;
    code: string;
    newPassword: string;
  }) => Promise<any>;
  refreshSession: () => Promise<void>;
  clearApiKey: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

import { setSharedAuthToken, clearSharedAuthToken } from "@/lib/authTokenBridge";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<BackendUser | null>(null);
  const [loading, setLoading] = useState(true);
  // Removed planStatus state - now using credit-based system

  // Set authentication cookie when user is authenticated
  const setAuthCookie = async (userData: BackendUser, token: string) => {
    try {
      setCookie("auth-token", token, 7);
      setCookie("auth-user", JSON.stringify(userData), 7);
      setSharedAuthToken(token);
    } catch (error) {
      console.error("❌ AuthProvider: Failed to set auth cookie:", error);
    }
  };

  // Save user-specific data to localStorage
  const saveUserData = (userData: BackendUser | null) => {
    if (!userData) return;
    try {
      // Save user-specific data that should persist across sessions
      localStorage.setItem("user_id", userData.id);
      localStorage.setItem("user_email", userData.email);
      localStorage.setItem("organization_id", userData.organization_id);
    } catch (error) {
      console.error("❌ AuthProvider: Failed to save user data:", error);
    }
  };

  // Clear API key specifically (for when user revokes their key)
  const clearApiKey = () => {
    try {
      localStorage.removeItem("ai_service_api_key");
      console.log("✅ API key cleared from localStorage");
    } catch (error) {
      console.error("❌ AuthProvider: Failed to clear API key:", error);
    }
  };

  // Clear user-specific data from localStorage
  const clearUserData = () => {
    try {
      localStorage.removeItem("user_id");
      localStorage.removeItem("user_email");
      localStorage.removeItem("organization_id");
      localStorage.removeItem("ai2me_backend_token"); // always clear — signed with current secret
      // Don't remove ai_service_api_key - let it persist across sessions
      // localStorage.removeItem("ai_service_api_key");

      // Clear any other user-specific localStorage items
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
          key &&
          (key.startsWith("api_key_") ||
            key.startsWith("user_") ||
            key.startsWith("auth_"))
        ) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
    } catch (error) {
      console.error("❌ AuthProvider: Failed to clear user data:", error);
    }
  };

  // Clear authentication cookies and localStorage
  const clearAuthCookies = () => {
    deleteCookie("auth-token");
    clearSharedAuthToken();
    deleteCookie("auth-user");
    clearUserData();
  };

  const updateUser = (updates: Partial<BackendUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updatedUser = { ...prev, ...updates };
      try {
        setCookie("auth-user", JSON.stringify(updatedUser), 7);
      } catch (error) {
        console.error("AuthProvider: Failed to update auth-user cookie:", error);
      }
      return updatedUser;
    });
  };

  // Check if user is authenticated on app load
  useEffect(() => {
    const token = getCookie("auth-token");
    const userDataCookie = getCookie("auth-user");

    if (!token || !userDataCookie) {
      // No email/password session — check NextAuth OAuth session ONLY on explicit OAuth callback.
      // Do NOT silently hydrate on every page load — this causes foreign OAuth accounts
      // (e.g. team@eternitai.com) to auto-sign in after the user has signed out.
      const isOAuthCallback =
        typeof window !== "undefined" &&
        new URLSearchParams(window.location.search).get("oauth_callback") === "true";

      if (isOAuthCallback) {
        (async () => {
          try {
            const res = await fetch("/api/auth/session", { cache: "no-store" });
            if (res.ok) {
              const session = await res.json();
              const backendUser = (session as any)?.backendUser;
              const backendToken = (session as any)?.backendToken;
              if (backendUser && backendToken) {
                setUser(backendUser as BackendUser);
                saveUserData(backendUser as BackendUser);
                setSharedAuthToken(backendToken);
                setLoading(false);
                return;
              }
              if (backendToken) {
                const meRes = await fetch("/api/auth/me", {
                  headers: { Authorization: `Bearer ${backendToken}` },
                });
                if (meRes.ok) {
                  const meData = await meRes.json();
                  const u = meData.data || meData;
                  if (u?.id || u?.email) {
                    setUser(u as BackendUser);
                    saveUserData(u as BackendUser);
                    setSharedAuthToken(backendToken);
                    setLoading(false);
                    return;
                  }
                }
              }
            }
          } catch { /* NextAuth unavailable */ }
          setUser(null);
          setLoading(false);
        })();
      } else {
        // Not an OAuth callback — no auth-token means genuinely signed out. Stay signed out.
        setUser(null);
        setLoading(false);
      }
      return;
    }

    let cachedUser: BackendUser | null = null;
    try {
      cachedUser = JSON.parse(userDataCookie) as BackendUser;
    } catch {
      clearAuthCookies();
      setUser(null);
      setLoading(false);
      return;
    }

    // Optimistically hydrate from cookie to avoid auth UI flicker.
    setUser(cachedUser);
    saveUserData(cachedUser);
    setSharedAuthToken(token);
    setLoading(false);

    (async () => {
      try {
        const response = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          // Only clear auth on 401 (invalid/expired token)
          // Do NOT clear on 502/503/504 (backend temporarily down)
          if (response.status === 401) {
            clearAuthCookies();
            setUser(null);
          }
          return;
        }

        const userInfo = await response.json();
        setUser(userInfo.data);
        saveUserData(userInfo.data);
      } catch {
        // Network error — backend unreachable. Keep existing auth state.
        // Do not clear cookies on transient failures.
      }
    })();
  }, []);

  // Removed checkPlanStatus function - now using credit-based system

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      updateUser,
      signIn: async ({ email, password }) => {
        console.log("🔵 AuthContext signIn: Starting login for", email);
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const raw = await res.text();
        let data = null;
        try { data = raw ? JSON.parse(raw) : null; } catch { }

        if (!res.ok) {
          const isHtml = raw?.trimStart().startsWith("<");
          const errorMsg = isHtml
            ? `Service temporarily unavailable (${res.status}). Please try again in a moment.`
            : data?.detail || data?.message || raw || `Login failed (${res.status})`;
          console.error("❌ AuthContext signIn error:", {
            email,
            status: res.status,
            message: errorMsg,
            data,
            raw: raw.substring(0, 200)
          });
          return { error: errorMsg };
        }

        console.log("✅ AuthContext signIn: Login API successful for", email);

        if (data.requires_otp) {
          // Handle OTP verification flow
          console.error("❌ AuthContext signIn: OTP required");
          return { error: "OTP_REQUIRED" };
        }

        // Fetch user data using the access token
        const userResponse = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${data.access_token}`,
          },
        });

        if (!userResponse.ok) {
          throw new Error("Failed to fetch user data");
        }

        const userData = await userResponse.json();
        setUser(userData.data);
        await setAuthCookie(userData.data, data.access_token);
        saveUserData(userData.data);

        // Show password-update reminder for new users who haven't set their own password yet
        if (userData.data?.is_verified === false) {
          setTimeout(() => {
            toast.warning(
              "Please set a personal password for your account.",
              {
                duration: 35000,
                closeButton: true,
                action: {
                  label: "Set My Password",
                  onClick: () => {
                    window.location.href = "/dashboard/settings?tab=security";
                  },
                },
              }
            );
          }, 500);
        }
      },
      signOut: async () => {
        // Clear custom auth cookies first
        clearAuthCookies();
        setUser(null);
        // Clear NextAuth session — must use signOut() from next-auth/react,
        // not a raw fetch, otherwise the session cookie persists and
        // auto-logs the user back in on next page load
        try {
          const { signOut: nextAuthSignOut } = await import("next-auth/react");
          await nextAuthSignOut({ redirect: true, callbackUrl: "/" });
        } catch {
          // Fallback: hard redirect to clear state
          if (typeof window !== "undefined") window.location.href = "/";
        }
      },
      signUp: async (signupData) => {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify(signupData),
        });

        const raw = await res.text();
        let data: any = null;
        try { data = raw ? JSON.parse(raw) : null; } catch { }

        if (!res.ok) {
          const errorMsg = data?.detail || data?.message || raw || `Signup failed (${res.status})`;
          console.error("❌ AuthContext signUp error:", {
            status: res.status,
            message: errorMsg,
            data,
            raw: raw.substring(0, 200)
          });
          return { error: errorMsg };
        }

        console.log("✅ AuthContext signUp: Success, returning data:", data);
        return data;
      },
      confirmSignUp: async ({ email, code }) => {
        console.log("🔵 AuthContext confirmSignUp: email=", email, "code=", code);
        const response = await fetch("/api/auth/confirm-signup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: email,
            otp_code: code,
          }),
        });
        console.log("🔵 Sent to API:", { username: email, otp_code: code });

        const data = await response.json();

        if (!response.ok) {
          const errorMsg = data.detail || data.message || "Verification failed";
          console.error("❌ AuthContext confirmSignUp error:", {
            status: response.status,
            message: errorMsg,
            detail: data.detail,
            fullData: data
          });
          return { error: errorMsg };
        }

        // Do not auto-authenticate here. The user will manually log in.

        // Force a small delay to ensure state is propagated
        await new Promise((resolve) => setTimeout(resolve, 100));
      },
      resendSignUpCode: async (email: string) => {
        const response = await fetch("/api/auth/resend-otp", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (!response.ok) {
          const errorMsg = data.detail || "Failed to resend code";
          console.error("❌ AuthContext resendSignUpCode error:", {
            status: response.status,
            message: errorMsg,
            data
          });
          return { error: errorMsg };
        }

        return data;
      },
      forgotPassword: async (email: string) => {
        const response = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (!response.ok) {
          const errorMsg = data.detail || "Failed to send reset email";
          console.error("❌ AuthContext forgotPassword error:", {
            status: response.status,
            message: errorMsg,
            data
          });
          return { error: errorMsg };
        }

        return data;
      },
      forgotPasswordSubmit: async ({ email, code, newPassword }) => {
        const response = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, code, newPassword }),
        });

        const data = await response.json();

        if (!response.ok) {
          const errorMsg = data.detail || "Password reset failed";
          console.error("❌ AuthContext forgotPasswordSubmit error:", {
            status: response.status,
            message: errorMsg,
            data
          });
          return { error: errorMsg };
        }

        return data;
      },
      refreshSession: async () => {
        try {
          const token = getCookie("auth-token");
          if (!token) {
            console.error("❌ AuthContext refreshSession: No token found");
            return; // Don't clear cookies — token just set, may not be readable yet
          }

          const response = await fetch("/api/auth/me", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const userInfo = await response.json();
            if (userInfo.data) {
              setUser(userInfo.data);
              saveUserData(userInfo.data);
            }
          } else if (response.status === 401) {
            // Only clear cookies on definitive auth failure (invalid token)
            console.error("❌ AuthContext refreshSession: 401 token invalid");
            clearAuthCookies();
            setUser(null);
          } else {
            // Backend temporarily unavailable (500, 502, 503) — do NOT clear cookies
            console.error("❌ AuthContext refreshSession: backend error", response.status);
          }
        } catch (error) {
          // Network error — do NOT clear cookies; backend may be temporarily unreachable
          console.error("❌ AuthContext refreshSession failed (network):", error);
        }
      },
      clearApiKey,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
};
