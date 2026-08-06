/**
 * Compliance Metrics API Route
 * Calculates real compliance metrics from blockchain service database
 * Uses direct database queries for accurate compliance scoring
 */

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { withBlockchainAuth, validateRequestParams, getOrgFilter } from '@/lib/auth-middleware';
import { AuthenticatedUser } from '@/types/auth';

// Database connection for blockchain service
// Fallback to Docker internal DNS if env vars are missing
const connectionString = process.env.BLOCKCHAIN_DATABASE_URL ||
  process.env.DATABASE_URL ||
  "postgresql://ai2me_user:ai2me_staging_password_2024@postgres:5432/ai2me";

const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function complianceMetricsHandler(request: NextRequest, user: AuthenticatedUser) {
  try {

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const params = validateRequestParams(searchParams, [], {
      time_range: '30d',
      group_by: 'day',
    });

    // Convert time range to PostgreSQL interval
    const timeInterval = params.time_range.replace('d', ' days').replace('h', ' hours');

    // Get organization filter
    const orgFilter = getOrgFilter(user);
    const orgCondition = orgFilter ? 'AND org_id = $1' : '';
    const queryParams = orgFilter ? [orgFilter] : [];


    // Real compliance metrics query - Fixed PostgreSQL INTERVAL syntax
    const complianceQuery = `
      SELECT 
        COUNT(*) as total_transactions,
        COUNT(CASE WHEN blockchain_status = 'confirmed' THEN 1 END) as verified_transactions,
        COUNT(CASE WHEN s3_location IS NOT NULL THEN 1 END) as s3_stored,
        COUNT(CASE WHEN acl_transaction_id IS NOT NULL THEN 1 END) as acl_logged,
        COUNT(CASE WHEN blockchain_tx_hash IS NOT NULL THEN 1 END) as blockchain_anchored,
        AVG(latency_ms) as avg_processing_time,
        SUM(credits_deducted) as total_credits_processed,
        COUNT(CASE WHEN blockchain_status = 'failed' THEN 1 END) as failed_transactions,
        COUNT(CASE WHEN blockchain_status = 'pending' THEN 1 END) as pending_transactions
      FROM transaction_logs 
      WHERE created_at >= NOW() - INTERVAL '${timeInterval}' ${orgCondition}
    `;

    const complianceResult = await pool.query(complianceQuery, queryParams);
    const metrics = complianceResult.rows[0];

    // Calculate real compliance score
    const totalTx = parseInt(metrics.total_transactions) || 0;
    const s3Score = totalTx > 0 ? (parseInt(metrics.s3_stored) / totalTx) * 100 : 0;
    const aclScore = totalTx > 0 ? (parseInt(metrics.acl_logged) / totalTx) * 100 : 0;
    const blockchainScore = totalTx > 0 ? (parseInt(metrics.blockchain_anchored) / totalTx) * 100 : 0;

    // Weighted compliance score (S3: 30%, ACL: 40%, Blockchain: 30%)
    const overallComplianceScore = (s3Score * 0.3) + (aclScore * 0.4) + (blockchainScore * 0.3);

    // Storage distribution query
    const distributionQuery = `
      SELECT 
        CASE 
          WHEN s3_location IS NOT NULL AND acl_transaction_id IS NOT NULL AND blockchain_tx_hash IS NOT NULL THEN 'full_compliance'
          WHEN s3_location IS NOT NULL AND acl_transaction_id IS NOT NULL THEN 's3_and_acl'
          WHEN s3_location IS NOT NULL THEN 's3_only'
          ELSE 'none'
        END as storage_tier,
        COUNT(*) as count
      FROM transaction_logs
      WHERE created_at >= NOW() - INTERVAL '${timeInterval}' ${orgCondition}
      GROUP BY storage_tier
    `;

    const distributionResult = await pool.query(distributionQuery, queryParams);
    const distribution = distributionResult.rows.reduce((acc: Record<string, number>, row: { storage_tier: string; count: string }) => {
      acc[row.storage_tier] = parseInt(row.count);
      return acc;
    }, {});

    // Provider breakdown query
    const providerQuery = `
      SELECT 
        provider,
        COUNT(*) as count,
        AVG(latency_ms) as avg_latency,
        SUM(credits_deducted) as total_credits
      FROM transaction_logs
      WHERE created_at >= NOW() - INTERVAL '${timeInterval}' ${orgCondition}
      GROUP BY provider
      ORDER BY count DESC
    `;

    const providerResult = await pool.query(providerQuery, queryParams);
    const providerBreakdown = providerResult.rows;

    // Build comprehensive response with real data
    const response = {
      timeRange: params.time_range,
      totalTransactions: totalTx,
      verifiedTransactions: parseInt(metrics.verified_transactions) || 0,
      pendingTransactions: parseInt(metrics.pending_transactions) || 0,
      failedTransactions: parseInt(metrics.failed_transactions) || 0,
      s3Stored: parseInt(metrics.s3_stored) || 0,
      aclLogged: parseInt(metrics.acl_logged) || 0,
      blockchainAnchored: parseInt(metrics.blockchain_anchored) || 0,
      avgProcessingTime: parseFloat(metrics.avg_processing_time) || 0,
      totalCreditsProcessed: parseFloat(metrics.total_credits_processed) || 0,
      complianceScore: Math.round(overallComplianceScore * 10) / 10,
      componentScores: {
        s3: Math.round(s3Score * 10) / 10,
        azureACL: Math.round(aclScore * 10) / 10,
        polygon: Math.round(blockchainScore * 10) / 10,
      },
      storageDistribution: {
        s3Only: distribution.s3_only || 0,
        s3AndACL: distribution.s3_and_acl || 0,
        fullCompliance: distribution.full_compliance || 0,
        none: distribution.none || 0,
      },
      providerBreakdown,
      successRate: totalTx > 0 ? Math.round(((parseInt(metrics.verified_transactions) || 0) / totalTx) * 100 * 10) / 10 : 0,
      metadata: {
        requested_by: user.email,
        organization_id: orgFilter || 'all',
        request_timestamp: new Date().toISOString(),
        source: 'blockchain_database_direct',
        query_parameters: params,
      }
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'private, max-age=120', // Cache for 2 minutes
      },
    });
  } catch (error) {
    console.error('Compliance metrics request failed:', error);

    // In development, return fallback metrics when database is unavailable
    if (process.env.NODE_ENV === 'development') {
      console.warn('Database unavailable in development, returning fallback metrics');
      return NextResponse.json(
        {
          totalTransactions: 0,
          verifiedTransactions: 0,
          s3Stored: 0,
          aclLogged: 0,
          blockchainAnchored: 0,
          avgProcessingTime: 0,
          totalCreditsProcessed: 0,
          complianceScore: 0,
          successRate: 0,
          metadata: {
            requested_by: user.email,
            organization_id: 'dev-org',
            request_timestamp: new Date().toISOString(),
            source: 'fallback_development_mode',
            error: 'Database unavailable - blockchain service not running',
          }
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch compliance metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
        timeRange: '30d',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// For development, bypass auth temporarily to test blockchain integration
async function devComplianceMetricsHandler(request: NextRequest) {
  if (process.env.NODE_ENV === 'development') {
    const mockUser: AuthenticatedUser = {
      id: 'dev-user',
      email: 'dev@example.com',
      organizationId: 'dev-org',
      role: 'admin',
      permissions: ['blockchain_access', 'admin']
    };
    return complianceMetricsHandler(request, mockUser);
  }
  return withBlockchainAuth(complianceMetricsHandler)(request);
}

// Export with conditional authentication
export const GET = devComplianceMetricsHandler;
