import { NextRequest, NextResponse } from 'next/server'


interface BalanceHistoryPoint {
  date: string
  balance: number
  transaction_type: string
  amount: number
  description: string
  credits_used?: number
  credits_added?: number
}

interface BalanceHistoryResponse {
  organization_id: string
  current_balance: number
  period_days: number
  balance_history: BalanceHistoryPoint[]
  balance_trend: {
    direction: 'increasing' | 'decreasing' | 'stable'
    change: number
  }
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
    const days = Math.min(parseInt(searchParams.get('days') || '7'), 30)
    
    // 2. Validate parameters
    if (days < 1 || days > 30) {
      const errorResponse: ErrorResponse = {
        error: 'Days parameter must be between 1 and 30',
        code: 'INVALID_DAYS_PARAMETER',
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
      days: days.toString()
    })
    
    // 5. Check Redis cache first (if available)
    // const cachedData: BalanceHistoryResponse | null = null
    
    // 6. Fetch from backend
    const backendResponse = await fetch(
      `${backendUrl}/v1/credits/analytics/balance-history?${queryParams}`,
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
      let errorMessage = 'Failed to fetch balance history'
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
      current_balance?: number
      period_days?: number
      balance_history?: Array<{
        date: string
        balance: number
        transaction_type: string
        amount: number
        description: string
        credits_used?: number
        credits_added?: number
      }>
      balance_trend?: {
        direction: string
        change: number
      }
      generated_at?: string
    }
    
    // 8. Transform data for frontend consumption (following best standards)
    const transformedData: BalanceHistoryResponse = {
      organization_id: data.organization_id || '',
      current_balance: Math.round((data.current_balance || 0) * 100) / 100,
      period_days: data.period_days || days,
      balance_history: (data.balance_history || []).map((point) => ({
        date: new Date(point.date).toISOString(),
        balance: Math.round((point.balance || 0) * 100) / 100,
        transaction_type: point.transaction_type || '',
        amount: Math.round((point.amount || 0) * 100) / 100,
        description: point.description || '',
        credits_used: point.credits_used ? Math.round(point.credits_used * 100) / 100 : undefined,
        credits_added: point.credits_added ? Math.round(point.credits_added * 100) / 100 : undefined
      })),
      balance_trend: {
        direction: (data.balance_trend?.direction as 'increasing' | 'decreasing' | 'stable') || 'stable',
        change: Math.round((data.balance_trend?.change || 0) * 100) / 100
      },
      generated_at: data.generated_at || timestamp
    }
    
    // 9. Cache the result in Redis (if available)
    try {
      // await redis.setex(cacheKey, 180, JSON.stringify(transformedData)) // 3 minutes cache
    } catch (redisError) {
      console.warn('Failed to cache data in Redis:', redisError)
    }
    
    // 10. Return with appropriate headers
    return NextResponse.json(transformedData, {
      headers: {
        'Cache-Control': 'public, max-age=180, stale-while-revalidate=360',
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
