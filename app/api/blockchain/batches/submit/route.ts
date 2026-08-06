/**
 * Batch Submit API Route
 * Triggers real batch processing through blockchain service
 * Admin-only endpoint for manual batch submission
 */

import { NextRequest, NextResponse } from 'next/server';
import { InternalBlockchainClient } from '@/lib/internal-blockchain-client';
import { withBlockchainAuth } from '@/lib/auth-middleware';
import { AuthenticatedUser } from '@/types/auth';

async function batchSubmitHandler(request: NextRequest, user: AuthenticatedUser) {
  try {
    
    // Check admin permissions
    if (user.role !== 'admin' && !user.permissions.includes('admin')) {
      return NextResponse.json(
        { error: 'Insufficient permissions - admin access required' },
        { status: 403 }
      );
    }

    // Parse batch submission data from request body
    const batchData = await request.json();

    // Create blockchain client instance
    const blockchainClient = new InternalBlockchainClient();

    // Call real blockchain service batch submission
    const submissionResult = await blockchainClient.submitBatch(batchData);

    // Add audit metadata
    const response = {
      ...submissionResult,
      metadata: {
        submitted_by: user.email,
        submission_timestamp: new Date().toISOString(),
        source: 'blockchain_service_batch_submit',
        admin_action: true,
      }
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache', // Don't cache batch submissions
      },
    });
  } catch (error) {
    console.error('Batch submission failed:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to submit batch',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Export with authentication wrapper (admin-only)
export const POST = withBlockchainAuth(batchSubmitHandler);
