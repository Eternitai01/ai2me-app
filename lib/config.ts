/**
 * Configuration utility for blockchain API integration
 */

import { getBlockchainServiceUrl } from './blockchain-service-url';

// Environment configuration with fallbacks
export const config = {
  // Blockchain service URL
  blockchainServiceUrl: getBlockchainServiceUrl(),

  // Database URL
  blockchainDatabaseUrl: process.env.BLOCKCHAIN_DATABASE_URL || 
                        process.env.DATABASE_URL ||
                        'postgresql://ai2me_user:ai2me_password@localhost:5432/ai2me_blockchain',

  // JWT configuration
  jwtSecret: process.env.JWT_SECRET || 'dev-jwt-secret-key',

  // Service authentication
  serviceToken: process.env.BLOCKCHAIN_SERVICE_TOKEN || 'dev-service-token',

  // Feature flags
  enableRealTimeUpdates: process.env.ENABLE_REAL_TIME_UPDATES !== 'false',
  enableDatabaseQueries: process.env.ENABLE_DATABASE_QUERIES !== 'false',
  
  // Development settings
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production' || !!process.env.AWS_REGION,
};

/**
 * Validate required configuration
 */
export function validateConfig() {
  const missing = [];
  
  if (!config.jwtSecret || config.jwtSecret === 'dev-jwt-secret-key') {
    console.warn('Using default JWT secret - not secure for production');
  }
  
  if (!config.blockchainServiceUrl) {
    missing.push('BLOCKCHAIN_SERVICE_URL or NEXT_PUBLIC_BLOCKCHAIN_API_URL');
  }
  
  if (!config.blockchainDatabaseUrl) {
    missing.push('BLOCKCHAIN_DATABASE_URL or DATABASE_URL');
  }
  
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing);
    if (config.isProduction) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }
}

// Validate configuration on import
validateConfig();
