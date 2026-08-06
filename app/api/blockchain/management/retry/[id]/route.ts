/**
 * Individual Transaction Retry API Route
 * Retries specific failed transaction with real database updates
 * Admin-only endpoint with eligibility validation and audit logging
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

async function retryTransactionHandler(
  request: NextRequest,
  user: AuthenticatedUser,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const transactionId = resolvedParams.id;

    if (!transactionId) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    
    // Check admin permissions
    if (user.role !== 'admin' && !user.permissions.includes('admin')) {
      return NextResponse.json(
        { error: 'Insufficient permissions - admin access required' },
        { status: 403 }
      );
    }

    // Parse retry options from request body
    const body = await request.json().catch(() => ({}));
    const retryReason = body.reason || 'Manual retry by admin';
    const forceRetry = body.force_retry || false;

    // Begin transaction for atomic operation
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // 1. Check retry eligibility
      const orgFilter = getOrgFilter(user);
      const orgCondition = orgFilter ? 'AND t.org_id = $2' : '';
      const eligibilityParams = orgFilter ? [transactionId, orgFilter] : [transactionId];

      const eligibilityQuery = `
        SELECT 
          t.transaction_id,
          t.org_id,
          t.provider,
          t.model,
          t.blockchain_status,
          t.created_at,
          t.credits_deducted,
          COALESCE(r.retry_count, 0) as current_retries,
          r.last_retry_at,
          CASE 
            WHEN t.s3_location IS NULL THEN 's3_upload'
            WHEN t.acl_transaction_id IS NULL THEN 'acl_logging'
            WHEN t.blockchain_submitted_at IS NULL THEN 'blockchain_submission'
            ELSE 'verification'
          END as failure_stage
        FROM transaction_logs t
        LEFT JOIN (
          SELECT 
            transaction_id,
            COUNT(*) as retry_count,
            MAX(requested_at) as last_retry_at
          FROM transaction_retry_log 
          GROUP BY transaction_id
        ) r ON t.transaction_id = r.transaction_id
        WHERE t.transaction_id = $1 ${orgCondition}
      `;

      const eligibilityResult = await client.query(eligibilityQuery, eligibilityParams);
      
      if (eligibilityResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Transaction not found' },
          { status: 404 }
        );
      }

      const transaction = eligibilityResult.rows[0];

      // 2. Validate retry conditions
      const canRetry = 
        transaction.blockchain_status === 'failed' &&
        (forceRetry || (
          new Date(transaction.created_at).getTime() > Date.now() - 24 * 60 * 60 * 1000 && // Within 24 hours
          transaction.current_retries < 3 // Less than 3 retry attempts
        ));

      if (!canRetry && !forceRetry) {
        const reason = transaction.blockchain_status !== 'failed' ? 'Transaction is not in failed status' :
                     transaction.current_retries >= 3 ? 'Maximum retry attempts exceeded' :
                     'Transaction is too old to retry (>24 hours)';

        return NextResponse.json(
          { 
            error: 'Transaction cannot be retried',
            reason,
            transactionDetails: {
              transactionId: transaction.transaction_id,
              status: transaction.blockchain_status,
              retryCount: transaction.current_retries,
              createdAt: transaction.created_at,
              failureStage: transaction.failure_stage,
            }
          },
          { status: 400 }
        );
      }

      // 3. Reset transaction status to pending
      const retryQuery = `
        UPDATE transaction_logs 
        SET blockchain_status = 'pending',
            last_modified_at = NOW(),
            last_modified_by = $2
        WHERE transaction_id = $1
        RETURNING transaction_id, blockchain_status, last_modified_at
      `;

      await client.query(retryQuery, [transactionId, user.email]);

      // 4. Log retry attempt
      const logRetryQuery = `
        INSERT INTO transaction_retry_log (
          transaction_id, retry_attempt, requested_by, retry_reason
        ) VALUES ($1, $2, $3, $4)
        RETURNING id, retry_attempt, requested_at
      `;

      const nextRetryAttempt = transaction.current_retries + 1;
      const retryLogResult = await client.query(logRetryQuery, [
        transactionId,
        nextRetryAttempt,
        user.email,
        retryReason
      ]);

      // 5. Log admin action
      const logActionQuery = `
        INSERT INTO admin_action_log (
          action_type, action_details, performed_by, target_resource, result
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING id, performed_at
      `;

      const actionDetails = {
        transaction_id: transactionId,
        provider: transaction.provider,
        model: transaction.model,
        credits: parseFloat(transaction.credits_deducted),
        retry_attempt: nextRetryAttempt,
        retry_reason: retryReason,
        force_retry: forceRetry,
        failure_stage: transaction.failure_stage,
        previous_retries: transaction.current_retries,
      };

      const actionLogResult = await client.query(logActionQuery, [
        'retry_transaction',
        JSON.stringify(actionDetails),
        user.email,
        `transaction:${transactionId}`,
        'success'
      ]);

      await client.query('COMMIT');

      const response = {
        success: true,
        message: `Transaction ${transactionId} queued for retry (attempt ${nextRetryAttempt})`,
        transactionDetails: {
          transactionId: transaction.transaction_id,
          provider: transaction.provider,
          model: transaction.model,
          credits: parseFloat(transaction.credits_deducted),
          previousStatus: 'failed',
          newStatus: 'pending',
          failureStage: transaction.failure_stage,
          retryAttempt: nextRetryAttempt,
          canRetryAgain: nextRetryAttempt < 3,
        },
        retryLog: {
          id: retryLogResult.rows[0].id,
          retryAttempt: retryLogResult.rows[0].retry_attempt,
          requestedAt: retryLogResult.rows[0].requested_at,
          reason: retryReason,
        },
        adminAction: {
          id: actionLogResult.rows[0].id,
          action: 'retry_transaction',
          performedBy: user.email,
          timestamp: actionLogResult.rows[0].performed_at,
          details: actionDetails,
        },
        metadata: {
          request_timestamp: new Date().toISOString(),
          source: 'blockchain_database_retry_management',
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
    const resolvedParams = await params;
    const transactionId = resolvedParams.id;
    
    console.error(`Transaction retry failed for ${transactionId}:`, error);
    
    // Log failed admin action
    try {
      await pool.query(`
        INSERT INTO admin_action_log (
          action_type, action_details, performed_by, target_resource, result, error_message
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        'retry_transaction',
        JSON.stringify({ transaction_id: transactionId }),
        user.email,
        `transaction:${transactionId}`,
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      ]);
    } catch (logError) {
      console.error('Failed to log retry error:', logError);
    }
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retry transaction',
        message: error instanceof Error ? error.message : 'Unknown error',
        transactionId: transactionId,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Export with authentication wrapper (admin-only)
export const POST = withBlockchainAuth(retryTransactionHandler);
