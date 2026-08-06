/**
 * Queue Pause API Route
 * Pauses real blockchain queue processing by updating system configuration
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

async function pauseQueueHandler(request: NextRequest, user: AuthenticatedUser) {
  try {
    
    // Check admin permissions
    if (user.role !== 'admin' && !user.permissions.includes('admin')) {
      return NextResponse.json(
        { error: 'Insufficient permissions - admin access required' },
        { status: 403 }
      );
    }

    // Parse optional pause reason from request body
    const body = await request.json().catch(() => ({}));
    const pauseReason = body.reason || 'Manual pause by admin';


    // Begin transaction for atomic operation
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // 1. Update queue processing configuration
      const updateConfigQuery = `
        UPDATE system_config 
        SET value = jsonb_set(
              jsonb_set(
                jsonb_set(value, '{enabled}', 'false'),
                '{paused_by}', $2
              ),
              '{paused_at}', $3
            ),
            updated_at = NOW(),
            updated_by = $1
        WHERE key = 'queue_processing'
        RETURNING value
      `;

      await client.query(updateConfigQuery, [
        user.email,
        JSON.stringify(user.email),
        JSON.stringify(new Date().toISOString())
      ]);

      // 2. Get current queue status
      const queueStatusQuery = `
        SELECT 
          COUNT(CASE WHEN blockchain_status = 'pending' THEN 1 END) as pending_count,
          COUNT(CASE WHEN blockchain_status = 'processing' THEN 1 END) as processing_count,
          COUNT(CASE WHEN blockchain_status = 'submitted' THEN 1 END) as submitted_count
        FROM transaction_logs
        WHERE created_at >= NOW() - INTERVAL '24 hours'
      `;

      const queueResult = await client.query(queueStatusQuery);
      const queueStatus = queueResult.rows[0];

      // 3. Log admin action
      const logActionQuery = `
        INSERT INTO admin_action_log (
          action_type, action_details, performed_by, target_resource, result
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING id, performed_at
      `;

      const actionDetails = {
        reason: pauseReason,
        queue_length_at_pause: parseInt(queueStatus.pending_count) || 0,
        processing_at_pause: parseInt(queueStatus.processing_count) || 0,
      };

      const logResult = await client.query(logActionQuery, [
        'pause_queue',
        JSON.stringify(actionDetails),
        user.email,
        'queue_processing',
        'success'
      ]);

      await client.query('COMMIT');

      const response = {
        success: true,
        message: 'Queue processing paused successfully',
        queueStatus: {
          enabled: false,
          pausedBy: user.email,
          pausedAt: new Date().toISOString(),
          reason: pauseReason,
          pendingTransactions: parseInt(queueStatus.pending_count) || 0,
          processingTransactions: parseInt(queueStatus.processing_count) || 0,
          submittedTransactions: parseInt(queueStatus.submitted_count) || 0,
        },
        adminAction: {
          id: logResult.rows[0].id,
          action: 'pause_queue',
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
          'Cache-Control': 'no-cache', // Don't cache management operations
        },
      });

    } catch (dbError) {
      await client.query('ROLLBACK');
      throw dbError;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Queue pause operation failed:', error);
    
    // Log failed admin action
    try {
      await pool.query(`
        INSERT INTO admin_action_log (
          action_type, performed_by, target_resource, result, error_message
        ) VALUES ($1, $2, $3, $4, $5)
      `, [
        'pause_queue',
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
        error: 'Failed to pause queue processing',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Export with authentication wrapper (admin-only)
export const POST = withBlockchainAuth(pauseQueueHandler);
