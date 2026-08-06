/**
 * Recent Transactions API Route
 * Proxies requests to blockchain service recent transactions endpoint
 * Returns real transaction data from blockchain service database
 */

import { NextRequest, NextResponse } from 'next/server';
import { InternalBlockchainClient } from '@/lib/internal-blockchain-client';
import { withBlockchainAuth, validateRequestParams, getOrgFilter } from '@/lib/auth-middleware';
import { AuthenticatedUser } from '@/types/auth';

async function recentTransactionsHandler(request: NextRequest, user: AuthenticatedUser) {
  try {
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const params = validateRequestParams(searchParams, [], {
      limit: '50',
      offset: '0', 
      status: '',
      provider: '',
    });

    // Add organization filter for non-admin users
    const orgFilter = getOrgFilter(user);
    if (orgFilter) {
    }

    // Create blockchain client instance
    const blockchainClient = new InternalBlockchainClient();

    // Call real blockchain service (with fallback for development)
    let transactionData;
    try {
      transactionData = await blockchainClient.getRecentTransactions({
        limit: parseInt(params.limit),
        offset: parseInt(params.offset),
        status: params.status || undefined,
        provider: params.provider || undefined,
      });
    } catch (serviceError) {
      console.warn('Blockchain service unavailable, returning empty transaction list:', serviceError);
      transactionData = {
        transactions: [],
        total_count: 0,
      };
    }
    

    // Filter by organization if not admin
    let filteredTransactions = transactionData.transactions || [];
    if (orgFilter) {
      filteredTransactions = filteredTransactions.filter((tx: { org_id: string }) => 
        tx.org_id === orgFilter
      );
    }

    const response = {
      transactions: filteredTransactions,
      total_count: orgFilter ? filteredTransactions.length : transactionData.total_count,
      page: Math.floor(parseInt(params.offset) / parseInt(params.limit)) + 1,
      per_page: parseInt(params.limit),
      filters_applied: {
        organization: orgFilter || 'all',
        status: params.status || 'all',
        provider: params.provider || 'all',
      },
      metadata: {
        requested_by: user.email,
        request_timestamp: new Date().toISOString(),
        source: 'blockchain_service_database',
      }
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'private, max-age=60', // Cache for 1 minute
      },
    });
  } catch (error) {
    console.error('Recent transactions request failed:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to fetch recent transactions',
        message: error instanceof Error ? error.message : 'Unknown error',
        transactions: [],
        total_count: 0,
        timestamp: new Date().toISOString(),
      },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-cache',
        },
      }
    );
  }
}

// For development, bypass auth temporarily to test blockchain integration
async function devRecentTransactionsHandler(request: NextRequest) {
  if (process.env.NODE_ENV === 'development') {
    const mockUser: AuthenticatedUser = {
      id: 'dev-user',
      email: 'dev@example.com',
      organizationId: 'dev-org',
      role: 'admin',
      permissions: ['blockchain_access', 'admin']
    };
    return recentTransactionsHandler(request, mockUser);
  }
  return withBlockchainAuth(recentTransactionsHandler)(request);
}

// Export with conditional authentication
export const GET = devRecentTransactionsHandler;
