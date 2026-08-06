import { NextRequest, NextResponse } from 'next/server'


interface UsageSummaryResponse {
  organization_id: string
  period_days: number
  start_date: string
  end_date: string
  total_credits_used: number
  total_requests: number
  average_credits_per_request: number
  daily_breakdown: Array<{
    date: string
    credits_used: number
    request_count: number
  }>
  usage_trend: {
    direction: 'increasing' | 'decreasing' | 'stable'
    percentage_change: number
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
    const days = parseInt(searchParams.get('days') || '30')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    
    // 2. Validate parameters
    if (days < 1 || days > 365) {
      const errorResponse: ErrorResponse = {
        error: 'Days parameter must be between 1 and 365',
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
    
    // 4. Build backend URL with query params
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000'
    const queryParams = new URLSearchParams({
      days: days.toString(),
      ...(startDate && { start_date: startDate }),
      ...(endDate && { end_date: endDate })
    })
    
    // 5. Check Redis cache first (if available)
    // const cachedData: UsageSummaryResponse | null = null
    
    // 6. Fetch from backend
    const backendResponse = await fetch(
      `${backendUrl}/v1/credits/analytics/usage-summary?${queryParams}`,
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
      let errorMessage = 'Failed to fetch usage summary'
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
      period_days?: number
      start_date?: string
      end_date?: string
      total_credits_used?: number
      total_requests?: number
      average_credits_per_request?: number
      daily_breakdown?: Array<{
        date: string
        credits_used: number
        request_count: number
      }>
      usage_trend?: {
        direction: string
        percentage_change: number
      }
      generated_at?: string
    }
    
    // 8. Transform data for frontend consumption (following best standards)
    const transformedData: UsageSummaryResponse = {
      organization_id: data.organization_id || '',
      period_days: data.period_days || days,
      start_date: data.start_date || new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
      end_date: data.end_date || new Date().toISOString(),
      total_credits_used: Math.round((data.total_credits_used || 0) * 100) / 100,
      total_requests: data.total_requests || 0,
      average_credits_per_request: Math.round((data.average_credits_per_request || 0) * 100) / 100,
      daily_breakdown: (data.daily_breakdown || []).map((day) => ({
        date: new Date(day.date).toISOString().split('T')[0], // YYYY-MM-DD format
        credits_used: Math.round((day.credits_used || 0) * 100) / 100,
        request_count: day.request_count || 0
      })),
      usage_trend: {
        direction: (data.usage_trend?.direction as 'increasing' | 'decreasing' | 'stable') || 'stable',
        percentage_change: Math.round((data.usage_trend?.percentage_change || 0) * 10) / 10
      },
      generated_at: data.generated_at || timestamp
    }
    
    // 9. Cache the result in Redis (if available)
    try {
      // await redis.setex(cacheKey, 300, JSON.stringify(transformedData)) // 5 minutes cache
    } catch (redisError) {
      console.warn('Failed to cache data in Redis:', redisError)
    }
    
    // 10. Return with appropriate headers
    return NextResponse.json(transformedData, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
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
