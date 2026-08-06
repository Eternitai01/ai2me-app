"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";

/**
 * Syncs the NextAuth backendToken to localStorage so API service classes
 * (ChatHistoryService, etc.) can include it in Authorization headers without
 * requiring React hooks or NextAuth server-side session access.
 */
export function SessionTokenSync() {
  const { data: session } = useSession();

  useEffect(() => {
    const token = (session as any)?.backendToken;
    if (token) {
      localStorage.setItem("ai2me_backend_token", token);
    } else if (session === null) {
      // Explicitly signed out — clear the token
      localStorage.removeItem("ai2me_backend_token");
    }
  }, [session]);

  return null;
}
