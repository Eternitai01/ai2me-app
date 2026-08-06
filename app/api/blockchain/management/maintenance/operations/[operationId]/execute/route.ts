import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  _request: NextRequest,
  context: { params: { operationId: string } }
) {
  const { operationId } = context.params;
  return NextResponse.json(
    {
      id: operationId,
      type: 'restart_service',
      description: 'Maintenance operation started',
      estimatedDuration: 5,
      requiresDowntime: false,
      status: 'running',
      progress: 10,
      startedAt: new Date().toISOString(),
    },
    { status: 200 }
  );
}
