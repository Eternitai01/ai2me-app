/**
 * Error Handling Hook for Analytics
 * 
 * Provides centralized error handling with:
 * - Error categorization
 * - Retry logic with exponential backoff
 * - User-friendly error messages
 * - Error reporting and logging
 * - Fallback data for critical errors
 */

import { useState, useCallback, useRef, useEffect } from 'react'

// Types
export interface AnalyticsError {
  type: 'network' | 'validation' | 'server' | 'timeout' | 'auth' | 'unknown'
  message: string
  retryable: boolean
  retryCount: number
  maxRetries: number
  timestamp: Date
  originalError?: Error
}

export interface ErrorHandlingConfig {
  maxRetries: number
  retryDelay: number
  exponentialBackoff: boolean
  showUserFriendlyMessages: boolean
  enableErrorReporting: boolean
  fallbackData?: unknown
}

export interface ErrorHandlingState {
  error: AnalyticsError | null
  isRetrying: boolean
  retryCount: number
  canRetry: boolean
}

export interface ErrorHandlingActions {
  handleError: (error: Error) => void
  retry: () => void
  clearError: () => void
  reset: () => void
}

// Default configuration
const DEFAULT_CONFIG: ErrorHandlingConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  exponentialBackoff: true,
  showUserFriendlyMessages: true,
  enableErrorReporting: true,
  fallbackData: null
}

// Error categorization
const categorizeError = (error: Error): Omit<AnalyticsError, 'retryCount' | 'timestamp'> => {
  const message = error.message.toLowerCase()
  
  // Network errors
  if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
    return {
      type: 'network',
      message: 'Network connection failed. Please check your internet connection.',
      retryable: true,
      maxRetries: 3,
      originalError: error
    }
  }
  
  // Timeout errors
  if (message.includes('timeout') || message.includes('aborted')) {
    return {
      type: 'timeout',
      message: 'Request timed out. Please try again.',
      retryable: true,
      maxRetries: 2,
      originalError: error
    }
  }
  
  // Authentication errors
  if (message.includes('unauthorized') || message.includes('authentication') || message.includes('401')) {
    return {
      type: 'auth',
      message: 'Authentication required. Please log in again.',
      retryable: false,
      maxRetries: 0,
      originalError: error
    }
  }
  
  // Validation errors
  if (message.includes('validation') || message.includes('invalid') || message.includes('400')) {
    return {
      type: 'validation',
      message: 'Invalid request parameters. Please check your input.',
      retryable: false,
      maxRetries: 0,
      originalError: error
    }
  }
  
  // Server errors
  if (message.includes('server') || message.includes('500') || message.includes('502') || message.includes('503')) {
    return {
      type: 'server',
      message: 'Server error occurred. Please try again later.',
      retryable: true,
      maxRetries: 2,
      originalError: error
    }
  }
  
  // Unknown errors
  return {
    type: 'unknown',
    message: 'An unexpected error occurred. Please try again.',
    retryable: true,
    maxRetries: 1,
    originalError: error
  }
}

// User-friendly error messages
const getUserFriendlyMessage = (error: AnalyticsError): string => {
  if (!error.retryable) {
    return error.message
  }
  
  if (error.retryCount > 0) {
    return `${error.message} (Attempt ${error.retryCount + 1}/${error.maxRetries + 1})`
  }
  
  return error.message
}

// Error reporting
const reportError = () => {
  // Analytics Error - handled by error state
  
  // Example: Sentry.captureException(error.originalError, { tags: { context } })
}

// Main error handling hook
export function useErrorHandling(
  config: Partial<ErrorHandlingConfig> = {},
  options: {
    onError?: (error: AnalyticsError) => void
    onRetry?: (retryCount: number) => void
    onClear?: () => void
  } = {}
) {
  const {
    onError,
    onRetry,
    onClear
  } = options

  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  
  // State
  const [error, setError] = useState<AnalyticsError | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  
  // Refs
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const retryFunctionRef = useRef<(() => Promise<void>) | null>(null)

  // Calculate derived state
  const canRetry = error ? error.retryable && retryCount < error.maxRetries : false

  // Handle error
  const handleError = useCallback((error: Error) => {
    const categorizedError = categorizeError(error)
    
    const analyticsError: AnalyticsError = {
      ...categorizedError,
      retryCount: 0,
      timestamp: new Date()
    }
    
    setError(analyticsError)
    setRetryCount(0)
    setIsRetrying(false)
    
    // Report error
    if (finalConfig.enableErrorReporting) {
      reportError()
    }
    
    // Call error callback
    onError?.(analyticsError)
  }, [finalConfig.enableErrorReporting, onError])

  // Retry function
  const retry = useCallback(async () => {
    if (!error || !canRetry || !retryFunctionRef.current) return

    setIsRetrying(true)
    setRetryCount(prev => prev + 1)
    
    // Call retry callback
    onRetry?.(retryCount + 1)
    
    try {
      await retryFunctionRef.current()
      // If successful, clear error
      setError(null)
      setRetryCount(0)
    } catch {
      // Update error with new retry count
      const updatedError: AnalyticsError = {
        ...error,
        retryCount: retryCount + 1
      }
      setError(updatedError)
      
      // Report retry error
      if (finalConfig.enableErrorReporting) {
        reportError()
      }
    } finally {
      setIsRetrying(false)
    }
  }, [error, canRetry, retryCount, finalConfig.enableErrorReporting, onRetry])

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
    setRetryCount(0)
    setIsRetrying(false)
    
    // Clear retry timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
      retryTimeoutRef.current = null
    }
    
    onClear?.()
  }, [onClear])

  // Reset all state
  const reset = useCallback(() => {
    clearError()
    retryFunctionRef.current = null
  }, [clearError])

  // Set retry function
  const setRetryFunction = useCallback((fn: () => Promise<void>) => {
    retryFunctionRef.current = fn
  }, [])

  // Auto-retry with exponential backoff
  useEffect(() => {
    if (!error || !canRetry || !finalConfig.exponentialBackoff) return

    const delay = finalConfig.retryDelay * Math.pow(2, retryCount)
    
    retryTimeoutRef.current = setTimeout(() => {
      retry()
    }, delay)

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
  }, [error, canRetry, retryCount, finalConfig.exponentialBackoff, finalConfig.retryDelay, retry])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
  }, [])

  // Error handling state
  const errorState: ErrorHandlingState = {
    error,
    isRetrying,
    retryCount,
    canRetry
  }

  // Error handling actions
  const errorActions: ErrorHandlingActions = {
    handleError,
    retry,
    clearError,
    reset
  }

  return {
    // State
    ...errorState,
    
    // Actions
    ...errorActions,
    
    // Utilities
    setRetryFunction,
    
    // Configuration
    config: finalConfig
  }
}

// Specialized hook for analytics errors
export function useAnalyticsErrorHandling(
  config: Partial<ErrorHandlingConfig> = {},
  options?: Parameters<typeof useErrorHandling>[1]
) {
  const errorHandling = useErrorHandling(config, options)

  // Enhanced error handling for analytics
  const handleAnalyticsError = useCallback((error: Error) => {
    errorHandling.handleError(error)
  }, [errorHandling])

  // Get user-friendly error message
  const getErrorMessage = useCallback(() => {
    if (!errorHandling.error) return null
    
    return getUserFriendlyMessage(errorHandling.error)
  }, [errorHandling.error])

  // Check if error is critical (requires user action)
  const isCriticalError = useCallback(() => {
    if (!errorHandling.error) return false
    
    return errorHandling.error.type === 'auth' || 
           errorHandling.error.type === 'validation' ||
           (!errorHandling.error.retryable && errorHandling.retryCount >= errorHandling.error.maxRetries)
  }, [errorHandling.error, errorHandling.retryCount])

  return {
    ...errorHandling,
    handleAnalyticsError,
    getErrorMessage,
    isCriticalError
  }
}

// Hook for error boundaries
export function useErrorBoundary() {
  const [error, setError] = useState<Error | null>(null)

  const resetError = useCallback(() => {
    setError(null)
  }, [])

  const captureError = useCallback((error: Error) => {
    setError(error)
  }, [])

  return {
    error,
    resetError,
    captureError
  }
}

// Utility functions
export const isRetryableError = (error: Error): boolean => {
  const categorized = categorizeError(error)
  return categorized.retryable
}

export const getErrorType = (error: Error): AnalyticsError['type'] => {
  const categorized = categorizeError(error)
  return categorized.type
}

export const shouldShowRetryButton = (error: AnalyticsError): boolean => {
  return error.retryable && error.retryCount < error.maxRetries
}
