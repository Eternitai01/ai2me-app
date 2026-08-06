import { NextRequest, NextResponse } from 'next/server';
import { withBlockchainAuth } from '@/lib/auth-middleware';
import { AuthenticatedUser } from '@/types/auth';
import { getBlockchainServiceUrl } from '@/lib/blockchain-service-url';

async function getPolygonTransactionHandler(
  request: NextRequest,
  user: AuthenticatedUser,
  context: { params: Promise<{ transactionId: string }> }
) {
  try {
    const { transactionId } = await context.params;
    

    // Call the blockchain service Polygon transaction endpoint
    const blockchainServiceUrl = getBlockchainServiceUrl();
    const polygonUrl = `${blockchainServiceUrl}/v1/compliance/polygon/transactions/${transactionId}`;

    const response = await fetch(polygonUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Blockchain service Polygon transaction failed: ${response.status} - ${errorText}`);
      
      return NextResponse.json(
        {
          success: false,
          error: 'Polygon transaction fetch failed',
          message: `Blockchain service error: ${response.status}`,
        },
        { status: response.status }
      );
    }

    const polygonResult = await response.json();

    return NextResponse.json(polygonResult, { status: 200 });

  } catch (error) {
    console.error('Failed to fetch Polygon transaction:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch Polygon transaction',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const GET = withBlockchainAuth(getPolygonTransactionHandler);
