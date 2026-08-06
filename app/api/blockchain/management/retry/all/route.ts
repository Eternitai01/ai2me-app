/**
 * Bulk Transaction Retry API Route
 * Retries all eligible failed transactions with real database updates
 * Admin-only endpoint for bulk retry operations
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

async function retryAllFailedHandler(request: NextRequest, user: AuthenticatedUser) {
  try {
    
    // Check admin permissions
    if (user.role !== 'admin' && !user.permissions.includes('admin')) {
      return NextResponse.json(
        { error: 'Insufficient permissions - admin access required' },
        { status: 403 }
      );
    }

    // Parse retry options from request body
    const body = await request.json().catch(() => ({}));
    const retryReason = body.reason || 'Bulk retry by admin';
    const forceRetry = body.force_retry || false;
    const maxRetries = body.max_retries || 3;

    // Begin transaction for atomic operation
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // 1. Get all eligible failed transactions
      const orgFilter = getOrgFilter(user);
      const orgCondition = orgFilter ? 'AND t.org_id = $1' : '';
      const baseParams = orgFilter ? [orgFilter] : [];

      const eligibilityQuery = `
        SELECT 
          t.transaction_id,
          t.org_id,
          t.provider,
          t.model,
          t.credits_deducted,
          t.blockchain_status,
          t.created_at,
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
        WHERE t.blockchain_status = 'failed' ${orgCondition}
          AND (
            $${baseParams.length + 1} = true OR (
              t.created_at > NOW() - INTERVAL '24 hours' AND 
              COALESCE(r.retry_count, 0) < $${baseParams.length + 2}
            )
          )
        ORDER BY t.created_at DESC
      `;

      const eligibilityParams = [...baseParams, forceRetry, maxRetries];
      const eligibilityResult = await client.query(eligibilityQuery, eligibilityParams);
      const eligibleTransactions = eligibilityResult.rows;

      if (eligibleTransactions.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: 'No eligible transactions found for retry',
            eligibilityCriteria: {
              forceRetry,
              maxRetries,
              organizationFilter: orgFilter || 'all',
            },
            metadata: {
              request_timestamp: new Date().toISOString(),
              source: 'blockchain_database_bulk_retry',
            }
          },
          { status: 200 }
        );
      }


      // 2. Update all eligible transactions to pending status
      const transactionIds = eligibleTransactions.map(tx => tx.transaction_id);
      const updateQuery = `
        UPDATE transaction_logs 
        SET blockchain_status = 'pending',
            last_modified_at = NOW(),
            last_modified_by = $1
        WHERE transaction_id = ANY($2)
        RETURNING transaction_id, blockchain_status
      `;

      const updateResult = await client.query(updateQuery, [user.email, transactionIds]);
      const updatedTransactions = updateResult.rows;

      // 3. Log retry attempts for all transactions
      const retryLogValues = eligibleTransactions.map((tx, index) => 
        `($${index * 4 + 1}, $${index * 4 + 2}, $${index * 4 + 3}, $${index * 4 + 4})`
      ).join(', ');

      const retryLogParams: (string | number)[] = [];
      eligibleTransactions.forEach(tx => {
        retryLogParams.push(
          tx.transaction_id,
          tx.current_retries + 1,
          user.email,
          retryReason
        );
      });

      const bulkRetryLogQuery = `
        INSERT INTO transaction_retry_log (
          transaction_id, retry_attempt, requested_by, retry_reason
        ) VALUES ${retryLogValues}
        RETURNING transaction_id, retry_attempt
      `;

      await client.query(bulkRetryLogQuery, retryLogParams);

      // 4. Calculate retry analytics
      const retryAnalytics = {
        totalEligible: eligibleTransactions.length,
        successfullyQueued: updatedTransactions.length,
        failureStageBreakdown: eligibleTransactions.reduce((acc: Record<string, number>, tx: { failure_stage: string }) => {
          acc[tx.failure_stage] = (acc[tx.failure_stage] || 0) + 1;
          return acc;
        }, {}),
        providerBreakdown: eligibleTransactions.reduce((acc: Record<string, number>, tx: { provider: string }) => {
          acc[tx.provider] = (acc[tx.provider] || 0) + 1;
          return acc;
        }, {}),
        totalCreditsAffected: eligibleTransactions.reduce((sum: number, tx: { credits_deducted: string }) => 
          sum + parseFloat(tx.credits_deducted?.toString() || '0'), 0),
        retryAttemptBreakdown: eligibleTransactions.reduce((acc: Record<string, number>, tx: { current_retries: number }) => {
          const nextAttempt = tx.current_retries + 1;
          acc[`attempt_${nextAttempt}`] = (acc[`attempt_${nextAttempt}`] || 0) + 1;
          return acc;
        }, {}),
      };

      // 5. Log bulk admin action
      const logActionQuery = `
        INSERT INTO admin_action_log (
          action_type, action_details, performed_by, target_resource, result
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING id, performed_at
      `;

      const actionDetails = {
        retry_reason: retryReason,
        force_retry: forceRetry,
        max_retries: maxRetries,
        transactions_found: eligibleTransactions.length,
        transactions_queued: updatedTransactions.length,
        analytics: retryAnalytics,
        organization_filter: orgFilter || 'all',
      };

      const actionLogResult = await client.query(logActionQuery, [
        'bulk_retry_failed',
        JSON.stringify(actionDetails),
        user.email,
        'failed_transactions',
        'success'
      ]);

      await client.query('COMMIT');

      const response = {
        success: true,
        message: `Successfully queued ${updatedTransactions.length} failed transactions for retry`,
        retryResults: {
          eligibleTransactions: eligibleTransactions.length,
          queuedForRetry: updatedTransactions.length,
          skipped: eligibleTransactions.length - updatedTransactions.length,
          totalCreditsAffected: retryAnalytics.totalCreditsAffected,
        },
        analytics: retryAnalytics,
        transactionDetails: eligibleTransactions.map(tx => ({
          transactionId: tx.transaction_id,
          provider: tx.provider,
          model: tx.model,
          credits: parseFloat(tx.credits_deducted),
          failureStage: tx.failure_stage,
          retryAttempt: tx.current_retries + 1,
        })),
        adminAction: {
          id: actionLogResult.rows[0].id,
          action: 'bulk_retry_failed',
          performedBy: user.email,
          timestamp: actionLogResult.rows[0].performed_at,
          details: actionDetails,
        },
        metadata: {
          request_timestamp: new Date().toISOString(),
          source: 'blockchain_database_bulk_retry',
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
    console.error('Bulk retry operation failed:', error);
    
    // Log failed admin action
    try {
      await pool.query(`
        INSERT INTO admin_action_log (
          action_type, performed_by, target_resource, result, error_message
        ) VALUES ($1, $2, $3, $4, $5)
      `, [
        'bulk_retry_failed',
        user.email,
        'failed_transactions',
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      ]);
    } catch (logError) {
      console.error('Failed to log bulk retry error:', logError);
    }
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retry transactions',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Export with authentication wrapper (admin-only)
export const POST = withBlockchainAuth(retryAllFailedHandler);
