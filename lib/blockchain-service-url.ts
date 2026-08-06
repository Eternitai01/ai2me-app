/**
 * Utility to get the correct blockchain service URL for server-side API routes
 * Handles both local development and production environments
 */
export function getBlockchainServiceUrl(): string {
  // 1. Use explicit BLOCKCHAIN_SERVICE_URL if set
  if (process.env.BLOCKCHAIN_SERVICE_URL) {
    return process.env.BLOCKCHAIN_SERVICE_URL;
  }
  
  // 2. Use NEXT_PUBLIC_BLOCKCHAIN_API_URL if available (production builds)
  if (process.env.NEXT_PUBLIC_BLOCKCHAIN_API_URL) {
    return process.env.NEXT_PUBLIC_BLOCKCHAIN_API_URL;
  }
  
  // 3. Check if running in production environment
  const isProduction = process.env.NODE_ENV === 'production' || 
                      process.env.AWS_REGION || 
                      process.env.VERCEL ||
                      process.env.RAILWAY_ENVIRONMENT;
  
  if (isProduction) {
    // Production URLs based on region or default to US
    return 'https://us.bc.ai2me.com';
  }
  
  // 4. Local development fallbacks
  // Try docker container name first (for docker-compose)
  if (process.env.DOCKER === 'true' || process.env.COMPOSE_PROJECT_NAME) {
    return 'http://ai2me-blockchain:8003';
  }
  
  // Final fallback for local development
  return 'http://localhost:8003';
}

/**
 * Log the blockchain service URL being used (for debugging)
 */
export function logBlockchainServiceUrl(): void {
  const url = getBlockchainServiceUrl();
  console.log('[Blockchain] Using service URL:', url);
}