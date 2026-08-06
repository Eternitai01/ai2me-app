/**
 * React hook for secure API key storage
 */

import { useState, useEffect, useCallback } from "react";
import {
  storeApiKey,
  getStoredApiKey,
  removeStoredApiKey,
  getStoredApiKeyIds,
  clearAllStoredApiKeys,
} from "@/lib/api-key-storage";

interface ApiKeyStorageInfo {
  totalKeys: number;
  encryptedKeys: number;
  plainTextKeys: number;
  encryptionSupported: boolean;
}

export function useApiKeyStorage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storageInfo, setStorageInfo] = useState<ApiKeyStorageInfo | null>(
    null
  );

  // Load storage info on mount
  useEffect(() => {
    const info: ApiKeyStorageInfo = {
      totalKeys: getStoredApiKeyIds().length,
      encryptedKeys: getStoredApiKeyIds().length, // All keys are encrypted now
      plainTextKeys: 0,
      encryptionSupported: true,
    };
    setStorageInfo(info);
  }, []);

  // Store API key with encryption
  const store = useCallback(
    (apiKeyId: string, apiKeyValue: string): boolean => {
      setIsLoading(true);
      setError(null);

      try {
        storeApiKey(apiKeyId, apiKeyValue);
        // Update storage info
        const info: ApiKeyStorageInfo = {
          totalKeys: getStoredApiKeyIds().length,
          encryptedKeys: getStoredApiKeyIds().length,
          plainTextKeys: 0,
          encryptionSupported: true,
        };
        setStorageInfo(info);
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to store API key";
        setError(errorMessage);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Retrieve API key with decryption
  const retrieve = useCallback((apiKeyId: string): string | null => {
    setIsLoading(true);
    setError(null);

    try {
      const apiKey = getStoredApiKey(apiKeyId);
      return apiKey;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to retrieve API key";
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Remove API key
  const remove = useCallback((apiKeyId: string): boolean => {
    try {
      removeStoredApiKey(apiKeyId);
      // Update storage info
      const info: ApiKeyStorageInfo = {
        totalKeys: getStoredApiKeyIds().length,
        encryptedKeys: getStoredApiKeyIds().length,
        plainTextKeys: 0,
        encryptionSupported: true,
      };
      setStorageInfo(info);
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to remove API key";
      setError(errorMessage);
      return false;
    }
  }, []);

  // Check if API key exists
  const exists = useCallback((apiKeyId: string): boolean => {
    return getStoredApiKey(apiKeyId) !== null;
  }, []);

  // Get all API key IDs
  const getAllIds = useCallback((): string[] => {
    return getStoredApiKeyIds();
  }, []);

  // Clear all API keys
  const clearAll = useCallback((): boolean => {
    try {
      clearAllStoredApiKeys();
      // Update storage info
      const info: ApiKeyStorageInfo = {
        totalKeys: 0,
        encryptedKeys: 0,
        plainTextKeys: 0,
        encryptionSupported: true,
      };
      setStorageInfo(info);
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to clear API keys";
      setError(errorMessage);
      return false;
    }
  }, []);

  // Refresh storage info
  const refreshInfo = useCallback(() => {
    const info: ApiKeyStorageInfo = {
      totalKeys: getStoredApiKeyIds().length,
      encryptedKeys: getStoredApiKeyIds().length,
      plainTextKeys: 0,
      encryptionSupported: true,
    };
    setStorageInfo(info);
  }, []);

  return {
    // Actions
    store,
    retrieve,
    remove,
    exists,
    getAllIds,
    clearAll,
    refreshInfo,

    // State
    isLoading,
    error,
    storageInfo,

    // Utilities
    clearError: () => setError(null),
  };
}
