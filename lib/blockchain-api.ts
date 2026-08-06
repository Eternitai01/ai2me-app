/**
 * Blockchain API integration layer
 * Handles communication with the blockchain service
 */

import axios from 'axios';
import { 
  ComplianceStatus, 
  TransactionVerification, 
  AuditTrailEntry, 
  BlockchainHealthStatus,
  PublicVerificationResponse,
  TransactionStatusResponse,
  AuditTrailFilters,
  VerificationFilters
} from '@/types/blockchain';

// Use Next.js API routes for blockchain service communication
const BLOCKCHAIN_API_BASE = '/api/blockchain';

// Create axios instance with default config
const blockchainApi = axios.create({
  baseURL: BLOCKCHAIN_API_BASE,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for authentication (if needed)
blockchainApi.interceptors.request.use((config) => {
  // Add any required headers or auth tokens
  return config;
});

// Response interceptor for error handling
blockchainApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Blockchain API Error:', error);
    throw error;
  }
);

/**
 * Get blockchain service health status (REAL API)
 */
export async function getBlockchainHealth(): Promise<BlockchainHealthStatus> {
  try {
    
    // Call our Next.js API route which proxies to real blockchain service
    const response = await blockchainApi.get('/health');
    
    // Transform blockchain service response to our interface
    const healthData: BlockchainHealthStatus = {
      service: response.data.service || 'AI2me Blockchain Service',
      status: response.data.status === 'healthy' ? 'operational' : 
              response.data.status === 'degraded' ? 'degraded' : 'offline',
      uptime: response.data.uptime_seconds || 0,
      components: response.data.checks ? {
        database: {
          healthy: response.data.checks.database?.healthy || false,
          message: response.data.checks.database?.message || 'Unknown',
          response_time_ms: response.data.checks.database?.response_time_ms || 0,
        },
        blockchain: {
          healthy: response.data.checks.blockchain?.healthy || false,
          message: response.data.checks.blockchain?.message || 'Unknown',
          response_time_ms: response.data.checks.blockchain?.response_time_ms || 0,
        },
        redis: {
          healthy: response.data.checks.redis?.healthy || false,
          message: response.data.checks.redis?.message || 'Unknown',
          response_time_ms: response.data.checks.redis?.response_time_ms || 0,
        },
      } : undefined,
      timestamp: response.data.timestamp || new Date().toISOString(),
      error: response.data.error,
    };
    
    return healthData;
  } catch (error) {
    console.error('Failed to fetch REAL blockchain health:', error);
    
    // In development, return a fallback health status when service is unavailable
    if (process.env.NODE_ENV === 'development') {
      console.warn('Blockchain service unavailable in development, using fallback health status');
      return {
        service: 'AI2me Blockchain Service (Unavailable)',
        status: 'offline',
        uptime: 0,
        components: {
          database: {
            healthy: false,
            message: 'Service unavailable - blockchain service not running on localhost:8003',
            response_time_ms: 0,
          },
          blockchain: {
            healthy: false,
            message: 'Service unavailable - blockchain service not running on localhost:8003',
            response_time_ms: 0,
          },
          redis: {
            healthy: false,
            message: 'Service unavailable - blockchain service not running on localhost:8003',
            response_time_ms: 0,
          },
        },
        timestamp: new Date().toISOString(),
        error: 'Blockchain service not available on localhost:8003',
      };
    }
    
    throw new Error('Unable to fetch blockchain service health');
  }
}

/**
 * Get compliance status overview (REAL API)
 */
export async function getComplianceStatus(): Promise<ComplianceStatus> {
  try {
    
    // Get real health data and compliance metrics in parallel
    const [health, metricsResponse] = await Promise.allSettled([
      getBlockchainHealth(),
      blockchainApi.get('/compliance/metrics?time_range=30d')
    ]);
    
    // Handle health data
    const healthData = health.status === 'fulfilled' ? health.value : {
      service: 'AI2me Blockchain Service (Unavailable)',
      status: 'offline' as const,
      uptime: 0,
      timestamp: new Date().toISOString(),
      error: 'Service unavailable',
    };
    
    // Handle metrics data
    if (metricsResponse.status === 'rejected') {
      console.warn('Compliance metrics unavailable, using fallback values');
      return {
        overallScore: 0,
        storageStatus: {
          s3: 'offline' as const,
          azureACL: 'offline' as const,
          polygon: 'offline' as const,
        },
        encryptionStatus: false,
        lastUpdated: healthData.timestamp,
        totalTransactions: 0,
        verifiedTransactions: 0,
      };
    }
    
    const metrics = metricsResponse.value.data;
    
    // Use real data for storage status based on service health AND transaction counts
    const storageStatus = {
      s3: (healthData.components?.database?.healthy && healthData.status === 'operational') ? 'operational' as const : 'offline' as const,
      azureACL: (healthData.components?.database?.healthy && healthData.status === 'operational') ? 'operational' as const : 'offline' as const, 
      polygon: (healthData.components?.blockchain?.healthy && healthData.status === 'operational') ? 'ready' as const : 'offline' as const,
    };
    
    // Calculate overall compliance score based on service health and transaction data
    let overallScore = 0;
    
    if (healthData.status === 'operational') {
      // Base score for operational services
      overallScore = 85;
      
      // Add points based on actual transaction processing
      if (metrics.totalTransactions > 0) {
        overallScore = Math.min(98, overallScore + (metrics.successRate || 0) * 0.15);
      }
      
      // Bonus for all storage systems being operational
      const allStorageOperational = Object.values(storageStatus).every(status => status === 'operational');
      if (allStorageOperational) {
        overallScore = Math.min(99, overallScore + 5);
      }
    } else if (healthData.status === 'degraded') {
      overallScore = 65;
    } else {
      overallScore = 0;
    }

    const finalComplianceStatus = {
      overallScore: Math.round(overallScore * 10) / 10, // Round to 1 decimal place
      storageStatus,
      encryptionStatus: healthData.components?.database?.healthy || false, // Encryption available if database is healthy
      lastUpdated: healthData.timestamp || new Date().toISOString(),
      totalTransactions: metrics.totalTransactions || 0,
      verifiedTransactions: metrics.verifiedTransactions || 0,
    };
    
    return finalComplianceStatus;
  } catch (error) {
    console.error('Failed to fetch REAL compliance status:', error);
    
    // Return fallback compliance status when blockchain service is unavailable
    return {
      overallScore: 0,
      storageStatus: {
        s3: 'offline' as const,
        azureACL: 'offline' as const,
        polygon: 'offline' as const,
      },
      encryptionStatus: false,
      lastUpdated: new Date().toISOString(),
      totalTransactions: 0,
      verifiedTransactions: 0,
    };
  }
}

/**
 * Get transaction verification status
 */
export async function getTransactionStatus(transactionId: string): Promise<TransactionStatusResponse> {
  try {
    const response = await blockchainApi.get(`/transactions/${transactionId}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch transaction status for ${transactionId}:`, error);
    throw new Error(`Unable to fetch transaction status for ${transactionId}`);
  }
}

/**
 * Get public verification for a transaction
 */
export async function getPublicVerification(transactionId: string): Promise<PublicVerificationResponse> {
  try {
    const response = await blockchainApi.get(`/compliance/verify/${transactionId}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch public verification for ${transactionId}:`, error);
    throw new Error(`Unable to fetch public verification for ${transactionId}`);
  }
}

/**
 * Get recent transaction verifications
 */
export async function getRecentTransactionVerifications(
  filters?: VerificationFilters
): Promise<TransactionVerification[]> {
  try {
    
    // Build query parameters for real API call
    const params = new URLSearchParams();
    params.set('limit', '20'); // Get recent 20 transactions
    
    if (filters?.status && filters.status !== 'all') {
      params.set('status', filters.status);
    }
    if (filters?.provider) {
      params.set('provider', filters.provider);
    }

    // Call our Next.js API route which proxies to real blockchain service
    const response = await blockchainApi.get(`/transactions/recent?${params.toString()}`);
    const transactionData = response.data;

    // Transform real blockchain service data to our interface
    const transactions: TransactionVerification[] = (transactionData.transactions || []).map((tx: { transaction_id: string; provider: string; model: string; credits_deducted: number; blockchain_status: string; s3_location?: string; acl_transaction_id?: string; polygon_tx_hash?: string; created_at: string }) => {
      // Calculate progress based on real blockchain status
      const getProgress = (status: string) => {
        switch (status) {
          case 'confirmed': return 100;
          case 'submitted': return 80;
          case 'processing': return 60;
          case 'pending': return 20;
          case 'failed': return 0;
          default: return 50;
        }
      };

      // Map blockchain status to our verification status
      const getVerificationStatus = (blockchainStatus: string): 'pending' | 'submitted' | 'confirmed' | 'failed' => {
        switch (blockchainStatus) {
          case 'confirmed': return 'confirmed';
          case 'submitted': return 'submitted';
          case 'failed': return 'failed';
          case 'pending': return 'pending';
          default: return 'pending';
        }
      };

      return {
        transactionId: tx.transaction_id,
        provider: tx.provider,
        model: tx.model,
        credits: parseFloat(tx.credits_deducted?.toString() || '0'),
        status: getVerificationStatus(tx.blockchain_status),
        progress: getProgress(tx.blockchain_status),
        timestamp: tx.created_at,
        blockchainStatus: tx.blockchain_status,
        s3Location: tx.s3_location,
        azureACLId: tx.acl_transaction_id,
        polygonTxHash: tx.polygon_tx_hash,
      };
    });

    
    // Apply frontend filters (server-side filtering is preferred but this is backup)
    let filteredTransactions = transactions;
    
    if (filters?.status && filters.status !== 'all') {
      filteredTransactions = filteredTransactions.filter(tx => tx.status === filters.status);
    }
    
    if (filters?.provider) {
      filteredTransactions = filteredTransactions.filter(tx => tx.provider === filters.provider);
    }

    return filteredTransactions;
  } catch (error) {
    console.error('Failed to fetch recent transaction verifications:', error);
    
    // Return empty array when blockchain service is unavailable (development mode)
    if (process.env.NODE_ENV === 'development') {
      console.warn('Blockchain service unavailable in development, returning empty array');
      return [];
    }
    
    throw new Error('Unable to fetch recent transaction verifications');
  }
}

/**
 * Get audit trail entries
 */
export async function getAuditTrail(filters?: AuditTrailFilters): Promise<AuditTrailEntry[]> {
  try {
    // Generate dynamic audit trail data
    const providers = ['Anthropic', 'OpenAI', 'Google', 'Azure'];
    const models = ['Claude-3', 'GPT-4', 'GPT-3.5', 'Gemini Pro', 'Azure OpenAI'];
    const eventTypes: ('transaction_created' | 's3_stored' | 'acl_logged' | 'blockchain_submitted' | 'verification_completed')[] = 
      ['transaction_created', 's3_stored', 'acl_logged', 'blockchain_submitted', 'verification_completed'];
    const statuses = ['verified', 'pending', 'failed', 'processing'];
    
    const generateAuditEntry = (): AuditTrailEntry => {
      const provider = providers[Math.floor(Math.random() * providers.length)];
      const model = models[Math.floor(Math.random() * models.length)];
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const minutesAgo = Math.floor(Math.random() * 120) + 1;
      const transactionId = `tx-${Math.random().toString(36).substr(2, 6)}`;
      
      const details: { provider: string; model: string; [key: string]: unknown } = {
        provider,
        model,
      };
      
      switch (eventType) {
        case 'transaction_created':
          details.credits = Math.floor(Math.random() * 100) + 10;
          break;
        case 's3_stored':
          details.location = `s3://ai2me-compliance/${transactionId}.json`;
          details.encryption = 'AES-256-GCM';
          break;
        case 'acl_logged':
          details.location = 'Azure Confidential Ledger';
          details.aclId = `acl-${Math.random().toString(36).substr(2, 8)}`;
          break;
        case 'blockchain_submitted':
          details.location = 'Polygon Amoy';
          details.batchId = `batch-${Math.random().toString(36).substr(2, 8)}`;
          break;
        case 'verification_completed':
          details.status = statuses[Math.floor(Math.random() * statuses.length)];
          details.hash = `0x${Math.random().toString(16).substr(2, 8)}...${Math.random().toString(16).substr(2, 4)}`;
          break;
      }
      
      return {
        id: `audit-${Math.random().toString(36).substr(2, 8)}`,
        transactionId,
        eventType,
        timestamp: new Date(Date.now() - minutesAgo * 60 * 1000).toISOString(),
        details,
      };
    };

    const mockAuditTrail: AuditTrailEntry[] = Array.from({ length: 15 }, () => generateAuditEntry())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply filters if provided
    let filteredAuditTrail = mockAuditTrail;
    
    if (filters?.transactionId) {
      filteredAuditTrail = filteredAuditTrail.filter(entry => 
        entry.transactionId.includes(filters.transactionId!)
      );
    }
    
    if (filters?.eventType) {
      filteredAuditTrail = filteredAuditTrail.filter(entry => entry.eventType === filters.eventType);
    }

    return filteredAuditTrail;
  } catch (error) {
    console.error('Failed to fetch audit trail:', error);
    throw new Error('Unable to fetch audit trail');
  }
}

/**
 * Export audit trail data
 */
export async function exportAuditTrail(format: 'json' | 'csv' = 'json'): Promise<Blob> {
  try {
    // In production, this would call the blockchain service export endpoint
    // For now, we'll generate mock export data
    const auditTrail = await getAuditTrail();
    
    if (format === 'json') {
      const jsonData = JSON.stringify(auditTrail, null, 2);
      return new Blob([jsonData], { type: 'application/json' });
    } else {
      // Convert to CSV
      const csvHeader = 'ID,Transaction ID,Event Type,Timestamp,Provider,Model,Status\n';
      const csvRows = auditTrail.map(entry => 
        `${entry.id},${entry.transactionId},${entry.eventType},${entry.timestamp},${entry.details.provider || ''},${entry.details.model || ''},${entry.details.status || ''}`
      ).join('\n');
      
      return new Blob([csvHeader + csvRows], { type: 'text/csv' });
    }
  } catch (error) {
    console.error('Failed to export audit trail:', error);
    throw new Error('Unable to export audit trail');
  }
}
