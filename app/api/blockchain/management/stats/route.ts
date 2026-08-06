/**
 * System Statistics API Route
 * Provides real-time system statistics from blockchain database
 * Used for monitoring dashboard and system health assessment
 */

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { withBlockchainAuth, getOrgFilter } from '@/lib/auth-middleware';
import { AuthenticatedUser } from '@/types/auth';

// Database connection for blockchain service
const pool = new Pool({
  connectionString: process.env.BLOCKCHAIN_DATABASE_URL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function systemStatsHandler(request: NextRequest, user: AuthenticatedUser) {
  try {
    
    // Get organization filter
    const orgFilter = getOrgFilter(user);
    const orgCondition = orgFilter ? 'AND org_id = $1' : '';
    const queryParams = orgFilter ? [orgFilter] : [];


    // 1. Current system statistics
    const systemStatsQuery = `
      SELECT 
        -- Queue metrics
        COUNT(CASE WHEN blockchain_status = 'pending' THEN 1 END) as queue_length,
        COUNT(CASE WHEN blockchain_status = 'processing' THEN 1 END) as currently_processing,
        COUNT(CASE WHEN blockchain_status = 'submitted' THEN 1 END) as submitted_count,
        
        -- Hourly metrics
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '1 hour' THEN 1 END) as transactions_last_hour,
        COUNT(CASE WHEN blockchain_status = 'confirmed' AND created_at >= NOW() - INTERVAL '1 hour' THEN 1 END) as completed_last_hour,
        COUNT(CASE WHEN blockchain_status = 'failed' AND created_at >= NOW() - INTERVAL '1 hour' THEN 1 END) as failures_last_hour,
        
        -- Daily metrics
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as transactions_24h,
        COUNT(CASE WHEN blockchain_status = 'confirmed' AND created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as completed_24h,
        
        -- Performance metrics
        AVG(CASE WHEN blockchain_status = 'confirmed' AND created_at >= NOW() - INTERVAL '24 hours' 
            THEN latency_ms END) as avg_processing_time_24h,
        MAX(CASE WHEN blockchain_status = 'confirmed' AND created_at >= NOW() - INTERVAL '24 hours' 
            THEN latency_ms END) as max_processing_time_24h,
        MIN(CASE WHEN blockchain_status = 'confirmed' AND created_at >= NOW() - INTERVAL '24 hours' 
            THEN latency_ms END) as min_processing_time_24h,
        
        -- Credit metrics
        SUM(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN credits_deducted ELSE 0 END) as credits_processed_24h,
        SUM(CASE WHEN blockchain_status = 'failed' AND created_at >= NOW() - INTERVAL '24 hours' 
            THEN credits_deducted ELSE 0 END) as credits_lost_24h,
            
        -- Timing metrics
        MIN(CASE WHEN blockchain_status = 'pending' THEN created_at END) as oldest_pending,
        MAX(created_at) as latest_transaction

      FROM transaction_logs
      WHERE created_at >= NOW() - INTERVAL '7 days' ${orgCondition}
    `;

    const systemStatsResult = await pool.query(systemStatsQuery, queryParams);
    const systemStats = systemStatsResult.rows[0];

    // 2. Batch processing statistics
    const batchStatsQuery = `
      SELECT 
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_batches,
        COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_batches,
        COUNT(CASE WHEN status = 'submitted' THEN 1 END) as submitted_batches,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_batches,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_batches,
        AVG(transaction_count) as avg_batch_size,
        AVG(CASE WHEN submitted_at IS NOT NULL AND created_at IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (submitted_at - created_at)) END) as avg_batch_processing_time,
        MAX(created_at) as last_batch_created,
        SUM(transaction_count) as total_transactions_in_batches
      FROM blockchain_batches
      WHERE created_at >= NOW() - INTERVAL '24 hours'
    `;

    const batchStatsResult = await pool.query(batchStatsQuery);
    const batchStats = batchStatsResult.rows[0];

    // 3. Provider performance breakdown
    const providerStatsQuery = `
      SELECT 
        provider,
        COUNT(*) as transaction_count,
        COUNT(CASE WHEN blockchain_status = 'confirmed' THEN 1 END) as success_count,
        COUNT(CASE WHEN blockchain_status = 'failed' THEN 1 END) as failure_count,
        AVG(latency_ms) as avg_latency,
        SUM(credits_deducted) as total_credits
      FROM transaction_logs
      WHERE created_at >= NOW() - INTERVAL '24 hours' ${orgCondition}
      GROUP BY provider
      ORDER BY transaction_count DESC
    `;

    const providerStatsResult = await pool.query(providerStatsQuery, queryParams);
    const providerStats = providerStatsResult.rows;

    // 4. System configuration status
    const configQuery = `
      SELECT key, value, updated_at, updated_by
      FROM system_config
      WHERE key IN ('queue_processing', 'batch_config', 'system_config')
    `;

    const configResult = await pool.query(configQuery);
    const systemConfigs = configResult.rows.reduce((acc: Record<string, { value: string; updated_at: string; updated_by: string }>, config: { key: string; value: string; updated_at: string; updated_by: string }) => {
      acc[config.key] = {
        value: config.value,
        updated_at: config.updated_at,
        updated_by: config.updated_by,
      };
      return acc;
    }, {});

    // 5. Calculate derived metrics
    const totalTx24h = parseInt(systemStats.transactions_24h) || 0;
    const completed24h = parseInt(systemStats.completed_24h) || 0;
    const failures24h = parseInt(systemStats.failures_last_hour) || 0;
    const queueLength = parseInt(systemStats.queue_length) || 0;
    const processing = parseInt(systemStats.currently_processing) || 0;

    const performanceMetrics = {
      throughputPerHour: parseInt(systemStats.transactions_last_hour) || 0,
      completionRatePerHour: parseInt(systemStats.completed_last_hour) || 0,
      successRate24h: totalTx24h > 0 ? (completed24h / totalTx24h) * 100 : 0,
      errorRate24h: totalTx24h > 0 ? (failures24h / totalTx24h) * 100 : 0,
      avgProcessingTime: parseFloat(systemStats.avg_processing_time_24h) || 0,
      maxProcessingTime: parseFloat(systemStats.max_processing_time_24h) || 0,
      minProcessingTime: parseFloat(systemStats.min_processing_time_24h) || 0,
      queueEfficiency: queueLength > 0 ? (processing / queueLength) * 100 : 100,
    };

    // 6. System health assessment
    const systemHealth = {
      status: queueLength < 50 && performanceMetrics.errorRate24h < 5 ? 'healthy' :
              queueLength < 100 && performanceMetrics.errorRate24h < 10 ? 'warning' : 'critical',
      warnings: [
        ...(queueLength > 50 ? [`High queue length: ${queueLength} pending`] : []),
        ...(queueLength > 100 ? [`Critical queue length: ${queueLength} pending`] : []),
        ...(performanceMetrics.errorRate24h > 5 ? [`High error rate: ${performanceMetrics.errorRate24h.toFixed(1)}%`] : []),
        ...(performanceMetrics.avgProcessingTime > 10000 ? [`Slow processing: ${performanceMetrics.avgProcessingTime.toFixed(0)}ms avg`] : []),
        ...(!systemConfigs.queue_processing?.value?.enabled ? ['Queue processing is paused'] : []),
      ],
      alerts: [
        ...(queueLength > 100 ? ['Critical queue length'] : []),
        ...(performanceMetrics.errorRate24h > 10 ? ['Critical error rate'] : []),
        ...(processing === 0 && queueLength > 0 ? ['No active processing'] : []),
      ],
    };

    // Build comprehensive response
    const response = {
      systemStats: {
        uptime: 0, // Would need to track service start time
        queueLength,
        currentlyProcessing: processing,
        submittedCount: parseInt(systemStats.submitted_count) || 0,
        transactionsLastHour: parseInt(systemStats.transactions_last_hour) || 0,
        completedLastHour: parseInt(systemStats.completed_last_hour) || 0,
        failuresLastHour: parseInt(systemStats.failures_last_hour) || 0,
        transactions24h: totalTx24h,
        completed24h,
        creditsProcessed24h: parseFloat(systemStats.credits_processed_24h) || 0,
        creditsLost24h: parseFloat(systemStats.credits_lost_24h) || 0,
        oldestPending: systemStats.oldest_pending,
        latestTransaction: systemStats.latest_transaction,
      },
      batchStats: {
        pendingBatches: parseInt(batchStats.pending_batches) || 0,
        processingBatches: parseInt(batchStats.processing_batches) || 0,
        submittedBatches: parseInt(batchStats.submitted_batches) || 0,
        confirmedBatches: parseInt(batchStats.confirmed_batches) || 0,
        failedBatches: parseInt(batchStats.failed_batches) || 0,
        avgBatchSize: parseFloat(batchStats.avg_batch_size) || 0,
        avgBatchProcessingTime: parseFloat(batchStats.avg_batch_processing_time) || 0,
        lastBatchCreated: batchStats.last_batch_created,
        totalTransactionsInBatches: parseInt(batchStats.total_transactions_in_batches) || 0,
      },
      performanceMetrics,
      providerStats,
      systemHealth,
      systemConfiguration: {
        queueProcessing: systemConfigs.queue_processing?.value || { enabled: true },
        batchConfig: systemConfigs.batch_config?.value || {},
        systemConfig: systemConfigs.system_config?.value || {},
        lastConfigUpdate: Math.max(
          new Date(systemConfigs.queue_processing?.updated_at || 0).getTime(),
          new Date(systemConfigs.batch_config?.updated_at || 0).getTime(),
          new Date(systemConfigs.system_config?.updated_at || 0).getTime()
        ),
      },
      metadata: {
        requested_by: user.email,
        organization_id: orgFilter || 'all',
        request_timestamp: new Date().toISOString(),
        source: 'blockchain_database_system_stats',
        admin_access: user.role === 'admin' || user.permissions.includes('admin'),
      }
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'private, max-age=10', // Cache for 10 seconds (frequently changing data)
      },
    });
  } catch (error) {
    console.error('System statistics request failed:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to fetch system statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Export with authentication wrapper
export const GET = withBlockchainAuth(systemStatsHandler);
