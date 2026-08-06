/**
 * Management API for blockchain operations
 * Handles administrative controls and system management
 */

import axios from 'axios';

// Management API base URL
const MANAGEMENT_API_BASE = '/api';

// Create axios instance for management operations
const managementApi = axios.create({
  baseURL: MANAGEMENT_API_BASE,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for authentication
managementApi.interceptors.request.use((config) => {
  // Add admin auth token if available
  const token = localStorage.getItem('admin-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
managementApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Management API Error:', error);
    throw error;
  }
);

// Management Interfaces
export interface QueueManagementResult {
  success: boolean;
  message: string;
  queueLength: number;
  processedCount?: number;
}

export interface BatchConfiguration {
  batchSize: number;
  processingInterval: number; // minutes
  autoBatch: boolean;
  maxBatchAge: number; // minutes
  retryAttempts: number;
}

export interface SystemConfiguration {
  maintenanceMode: boolean;
  processingEnabled: boolean;
  alertsEnabled: boolean;
  maxConcurrentTransactions: number;
  timeoutSettings: {
    s3Upload: number;
    aclLogging: number;
    blockchainSubmission: number;
  };
  thresholds: {
    queueWarning: number;
    queueCritical: number;
    responseTimeWarning: number;
    responseTimeCritical: number;
  };
}

export interface FailedTransaction {
  transactionId: string;
  provider: string;
  model: string;
  credits: number;
  failureReason: string;
  failureStage: 's3_upload' | 'acl_logging' | 'blockchain_submission' | 'verification';
  failedAt: string;
  retryCount: number;
  canRetry: boolean;
  errorDetails: Record<string, unknown>;
}

export interface SystemStats {
  uptime: number;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  averageProcessingTime: number;
  queueLength: number;
  activeConnections: number;
  systemLoad: {
    cpu: number;
    memory: number;
    storage: number;
    network: number;
  };
}

export interface MaintenanceOperation {
  id: string;
  type: 'restart_service' | 'clear_cache' | 'rebuild_index' | 'cleanup_logs' | 'backup_data';
  description: string;
  estimatedDuration: number; // minutes
  requiresDowntime: boolean;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  startedAt?: string;
  completedAt?: string;
  result?: string;
}

/**
 * Queue Management Operations
 */

// Pause queue processing (REAL API)
export async function pauseQueue(reason?: string): Promise<QueueManagementResult> {
  try {
    
    const response = await managementApi.post('/blockchain/management/queue/pause', {
      reason: reason || 'Manual pause by admin'
    });
    
    return {
      success: response.data.success,
      message: response.data.message,
      queueLength: response.data.queueStatus?.pendingTransactions || 0,
      processedCount: response.data.queueStatus?.processingTransactions || 0,
    };
  } catch (error) {
    console.error('Failed to pause queue:', error);
    throw new Error('Unable to pause queue processing');
  }
}

// Resume queue processing (REAL API)
export async function resumeQueue(): Promise<QueueManagementResult> {
  try {
    
    const response = await managementApi.post('/blockchain/management/queue/resume');
    
    return {
      success: response.data.success,
      message: response.data.message,
      queueLength: response.data.queueStatus?.pendingTransactions || 0,
      processedCount: response.data.queueStatus?.processingTransactions || 0,
    };
  } catch (error) {
    console.error('Failed to resume queue:', error);
    throw new Error('Unable to resume queue processing');
  }
}

// Clear failed transactions from queue
export async function clearFailedTransactions(): Promise<QueueManagementResult> {
  try {
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const clearedCount = Math.floor(Math.random() * 10) + 1;
      return {
        success: true,
        message: `Cleared ${clearedCount} failed transactions`,
        queueLength: Math.floor(Math.random() * 30),
        processedCount: clearedCount,
      };
    }

    const response = await managementApi.delete('/blockchain/management/queue/failed');
    return response.data;
  } catch (error) {
    console.error('Failed to clear failed transactions:', error);
    throw new Error('Unable to clear failed transactions');
  }
}

// Process queue immediately
export async function processQueueNow(): Promise<QueueManagementResult> {
  try {
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 3000));
      const processedCount = Math.floor(Math.random() * 20) + 5;
      return {
        success: true,
        message: `Processed ${processedCount} transactions`,
        queueLength: Math.max(0, Math.floor(Math.random() * 20) - processedCount),
        processedCount,
      };
    }

    const response = await managementApi.post('/blockchain/management/queue/process');
    return response.data;
  } catch (error) {
    console.error('Failed to process queue:', error);
    throw new Error('Unable to process queue');
  }
}

/**
 * Batch Management Operations
 */

// Get current batch configuration
export async function getBatchConfiguration(): Promise<BatchConfiguration> {
  try {
    if (process.env.NODE_ENV === 'development') {
      return {
        batchSize: 25,
        processingInterval: 5,
        autoBatch: true,
        maxBatchAge: 30,
        retryAttempts: 3,
      };
    }

    const response = await managementApi.get('/blockchain/management/config/batch');
    return response.data;
  } catch (error) {
    console.error('Failed to get batch configuration:', error);
    throw new Error('Unable to get batch configuration');
  }
}

// Update batch configuration
export async function updateBatchConfiguration(config: Partial<BatchConfiguration>): Promise<BatchConfiguration> {
  try {
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        batchSize: config.batchSize || 25,
        processingInterval: config.processingInterval || 5,
        autoBatch: config.autoBatch !== undefined ? config.autoBatch : true,
        maxBatchAge: config.maxBatchAge || 30,
        retryAttempts: config.retryAttempts || 3,
      };
    }

    const response = await managementApi.put('/blockchain/management/config/batch', config);
    return response.data;
  } catch (error) {
    console.error('Failed to update batch configuration:', error);
    throw new Error('Unable to update batch configuration');
  }
}

// Trigger batch processing manually
export async function triggerBatchProcessing(): Promise<QueueManagementResult> {
  try {
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return {
        success: true,
        message: 'Batch processing triggered successfully',
        queueLength: Math.floor(Math.random() * 30),
        processedCount: Math.floor(Math.random() * 15) + 10,
      };
    }

    const response = await managementApi.post('/blockchain/management/queue/process');
    return response.data;
  } catch (error) {
    console.error('Failed to trigger batch processing:', error);
    throw new Error('Unable to trigger batch processing');
  }
}

/**
 * System Configuration Management
 */

// Get system configuration
export async function getSystemConfiguration(): Promise<SystemConfiguration> {
  try {
    if (process.env.NODE_ENV === 'development') {
      return {
        maintenanceMode: false,
        processingEnabled: true,
        alertsEnabled: true,
        maxConcurrentTransactions: 10,
        timeoutSettings: {
          s3Upload: 30000,
          aclLogging: 10000,
          blockchainSubmission: 60000,
        },
        thresholds: {
          queueWarning: 50,
          queueCritical: 100,
          responseTimeWarning: 5000,
          responseTimeCritical: 10000,
        },
      };
    }

    const response = await managementApi.get('/blockchain/management/system/config');
    return response.data;
  } catch (error) {
    console.error('Failed to get system configuration:', error);
    throw new Error('Unable to get system configuration');
  }
}

// Update system configuration
export async function updateSystemConfiguration(config: Partial<SystemConfiguration>): Promise<SystemConfiguration> {
  try {
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Return mock updated configuration
      return {
        maintenanceMode: config.maintenanceMode !== undefined ? config.maintenanceMode : false,
        processingEnabled: config.processingEnabled !== undefined ? config.processingEnabled : true,
        alertsEnabled: config.alertsEnabled !== undefined ? config.alertsEnabled : true,
        maxConcurrentTransactions: config.maxConcurrentTransactions || 10,
        timeoutSettings: config.timeoutSettings || {
          s3Upload: 30000,
          aclLogging: 10000,
          blockchainSubmission: 60000,
        },
        thresholds: config.thresholds || {
          queueWarning: 50,
          queueCritical: 100,
          responseTimeWarning: 5000,
          responseTimeCritical: 10000,
        },
      };
    }

    const response = await managementApi.put('/blockchain/management/system/config', config);
    return response.data;
  } catch (error) {
    console.error('Failed to update system configuration:', error);
    throw new Error('Unable to update system configuration');
  }
}

/**
 * Failed Transaction Management
 */

// Get failed transactions (REAL API)
export async function getFailedTransactions(): Promise<FailedTransaction[]> {
  try {
    
    const response = await managementApi.get('/blockchain/transactions/failed?include_retry_history=true');
    const failedData = response.data;

    // Transform real data to our interface
    const failedTransactions: FailedTransaction[] = (failedData.failedTransactions || []).map((tx: { transaction_id: string; provider: string; model: string; credits_deducted: string; failure_reason?: string; failure_stage: string; failed_at: string; retry_count: number; can_retry: boolean; error_details: Record<string, unknown> }) => ({
      transactionId: tx.transaction_id,
      provider: tx.provider,
      model: tx.model,
      credits: parseFloat(tx.credits_deducted) || 0,
      failureReason: tx.failure_reason || 'Unknown error',
      failureStage: tx.failure_stage as FailedTransaction['failureStage'],
      failedAt: tx.failed_at,
      retryCount: tx.retry_count || 0,
      canRetry: tx.can_retry || false,
      errorDetails: {
        statusCode: 500,
        message: tx.failure_reason || 'Unknown error',
        latency: 0,
        s3Location: undefined,
        aclTransactionId: undefined,
      },
    }));

    return failedTransactions;
  } catch (error) {
    console.error('Failed to get REAL failed transactions:', error);
    throw new Error('Unable to get failed transactions');
  }
}

// Retry failed transaction (REAL API)
export async function retryFailedTransaction(transactionId: string, reason?: string): Promise<QueueManagementResult> {
  try {
    
    const response = await managementApi.post(`/blockchain/management/retry/${transactionId}`, {
      reason: reason || 'Manual retry by admin'
    });
    
    return {
      success: response.data.success,
      message: response.data.message,
      queueLength: 0, // Not provided in individual retry response
      processedCount: response.data.success ? 1 : 0,
    };
  } catch (error) {
    console.error(`Failed to retry transaction ${transactionId}:`, error);
    throw new Error(`Unable to retry transaction ${transactionId}`);
  }
}

// Retry all failed transactions (REAL API)
export async function retryAllFailedTransactions(reason?: string): Promise<QueueManagementResult> {
  try {
    
    const response = await managementApi.post('/blockchain/management/retry/all', {
      reason: reason || 'Bulk retry by admin'
    });
    
    return {
      success: response.data.success,
      message: response.data.message,
      queueLength: response.data.retryResults?.eligibleTransactions || 0,
      processedCount: response.data.retryResults?.queuedForRetry || 0,
    };
  } catch (error) {
    console.error('Failed to retry all failed transactions:', error);
    throw new Error('Unable to retry all failed transactions');
  }
}

/**
 * System Statistics and Monitoring
 */

// Get system statistics
export async function getSystemStats(): Promise<SystemStats> {
  try {
    if (process.env.NODE_ENV === 'development') {
      return {
        uptime: Math.floor(Math.random() * 86400) + 3600, // 1-24 hours
        totalTransactions: Math.floor(Math.random() * 10000) + 5000,
        successfulTransactions: Math.floor(Math.random() * 9500) + 4500,
        failedTransactions: Math.floor(Math.random() * 500) + 50,
        averageProcessingTime: Math.random() * 30 + 15, // 15-45 seconds
        queueLength: Math.floor(Math.random() * 50),
        activeConnections: Math.floor(Math.random() * 20) + 5,
        systemLoad: {
          cpu: Math.random() * 80 + 10,
          memory: Math.random() * 70 + 20,
          storage: Math.random() * 60 + 30,
          network: Math.random() * 50 + 10,
        },
      };
    }

    const response = await managementApi.get('/blockchain/management/stats');
    const data = response.data || {};

    // Map API response shape to SystemStats interface
    const systemStats = data.systemStats || {};
    const performanceMetrics = data.performanceMetrics || {};

    return {
      uptime: systemStats.uptime ?? 0,
      totalTransactions: systemStats.transactions24h ?? 0,
      successfulTransactions: systemStats.completed24h ?? 0,
      failedTransactions: systemStats.failuresLastHour ?? 0,
      averageProcessingTime: performanceMetrics.avgProcessingTime ?? 0,
      queueLength: systemStats.queueLength ?? 0,
      activeConnections: systemStats.currentlyProcessing ?? 0,
      systemLoad: {
        cpu: 0,
        memory: 0,
        storage: 0,
        network: 0,
      },
    };
  } catch (error) {
    console.error('Failed to get system statistics:', error);
    throw new Error('Unable to get system statistics');
  }
}

/**
 * Maintenance Operations
 */

// Get available maintenance operations
export async function getMaintenanceOperations(): Promise<MaintenanceOperation[]> {
  try {
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          id: 'restart-service',
          type: 'restart_service',
          description: 'Restart blockchain processing service',
          estimatedDuration: 2,
          requiresDowntime: true,
          status: 'pending',
          progress: 0,
        },
        {
          id: 'clear-cache',
          type: 'clear_cache',
          description: 'Clear application cache and temporary files',
          estimatedDuration: 1,
          requiresDowntime: false,
          status: 'pending',
          progress: 0,
        },
        {
          id: 'cleanup-logs',
          type: 'cleanup_logs',
          description: 'Archive and cleanup old log files',
          estimatedDuration: 5,
          requiresDowntime: false,
          status: 'pending',
          progress: 0,
        },
        {
          id: 'backup-data',
          type: 'backup_data',
          description: 'Create system backup',
          estimatedDuration: 15,
          requiresDowntime: false,
          status: 'pending',
          progress: 0,
        },
      ];
    }

    const response = await managementApi.get('/blockchain/management/maintenance/operations');
    return response.data;
  } catch (error) {
    console.error('Failed to get maintenance operations:', error);
    throw new Error('Unable to get maintenance operations');
  }
}

// Execute maintenance operation
export async function executeMaintenanceOperation(operationId: string): Promise<MaintenanceOperation> {
  try {
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        id: operationId,
        type: 'restart_service',
        description: 'Maintenance operation started',
        estimatedDuration: 5,
        requiresDowntime: false,
        status: 'running',
        progress: 10,
        startedAt: new Date().toISOString(),
      };
    }

    const response = await managementApi.post(`/blockchain/management/maintenance/operations/${operationId}/execute`);
    return response.data;
  } catch (error) {
    console.error(`Failed to execute maintenance operation ${operationId}:`, error);
    throw new Error(`Unable to execute maintenance operation ${operationId}`);
  }
}
