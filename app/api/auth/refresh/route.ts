import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/backend-api';

export async function POST(request: NextRequest) {
  try {
    // Get auth-token from cookies
    const authToken = request.cookies.get('auth-token')?.value;
    
    if (!authToken) {
      return NextResponse.json(
        { detail: 'No authentication token found' },
        { status: 401 }
      );
    }

    // Forward request to backend refresh endpoint
    const backendUrl = getBackendUrl();
    const incomingCookieHeader = request.headers.get('cookie');

    const response = await fetch(`${backendUrl}/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': incomingCookieHeader || `auth-token=${authToken}`,
      },
      credentials: 'include',
    });

    const rawBody = await response.text();
    let data: any = {};
    try {
      data = rawBody ? JSON.parse(rawBody) : {};
    } catch {
      data = {};
    }

    if (!response.ok) {
      const detail =
        data?.detail ||
        data?.message ||
        `Backend refresh failed (${response.status})`;

      console.error('Refresh backend error', {
        backendUrl,
        status: response.status,
        statusText: response.statusText,
        detail,
        rawBody: rawBody?.slice(0, 400),
      });

      return NextResponse.json(
        {
          detail,
          backend_status: response.status,
        },
        { status: response.status }
      );
    }

    // Create response with new token in cookie
    const nextResponse = NextResponse.json({
      message: 'Token refreshed successfully',
      expires_in: data.expires_in,
      access_token: data.access_token,
    });

    // Keep cookie settings aligned with the existing client-side auth flow.
    // Multiple parts of the app read auth-token from document.cookie.
    if (data.access_token) {
      nextResponse.cookies.set('auth-token', data.access_token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: data.expires_in || 60 * 60 * 24 * 7, // 7 days default
        path: '/',
      });
    }

    return nextResponse;
  } catch (error) {
    console.error('Token refresh API error:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}
