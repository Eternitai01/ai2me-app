import { NextRequest, NextResponse } from 'next/server';
import { withBlockchainAuth } from '@/lib/auth-middleware';
import { getBlockchainServiceUrl, logBlockchainServiceUrl } from '@/lib/blockchain-service-url';

async function syncTransactionsHandler(request: NextRequest) {
  try {
    console.log(`request is coming from ip: ${request.headers.get('x-forwarded-for')}`)
    // Call the blockchain service sync endpoint
    const blockchainServiceUrl = getBlockchainServiceUrl();
    logBlockchainServiceUrl();
    const response = await fetch(`${blockchainServiceUrl}/v1/sync/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `Blockchain service sync failed: ${response.statusText}`);
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      message: "Blockchain sync completed successfully",
      data: result,
    }, { status: 200 });

  } catch (error) {
    console.error('Failed to sync blockchain transactions:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to sync blockchain transactions',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const POST = withBlockchainAuth(syncTransactionsHandler);
