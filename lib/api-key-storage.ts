/**
 * API Key Storage Utilities
 *
 * This module provides utilities for securely storing and retrieving API keys
 * in localStorage. API keys are encrypted before storage for security.
 */

import { encryptString } from "./encryption";
import { decryptString } from "./decryption";

export const API_KEY_STORAGE_PREFIX = "api_key_";

/**
 * Store an API key value in localStorage (encrypted)
 * @param apiKeyId - The ID of the API key
 * @param apiKeyValue - The actual API key value to store
 */
export function storeApiKey(apiKeyId: string, apiKeyValue: string): void {
  try {
    const encryptedValue = encryptString(apiKeyValue);
    localStorage.setItem(
      `${API_KEY_STORAGE_PREFIX}${apiKeyId}`,
      encryptedValue
    );
    console.log(`API key stored securely for ID: ${apiKeyId}`);
  } catch (error) {
    console.error("Failed to store API key:", error);
  }
}

/**
 * Retrieve an API key value from localStorage (decrypted)
 * @param apiKeyId - The ID of the API key
 * @returns The API key value or null if not found
 */
export function getStoredApiKey(apiKeyId: string): string | null {
  try {
    const encryptedValue = localStorage.getItem(
      `${API_KEY_STORAGE_PREFIX}${apiKeyId}`
    );
    if (!encryptedValue) return null;

    return decryptString(encryptedValue);
  } catch (error) {
    console.error("Failed to retrieve API key:", error);
    return null;
  }
}

/**
 * Remove an API key from localStorage
 * @param apiKeyId - The ID of the API key to remove
 */
export function removeStoredApiKey(apiKeyId: string): void {
  try {
    localStorage.removeItem(`${API_KEY_STORAGE_PREFIX}${apiKeyId}`);
    console.log(`API key removed for ID: ${apiKeyId}`);
  } catch (error) {
    console.error("Failed to remove API key:", error);
  }
}

/**
 * Get all stored API key IDs
 * @returns Array of API key IDs that have stored values
 */
export function getStoredApiKeyIds(): string[] {
  try {
    const keys = Object.keys(localStorage);
    return keys
      .filter((key) => key.startsWith(API_KEY_STORAGE_PREFIX))
      .map((key) => key.replace(API_KEY_STORAGE_PREFIX, ""));
  } catch (error) {
    console.error("Failed to get stored API key IDs:", error);
    return [];
  }
}

/**
 * Clear all stored API keys
 */
export function clearAllStoredApiKeys(): void {
  try {
    const keys = getStoredApiKeyIds();
    keys.forEach((id) => removeStoredApiKey(id));
    console.log("All stored API keys cleared");
  } catch (error) {
    console.error("Failed to clear stored API keys:", error);
  }
}

