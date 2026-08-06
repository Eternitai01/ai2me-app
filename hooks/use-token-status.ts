/**
 * React hook for monitoring JWT token expiry and auto-refresh
 */

import { useState, useEffect, useCallback } from 'react';

interface TokenStatus {
  expiresIn: number | null; // Seconds until expiry
  isExpiringSoon: boolean; // < 1 hour remaining
  isExpired: boolean;
  lastChecked: Date | null;
  isRefreshing: boolean;
  refreshToken: () => Promise<boolean>;
}

const TOKEN_CHECK_INTERVAL = 300000 ; // Check every 5 minutes
const TOKEN_EXPIRY_THRESHOLD = 3600; // Warn when < 1 hour remains

function decodeJWT(token: string): { exp?: number; [key: string]: any } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;

  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const trimmed = cookie.trim();
    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex);
    const value = trimmed.slice(separatorIndex + 1);
    if (key === name) {
      return decodeURIComponent(value);
    }
  }
  return null;
}

export function useTokenStatus(): TokenStatus {
  const [expiresIn, setExpiresIn] = useState<number | null>(null);
  const [isExpiringSoon, setIsExpiringSoon] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkTokenExpiry = useCallback(() => {
    const token = getCookie('auth-token');
    if (!token) {
      setExpiresIn(null);
      setIsExpiringSoon(false);
      setIsExpired(true);
      return;
    }

    const payload = decodeJWT(token);
    if (!payload || !payload.exp) {
      setExpiresIn(null);
      setIsExpiringSoon(false);
      setIsExpired(true);
      return;
    }

    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = payload.exp - now;

    setExpiresIn(timeUntilExpiry);
    setIsExpired(timeUntilExpiry <= 0);
    setIsExpiringSoon(timeUntilExpiry > 0 && timeUntilExpiry < TOKEN_EXPIRY_THRESHOLD);
    setLastChecked(new Date());
  }, []);

  const refreshToken = useCallback(async (): Promise<boolean> => {
    if (isRefreshing) return false;

    setIsRefreshing(true);

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        setTimeout(checkTokenExpiry, 100);
        return true;
      }

      if (response.status === 401) {
        setIsExpired(true);
      }
      return false;
    } catch {
      return false;
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, checkTokenExpiry]);

  useEffect(() => {
    checkTokenExpiry();

    const interval = setInterval(checkTokenExpiry, TOKEN_CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [checkTokenExpiry]);

  useEffect(() => {
    if (isExpiringSoon && !isRefreshing && !isExpired) {
      refreshToken();
    }
  }, [isExpiringSoon, isRefreshing, isExpired, refreshToken]);

  return {
    expiresIn,
    isExpiringSoon,
    isExpired,
    lastChecked,
    isRefreshing,
    refreshToken,
  };
}

export function formatTimeRemaining(seconds: number | null): string {
  if (seconds === null || seconds <= 0) {
    return 'Expired';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days} day${days !== 1 ? 's' : ''}`;
  }

  if (hours > 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} min`;
  }

  return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
}
