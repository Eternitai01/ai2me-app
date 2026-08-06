/**
 *  encryption utility
 */

const ENCRYPTION_KEY = "ai2me-secret-key-2024";

function xorEncrypt(text: string, key: string): string {
  let result = "";
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(
      text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  return btoa(result); // Base64 encode
}

export function encryptString(text: string): string {
  return xorEncrypt(text, ENCRYPTION_KEY);
}
