/**
 * Queue Resume API Route
 * Resumes real blockchain queue processing by updating system configuration
 * Admin-only endpoint with audit logging
 */

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { withBlockchainAuth } from '@/lib/auth-middleware';
import { AuthenticatedUser } from '@/types/auth';

// Database connection for blockchain service
const pool = new Pool({
  connectionString: process.env.BLOCKCHAIN_DATABASE_URL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function resumeQueueHandler(request: NextRequest, user: AuthenticatedUser) {
  try {
    
    // Check admin permissions
    if (user.role !== 'admin' && !user.permissions.includes('admin')) {
      return NextResponse.json(
        { error: 'Insufficient permissions - admin access required' },
        { status: 403 }
      );
    }


    // Begin transaction for atomic operation
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // 1. Check current queue configuration
      const currentConfigQuery = `
        SELECT value FROM system_config WHERE key = 'queue_processing'
      `;
      
      const currentConfigResult = await client.query(currentConfigQuery);
      const currentConfig = currentConfigResult.rows[0]?.value || {};

      // 2. Update queue processing configuration to enable
      const updateConfigQuery = `
        UPDATE system_config 
        SET value = jsonb_set(
              value - 'paused_by' - 'paused_at',
              '{enabled}', 'true'
            ),
            updated_at = NOW(),
            updated_by = $1
        WHERE key = 'queue_processing'
        RETURNING value
      `;

      await client.query(updateConfigQuery, [user.email]);

      // 3. Get current queue status after resume
      const queueStatusQuery = `
        SELECT 
          COUNT(CASE WHEN blockchain_status = 'pending' THEN 1 END) as pending_count,
          COUNT(CASE WHEN blockchain_status = 'processing' THEN 1 END) as processing_count,
          COUNT(CASE WHEN blockchain_status = 'submitted' THEN 1 END) as submitted_count,
          MIN(CASE WHEN blockchain_status = 'pending' THEN created_at END) as oldest_pending
        FROM transaction_logs
        WHERE created_at >= NOW() - INTERVAL '24 hours'
      `;

      const queueResult = await client.query(queueStatusQuery);
      const queueStatus = queueResult.rows[0];

      // 4. Log admin action
      const logActionQuery = `
        INSERT INTO admin_action_log (
          action_type, action_details, performed_by, target_resource, result
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING id, performed_at
      `;

      const actionDetails = {
        previously_paused_by: currentConfig.paused_by || null,
        previously_paused_at: currentConfig.paused_at || null,
        queue_length_at_resume: parseInt(queueStatus.pending_count) || 0,
        processing_at_resume: parseInt(queueStatus.processing_count) || 0,
      };

      const logResult = await client.query(logActionQuery, [
        'resume_queue',
        JSON.stringify(actionDetails),
        user.email,
        'queue_processing',
        'success'
      ]);

      await client.query('COMMIT');

      const response = {
        success: true,
        message: 'Queue processing resumed successfully',
        queueStatus: {
          enabled: true,
          resumedBy: user.email,
          resumedAt: new Date().toISOString(),
          previouslyPausedBy: currentConfig.paused_by || null,
          previouslyPausedAt: currentConfig.paused_at || null,
          pendingTransactions: parseInt(queueStatus.pending_count) || 0,
          processingTransactions: parseInt(queueStatus.processing_count) || 0,
          submittedTransactions: parseInt(queueStatus.submitted_count) || 0,
          oldestPending: queueStatus.oldest_pending,
        },
        adminAction: {
          id: logResult.rows[0].id,
          action: 'resume_queue',
          performedBy: user.email,
          timestamp: logResult.rows[0].performed_at,
          details: actionDetails,
        },
        metadata: {
          request_timestamp: new Date().toISOString(),
          source: 'blockchain_database_queue_management',
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
    console.error('Queue resume operation failed:', error);
    
    // Log failed admin action
    try {
      await pool.query(`
        INSERT INTO admin_action_log (
          action_type, performed_by, target_resource, result, error_message
        ) VALUES ($1, $2, $3, $4, $5)
      `, [
        'resume_queue',
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
        error: 'Failed to resume queue processing',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Export with authentication wrapper (admin-only)
export const POST = withBlockchainAuth(resumeQueueHandler);
