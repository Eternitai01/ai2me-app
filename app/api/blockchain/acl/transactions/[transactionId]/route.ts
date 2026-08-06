import { NextRequest, NextResponse } from 'next/server';
import { withBlockchainAuth } from '@/lib/auth-middleware';
import { AuthenticatedUser } from '@/types/auth';
import { getBlockchainServiceUrl } from '@/lib/blockchain-service-url';

async function getACLTransactionHandler(
  request: NextRequest,
  user: AuthenticatedUser,
  context: { params: Promise<{ transactionId: string }> }
) {
  try {
    const { transactionId } = await context.params;
    

    // Call the blockchain service ACL transaction endpoint
    const blockchainServiceUrl = getBlockchainServiceUrl();
    const aclUrl = `${blockchainServiceUrl}/v1/compliance/acl/transactions/${transactionId}`;

    const response = await fetch(aclUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      
      return NextResponse.json(
        {
          success: false,
          error: errorText || 'ACL transaction fetch failed',
          message: `Blockchain service error: ${response.status}`,
        },
        { status: response.status }
      );
    }

    const aclResult = await response.json();

    return NextResponse.json(aclResult, { status: 200 });

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch ACL transaction',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const GET = withBlockchainAuth(getACLTransactionHandler);
