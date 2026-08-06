const DEV_API_BASE_URL = "http://localhost:8000/v1";
const PROD_API_BASE_URL = "https://us.be.ai2me.com/v1";

export function getPublicApiBaseUrl(): string {
  // Always prefer the explicit env var — this is the only safe source in production.
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && envUrl.trim()) return envUrl.trim();

  if (typeof window === "undefined") return PROD_API_BASE_URL;

  const host = window.location.hostname.toLowerCase();

  if (host === "localhost" || host === "127.0.0.1") {
    return DEV_API_BASE_URL;
  }

  // Production fallback — always point to the backend service, never the frontend domain.
  // Domain-sniffing was removed: it caused silent 404s when the proxy architecture changed.
  return PROD_API_BASE_URL;
}
