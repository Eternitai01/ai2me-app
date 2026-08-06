/**
 * API Response Types
 * Common interfaces for API responses and data structures
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface ErrorResponse {
  success: false;
  error: string;
  message?: string;
  timestamp: string;
}

export interface TransactionData {
  transaction_id: string;
  org_id: string;
  provider: string;
  model: string;
  tokens_used: number;
  credits_deducted: number;
  created_at: string;
  blockchain_status: string;
  s3_location?: string;
  acl_transaction_id?: string;
  polygon_tx_hash?: string;
  latency_ms?: number;
  status_code?: number;
  created_by?: string;
  failure_stage?: string;
  retry_count?: number;
  last_retry_at?: string;
}

export interface QueueStatus {
  pendingTransactions: number;
  processingTransactions: number;
  pausedBy?: string;
  resumedBy?: string;
  pausedAt?: string;
  resumedAt?: string;
}

export interface BatchSubmissionData {
  batch_size?: number;
  force_submit?: boolean;
  manual_trigger?: boolean;
  requested_by?: string;
}

export interface RetryOptions {
  force_retry?: boolean;
  max_retries?: number;
  reason?: string;
}

export interface SearchCriteria {
  status?: string;
  provider?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  pagination?: {
    limit: number;
    offset: number;
  };
}

export interface AnalyticsData {
  totalTransactions: number;
  verifiedTransactions: number;
  complianceScore: number;
  successRate: number;
  metadata?: {
    source: string;
  };
}

export interface ComplianceStatus {
  overallScore: number;
  storageStatus: {
    s3: 'operational' | 'degraded' | 'offline';
    azureACL: 'operational' | 'degraded' | 'offline';
  };
  encryptionStatus: boolean;
  lastUpdated: string;
  totalTransactions: number;
  verifiedTransactions: number;
}

export interface HealthStatus {
  service: string;
  status: 'operational' | 'degraded' | 'offline';
  uptime: number;
  components: {
    database?: { healthy: boolean };
    blockchain?: { healthy: boolean };
    redis?: { healthy: boolean };
  };
  timestamp: string;
}
