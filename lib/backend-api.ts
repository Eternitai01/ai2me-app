/**
 * Backend API utility functions
 * Handles SSL issues and provides consistent backend URL management
 */

/**
 * Get the correct backend URL, handling SSL issues for local development
 */
export function getBackendUrl(): string {
  let backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';

  // Remove trailing slash if present
  backendUrl = backendUrl.replace(/\/+$/, '');

  // Ensure we're using HTTP for local development to avoid SSL issues
  if (backendUrl.startsWith('https://') && backendUrl.includes('localhost')) {
    backendUrl = backendUrl.replace('https://', 'http://');
  }

  return backendUrl;
}

/**
 * Make a request to the backend API with proper error handling
 */
export async function makeBackendRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const backendUrl = getBackendUrl();
  const url = `${backendUrl}${endpoint}`;

  console.log(`Making backend request to: ${url}`);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    return response;
  } catch (error) {
    console.error(`Backend request failed for ${url}:`, error);
    throw error;
  }
}
