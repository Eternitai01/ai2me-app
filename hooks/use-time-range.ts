/**
 * Time Range Management Hook
 * 
 * Provides lazy loading time range selection with:
 * - Predefined time ranges
 * - Custom date range selection
 * - URL state persistence
 * - Automatic data refresh on range change
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

// Types
export interface TimeRange {
  label: string
  value: string
  days: number | null
  startDate?: Date
  endDate?: Date
}

export interface CustomDateRange {
  startDate: Date
  endDate: Date
}

// Predefined time ranges
export const TIME_RANGES: TimeRange[] = [
  { label: 'Last 7 days', value: '7d', days: 7 },
  { label: 'Last 30 days', value: '30d', days: 30 },
  { label: 'Last 90 days', value: '90d', days: 90 },
  { label: 'Last 6 months', value: '6m', days: 180 },
  { label: 'Last year', value: '1y', days: 365 },
  { label: 'Custom Range', value: 'custom', days: null }
]

// Hook for time range management
export function useTimeRange(
  options: {
    defaultRange?: string
    persistInURL?: boolean
    onRangeChange?: (range: TimeRange, customRange?: CustomDateRange) => void
  } = {}
) {
  const {
    defaultRange = '30d',
    persistInURL = true,
    onRangeChange
  } = options

  const router = useRouter()
  const searchParams = useSearchParams()
  
  // State
  const [selectedRange, setSelectedRange] = useState<string>(defaultRange)
  const [customRange, setCustomRange] = useState<CustomDateRange | null>(null)
  const [isCustomRangeOpen, setIsCustomRangeOpen] = useState(false)

  // Get current time range from URL or state
  const currentTimeRange = useMemo(() => {
    const urlRange = searchParams.get('timeRange')
    const range = urlRange || selectedRange
    
    return TIME_RANGES.find(tr => tr.value === range) || TIME_RANGES[1] // Default to 30d
  }, [selectedRange, searchParams])

  // Get current custom range from URL or state
  const currentCustomRange = useMemo(() => {
    if (currentTimeRange.value !== 'custom') return null
    
    const urlStartDate = searchParams.get('startDate')
    const urlEndDate = searchParams.get('endDate')
    
    if (urlStartDate && urlEndDate) {
      return {
        startDate: new Date(urlStartDate),
        endDate: new Date(urlEndDate)
      }
    }
    
    return customRange
  }, [currentTimeRange, searchParams, customRange])

  // Calculate date range based on selection
  const dateRange = useMemo(() => {
    if (currentTimeRange.value === 'custom' && currentCustomRange) {
      return {
        startDate: currentCustomRange.startDate,
        endDate: currentCustomRange.endDate,
        days: Math.ceil((currentCustomRange.endDate.getTime() - currentCustomRange.startDate.getTime()) / (1000 * 60 * 60 * 24))
      }
    }
    
    if (currentTimeRange.days) {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(endDate.getDate() - currentTimeRange.days)
      
      return {
        startDate,
        endDate,
        days: currentTimeRange.days
      }
    }
    
    return null
  }, [currentTimeRange, currentCustomRange])

  // Update URL when range changes
  const updateURL = useCallback((range: string, customRange?: CustomDateRange) => {
    if (!persistInURL) return
    
    const params = new URLSearchParams(searchParams.toString())
    params.set('timeRange', range)
    
    if (range === 'custom' && customRange) {
      params.set('startDate', customRange.startDate.toISOString().split('T')[0])
      params.set('endDate', customRange.endDate.toISOString().split('T')[0])
    } else {
      params.delete('startDate')
      params.delete('endDate')
    }
    
    router.replace(`?${params.toString()}`, { scroll: false })
  }, [persistInURL, searchParams, router])

  // Handle range selection
  const selectRange = useCallback((rangeValue: string) => {
    const range = TIME_RANGES.find(tr => tr.value === rangeValue)
    if (!range) return
    
    setSelectedRange(rangeValue)
    
    if (range.value === 'custom') {
      setIsCustomRangeOpen(true)
    } else {
      setIsCustomRangeOpen(false)
      setCustomRange(null)
      updateURL(rangeValue)
      onRangeChange?.(range)
    }
  }, [updateURL, onRangeChange])

  // Handle custom range selection
  const selectCustomRange = useCallback((startDate: Date, endDate: Date) => {
    // Validate date range
    if (startDate >= endDate) {
      throw new Error('Start date must be before end date')
    }
    
    const maxDays = 365
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysDiff > maxDays) {
      throw new Error(`Date range cannot exceed ${maxDays} days`)
    }
    
    const customRangeData = { startDate, endDate }
    setCustomRange(customRangeData)
    setIsCustomRangeOpen(false)
    updateURL('custom', customRangeData)
    
    const customRangeObj = { ...TIME_RANGES.find(tr => tr.value === 'custom')!, ...customRangeData }
    onRangeChange?.(customRangeObj, customRangeData)
  }, [updateURL, onRangeChange])

  // Initialize from URL on mount
  useEffect(() => {
    const urlRange = searchParams.get('timeRange')
    if (urlRange && urlRange !== selectedRange) {
      setSelectedRange(urlRange)
    }
  }, [searchParams, selectedRange])

  // Get analytics parameters for API calls - memoized to prevent infinite loops
  const analyticsParams = useMemo(() => {
    if (!dateRange) return { days: 30 }
    
    if (currentTimeRange.value === 'custom' && currentCustomRange) {
      return {
        start_date: currentCustomRange.startDate.toISOString(),
        end_date: currentCustomRange.endDate.toISOString()
      }
    }
    
    return {
      days: dateRange.days
    }
  }, [dateRange, currentTimeRange, currentCustomRange])

  const getAnalyticsParams = useCallback(() => analyticsParams, [analyticsParams])

  // Format date for display
  const formatDateRange = useCallback(() => {
    if (!dateRange) return ''
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    }
    
    return `${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}`
  }, [dateRange])

  // Check if range is valid
  const isValidRange = useMemo(() => {
    if (!dateRange) return false
    
    if (currentTimeRange.value === 'custom' && currentCustomRange) {
      return currentCustomRange.startDate < currentCustomRange.endDate
    }
    
    return true
  }, [dateRange, currentTimeRange, currentCustomRange])

  // Get range summary for display
  const getRangeSummary = useCallback(() => {
    if (currentTimeRange.value === 'custom' && currentCustomRange) {
      return formatDateRange()
    }
    
    return currentTimeRange.label
  }, [currentTimeRange, currentCustomRange, formatDateRange])

  return {
    // State
    selectedRange,
    customRange: currentCustomRange,
    isCustomRangeOpen,
    currentTimeRange,
    dateRange,
    
    // Actions
    selectRange,
    selectCustomRange,
    setIsCustomRangeOpen,
    
    // Utilities
    getAnalyticsParams,
    formatDateRange,
    getRangeSummary,
    isValidRange,
    
    // Constants
    timeRanges: TIME_RANGES
  }
}

// Hook for lazy loading with time range
export function useTimeRangeAnalytics(
  endpoint: 'usage-summary' | 'recent-usage' | 'balance-history',
  timeRangeOptions?: Parameters<typeof useTimeRange>[0],
  analyticsOptions?: {
    enabled?: boolean
    retryCount?: number
    retryDelay?: number
    staleTime?: number
  }
) {
  const timeRange = useTimeRange(timeRangeOptions)
  const analyticsParams = timeRange.getAnalyticsParams()
  
  // Import the lazy analytics hook
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useLazyAnalytics } = require('./use-lazy-analytics')
  
  const analytics = useLazyAnalytics(endpoint, analyticsParams, {
    ...analyticsOptions,
    enabled: timeRange.isValidRange && analyticsOptions?.enabled !== false
  })

  // Refetch when time range changes
  useEffect(() => {
    if (timeRange.isValidRange) {
      analytics.refetch()
    }
  }, [timeRange.isValidRange, analytics])

  return {
    ...analytics,
    timeRange
  }
}
