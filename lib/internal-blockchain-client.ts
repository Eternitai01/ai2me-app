/**
 * Internal Blockchain Client
 * Handles server-side communication with blockchain service
 * Uses localhost:8003 for development, internal Docker network for production
 */

import { config } from './config';

// Use configuration from config utility
const BLOCKCHAIN_SERVICE_URL = config.blockchainServiceUrl;

const INTERNAL_SERVICE_HEADERS = {
  'X-Internal-Service': 'web-frontend',
  'X-Service-Token': config.serviceToken,
  'Content-Type': 'application/json',
};

export class InternalBlockchainClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = BLOCKCHAIN_SERVICE_URL;
    console.log('[Blockchain] Using service URL:', this.baseUrl);
  }

  /**
   * Make authenticated request to blockchain service
   */
  private async makeRequest(endpoint: string, options?: RequestInit) {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...INTERNAL_SERVICE_HEADERS,
          ...options?.headers,
        },
        // Timeout for internal service calls
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Blockchain service error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      console.log(`Blockchain response received for: ${endpoint}`);
      return data;
    } catch (error) {
      console.error(`Blockchain request failed for ${endpoint}:`, error);
      
      // During build time, gracefully fail instead of crashing
      if (process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV !== 'production') {
        console.warn('Blockchain service unavailable during build - returning fallback data');
        return this.getFallbackData(endpoint);
      }
      
      throw error;
    }
  }

  /**
   * Provide fallback data during build time
   */
  private getFallbackData(endpoint: string) {
    if (endpoint === '/health') {
      return {
        service: 'AI2me Blockchain Service (Build Time)',
        status: 'offline',
        uptime_seconds: 0,
        checks: {
          database: { healthy: false, message: 'Build time fallback', response_time_ms: 0 },
          blockchain: { healthy: false, message: 'Build time fallback', response_time_ms: 0 },
          redis: { healthy: false, message: 'Build time fallback', response_time_ms: 0 },
        },
        timestamp: new Date().toISOString(),
        error: 'Service unavailable during build'
      };
    }
    
    return { error: 'Service unavailable during build', data: null };
  }

  /**
   * Health check
   */
  async getHealth() {
    return this.makeRequest('/health');
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(transactionId: string) {
    return this.makeRequest(`/v1/transactions/status/${transactionId}`);
  }

  /**
   * Get public verification
   */
  async getPublicVerification(transactionId: string) {
    return this.makeRequest(`/v1/compliance/verify/public/${transactionId}`);
  }

  /**
   * Get recent transactions
   */
  async getRecentTransactions(params?: {
    limit?: number;
    offset?: number;
    status?: string;
    provider?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    if (params?.status) searchParams.set('status', params.status);
    if (params?.provider) searchParams.set('provider', params.provider);

    const endpoint = `/v1/compliance/transactions/recent${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return this.makeRequest(endpoint);
  }

  /**
   * Get batch list
   */
  async getBatches(params?: {
    limit?: number;
    offset?: number;
    status?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    if (params?.status) searchParams.set('status', params.status);

    const endpoint = `/v1/batches/${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return this.makeRequest(endpoint);
  }

  /**
   * Submit batch for processing
   */
  async submitBatch(batchData: { batch_size?: number; force_submit?: boolean; manual_trigger?: boolean; requested_by?: string }) {
    return this.makeRequest('/v1/batches/submit', {
      method: 'POST',
      body: JSON.stringify(batchData),
    });
  }

  /**
   * Get ACL transactions
   */
  async getACLTransactions(limit: number = 10) {
    return this.makeRequest(`/v1/compliance/acl/transactions?limit=${limit}`);
  }

  /**
   * Get specific ACL transaction
   */
  async getACLTransaction(transactionId: string) {
    return this.makeRequest(`/v1/compliance/acl/transactions/${transactionId}`);
  }

  /**
   * Get Polygon transaction
   */
  async getPolygonTransaction(transactionId: string) {
    return this.makeRequest(`/v1/compliance/polygon/transactions/${transactionId}`);
  }

  /**
   * Get Polygon batch
   */
  async getPolygonBatch(batchId: string) {
    return this.makeRequest(`/v1/compliance/polygon/batches/${batchId}`);
  }

  /**
   * Test connectivity
   */
  async testConnection() {
    try {
      await this.getHealth();
      return { connected: true, url: this.baseUrl };
    } catch (error) {
      return { 
        connected: false, 
        url: this.baseUrl, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

// Export class only - no singleton instance to avoid build-time issues
export default InternalBlockchainClient;
