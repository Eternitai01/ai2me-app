/**
 * Blockchain Health API Route
 * Proxies requests to the blockchain service health endpoint
 * Uses localhost:8003 for development, internal Docker network for production
 */

import { NextResponse } from 'next/server';
import { InternalBlockchainClient } from '@/lib/internal-blockchain-client';

async function healthHandler() {
  try {
    // Create instance at request time to avoid build-time issues
    const blockchainClient = new InternalBlockchainClient();
    const healthData = await blockchainClient.getHealth();
    return NextResponse.json(healthData, {
      status: 200,
      headers: {
        'Cache-Control': 'private, max-age=30', // Cache for 30 seconds
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        service: 'AI2me Blockchain Service',
        status: 'offline',
        uptime_seconds: 0,
        checks: {
          database: {
            healthy: false,
            message: 'Service unavailable',
            response_time_ms: 0,
          },
          blockchain: {
            healthy: false,
            message: 'Service unavailable', 
            response_time_ms: 0,
          },
          redis: {
            healthy: false,
            message: 'Service unavailable',
            response_time_ms: 0,
          },
        },
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { 
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  }
}

// Health endpoint should be public for monitoring - no auth required
export const GET = healthHandler;
