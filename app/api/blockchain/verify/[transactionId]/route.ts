import { NextRequest, NextResponse } from 'next/server';
import { withBlockchainAuth } from '@/lib/auth-middleware';
import { AuthenticatedUser } from '@/types/auth';
import { getBlockchainServiceUrl } from '@/lib/blockchain-service-url';

async function verifyTransactionHandler(
  request: NextRequest,
  user: AuthenticatedUser,
  context: { params: Promise<{ transactionId: string }> }
) {
  try {
    const { transactionId } = await context.params;
    

    // Call the blockchain service verification endpoint
    const blockchainServiceUrl = getBlockchainServiceUrl();
    const verifyUrl = `${blockchainServiceUrl}/v1/compliance/verify/private/${transactionId}`;

    const response = await fetch(verifyUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Blockchain service verification failed: ${response.status} - ${errorText}`);
      
      return NextResponse.json(
        {
          success: false,
          error: 'Verification failed',
          message: `Blockchain service error: ${response.status}`,
        },
        { status: response.status }
      );
    }

    const verificationResult = await response.json();

    return NextResponse.json(verificationResult, { status: 200 });

  } catch (error) {
    console.error('Failed to verify transaction:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to verify transaction',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const GET = withBlockchainAuth(verifyTransactionHandler);
