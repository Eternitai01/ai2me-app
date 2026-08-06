/**
 * Batch Details API Route
 * Gets specific blockchain batch details from real blockchain service
 * Includes transaction list and batch verification data
 */

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { withBlockchainAuth, getOrgFilter } from '@/lib/auth-middleware';

// Database connection for blockchain service
const pool = new Pool({
  connectionString: process.env.BLOCKCHAIN_DATABASE_URL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function batchDetailsHandler(
  request: NextRequest,
  user: { email: string; organizationId: string; id: string; permissions: string[]; role: string },
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const batchId = resolvedParams.id;

    if (!batchId) {
      return NextResponse.json(
        { error: 'Batch ID is required' },
        { status: 400 }
      );
    }


    // Get organization filter
    const orgFilter = getOrgFilter(user);

    // Real batch details query
    const batchQuery = `
      SELECT 
        batch_id,
        transaction_count,
        merkle_root,
        blockchain_tx_hash,
        blockchain_network,
        contract_address,
        status,
        s3_location,
        created_at,
        submitted_at,
        confirmed_at,
        created_by
      FROM blockchain_batches
      WHERE batch_id = $1
    `;

    const batchResult = await pool.query(batchQuery, [batchId]);
    
    if (batchResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Batch not found' },
        { status: 404 }
      );
    }

    const batch = batchResult.rows[0];

    // Get transactions in this batch
    const transactionsQuery = `
      SELECT 
        transaction_id,
        org_id,
        provider,
        model,
        tokens_used,
        credits_deducted,
        blockchain_status,
        s3_location,
        acl_transaction_id,
        batch_transaction_index,
        created_at,
        latency_ms
      FROM transaction_logs
      WHERE blockchain_batch_id = $1
      ${orgFilter ? 'AND org_id = $2' : ''}
      ORDER BY batch_transaction_index ASC, created_at ASC
    `;

    const transactionsParams = orgFilter ? [batchId, orgFilter] : [batchId];
    const transactionsResult = await pool.query(transactionsQuery, transactionsParams);
    const batchTransactions = transactionsResult.rows;

    // Calculate batch analytics
    const analytics = {
      transactionCount: batchTransactions.length,
      statusBreakdown: batchTransactions.reduce((acc: Record<string, number>, tx: { blockchain_status: string }) => {
        acc[tx.blockchain_status] = (acc[tx.blockchain_status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      providerBreakdown: batchTransactions.reduce((acc: Record<string, number>, tx: { provider: string }) => {
        acc[tx.provider] = (acc[tx.provider] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      totalCredits: batchTransactions.reduce((sum: number, tx: { credits_deducted: string }) => 
        sum + parseFloat(tx.credits_deducted?.toString() || '0'), 0),
      averageLatency: batchTransactions.length > 0 ?
        batchTransactions.reduce((sum: number, tx: { latency_ms: number }) => sum + (tx.latency_ms || 0), 0) / batchTransactions.length : 0,
      storageStatus: {
        s3Stored: batchTransactions.filter(tx => tx.s3_location).length,
        aclLogged: batchTransactions.filter(tx => tx.acl_transaction_id).length,
        fullCompliance: batchTransactions.filter(tx => tx.s3_location && tx.acl_transaction_id).length,
      },
      processingTime: batch.submitted_at && batch.created_at ?
        (new Date(batch.submitted_at).getTime() - new Date(batch.created_at).getTime()) / 1000 : null,
      confirmationTime: batch.confirmed_at && batch.submitted_at ?
        (new Date(batch.confirmed_at).getTime() - new Date(batch.submitted_at).getTime()) / 1000 : null,
    };

    // Build comprehensive response
    const response = {
      batch: {
        batchId: batch.batch_id,
        transactionCount: batch.transaction_count,
        merkleRoot: batch.merkle_root,
        blockchainTxHash: batch.blockchain_tx_hash,
        blockchainNetwork: batch.blockchain_network,
        contractAddress: batch.contract_address,
        status: batch.status,
        s3Location: batch.s3_location,
        createdAt: batch.created_at,
        submittedAt: batch.submitted_at,
        confirmedAt: batch.confirmed_at,
        createdBy: batch.created_by,
        // Add blockchain explorer URL
        explorerUrl: batch.blockchain_tx_hash ? 
          `https://amoy.polygonscan.com/tx/${batch.blockchain_tx_hash}` : null,
      },
      transactions: batchTransactions,
      analytics,
      metadata: {
        requested_by: user.email,
        organization_id: orgFilter || 'all',
        request_timestamp: new Date().toISOString(),
        source: 'blockchain_database_batch_details',
        transactions_filtered_by_org: !!orgFilter,
      }
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'private, max-age=300', // Cache for 5 minutes (batch data is relatively stable)
      },
    });
  } catch (error) {
    const resolvedParams = await params;
    const batchId = resolvedParams.id;
    
    console.error(`Batch details request failed for ${batchId}:`, error);
    
    // Check if it's a 404 from blockchain service
    if (error instanceof Error && error.message.includes('404')) {
      return NextResponse.json(
        { error: 'Batch not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      {
        error: 'Failed to fetch batch details',
        message: error instanceof Error ? error.message : 'Unknown error',
        batch_id: batchId,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Export with authentication wrapper
export const GET = withBlockchainAuth(batchDetailsHandler);
