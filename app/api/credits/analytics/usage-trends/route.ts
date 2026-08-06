import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = searchParams.get('days') || '30'
    
    // Get auth token
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // Build backend URL
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000'
    const queryParams = new URLSearchParams({ days })
    
    // Fetch from backend
    const backendResponse = await fetch(
      `${backendUrl}/v1/credits/analytics/usage-trends?${queryParams}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(30000)
      }
    )
    
    if (!backendResponse.ok) {
      let errorMessage = 'Failed to fetch usage trends'
      try {
        const errorData = await backendResponse.json()
        errorMessage = errorData.detail || errorData.error || errorMessage
      } catch {
        errorMessage = backendResponse.statusText || errorMessage
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: backendResponse.status }
      )
    }
    
    const data = await backendResponse.json()
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'private, max-age=300',
        'Content-Type': 'application/json'
      }
    })
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch usage trends' },
      { status: 500 }
    )
  }
}
