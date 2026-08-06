/**
 * Queue Process API Route
 * Triggers immediate queue processing by calling blockchain service batch submission
 * Admin-only endpoint for manual batch processing
 */

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { InternalBlockchainClient } from '@/lib/internal-blockchain-client';
import { withBlockchainAuth } from '@/lib/auth-middleware';
import { AuthenticatedUser } from '@/types/auth';

// Database connection for blockchain service
const pool = new Pool({
  connectionString: process.env.BLOCKCHAIN_DATABASE_URL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function processQueueHandler(request: NextRequest, user: AuthenticatedUser) {
  try {
    
    // Check admin permissions
    if (user.role !== 'admin' && !user.permissions.includes('admin')) {
      return NextResponse.json(
        { error: 'Insufficient permissions - admin access required' },
        { status: 403 }
      );
    }

    // Parse processing options from request body
    const body = await request.json().catch(() => ({}));
    const forceProcess = body.force_process || false;
    const batchSize = body.batch_size || null; // Use default if not specified

    // Begin transaction for atomic operation
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // 1. Get current queue status before processing
      const preProcessQuery = `
        SELECT 
          COUNT(CASE WHEN blockchain_status = 'pending' THEN 1 END) as pending_before,
          COUNT(CASE WHEN blockchain_status = 'processing' THEN 1 END) as processing_before,
          MIN(CASE WHEN blockchain_status = 'pending' THEN created_at END) as oldest_pending
        FROM transaction_logs
        WHERE created_at >= NOW() - INTERVAL '24 hours'
      `;

      const preProcessResult = await client.query(preProcessQuery);
      const preProcessStatus = preProcessResult.rows[0];

      // 2. Check if processing is enabled
      const configQuery = `
        SELECT value FROM system_config WHERE key = 'queue_processing'
      `;
      
      const configResult = await client.query(configQuery);
      const queueConfig = configResult.rows[0]?.value || { enabled: true };

      if (!queueConfig.enabled && !forceProcess) {
        throw new Error('Queue processing is currently paused. Use force_process=true to override.');
      }

      // 3. Trigger batch processing via blockchain service
      const batchSubmissionData = {
        force_submit: true,
        manual_trigger: true,
        requested_by: user.email,
        ...(batchSize && { batch_size: batchSize })
      };

      // Create blockchain client instance
      const blockchainClient = new InternalBlockchainClient();

      const batchResult = await blockchainClient.submitBatch(batchSubmissionData);

      // 4. Get queue status after processing
      const postProcessResult = await client.query(preProcessQuery);
      const postProcessStatus = postProcessResult.rows[0];

      // 5. Log admin action with results
      const logActionQuery = `
        INSERT INTO admin_action_log (
          action_type, action_details, performed_by, target_resource, result
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING id, performed_at
      `;

      const actionDetails = {
        force_process: forceProcess,
        custom_batch_size: batchSize,
        queue_before: {
          pending: parseInt(preProcessStatus.pending_before) || 0,
          processing: parseInt(preProcessStatus.processing_before) || 0,
        },
        queue_after: {
          pending: parseInt(postProcessStatus.pending_before) || 0,
          processing: parseInt(postProcessStatus.processing_before) || 0,
        },
        batch_result: {
          batch_id: batchResult.batch_id,
          transaction_count: batchResult.transaction_count,
          status: batchResult.status,
        },
        processing_enabled: queueConfig.enabled,
      };

      const logResult = await client.query(logActionQuery, [
        'process_queue',
        JSON.stringify(actionDetails),
        user.email,
        'queue_processing',
        'success'
      ]);

      await client.query('COMMIT');

      const response = {
        success: true,
        message: `Queue processed successfully. Batch ${batchResult.batch_id} created with ${batchResult.transaction_count} transactions.`,
        batchResult: {
          batchId: batchResult.batch_id,
          transactionCount: batchResult.transaction_count,
          status: batchResult.status,
          submittedAt: batchResult.submitted_at || new Date().toISOString(),
        },
        queueStatus: {
          pendingBefore: parseInt(preProcessStatus.pending_before) || 0,
          pendingAfter: parseInt(postProcessStatus.pending_before) || 0,
          processed: (parseInt(preProcessStatus.pending_before) || 0) - (parseInt(postProcessStatus.pending_before) || 0),
          processingEnabled: queueConfig.enabled,
        },
        adminAction: {
          id: logResult.rows[0].id,
          action: 'process_queue',
          performedBy: user.email,
          timestamp: logResult.rows[0].performed_at,
          details: actionDetails,
        },
        metadata: {
          request_timestamp: new Date().toISOString(),
          source: 'blockchain_service_batch_processing',
        }
      };

      return NextResponse.json(response, {
        status: 200,
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

    } catch (dbError) {
      await client.query('ROLLBACK');
      throw dbError;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Queue processing operation failed:', error);
    
    // Log failed admin action
    try {
      await pool.query(`
        INSERT INTO admin_action_log (
          action_type, performed_by, target_resource, result, error_message
        ) VALUES ($1, $2, $3, $4, $5)
      `, [
        'process_queue',
        user.email,
        'queue_processing',
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      ]);
    } catch (logError) {
      console.error('Failed to log admin action error:', logError);
    }
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process queue',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Export with authentication wrapper (admin-only)
export const POST = withBlockchainAuth(processQueueHandler);
