import { NextRequest, NextResponse } from 'next/server';
import { withBlockchainAuth } from '@/lib/auth-middleware';
import { AuthenticatedUser } from '@/types/auth';
import { getBlockchainServiceUrl } from '@/lib/blockchain-service-url';

async function decryptS3TransactionHandler(
  request: NextRequest,
  user: AuthenticatedUser,
  context: { params: Promise<{ transactionId: string }> }
) {
  try {
    const { transactionId } = await context.params;
    

    // Call the blockchain service S3 decrypt endpoint
    const blockchainServiceUrl = getBlockchainServiceUrl();
    const decryptUrl = `${blockchainServiceUrl}/v1/compliance/s3/decrypt/${transactionId}`;

    const response = await fetch(decryptUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Blockchain service S3 decrypt failed: ${response.status} - ${errorText}`);
      
      return NextResponse.json(
        {
          success: false,
          error: 'S3 decrypt failed',
          message: `Blockchain service error: ${response.status}`,
        },
        { status: response.status }
      );
    }

    const decryptResult = await response.json();

    return NextResponse.json(decryptResult, { status: 200 });

  } catch (error) {
    console.error('Failed to decrypt S3 transaction:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to decrypt S3 transaction',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const GET = withBlockchainAuth(decryptS3TransactionHandler);
