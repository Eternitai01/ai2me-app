/**
 * Advanced Compliance Analytics API Route
 * Provides comprehensive compliance analytics with time-series data
 * Uses real database queries for accurate compliance insights
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

async function complianceAnalyticsHandler(request: NextRequest, user: AuthenticatedUser) {
  try {
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const params = validateRequestParams(searchParams, [], {
      time_range: '30d',
      group_by: 'day',
      include_trends: 'true',
      include_costs: 'true',
    });

    // Convert time range to PostgreSQL interval
    const timeInterval = params.time_range.replace('d', ' days').replace('h', ' hours');
    
    // Get organization filter
    const orgFilter = getOrgFilter(user);
    const orgCondition = orgFilter ? 'AND org_id = $2' : '';
    const baseParams = orgFilter ? [timeInterval, orgFilter] : [timeInterval];


    // 1. Overall compliance metrics
    const overallQuery = `
      SELECT 
        COUNT(*) as total_transactions,
        COUNT(CASE WHEN blockchain_status = 'confirmed' THEN 1 END) as verified_transactions,
        COUNT(CASE WHEN blockchain_status = 'failed' THEN 1 END) as failed_transactions,
        COUNT(CASE WHEN blockchain_status = 'pending' THEN 1 END) as pending_transactions,
        COUNT(CASE WHEN s3_location IS NOT NULL THEN 1 END) as s3_stored,
        COUNT(CASE WHEN acl_transaction_id IS NOT NULL THEN 1 END) as acl_logged,
        COUNT(CASE WHEN blockchain_tx_hash IS NOT NULL THEN 1 END) as blockchain_anchored,
        AVG(latency_ms) as avg_processing_time,
        SUM(credits_deducted) as total_credits_processed,
        MIN(created_at) as earliest_transaction,
        MAX(created_at) as latest_transaction
      FROM transaction_logs 
      WHERE created_at >= NOW() - ($1::interval) ${orgCondition}
    `;

    const overallResult = await pool.query(overallQuery, baseParams);
    const overall = overallResult.rows[0];

    // 2. Time-series compliance score history
    const groupByClause = params.group_by === 'hour' ? 'DATE_TRUNC(\'hour\', created_at)' :
                         params.group_by === 'week' ? 'DATE_TRUNC(\'week\', created_at)' :
                         params.group_by === 'month' ? 'DATE_TRUNC(\'month\', created_at)' :
                         'DATE(created_at)';

    const timeSeriesQuery = `
      SELECT 
        ${groupByClause} as time_period,
        COUNT(*) as total,
        COUNT(CASE WHEN s3_location IS NOT NULL THEN 1 END) as s3_count,
        COUNT(CASE WHEN acl_transaction_id IS NOT NULL THEN 1 END) as acl_count,
        COUNT(CASE WHEN blockchain_tx_hash IS NOT NULL THEN 1 END) as blockchain_count,
        COUNT(CASE WHEN blockchain_status = 'confirmed' THEN 1 END) as verified_count,
        COUNT(CASE WHEN blockchain_status = 'failed' THEN 1 END) as failed_count,
        AVG(latency_ms) as avg_latency,
        SUM(credits_deducted) as period_credits
      FROM transaction_logs
      WHERE created_at >= NOW() - ($1::interval) ${orgCondition}
      GROUP BY ${groupByClause}
      ORDER BY time_period DESC
      LIMIT 50
    `;

    const timeSeriesResult = await pool.query(timeSeriesQuery, baseParams);
    const timeSeries = timeSeriesResult.rows;

    // 3. Provider performance analysis
    const providerQuery = `
      SELECT 
        provider,
        model,
        COUNT(*) as transaction_count,
        COUNT(CASE WHEN blockchain_status = 'confirmed' THEN 1 END) as success_count,
        COUNT(CASE WHEN blockchain_status = 'failed' THEN 1 END) as failure_count,
        AVG(latency_ms) as avg_latency,
        SUM(credits_deducted) as total_credits,
        AVG(tokens_used) as avg_tokens,
        MIN(created_at) as first_transaction,
        MAX(created_at) as last_transaction
      FROM transaction_logs
      WHERE created_at >= NOW() - ($1::interval) ${orgCondition}
      GROUP BY provider, model
      ORDER BY transaction_count DESC
    `;

    const providerResult = await pool.query(providerQuery, baseParams);
    const providerAnalysis = providerResult.rows;

    // 4. Storage distribution analysis
    const storageQuery = `
      SELECT 
        CASE 
          WHEN s3_location IS NOT NULL AND acl_transaction_id IS NOT NULL AND blockchain_tx_hash IS NOT NULL THEN 'full_compliance'
          WHEN s3_location IS NOT NULL AND acl_transaction_id IS NOT NULL THEN 's3_and_acl'
          WHEN s3_location IS NOT NULL THEN 's3_only'
          ELSE 'none'
        END as storage_tier,
        COUNT(*) as count,
        AVG(latency_ms) as avg_latency,
        SUM(credits_deducted) as total_credits
      FROM transaction_logs
      WHERE created_at >= NOW() - ($1::interval) ${orgCondition}
      GROUP BY storage_tier
      ORDER BY count DESC
    `;

    const storageResult = await pool.query(storageQuery, baseParams);
    const storageDistribution = storageResult.rows;

    // 5. Calculate real compliance scores
    const totalTx = parseInt(overall.total_transactions) || 0;
    const s3Score = totalTx > 0 ? (parseInt(overall.s3_stored) / totalTx) * 100 : 0;
    const aclScore = totalTx > 0 ? (parseInt(overall.acl_logged) / totalTx) * 100 : 0;
    const blockchainScore = totalTx > 0 ? (parseInt(overall.blockchain_anchored) / totalTx) * 100 : 0;
    const overallComplianceScore = (s3Score * 0.3) + (aclScore * 0.4) + (blockchainScore * 0.3);

    // 6. Performance metrics
    const performanceMetrics = {
      averageProcessingTime: parseFloat(overall.avg_processing_time) || 0,
      successRate: totalTx > 0 ? (parseInt(overall.verified_transactions) / totalTx) * 100 : 0,
      failureRate: totalTx > 0 ? (parseInt(overall.failed_transactions) / totalTx) * 100 : 0,
      pendingRate: totalTx > 0 ? (parseInt(overall.pending_transactions) / totalTx) * 100 : 0,
      throughput: timeSeries.length > 0 ? 
        timeSeries.reduce((sum: number, period: { total: string }) => sum + parseInt(period.total), 0) / timeSeries.length : 0,
    };

    // 7. Cost analytics (estimated based on usage)
    const s3Cost = parseInt(overall.s3_stored) * 0.001;
    const aclCost = parseInt(overall.acl_logged) * 0.002;
    const polygonCost = parseInt(overall.blockchain_anchored) * 0.005;
    const processingCost = totalTx * 0.0001;
    const verificationCost = parseInt(overall.verified_transactions) * 0.0002;
    const dataTransferCost = totalTx * 0.00005;
    const apiCallsCost = totalTx * 0.00002;
    
    const costAnalytics = {
      totalCost: s3Cost + aclCost + polygonCost + processingCost + verificationCost + dataTransferCost + apiCallsCost,
      breakdown: {
        storage: {
          s3: s3Cost,
          azureACL: aclCost,
          polygon: polygonCost,
        },
        compute: {
          processing: processingCost,
          verification: verificationCost,
        },
        network: {
          dataTransfer: dataTransferCost,
          apiCalls: apiCallsCost,
        }
      },
      trends: timeSeries.map((period: { time_period: string; s3_count: string; acl_count: string; blockchain_count: string; total: string; verified_count?: string }) => ({
        timestamp: period.time_period,
        storage: (parseInt(period.s3_count) * 0.001) + (parseInt(period.acl_count) * 0.002) + (parseInt(period.blockchain_count) * 0.005),
        compute: (parseInt(period.total) * 0.0001) + (parseInt(period.verified_count?.toString() || '0') * 0.0002),
        network: (parseInt(period.total) * 0.00005) + (parseInt(period.total) * 0.00002),
        total: (parseInt(period.s3_count) * 0.001) + (parseInt(period.acl_count) * 0.002) + (parseInt(period.blockchain_count) * 0.005) + (parseInt(period.total) * 0.0003),
      })),
      projections: [] // TODO: Implement cost projections based on trends
    };

    // Build comprehensive response with real data
    const response = {
      timeRange: params.time_range,
      overallScore: Math.round(overallComplianceScore * 10) / 10,
      componentScores: {
        s3: Math.round(s3Score * 10) / 10,
        azureACL: Math.round(aclScore * 10) / 10,
        polygon: Math.round(blockchainScore * 10) / 10,
      },
      metrics: {
        totalTransactions: totalTx,
        verifiedTransactions: parseInt(overall.verified_transactions) || 0,
        failedTransactions: parseInt(overall.failed_transactions) || 0,
        pendingTransactions: parseInt(overall.pending_transactions) || 0,
        s3Stored: parseInt(overall.s3_stored) || 0,
        aclLogged: parseInt(overall.acl_logged) || 0,
        blockchainAnchored: parseInt(overall.blockchain_anchored) || 0,
        totalCreditsProcessed: parseFloat(overall.total_credits_processed) || 0,
      },
      scoreHistory: timeSeries.map((period: { total: string; s3_count: string; acl_count: string; blockchain_count: string, time_period: string, avg_latency: string }) => {
        const periodTotal = parseInt(period.total) || 0;
        const periodS3Score = periodTotal > 0 ? (parseInt(period.s3_count) / periodTotal) * 100 : 0;
        const periodAclScore = periodTotal > 0 ? (parseInt(period.acl_count) / periodTotal) * 100 : 0;
        const periodBlockchainScore = periodTotal > 0 ? (parseInt(period.blockchain_count) / periodTotal) * 100 : 0;
        const periodOverallScore = (periodS3Score * 0.3) + (periodAclScore * 0.4) + (periodBlockchainScore * 0.3);

        return {
          timestamp: period.time_period,
          score: Math.round(periodOverallScore * 10) / 10,
          components: {
            s3: Math.round(periodS3Score * 10) / 10,
            azureACL: Math.round(periodAclScore * 10) / 10,
            polygon: Math.round(periodBlockchainScore * 10) / 10,
          },
          transactionCount: periodTotal,
          avgLatency: parseFloat(period.avg_latency) || 0,
        };
      }),
      storageDistribution: {
        breakdown: storageDistribution.reduce((acc: Record<string, { count: number; percentage: number; avgLatency: number; totalCredits: number }>, tier: { storage_tier: string; count: string; avg_latency: string; total_credits: string }) => {
          acc[tier.storage_tier] = {
            count: parseInt(tier.count),
            percentage: totalTx > 0 ? (parseInt(tier.count) / totalTx) * 100 : 0,
            avgLatency: parseFloat(tier.avg_latency) || 0,
            totalCredits: parseFloat(tier.total_credits) || 0,
          };
          return acc;
        }, {}),
        trends: timeSeries.map((period: { time_period: string; s3_count: string; acl_count: string; blockchain_count: string; total: string }) => ({
          timestamp: period.time_period,
          s3: parseInt(period.s3_count) || 0,
          azureACL: parseInt(period.acl_count) || 0,
          polygon: parseInt(period.blockchain_count) || 0,
          total: parseInt(period.total) || 0,
        }))
      },
      providerAnalysis,
      performanceMetrics,
      costAnalytics,
      metadata: {
        requested_by: user.email,
        organization_id: orgFilter || 'all',
        request_timestamp: new Date().toISOString(),
        source: 'blockchain_database_analytics',
        query_parameters: params,
        data_points: timeSeries.length,
      }
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'private, max-age=180', // Cache for 3 minutes
      },
    });
  } catch (error) {
    console.error('Compliance analytics request failed:', error);
    
    // In development, return fallback analytics when database is unavailable
    if (process.env.NODE_ENV === 'development') {
      console.warn('Database unavailable in development, returning fallback analytics');
      return NextResponse.json({
        overallScore: 85.0,
        storageDistribution: {
          s3: { total: 0, percentage: 0 },
          azureACL: { total: 0, percentage: 0 },
          polygon: { total: 0, percentage: 0 }
        },
        verificationMetrics: {
          totalVerifications: 0,
          successfulVerifications: 0,
          failedVerifications: 0,
          pendingVerifications: 0,
          averageVerificationTime: 0
        },
        performanceMetrics: {
          averageProcessingTime: 0,
          throughput: 0,
          successRate: 0,
          errorRate: 0
        },
        costAnalytics: {
          totalCost: 0,
          breakdown: {
            storage: {
              s3: 0,
              azureACL: 0,
              polygon: 0
            },
            compute: {
              processing: 0,
              verification: 0
            },
            network: {
              dataTransfer: 0,
              apiCalls: 0
            }
          },
          trends: Array.from({ length: 30 }, (_, i) => ({
            timestamp: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString(),
            storage: 0,
            compute: 0,
            network: 0,
            total: 0
          })),
          projections: []
        },
        complianceScore: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          score: 85.0,
          trend: 'stable' as const
        })),
        storageTrends: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          s3Count: 0,
          aclCount: 0,
          polygonCount: 0
        })),
        verificationTrends: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          successful: 0,
          failed: 0,
          pending: 0
        })),
        throughputData: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          transactionsPerSecond: 0
        })),
        responseTimeData: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          averageMs: 0
        })),
        costTrends: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          dailyCost: 0
        })),
        metrics: {
          totalTransactions: 0,
          verifiedTransactions: 0,
          failedTransactions: 0,
          averageProcessingTime: 0,
          totalCost: 0
        },
        metadata: {
          timeRange: '30d',
          generatedAt: new Date().toISOString(),
          source: 'fallback_development_mode',
          error: 'Database unavailable - blockchain service not running'
        }
      }, { status: 200 });
    }
    
    return NextResponse.json(
      {
        error: 'Failed to fetch compliance analytics',
        message: error instanceof Error ? error.message : 'Unknown error',
        timeRange: '30d',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// For development, bypass auth temporarily to test blockchain integration
async function devComplianceAnalyticsHandler(request: NextRequest) {
  if (process.env.NODE_ENV === 'development') {
    const mockUser: AuthenticatedUser = {
      id: 'dev-user',
      email: 'dev@example.com',
      organizationId: 'dev-org',
      role: 'admin',
      permissions: ['blockchain_access', 'admin']
    };
    return complianceAnalyticsHandler(request, mockUser);
  }
  return withBlockchainAuth(complianceAnalyticsHandler)(request);
}

// Export with conditional authentication
export const GET = devComplianceAnalyticsHandler;
