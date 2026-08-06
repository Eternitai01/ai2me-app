/**
 * Transaction Status API Route
 * Proxies requests to the blockchain service transaction status endpoint
 * Uses localhost:8003 for development, internal Docker network for production
 */

import { NextRequest, NextResponse } from 'next/server';
import { InternalBlockchainClient } from '@/lib/internal-blockchain-client';
import { withBlockchainAuth, getOrgFilter } from '@/lib/auth-middleware';
import { AuthenticatedUser } from '@/types/auth';

async function transactionStatusHandler(
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

    // Create blockchain client instance
    const blockchainClient = new InternalBlockchainClient();

    // Call real blockchain service
    const statusData = await blockchainClient.getTransactionStatus(transactionId);
    
    // Check organization access (if not admin)
    const orgFilter = getOrgFilter(user);
    if (orgFilter && statusData.org_id && statusData.org_id !== orgFilter) {
      return NextResponse.json(
        { error: 'Transaction not found' }, // Don't reveal existence
        { status: 404 }
      );
    }

    // Add metadata for tracking
    const response = {
      ...statusData,
      metadata: {
        requested_by: user.email,
        request_timestamp: new Date().toISOString(),
        source: 'blockchain_service_database',
      }
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'private, max-age=30', // Cache for 30 seconds
      },
    });
  } catch (error) {
    const resolvedParams = await params;
    const transactionId = resolvedParams.id;
    
    console.error(`Transaction status check failed for ${transactionId}:`, error);
    
    // Check if it's a 404 from blockchain service
    if (error instanceof Error && error.message.includes('404')) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      {
        error: 'Failed to fetch transaction status',
        message: error instanceof Error ? error.message : 'Unknown error',
        transaction_id: transactionId,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Export with authentication wrapper
export const GET = withBlockchainAuth(transactionStatusHandler);
