import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from "@/lib/backend-api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔵 Confirm signup API: Received body:', body);

    // Forward request to backend API
    const backendUrl = getBackendUrl();
    console.log('🔵 Sending to backend:', `${backendUrl}/v1/auth/confirm-signup`);
    const response = await fetch(`${backendUrl}/v1/auth/confirm-signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    console.log('🔵 Backend response:', { status: response.status, data });

    if (!response.ok) {
      console.error('❌ Backend returned error:', data);
      return NextResponse.json(
        { detail: data.detail || data.message || 'Signup confirmation failed' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Confirm signup API error:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}
