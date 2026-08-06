/**
 * Blockchain and compliance related TypeScript interfaces
 * for the AI2me platform frontend components
 */

export interface ComplianceStatus {
  overallScore: number;
  storageStatus: {
    s3: 'operational' | 'degraded' | 'offline';
    azureACL: 'operational' | 'degraded' | 'offline';
    polygon: 'ready' | 'pending' | 'offline';
  };
  encryptionStatus: boolean;
  lastUpdated: string;
  totalTransactions: number;
  verifiedTransactions: number;
}

export interface TransactionVerification {
  transactionId: string;
  provider: string;
  model: string;
  credits: number;
  status: 'pending' | 'submitted' | 'confirmed' | 'failed';
  progress: number;
  timestamp: string;
  blockchainStatus: string;
  s3Location?: string;
  azureACLId?: string;
  polygonTxHash?: string;
}

export interface AuditTrailEntry {
  id: string;
  transactionId: string;
  eventType: 'transaction_created' | 's3_stored' | 'acl_logged' | 'blockchain_submitted' | 'verification_completed';
  timestamp: string;
  details: {
    provider?: string;
    model?: string;
    credits?: number;
    status?: string;
    location?: string;
    hash?: string;
    [key: string]: unknown;
  };
}

export interface BlockchainHealthStatus {
  service: string;
  status: 'operational' | 'degraded' | 'offline';
  uptime: number;
  components?: {
    database: {
      healthy: boolean;
      message: string;
      response_time_ms: number;
    };
    blockchain: {
      healthy: boolean;
      message: string;
      response_time_ms: number;
    };
    redis: {
      healthy: boolean;
      message: string;
      response_time_ms: number;
    };
  };
  timestamp: string;
  error?: string; // For error cases
}

export interface ComplianceMetrics {
  totalTransactions: number;
  verifiedTransactions: number;
  pendingVerifications: number;
  failedVerifications: number;
  complianceScore: number;
  storageDistribution: {
    s3Only: number;
    s3AndACL: number;
    fullCompliance: number;
  };
  averageVerificationTime: number;
}

// API Response interfaces matching blockchain service
export interface PublicVerificationResponse {
  service: string;
  verification_type: string;
  status: string;
  verification_timestamp: string;
  message: string;
  transaction: {
    transaction_id: string;
    org_id_hash: string;
    provider: string;
    model: string;
    tokens_used: number;
    credits_deducted: number;
    created_at: string;
  };
  batch_info: {
    batch_id: string;
    status: string;
    transaction_count: number;
    blockchain_tx: string | null;
    polygonscan_url: string | null;
  };
  integrity_verification: {
    status: string;
    calculated_hash: string;
    fields_verified: string[];
  };
}

export interface TransactionStatusResponse {
  transaction_id: string;
  status: string;
  blockchain_status: string;
  s3_location: string | null;
  acl_transaction_id: string | null;
  created_at: string;
  storage_completed_at: string | null;
  verification_url: string;
}

// Filter interfaces for search and filtering
export interface AuditTrailFilters {
  dateRange?: {
    start: string;
    end: string;
  };
  transactionId?: string;
  eventType?: string;
  provider?: string;
  status?: string;
}

export interface VerificationFilters {
  status?: 'all' | 'pending' | 'submitted' | 'confirmed' | 'failed';
  provider?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}
