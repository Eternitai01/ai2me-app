/**
 * Failed Transactions API Route
 * Returns real failed transactions from blockchain database for retry management
 * Includes retry eligibility and failure analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { withBlockchainAuth, validateRequestParams, getOrgFilter } from '@/lib/auth-middleware';
import { AuthenticatedUser } from '@/types/auth';

// Database connection for blockchain service
const pool = new Pool({
  connectionString: process.env.BLOCKCHAIN_DATABASE_URL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function failedTransactionsHandler(request: NextRequest, user: AuthenticatedUser) {
  try {
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const params = validateRequestParams(searchParams, [], {
      limit: '100',
      offset: '0',
      include_retry_history: 'false',
    });

    // Get organization filter
    const orgFilter = getOrgFilter(user);
    const orgCondition = orgFilter ? 'AND t.org_id = $2' : '';
    
    // Real failed transactions query
    const failedQuery = `
      SELECT 
        t.transaction_id,
        t.org_id,
        t.provider,
        t.model,
        t.tokens_used,
        t.credits_deducted,
        t.blockchain_status,
        t.s3_location,
        t.acl_transaction_id,
        t.created_at,
        t.blockchain_submitted_at,
        t.latency_ms,
        t.status_code,
        -- Calculate retry eligibility
        CASE 
          WHEN t.created_at > NOW() - INTERVAL '24 hours' AND 
               COALESCE(retry_counts.retry_count, 0) < 3 THEN true
          ELSE false
        END as can_retry,
        COALESCE(retry_counts.retry_count, 0) as retry_count,
        retry_counts.last_retry_at,
        -- Determine failure stage based on available data
        CASE 
          WHEN t.s3_location IS NULL THEN 's3_upload'
          WHEN t.acl_transaction_id IS NULL THEN 'acl_logging'
          WHEN t.blockchain_submitted_at IS NULL THEN 'blockchain_submission'
          ELSE 'verification'
        END as failure_stage,
        -- Extract failure reason from status patterns
        CASE 
          WHEN t.status_code >= 500 THEN 'Service unavailable'
          WHEN t.status_code = 429 THEN 'Rate limit exceeded'
          WHEN t.status_code >= 400 THEN 'Client error'
          WHEN t.latency_ms > 60000 THEN 'Network timeout'
          ELSE 'Unknown error'
        END as failure_reason
      FROM transaction_logs t
      LEFT JOIN (
        SELECT 
          transaction_id,
          COUNT(*) as retry_count,
          MAX(requested_at) as last_retry_at
        FROM transaction_retry_log
        GROUP BY transaction_id
      ) retry_counts ON t.transaction_id = retry_counts.transaction_id
      WHERE t.blockchain_status = 'failed' ${orgCondition}
      ORDER BY t.created_at DESC
      LIMIT $1
    `;
    
    const queryParamsArray = orgFilter ? [params.limit, orgFilter] : [params.limit];
    
    // Execute real database query
    const result = await pool.query(failedQuery, queryParamsArray);
    const failedTransactions = result.rows;
    
    // Get retry history if requested
    let retryHistory = [];
    if (params.include_retry_history === 'true' && failedTransactions.length > 0) {
      const transactionIds = failedTransactions.map(tx => tx.transaction_id);
      const retryQuery = `
        SELECT 
          transaction_id,
          retry_attempt,
          requested_by,
          requested_at,
          result,
          completed_at
        FROM transaction_retry_log
        WHERE transaction_id = ANY($1)
        ORDER BY requested_at DESC
      `;
      
      const retryResult = await pool.query(retryQuery, [transactionIds]);
      retryHistory = retryResult.rows;
    }
    
    // Calculate failure analytics
    const analytics = {
      totalFailed: failedTransactions.length,
      failureStageBreakdown: failedTransactions.reduce((acc: Record<string, number>, tx: { failure_stage: string }) => {
        acc[tx.failure_stage] = (acc[tx.failure_stage] || 0) + 1;
        return acc;
      }, {}),
      failureReasonBreakdown: failedTransactions.reduce((acc: Record<string, number>, tx: { failure_reason: string }) => {
        acc[tx.failure_reason] = (acc[tx.failure_reason] || 0) + 1;
        return acc;
      }, {}),
      providerFailureRates: failedTransactions.reduce((acc: Record<string, number>, tx: { provider: string }) => {
        acc[tx.provider] = (acc[tx.provider] || 0) + 1;
        return acc;
      }, {}),
      retryableTransactions: failedTransactions.filter(tx => tx.can_retry).length,
      totalCreditsLost: failedTransactions.reduce((sum: number, tx: { credits_deducted: string }) => 
        sum + parseFloat(tx.credits_deducted?.toString() || '0'), 0
      ),
      averageFailureTime: failedTransactions.length > 0 ?
        failedTransactions.reduce((sum: number, tx: { latency_ms: number }) => sum + (tx.latency_ms || 0), 0) / failedTransactions.length : 0,
      oldestFailure: failedTransactions[failedTransactions.length - 1]?.created_at || null,
      newestFailure: failedTransactions[0]?.created_at || null,
    };

    const response = {
      failedTransactions,
      retryHistory,
      analytics,
      pagination: {
        limit: parseInt(params.limit),
        offset: parseInt(params.offset),
        total: analytics.totalFailed,
      },
      metadata: {
        requested_by: user.email,
        organization_id: orgFilter || 'all',
        request_timestamp: new Date().toISOString(),
        source: 'blockchain_database_failed_transactions',
        include_retry_history: params.include_retry_history === 'true',
      }
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'private, max-age=30', // Cache for 30 seconds
      },
    });
  } catch (error) {
    console.error('Failed transactions request failed:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to fetch failed transactions',
        message: error instanceof Error ? error.message : 'Unknown error',
        failedTransactions: [],
        analytics: null,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Export with authentication wrapper
export const GET = withBlockchainAuth(failedTransactionsHandler);
