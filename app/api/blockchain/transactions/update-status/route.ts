/**
 * API Route: Update Transaction Statuses
 * Checks Polygon blockchain for transaction confirmations and updates database
 */

import { NextRequest, NextResponse } from 'next/server';
import { getBlockchainServiceUrl } from '@/lib/blockchain-service-url';

export async function POST(request: NextRequest) {
  try {
    console.log(`request is coming from ip: ${request.headers.get('x-forwarded-for')}`)
    // Call the blockchain service to update transaction statuses
    const blockchainServiceUrl = getBlockchainServiceUrl();
    const blockchainResponse = await fetch(`${blockchainServiceUrl}/v1/batches/update-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!blockchainResponse.ok) {
      const errorText = await blockchainResponse.text();
      console.error('❌ Blockchain service error:', errorText);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to update transaction statuses',
          details: errorText
        },
        { status: 500 }
      );
    }

    const result = await blockchainResponse.json();

    return NextResponse.json({
      success: true,
      message: 'Transaction statuses updated successfully',
      data: result
    });

  } catch (error) {
    console.error('❌ Error updating transaction statuses:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
