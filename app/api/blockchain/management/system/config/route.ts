import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_CONFIG = {
  maintenanceMode: false,
  processingEnabled: true,
  alertsEnabled: true,
  maxConcurrentTransactions: 10,
  timeoutSettings: {
    s3Upload: 30000,
    aclLogging: 10000,
    blockchainSubmission: 60000,
  },
  thresholds: {
    queueWarning: 50,
    queueCritical: 100,
    responseTimeWarning: 5000,
    responseTimeCritical: 10000,
  },
};

let currentConfig = { ...DEFAULT_CONFIG };

export async function GET() {
  return NextResponse.json(currentConfig, {
    status: 200,
    headers: { 'Cache-Control': 'no-cache' },
  });
}

export async function PUT(request: NextRequest) {
  try {
    const updates = await request.json();
    currentConfig = {
      ...currentConfig,
      ...updates,
      timeoutSettings: {
        ...currentConfig.timeoutSettings,
        ...(updates?.timeoutSettings || {}),
      },
      thresholds: {
        ...currentConfig.thresholds,
        ...(updates?.thresholds || {}),
      },
    };

    return NextResponse.json(currentConfig, {
      status: 200,
      headers: { 'Cache-Control': 'no-cache' },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to update system config',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
