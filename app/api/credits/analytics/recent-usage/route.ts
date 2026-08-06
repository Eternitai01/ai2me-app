import { NextRequest, NextResponse } from 'next/server'


interface CreditTransaction {
  transaction_id: string
  credits_used: number
  balance_after: number
  description: string
  api_request_id?: string
  created_at: string
  provider_name: string
  model_name: string
  metadata?: Record<string, unknown>
}

interface RecentUsageResponse {
  organization_id: string
  transactions: CreditTransaction[]
  total_count: number
  returned_count: number
  generated_at: string
}

interface ErrorResponse {
  error: string
  code?: string
  details?: Record<string, unknown>
  timestamp: string
  request_id?: string
}

export async function GET(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7)
  const timestamp = new Date().toISOString()
  
  try {
    // 1. Extract query parameters
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0)
    
    // 2. Validate parameters
    if (limit < 1 || limit > 100) {
      const errorResponse: ErrorResponse = {
        error: 'Limit must be between 1 and 100',
        code: 'INVALID_LIMIT_PARAMETER',
        timestamp,
        request_id: requestId
      }
      return NextResponse.json(errorResponse, { status: 400 })
    }
    
    if (offset < 0) {
      const errorResponse: ErrorResponse = {
        error: 'Offset must be non-negative',
        code: 'INVALID_OFFSET_PARAMETER',
        timestamp,
        request_id: requestId
      }
      return NextResponse.json(errorResponse, { status: 400 })
    }
    
    // 3. Get auth token (same as other credit APIs)
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      const errorResponse: ErrorResponse = {
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED',
        timestamp,
        request_id: requestId
      }
      return NextResponse.json(errorResponse, { status: 401 })
    }
    
    // 4. Build backend URL
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000'
    const queryParams = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    })
    
    // 5. Check Redis cache first (if available)
    // const cachedData: RecentUsageResponse | null = null
    
    // 6. Fetch from backend
    const backendResponse = await fetch(
      `${backendUrl}/v1/credits/analytics/recent-usage?${queryParams}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        // Add timeout
        signal: AbortSignal.timeout(30000) // 30 seconds
      }
    )
    
    // 7. Handle backend response
    if (!backendResponse.ok) {
      let errorMessage = 'Failed to fetch recent usage'
      try {
      const errorData = await backendResponse.json() as { detail?: string; error?: string }
      errorMessage = errorData.detail || errorData.error || errorMessage
      } catch {
        // If response is not JSON, use status text
        errorMessage = backendResponse.statusText || errorMessage
      }
      
      const errorResponse: ErrorResponse = {
        error: errorMessage,
        code: `BACKEND_ERROR_${backendResponse.status}`,
        details: {
          status: backendResponse.status,
          statusText: backendResponse.statusText
        },
        timestamp,
        request_id: requestId
      }
      return NextResponse.json(errorResponse, { status: backendResponse.status })
    }
    
    const data = await backendResponse.json() as {
      organization_id?: string
      transactions?: Array<{
        transaction_id: string
        credits_used: number
        balance_after: number
        description: string
        api_request_id?: string
        created_at: string
        provider_name: string
        model_name: string
        metadata?: Record<string, unknown>
      }>
      total_count?: number
      returned_count?: number
      generated_at?: string
    }
    
    // 8. Transform data for frontend consumption (following best standards)
    const transformedData: RecentUsageResponse = {
      organization_id: data.organization_id || '',
      transactions: (data.transactions || []).map((transaction) => ({
        transaction_id: transaction.transaction_id || '',
        credits_used: Math.round((transaction.credits_used || 0) * 100) / 100,
        balance_after: Math.round((transaction.balance_after || 0) * 100) / 100,
        description: transaction.description || '',
        api_request_id: transaction.api_request_id || undefined,
        created_at: new Date(transaction.created_at).toISOString(),
        provider_name: transaction.provider_name || 'Unknown',
        model_name: transaction.model_name || 'Unknown',
        metadata: transaction.metadata || undefined
      })),
      total_count: data.total_count || 0,
      returned_count: data.returned_count || 0,
      generated_at: data.generated_at || timestamp
    }
    
    // 9. Cache the result in Redis (if available)
    
    // 10. Return with appropriate headers
    return NextResponse.json(transformedData, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=120',
        'Content-Type': 'application/json',
        'X-Cache': 'MISS',
        'X-Request-ID': requestId
      }
    })
    
  } catch (error) {
    const errorResponse: ErrorResponse = {
      error: 'Internal server error',
      code: 'INTERNAL_SERVER_ERROR',
      details: {
        message: error instanceof Error ? error.message : 'Unknown error',
        type: error instanceof Error ? error.constructor.name : 'Unknown'
      },
      timestamp,
      request_id: requestId
    }
    
    return NextResponse.json(errorResponse, { status: 500 })
  }
}
