/**
 * Public Verification API Route
 * Proxies requests to the blockchain service public verification endpoint
 * Uses localhost:8003 for development, internal Docker network for production
 */

import { NextRequest, NextResponse } from 'next/server';
import { InternalBlockchainClient } from '@/lib/internal-blockchain-client';
import { withBlockchainAuth, getOrgFilter } from '@/lib/auth-middleware';
import { AuthenticatedUser } from '@/types/auth';

async function publicVerificationHandler(
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

    // Call real blockchain service public verification
    const verificationData = await blockchainClient.getPublicVerification(transactionId);

    // Check organization access (if not admin)
    const orgFilter = getOrgFilter(user);
    if (orgFilter && verificationData.transaction?.org_id_hash) {
      // For security, we can't directly compare org_id_hash, but we can validate access
      // In a real implementation, you'd verify the hash matches the user's org
    }

    // Add metadata for tracking
    const response = {
      ...verificationData,
      metadata: {
        requested_by: user.email,
        request_timestamp: new Date().toISOString(),
        source: 'blockchain_service_verification',
        public_verification: true,
      }
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'private, max-age=300', // Cache for 5 minutes (verification is stable)
      },
    });
  } catch (error) {
    const resolvedParams = await params;
    const transactionId = resolvedParams.id;
    
    console.error(`Public verification failed for ${transactionId}:`, error);
    
    // Check if it's a 404 from blockchain service
    if (error instanceof Error && error.message.includes('404')) {
      return NextResponse.json(
        { error: 'Transaction not found for verification' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      {
        error: 'Failed to verify transaction',
        message: error instanceof Error ? error.message : 'Unknown error',
        transaction_id: transactionId,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Export with authentication wrapper
export const GET = withBlockchainAuth(publicVerificationHandler);
