import { NextRequest, NextResponse } from 'next/server';

async function proxy(request: NextRequest) {
  const url = new URL(request.url);
  url.pathname = '/api/blockchain/management/config/batch';

  const response = await fetch(url, {
    method: request.method,
    headers: request.headers,
    body: request.method === 'GET' ? undefined : await request.text(),
    cache: 'no-store',
  });

  const data = await response.text();
  return new NextResponse(data, {
    status: response.status,
    headers: response.headers,
  });
}

export async function GET(request: NextRequest) {
  return proxy(request);
}

export async function PUT(request: NextRequest) {
  return proxy(request);
}
