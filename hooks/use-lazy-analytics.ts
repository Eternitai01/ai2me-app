/**
 * Lazy Loading Analytics Hook
 * 
 * Provides lazy loading capabilities for analytics data with:
 * - On-demand data fetching
 * - Intelligent caching
 * - Error handling with retry
 * - Performance optimizations
 */

import { useState, useEffect, useCallback, useRef } from 'react'

// Types
export interface AnalyticsParams {
  days?: number
  limit?: number
  offset?: number
  start_date?: string
  end_date?: string
}

export interface AnalyticsData<T = unknown> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => void
  isStale: boolean
  lastFetched: Date | null
}

export interface UsageSummaryData {
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

export interface RecentUsageData {
  organization_id: string
  transactions: Array<{
    transaction_id: string
    credits_used: number
    balance_after: number
    description: string
    api_request_id?: string
    created_at: string
    metadata?: Record<string, unknown>
  }>
  total_count: number
  returned_count: number
  generated_at: string
}

export interface BalanceHistoryData {
  organization_id: string
  current_balance: number
  period_days: number
  balance_history: Array<{
    date: string
    balance: number
    transaction_type: string
    amount: number
    description: string
    credits_used?: number
    credits_added?: number
  }>
  balance_trend: {
    direction: 'increasing' | 'decreasing' | 'stable'
    change: number
  }
  generated_at: string
}

// Cache configuration
const CACHE_CONFIG = {
  'usage-summary': { ttl: 5 * 60 * 1000 }, // 5 minutes
  'recent-usage': { ttl: 1 * 60 * 1000 },  // 1 minute
  'balance-history': { ttl: 3 * 60 * 1000 }, // 3 minutes
  'model-usage': { ttl: 10 * 60 * 1000 }, // 10 minutes
  'usage-trends': { ttl: 5 * 60 * 1000 } // 5 minutes
}

// Cache storage
const cache = new Map<string, { data: unknown; timestamp: number; ttl: number }>()

// API client
const analyticsAPI = {
  async getUsageSummary(params: AnalyticsParams): Promise<UsageSummaryData> {
    const queryParams = new URLSearchParams()
    if (params.days) queryParams.set('days', params.days.toString())
    if (params.start_date) queryParams.set('start_date', params.start_date)
    if (params.end_date) queryParams.set('end_date', params.end_date)
    
    const response = await fetch(`/api/credits/analytics/usage-summary?${queryParams}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to fetch usage summary: ${response.status} ${response.statusText} - ${errorText}`)
    }
    
    return response.json()
  },

  async getRecentUsage(params: AnalyticsParams): Promise<RecentUsageData> {
    const queryParams = new URLSearchParams()
    if (params.limit) queryParams.set('limit', params.limit.toString())
    if (params.offset) queryParams.set('offset', params.offset.toString())
    
    const response = await fetch(`/api/credits/analytics/recent-usage?${queryParams}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to fetch recent usage: ${response.status} ${response.statusText} - ${errorText}`)
    }
    
    return response.json()
  },

  async getBalanceHistory(params: AnalyticsParams): Promise<BalanceHistoryData> {
    const queryParams = new URLSearchParams()
    if (params.days) queryParams.set('days', params.days.toString())
    
    const response = await fetch(`/api/credits/analytics/balance-history?${queryParams}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to fetch balance history: ${response.status} ${response.statusText} - ${errorText}`)
    }
    
    return response.json()
  },

  async getModelUsage(params: AnalyticsParams): Promise<unknown> {
    const queryParams = new URLSearchParams()
    if (params.days) queryParams.set('days', params.days.toString())
    if (params.start_date) queryParams.set('start_date', params.start_date)
    if (params.end_date) queryParams.set('end_date', params.end_date)
    
    const response = await fetch(`/api/credits/analytics/model-usage?${queryParams}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to fetch model usage: ${response.status} ${response.statusText} - ${errorText}`)
    }
    
    return response.json()
  },

  async getUsageTrends(params: AnalyticsParams): Promise<unknown> {
    const queryParams = new URLSearchParams()
    if (params.days) queryParams.set('days', params.days.toString())
    if (params.start_date) queryParams.set('start_date', params.start_date)
    if (params.end_date) queryParams.set('end_date', params.end_date)
    
    const response = await fetch(`/api/credits/analytics/usage-trends?${queryParams}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to fetch usage trends: ${response.status} ${response.statusText} - ${errorText}`)
    }
    
    return response.json()
  }
}

// Cache utilities
const getCacheKey = (endpoint: string, params: AnalyticsParams): string => {
  return `${endpoint}:${JSON.stringify(params)}`
}

const isCacheValid = (key: string, ttl: number): boolean => {
  const cached = cache.get(key)
  if (!cached) return false
  
  const now = Date.now()
  return (now - cached.timestamp) < ttl
}

const getCachedData = <T>(key: string): T | null => {
  const cached = cache.get(key)
  return cached ? (cached.data as T) : null
}

const setCachedData = <T>(key: string, data: T, ttl: number): void => {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  })
}

// Retry utility
const retry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)))
      }
    }
  }
  
  throw lastError!
}

// Main lazy loading hook
export function useLazyAnalytics<T>(
  endpoint: 'usage-summary' | 'recent-usage' | 'balance-history' | 'model-usage' | 'usage-trends',
  params: AnalyticsParams = {},
  options: {
    enabled?: boolean
    retryCount?: number
    retryDelay?: number
    staleTime?: number
  } = {}
): AnalyticsData<T> {
  const {
    enabled = true,
    retryCount = 3,
    retryDelay = 1000,
    staleTime = 30000 // 30 seconds
  } = options

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastFetched, setLastFetched] = useState<Date | null>(null)
  const [isStale, setIsStale] = useState(false)
  
  const abortControllerRef = useRef<AbortController | null>(null)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Check if data is stale
  const checkStaleness = useCallback(() => {
    if (!lastFetched) return
    
    const now = Date.now()
    const timeSinceLastFetch = now - lastFetched.getTime()
    setIsStale(timeSinceLastFetch > staleTime)
  }, [lastFetched, staleTime])

  // Fetch data function
  const fetchData = useCallback(async (forceRefresh: boolean = false) => {
    if (!enabled) return

    const cacheKey = getCacheKey(endpoint, params)
    const cacheConfig = CACHE_CONFIG[endpoint]
    
    // Check cache first (unless force refresh)
    if (!forceRefresh && isCacheValid(cacheKey, cacheConfig.ttl)) {
      const cachedData = getCachedData<T>(cacheKey)
      if (cachedData) {
        setData(cachedData)
        setError(null)
        setIsStale(false)
        return
      }
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController()

    setLoading(true)
    setError(null)

    try {
      const apiCall = async () => {
        switch (endpoint) {
          case 'usage-summary':
            return await analyticsAPI.getUsageSummary(params)
          case 'recent-usage':
            return await analyticsAPI.getRecentUsage(params)
          case 'balance-history':
            return await analyticsAPI.getBalanceHistory(params)
          case 'model-usage':
            return await analyticsAPI.getModelUsage(params)
          case 'usage-trends':
            return await analyticsAPI.getUsageTrends(params)
          default:
            throw new Error(`Unknown endpoint: ${endpoint}`)
        }
      }

      const result = await retry(apiCall, retryCount, retryDelay)
      
      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return
      }

      setData(result as T)
      setLastFetched(new Date())
      setIsStale(false)
      
      // Cache the result
      setCachedData(cacheKey, result, cacheConfig.ttl)
      
    } catch (err) {
      if (abortControllerRef.current?.signal.aborted) {
        return
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      // Analytics fetch error - handled by error state
    } finally {
      setLoading(false)
    }
  }, [endpoint, params, enabled, retryCount, retryDelay])

  // Refetch function
  const refetch = useCallback(() => {
    fetchData(true)
  }, [fetchData])

  // Initial fetch on mount and when params change
  useEffect(() => {
    fetchData()
  }, [fetchData]) // Refetch when endpoint or params change

  // Effect to check staleness periodically
  useEffect(() => {
    const interval = setInterval(checkStaleness, 10000) // Check every 10 seconds
    return () => clearInterval(interval)
  }, [checkStaleness])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const timeoutId = retryTimeoutRef.current
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [])

  return {
    data,
    loading,
    error,
    refetch,
    isStale,
    lastFetched
  }
}

// Specialized hooks for each endpoint
export function useLazyUsageSummary(
  params: AnalyticsParams = {},
  options?: Parameters<typeof useLazyAnalytics>[2]
) {
  return useLazyAnalytics<UsageSummaryData>('usage-summary', params, options)
}

export function useLazyRecentUsage(
  params: AnalyticsParams = {},
  options?: Parameters<typeof useLazyAnalytics>[2]
) {
  return useLazyAnalytics<RecentUsageData>('recent-usage', params, options)
}

export function useLazyBalanceHistory(
  params: AnalyticsParams = {},
  options?: Parameters<typeof useLazyAnalytics>[2]
) {
  return useLazyAnalytics<BalanceHistoryData>('balance-history', params, options)
}

// Hook for lazy loading multiple analytics at once
// Note: This function violates React hooks rules and should be used carefully
// Consider using individual hooks in components instead
export function useLazyAnalyticsBatch() {
  // This implementation violates React hooks rules
  // Use individual hooks in components instead
  throw new Error('useLazyAnalyticsBatch violates React hooks rules. Use individual hooks in components instead.')
}

// Utility hook for conditional lazy loading
export function useConditionalLazyAnalytics<T>(
  endpoint: 'usage-summary' | 'recent-usage' | 'balance-history',
  params: AnalyticsParams = {},
  condition: boolean,
  options?: Parameters<typeof useLazyAnalytics>[2]
) {
  const analytics = useLazyAnalytics<T>(endpoint, params, {
    ...options,
    enabled: condition
  })

  return analytics
}
