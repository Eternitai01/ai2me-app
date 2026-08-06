/**
 * Queue Status API Route
 * Gets real queue status from blockchain database
 * Provides current queue length, processing status, and throughput metrics
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

async function queueStatusHandler(request: NextRequest, user: AuthenticatedUser) {
  try {
    
    // Check admin permissions for queue management
    if (user.role !== 'admin' && !user.permissions.includes('admin')) {
      return NextResponse.json(
        { error: 'Insufficient permissions - admin access required' },
        { status: 403 }
      );
    }

    // Get organization filter
    const orgFilter = getOrgFilter(user);
    const orgCondition = orgFilter ? 'AND org_id = $1' : '';
    const queryParams = orgFilter ? [orgFilter] : [];


    // 1. Current queue status
    const queueQuery = `
      SELECT 
        COUNT(CASE WHEN blockchain_status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN blockchain_status = 'processing' THEN 1 END) as processing_count,
        COUNT(CASE WHEN blockchain_status = 'submitted' THEN 1 END) as submitted_count,
        MIN(CASE WHEN blockchain_status = 'pending' THEN created_at END) as oldest_pending,
        AVG(CASE WHEN blockchain_status IN ('confirmed', 'failed') AND created_at >= NOW() - INTERVAL '1 hour' 
            THEN EXTRACT(EPOCH FROM (COALESCE(blockchain_submitted_at, NOW()) - created_at)) END) as avg_processing_time
      FROM transaction_logs
      WHERE created_at >= NOW() - INTERVAL '24 hours' ${orgCondition}
    `;

    const queueResult = await pool.query(queueQuery, queryParams);
    const queueData = queueResult.rows[0];

    // 2. Throughput calculation (last hour)
    const throughputQuery = `
      SELECT 
        COUNT(*) as transactions_last_hour,
        COUNT(CASE WHEN blockchain_status = 'confirmed' THEN 1 END) as completed_last_hour
      FROM transaction_logs
      WHERE created_at >= NOW() - INTERVAL '1 hour' ${orgCondition}
    `;

    const throughputResult = await pool.query(throughputQuery, queryParams);
    const throughputData = throughputResult.rows[0];

    // 3. Batch processing status
    const batchQuery = `
      SELECT 
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_batches,
        COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_batches,
        COUNT(CASE WHEN status = 'submitted' THEN 1 END) as submitted_batches,
        AVG(transaction_count) as avg_batch_size,
        MAX(created_at) as last_batch_created
      FROM blockchain_batches
      WHERE created_at >= NOW() - INTERVAL '24 hours'
    `;

    const batchResult = await pool.query(batchQuery);
    const batchData = batchResult.rows[0];

    // 4. System configuration (processing enabled/disabled)
    const configQuery = `
      SELECT value
      FROM system_config
      WHERE key = 'queue_processing'
    `;

    let processingEnabled = true; // Default
    try {
      const configResult = await pool.query(configQuery);
      if (configResult.rows.length > 0) {
        processingEnabled = configResult.rows[0].value?.enabled !== false;
      }
    } catch (configError) {
      console.warn('Could not fetch processing config, assuming enabled:', configError);
    }

    // Calculate real queue metrics
    const queueLength = parseInt(queueData.pending_count) || 0;
    const processingCount = parseInt(queueData.processing_count) || 0;
    const submittedCount = parseInt(queueData.submitted_count) || 0;
    const transactionsPerHour = parseInt(throughputData.transactions_last_hour) || 0;
    const completedPerHour = parseInt(throughputData.completed_last_hour) || 0;
    
    const response = {
      queueStatus: {
        length: queueLength,
        processing: processingCount,
        submitted: submittedCount,
        processingEnabled,
        oldestPending: queueData.oldest_pending,
        averageWaitTime: parseFloat(queueData.avg_processing_time) || 0,
      },
      throughput: {
        transactionsPerHour,
        completedPerHour,
        throughputRate: transactionsPerHour, // transactions per hour
        completionRate: transactionsPerHour > 0 ? (completedPerHour / transactionsPerHour) * 100 : 0,
      },
      batchStatus: {
        pendingBatches: parseInt(batchData.pending_batches) || 0,
        processingBatches: parseInt(batchData.processing_batches) || 0,
        submittedBatches: parseInt(batchData.submitted_batches) || 0,
        averageBatchSize: parseFloat(batchData.avg_batch_size) || 0,
        lastBatchCreated: batchData.last_batch_created,
      },
      systemHealth: {
        healthy: queueLength < 100 && processingEnabled,
        warnings: [
          ...(queueLength > 50 ? ['High queue length'] : []),
          ...(queueLength > 100 ? ['Critical queue length'] : []),
          ...(!processingEnabled ? ['Processing disabled'] : []),
          ...(completedPerHour === 0 && transactionsPerHour > 0 ? ['No completions in last hour'] : []),
        ],
      },
      metadata: {
        requested_by: user.email,
        organization_id: orgFilter || 'all',
        request_timestamp: new Date().toISOString(),
        source: 'blockchain_database_queue_status',
        admin_access: true,
      }
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'private, max-age=10', // Cache for 10 seconds (queue status changes frequently)
      },
    });
  } catch (error) {
    console.error('Queue status request failed:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to fetch queue status',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Export with authentication wrapper (admin-only)
export const GET = withBlockchainAuth(queueStatusHandler);
