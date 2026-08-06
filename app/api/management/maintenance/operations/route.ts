import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  url.pathname = '/api/blockchain/management/maintenance/operations';

  const response = await fetch(url, {
    method: 'GET',
    headers: request.headers,
    cache: 'no-store',
  });

  const data = await response.text();
  return new NextResponse(data, {
    status: response.status,
    headers: response.headers,
  });
}
