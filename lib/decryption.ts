/**
 *  decryption utility
 */

const ENCRYPTION_KEY = "ai2me-secret-key-2024";

function xorDecrypt(encryptedText: string, key: string): string {
  try {
    const decoded = atob(encryptedText); // Base64 decode
    let result = "";
    for (let i = 0; i < decoded.length; i++) {
      result += String.fromCharCode(
        decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    return result;
  } catch {
    throw new Error("Failed to decrypt data");
  }
}

export function decryptString(encryptedText: string): string {
  return xorDecrypt(encryptedText, ENCRYPTION_KEY);
}
