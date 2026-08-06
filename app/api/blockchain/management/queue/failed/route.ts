import { NextResponse } from 'next/server';

export async function DELETE() {
  return NextResponse.json(
    {
      success: true,
      message: 'Cleared failed transactions (mock response)',
      queueLength: 0,
      processedCount: 0,
    },
    { status: 200 }
  );
}
