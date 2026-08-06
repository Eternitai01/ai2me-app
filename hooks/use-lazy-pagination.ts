/**
 * Lazy Loading Pagination Hook
 * 
 * Provides pagination with lazy loading for analytics data:
 * - Page-based pagination
 * - Infinite scroll support
 * - URL state persistence
 * - Performance optimizations
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

// Types
export interface PaginationConfig {
  pageSize: number
  maxPages: number
  showPageNumbers: boolean
  showPageSizeSelector: boolean
  enableInfiniteScroll: boolean
  preloadNextPage: boolean
}

export interface PaginationState {
  currentPage: number
  totalPages: number
  totalItems: number
  hasNextPage: boolean
  hasPreviousPage: boolean
  isLoading: boolean
  error: string | null
}

export interface PaginationActions {
  goToPage: (page: number) => void
  nextPage: () => void
  previousPage: () => void
  firstPage: () => void
  lastPage: () => void
  setPageSize: (size: number) => void
  refresh: () => void
}

// Default configuration
const DEFAULT_CONFIG: PaginationConfig = {
  pageSize: 20,
  maxPages: 5,
  showPageNumbers: true,
  showPageSizeSelector: true,
  enableInfiniteScroll: false,
  preloadNextPage: true
}

// Page size options
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

// Main pagination hook
export function useLazyPagination<T>(
  fetchFunction: (page: number, pageSize: number) => Promise<{
    data: T[]
    totalCount: number
    hasMore: boolean
  }>,
  config: Partial<PaginationConfig> = {},
  options: {
    persistInURL?: boolean
    onPageChange?: (page: number) => void
    onDataChange?: (data: T[]) => void
  } = {}
) {
  const {
    persistInURL = true,
    onPageChange,
    onDataChange
  } = options

  const router = useRouter()
  const searchParams = useSearchParams()
  
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  
  // State
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(finalConfig.pageSize)
  const [data, setData] = useState<T[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  
  // Refs for infinite scroll
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadingRef = useRef<HTMLDivElement | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Calculate derived state
  const totalPages = Math.ceil(totalItems / pageSize)
  const hasNextPage = currentPage < totalPages && hasMore
  const hasPreviousPage = currentPage > 1

  // Initialize from URL
  useEffect(() => {
    if (!persistInURL) return
    
    const urlPage = searchParams.get('page')
    const urlPageSize = searchParams.get('pageSize')
    
    if (urlPage) {
      const page = parseInt(urlPage, 10)
      if (page > 0) setCurrentPage(page)
    }
    
    if (urlPageSize) {
      const size = parseInt(urlPageSize, 10)
      if (PAGE_SIZE_OPTIONS.includes(size)) {
        setPageSize(size)
      }
    }
  }, [searchParams, persistInURL])

  // Update URL when pagination changes
  const updateURL = useCallback((page: number, size: number) => {
    if (!persistInURL) return
    
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    params.set('pageSize', size.toString())
    
    router.replace(`?${params.toString()}`, { scroll: false })
  }, [persistInURL, searchParams, router])

  // Fetch data function
  const fetchData = useCallback(async (page: number, size: number, append: boolean = false) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()
    
    setIsLoading(true)
    setError(null)

    try {
      const result = await fetchFunction(page, size)
      
      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return
      }

      if (append) {
        setData(prev => [...prev, ...result.data])
      } else {
        setData(result.data)
      }
      
      setTotalItems(result.totalCount)
      setHasMore(result.hasMore)
      
      onDataChange?.(result.data)
      
    } catch (err) {
      if (abortControllerRef.current?.signal.aborted) {
        return
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data'
      setError(errorMessage)
      // Pagination fetch error - handled by error state
    } finally {
      setIsLoading(false)
    }
  }, [fetchFunction, onDataChange]) // Include onDataChange in dependencies

  // Load data for current page - REMOVED automatic fetch to prevent infinite loops
  // Data will be fetched manually via refetch() or navigation functions

  // Navigation functions
  const goToPage = useCallback((page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return
    
    setCurrentPage(page)
    updateURL(page, pageSize)
    fetchData(page, pageSize) // Fetch data when page changes
    onPageChange?.(page)
  }, [currentPage, totalPages, pageSize, updateURL, onPageChange, fetchData])

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      goToPage(currentPage + 1)
    }
  }, [hasNextPage, currentPage, goToPage])

  const previousPage = useCallback(() => {
    if (hasPreviousPage) {
      goToPage(currentPage - 1)
    }
  }, [hasPreviousPage, currentPage, goToPage])

  const firstPage = useCallback(() => {
    goToPage(1)
  }, [goToPage])

  const lastPage = useCallback(() => {
    goToPage(totalPages)
  }, [totalPages, goToPage])

  const updatePageSize = useCallback((size: number) => {
    if (!PAGE_SIZE_OPTIONS.includes(size)) return
    
    setPageSize(size)
    setCurrentPage(1) // Reset to first page
    updateURL(1, size)
  }, [updateURL])

  const refresh = useCallback(() => {
    fetchData(currentPage, pageSize)
  }, [currentPage, pageSize, fetchData])

  // Infinite scroll setup
  useEffect(() => {
    if (!finalConfig.enableInfiniteScroll) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isLoading) {
          nextPage()
        }
      },
      { threshold: 0.1 }
    )

    observerRef.current = observer

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [finalConfig.enableInfiniteScroll, hasNextPage, isLoading, nextPage])

  // Preload next page
  useEffect(() => {
    if (!finalConfig.preloadNextPage || !hasNextPage || isLoading) return

    const preloadTimer = setTimeout(() => {
      fetchData(currentPage + 1, pageSize, true)
    }, 1000) // Preload after 1 second of inactivity

    return () => clearTimeout(preloadTimer)
  }, [currentPage, hasNextPage, isLoading, finalConfig.preloadNextPage, fetchData, pageSize])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Pagination state
  const paginationState: PaginationState = {
    currentPage,
    totalPages,
    totalItems,
    hasNextPage,
    hasPreviousPage,
    isLoading,
    error
  }

  // Pagination actions
  const paginationActions: PaginationActions = {
    goToPage,
    nextPage,
    previousPage,
    firstPage,
    lastPage,
    setPageSize: updatePageSize,
    refresh
  }

  return {
    // Data
    data,
    
    // State
    ...paginationState,
    
    // Actions
    ...paginationActions,
    
    // Refs for infinite scroll
    loadingRef,
    observerRef,
    
    // Configuration
    config: finalConfig
  }
}

// Specialized hook for recent usage pagination
export function useLazyRecentUsagePagination(
  config: Partial<PaginationConfig> = {},
  options?: Parameters<typeof useLazyPagination>[2]
) {
  const fetchFunction = useCallback(async (page: number, pageSize: number) => {
    const offset = (page - 1) * pageSize
    
    const response = await fetch(`/api/credits/analytics/recent-usage?limit=${pageSize}&offset=${offset}`, {
      credentials: 'include'
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch recent usage: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    return {
      data: data.transactions,
      totalCount: data.total_count,
      hasMore: data.returned_count === pageSize && (page * pageSize) < data.total_count
    }
  }, [])

  return useLazyPagination(fetchFunction, config, options)
}

// Hook for pagination with search/filtering
export function useLazyPaginationWithFilter<T>(
  fetchFunction: (page: number, pageSize: number, filters: Record<string, unknown>) => Promise<{
    data: T[]
    totalCount: number
    hasMore: boolean
  }>,
  filters: Record<string, unknown> = {},
  config: Partial<PaginationConfig> = {},
  options?: Parameters<typeof useLazyPagination>[2]
) {
  const [debouncedFilters, setDebouncedFilters] = useState(filters)
  
  // Debounce filters
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters)
    }, 300)
    
    return () => clearTimeout(timer)
  }, [filters])

  const fetchWithFilters = useCallback(async (page: number, pageSize: number) => {
    return fetchFunction(page, pageSize, debouncedFilters)
  }, [fetchFunction, debouncedFilters])

  return useLazyPagination(fetchWithFilters, config, options)
}
