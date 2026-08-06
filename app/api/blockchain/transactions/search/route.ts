/**
 * Advanced Transaction Search API Route
 * Performs real database search with complex filtering criteria
 * Uses direct database queries for optimal performance
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

interface SearchRequest {
  transactionId?: string;
  provider?: string;
  model?: string;
  status?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  creditRange?: {
    min: number;
    max: number;
  };
  pagination?: {
    limit: number;
    offset: number;
  };
}

async function transactionSearchHandler(request: NextRequest, user: AuthenticatedUser) {
  try {
    
    // Parse search criteria from request body
    const searchCriteria: SearchRequest = await request.json();
    
    // Get organization filter
    const orgFilter = getOrgFilter(user);
    
    // Build dynamic query with real database search
    let query = `
      SELECT 
        t.transaction_id, t.org_id, t.provider, t.model, t.tokens_used,
        t.credits_deducted, t.blockchain_status, t.s3_location, 
        t.acl_transaction_id, t.blockchain_tx_hash, t.created_at,
        t.blockchain_submitted_at, t.latency_ms, t.status_code,
        b.batch_id, b.merkle_root, b.status as batch_status
      FROM transaction_logs t
      LEFT JOIN blockchain_batches b ON t.blockchain_batch_id = b.batch_id
      WHERE 1=1
    `;
    
    const queryParams: (string | number)[] = [];
    let paramIndex = 1;
    
    // Add search filters
    if (searchCriteria.transactionId) {
      query += ` AND t.transaction_id ILIKE $${paramIndex}`;
      queryParams.push(`%${searchCriteria.transactionId}%`);
      paramIndex++;
    }
    
    if (searchCriteria.provider) {
      query += ` AND t.provider = $${paramIndex}`;
      queryParams.push(searchCriteria.provider);
      paramIndex++;
    }
    
    if (searchCriteria.model) {
      query += ` AND t.model ILIKE $${paramIndex}`;
      queryParams.push(`%${searchCriteria.model}%`);
      paramIndex++;
    }
    
    if (searchCriteria.status) {
      query += ` AND t.blockchain_status = $${paramIndex}`;
      queryParams.push(searchCriteria.status);
      paramIndex++;
    }
    
    // Date range filter
    if (searchCriteria.dateRange?.start) {
      query += ` AND t.created_at >= $${paramIndex}`;
      queryParams.push(searchCriteria.dateRange.start);
      paramIndex++;
    }
    
    if (searchCriteria.dateRange?.end) {
      query += ` AND t.created_at <= $${paramIndex}`;
      queryParams.push(searchCriteria.dateRange.end);
      paramIndex++;
    }
    
    // Credit range filter
    if (searchCriteria.creditRange?.min !== undefined) {
      query += ` AND t.credits_deducted >= $${paramIndex}`;
      queryParams.push(searchCriteria.creditRange.min);
      paramIndex++;
    }
    
    if (searchCriteria.creditRange?.max !== undefined) {
      query += ` AND t.credits_deducted <= $${paramIndex}`;
      queryParams.push(searchCriteria.creditRange.max);
      paramIndex++;
    }
    
    // Organization filter (security)
    if (orgFilter) {
      query += ` AND t.org_id = $${paramIndex}`;
      queryParams.push(orgFilter);
      paramIndex++;
    }
    
    // Add ordering and pagination
    query += ` ORDER BY t.created_at DESC`;
    
    const limit = searchCriteria.pagination?.limit || 50;
    const offset = searchCriteria.pagination?.offset || 0;
    
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);
    
    // Execute real database search
    const searchResult = await pool.query(query, queryParams);
    const transactions = searchResult.rows;
    
    // Get total count for pagination (separate query for performance)
    let countQuery = `
      SELECT COUNT(*) as total_count
      FROM transaction_logs t
      WHERE 1=1
    `;
    
    const countParams: (string | number)[] = [];
    let countParamIndex = 1;
    
    // Rebuild filters for count query
    if (searchCriteria.transactionId) {
      countQuery += ` AND t.transaction_id ILIKE $${countParamIndex}`;
      countParams.push(`%${searchCriteria.transactionId}%`);
      countParamIndex++;
    }
    
    if (searchCriteria.provider) {
      countQuery += ` AND t.provider = $${countParamIndex}`;
      countParams.push(searchCriteria.provider);
      countParamIndex++;
    }
    
    if (searchCriteria.model) {
      countQuery += ` AND t.model ILIKE $${countParamIndex}`;
      countParams.push(`%${searchCriteria.model}%`);
      countParamIndex++;
    }
    
    if (searchCriteria.status) {
      countQuery += ` AND t.blockchain_status = $${countParamIndex}`;
      countParams.push(searchCriteria.status);
      countParamIndex++;
    }
    
    if (searchCriteria.dateRange?.start) {
      countQuery += ` AND t.created_at >= $${countParamIndex}`;
      countParams.push(searchCriteria.dateRange.start);
      countParamIndex++;
    }
    
    if (searchCriteria.dateRange?.end) {
      countQuery += ` AND t.created_at <= $${countParamIndex}`;
      countParams.push(searchCriteria.dateRange.end);
      countParamIndex++;
    }
    
    if (searchCriteria.creditRange?.min !== undefined) {
      countQuery += ` AND t.credits_deducted >= $${countParamIndex}`;
      countParams.push(searchCriteria.creditRange.min);
      countParamIndex++;
    }
    
    if (searchCriteria.creditRange?.max !== undefined) {
      countQuery += ` AND t.credits_deducted <= $${countParamIndex}`;
      countParams.push(searchCriteria.creditRange.max);
      countParamIndex++;
    }
    
    if (orgFilter) {
      countQuery += ` AND t.org_id = $${countParamIndex}`;
      countParams.push(orgFilter);
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].total_count) || 0;
    
    // Calculate search analytics from real results
    const analytics = {
      totalResults: totalCount,
      returnedResults: transactions.length,
      statusBreakdown: transactions.reduce((acc: Record<string, number>, tx: { blockchain_status: string }) => {
        const status = tx.blockchain_status === 'confirmed' ? 'verified' : 
                     tx.blockchain_status === 'failed' ? 'failed' : 'pending';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, { verified: 0, pending: 0, failed: 0 }),
      providerBreakdown: transactions.reduce((acc: Record<string, number>, tx: { provider: string }) => {
        acc[tx.provider] = (acc[tx.provider] || 0) + 1;
        return acc;
      }, {}),
      modelBreakdown: transactions.reduce((acc: Record<string, number>, tx: { model: string }) => {
        acc[tx.model] = (acc[tx.model] || 0) + 1;
        return acc;
      }, {}),
      averageProcessingTime: transactions.length > 0 ? 
        transactions.reduce((sum: number, tx: { latency_ms: number }) => sum + (tx.latency_ms || 0), 0) / transactions.length : 0,
      totalCredits: transactions.reduce((sum: number, tx: { credits_deducted: string }) => sum + parseFloat(tx.credits_deducted?.toString() || '0'), 0),
      timeRange: {
        earliest: transactions[transactions.length - 1]?.created_at || '',
        latest: transactions[0]?.created_at || '',
      }
    };

    const response = {
      results: transactions,
      analytics,
      pagination: {
        total: totalCount,
        limit,
        offset,
        page: Math.floor(offset / limit) + 1,
        totalPages: Math.ceil(totalCount / limit),
      },
      searchCriteria,
      metadata: {
        requested_by: user.email,
        organization_id: orgFilter || 'all',
        request_timestamp: new Date().toISOString(),
        source: 'blockchain_database_search',
        query_execution_time: Date.now(), // Would calculate actual execution time
      }
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'private, max-age=60', // Cache search results for 1 minute
      },
    });
  } catch (error) {
    console.error('Transaction search failed:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to search transactions',
        message: error instanceof Error ? error.message : 'Unknown error',
        results: [],
        analytics: null,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Export with authentication wrapper
export const POST = withBlockchainAuth(transactionSearchHandler);
