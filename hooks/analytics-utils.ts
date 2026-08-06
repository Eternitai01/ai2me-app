/**
 * Analytics Data Transformation Utilities
 * 
 * Provides utilities for transforming raw analytics data into frontend-friendly formats:
 * - Chart data formatting
 * - Date formatting and timezone handling
 * - Number formatting for credits and costs
 * - Trend calculations and percentage changes
 * - Data aggregation for different time periods
 */

import { format, parseISO, isValid, differenceInDays, startOfDay, endOfDay } from 'date-fns'

// Types
export interface ChartDataPoint {
  date: string
  credits: number
  requests: number
  balance?: number
}

export interface TrendData {
  direction: 'increasing' | 'decreasing' | 'stable'
  percentage: number
  value: number
  previousValue: number
}

export interface FormattedCredits {
  value: number
  formatted: string
  currency: string
  precision: number
}

export interface DateRange {
  start: Date
  end: Date
  days: number
}

// Date formatting utilities
export const formatDate = (date: string | Date, formatString: string = 'MMM dd, yyyy'): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(dateObj)) return 'Invalid Date'
    return format(dateObj, formatString)
  } catch {
    // Date formatting error - fallback to invalid date
    return 'Invalid Date'
  }
}

export const formatDateRange = (startDate: string | Date, endDate: string | Date): string => {
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate
  
  if (!isValid(start) || !isValid(end)) return 'Invalid Date Range'
  
  const startFormatted = format(start, 'MMM dd')
  const endFormatted = format(end, 'MMM dd, yyyy')
  
  return `${startFormatted} - ${endFormatted}`
}

export const getRelativeTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(dateObj)) return 'Invalid Date'
  
  const now = new Date()
  const diffInDays = differenceInDays(now, dateObj)
  
  if (diffInDays === 0) return 'Today'
  if (diffInDays === 1) return 'Yesterday'
  if (diffInDays < 7) return `${diffInDays} days ago`
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`
  
  return `${Math.floor(diffInDays / 365)} years ago`
}

// Credit formatting utilities
export const formatCredits = (credits: number, precision: number = 2): FormattedCredits => {
  const rounded = Math.round(credits * Math.pow(10, precision)) / Math.pow(10, precision)
  
  return {
    value: rounded,
    formatted: new Intl.NumberFormat('en-US', {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision
    }).format(rounded),
    currency: 'credits',
    precision
  }
}

export const formatCreditsWithSymbol = (credits: number, precision: number = 2): string => {
  const formatted = formatCredits(credits, precision)
  return `${formatted.formatted} ${formatted.currency}`
}

export const formatCreditsCompact = (credits: number): string => {
  if (credits >= 1000000) {
    return `${(credits / 1000000).toFixed(1)}M credits`
  }
  if (credits >= 1000) {
    return `${(credits / 1000).toFixed(1)}K credits`
  }
  return `${credits.toFixed(0)} credits`
}

// Currency formatting utilities
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount)
}

export const formatCurrencyCompact = (amount: number, currency: string = 'USD'): string => {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}K`
  }
  return formatCurrency(amount, currency)
}

// Number formatting utilities
export const formatNumber = (number: number, options?: {
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  useGrouping?: boolean
}): string => {
  const defaultOptions = {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    useGrouping: true,
    ...options
  }
  
  return new Intl.NumberFormat('en-US', defaultOptions).format(number)
}

export const formatNumberCompact = (number: number): string => {
  if (number >= 1000000) {
    return `${(number / 1000000).toFixed(1)}M`
  }
  if (number >= 1000) {
    return `${(number / 1000).toFixed(1)}K`
  }
  return number.toFixed(0)
}

export const formatPercentage = (value: number, options?: {
  minimumFractionDigits?: number
  maximumFractionDigits?: number
}): string => {
  const defaultOptions = {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    ...options
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    ...defaultOptions
  }).format(value / 100)
}

// Chart data transformation
export const formatUsageChartData = (dailyBreakdown: Array<{
  date: string
  credits_used: number
  request_count: number
}>): ChartDataPoint[] => {
  return dailyBreakdown.map(day => ({
    date: formatDate(day.date, 'MMM dd'),
    credits: day.credits_used,
    requests: day.request_count
  }))
}

export const formatBalanceChartData = (balanceHistory: Array<{
  date: string
  balance: number
  transaction_type: string
  amount: number
  description: string
}>): ChartDataPoint[] => {
  return balanceHistory.map(point => ({
    date: formatDate(point.date, 'MMM dd'),
    balance: point.balance,
    credits: Math.abs(point.amount),
    requests: 0 // Default value for requests field
  }))
}

export const formatTrendChartData = (data: ChartDataPoint[], period: '7d' | '30d' | '90d' = '30d'): ChartDataPoint[] => {
  const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : 90
  const now = new Date()
  const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000)
  
  // Filter data to the specified period
  return data.filter(point => {
    const pointDate = parseISO(point.date)
    return pointDate >= startDate && pointDate <= now
  })
}

// Trend calculation utilities
export const calculateTrend = (current: number, previous: number): TrendData => {
  if (previous === 0) {
    return {
      direction: current > 0 ? 'increasing' : 'stable',
      percentage: current > 0 ? 100 : 0,
      value: current,
      previousValue: previous
    }
  }
  
  const percentage = ((current - previous) / previous) * 100
  const roundedPercentage = Math.round(percentage * 10) / 10
  
  let direction: 'increasing' | 'decreasing' | 'stable' = 'stable'
  if (roundedPercentage > 5) direction = 'increasing'
  else if (roundedPercentage < -5) direction = 'decreasing'
  
  return {
    direction,
    percentage: roundedPercentage,
    value: current,
    previousValue: previous
  }
}

export const calculateUsageTrend = (dailyBreakdown: Array<{
  date: string
  credits_used: number
  request_count: number
}>): TrendData => {
  if (dailyBreakdown.length < 2) {
    return {
      direction: 'stable',
      percentage: 0,
      value: 0,
      previousValue: 0
    }
  }
  
  const firstHalf = dailyBreakdown.slice(0, Math.floor(dailyBreakdown.length / 2))
  const secondHalf = dailyBreakdown.slice(Math.floor(dailyBreakdown.length / 2))
  
  const firstHalfAvg = firstHalf.reduce((sum, day) => sum + day.credits_used, 0) / firstHalf.length
  const secondHalfAvg = secondHalf.reduce((sum, day) => sum + day.credits_used, 0) / secondHalf.length
  
  return calculateTrend(secondHalfAvg, firstHalfAvg)
}

export const calculateBalanceTrend = (balanceHistory: Array<{
  date: string
  balance: number
  transaction_type: string
  amount: number
  description: string
}>): TrendData => {
  if (balanceHistory.length < 2) {
    return {
      direction: 'stable',
      percentage: 0,
      value: 0,
      previousValue: 0
    }
  }
  
  const firstBalance = balanceHistory[0].balance
  const lastBalance = balanceHistory[balanceHistory.length - 1].balance
  
  return calculateTrend(lastBalance, firstBalance)
}

// Data aggregation utilities
export const aggregateDataByPeriod = (
  data: ChartDataPoint[],
  period: 'day' | 'week' | 'month' = 'day'
): ChartDataPoint[] => {
  if (period === 'day') return data
  
  const grouped = new Map<string, { credits: number; requests: number; balance?: number }>()
  
  data.forEach(point => {
    let key: string
    const date = parseISO(point.date)
    
    switch (period) {
      case 'week':
        key = format(date, 'yyyy-\'W\'ww')
        break
      case 'month':
        key = format(date, 'yyyy-MM')
        break
      default:
        key = point.date
    }
    
    if (!grouped.has(key)) {
      grouped.set(key, { credits: 0, requests: 0, balance: point.balance })
    }
    
    const group = grouped.get(key)!
    group.credits += point.credits
    group.requests += point.requests
    if (point.balance !== undefined) {
      group.balance = point.balance // Use the latest balance
    }
  })
  
  return Array.from(grouped.entries()).map(([key, values]) => ({
    date: key,
    credits: values.credits,
    requests: values.requests,
    balance: values.balance
  }))
}

// Statistics utilities
export const calculateStatistics = (data: number[]): {
  min: number
  max: number
  average: number
  median: number
  total: number
} => {
  if (data.length === 0) {
    return { min: 0, max: 0, average: 0, median: 0, total: 0 }
  }
  
  const sorted = [...data].sort((a, b) => a - b)
  const total = data.reduce((sum, value) => sum + value, 0)
  const average = total / data.length
  
  let median: number
  if (sorted.length % 2 === 0) {
    median = (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
  } else {
    median = sorted[Math.floor(sorted.length / 2)]
  }
  
  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    average: Math.round(average * 100) / 100,
    median: Math.round(median * 100) / 100,
    total: Math.round(total * 100) / 100
  }
}

// Date range utilities
export const createDateRange = (days: number): DateRange => {
  const end = new Date()
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000)
  
  return {
    start: startOfDay(start),
    end: endOfDay(end),
    days
  }
}

export const createCustomDateRange = (startDate: Date, endDate: Date): DateRange => {
  const days = differenceInDays(endDate, startDate) + 1
  
  return {
    start: startOfDay(startDate),
    end: endOfDay(endDate),
    days
  }
}

// Validation utilities
export const isValidDateRange = (startDate: Date, endDate: Date): boolean => {
  return isValid(startDate) && isValid(endDate) && startDate < endDate
}

export const isValidCredits = (credits: number): boolean => {
  return typeof credits === 'number' && !isNaN(credits) && credits >= 0
}

// Export all utilities as a single object for convenience
export const analyticsUtils = {
  // Date formatting
  formatDate,
  formatDateRange,
  getRelativeTime,
  
  // Credit formatting
  formatCredits,
  formatCreditsWithSymbol,
  formatCreditsCompact,
  
  // Currency formatting
  formatCurrency,
  formatCurrencyCompact,
  
  // Number formatting
  formatNumber,
  formatNumberCompact,
  formatPercentage,
  
  // Chart data
  formatUsageChartData,
  formatBalanceChartData,
  formatTrendChartData,
  
  // Trend calculation
  calculateTrend,
  calculateUsageTrend,
  calculateBalanceTrend,
  
  // Data aggregation
  aggregateDataByPeriod,
  
  // Statistics
  calculateStatistics,
  
  // Date ranges
  createDateRange,
  createCustomDateRange,
  
  // Validation
  isValidDateRange,
  isValidCredits
}
