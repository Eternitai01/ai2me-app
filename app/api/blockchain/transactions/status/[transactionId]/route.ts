import { NextRequest, NextResponse } from 'next/server';
import { InternalBlockchainClient } from '@/lib/internal-blockchain-client';
import { withBlockchainAuth } from '@/lib/auth-middleware';
import { AuthenticatedUser } from '@/types/auth';

async function getTransactionStatusHandler(
  request: NextRequest, 
  user: AuthenticatedUser,
  { params }: { params: Promise<{ transactionId: string }> }
) {
  try {
    const resolvedParams = await params;
    const blockchainClient = new InternalBlockchainClient();
    const response = await blockchainClient.getTransactionStatus(resolvedParams.transactionId);

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Failed to get transaction status:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get transaction status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const GET = withBlockchainAuth(getTransactionStatusHandler);
