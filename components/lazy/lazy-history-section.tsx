"use client"

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { History, Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'

interface LazyHistorySectionProps {
  title: string
  description: string
  icon: React.ReactNode
  data: unknown[]
  loading: boolean
  error: string | null
  onLoad: () => Promise<void>
  onRefresh?: () => Promise<void>
  renderContent: (data: unknown[]) => React.ReactNode
  emptyMessage: string
  className?: string
}

export function LazyHistorySection({
  title,
  description,
  icon,
  data,
  loading,
  error,
  onLoad,
  onRefresh,
  renderContent,
  emptyMessage,
  className = ""
}: LazyHistorySectionProps) {
  const { user, loading: authLoading } = useAuth()
  const [isVisible, setIsVisible] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

  // Intersection Observer to detect when section comes into view
  useEffect(() => {
    // Don't load if user is not authenticated or still loading
    if (authLoading || !user) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsVisible(true)
          setHasLoaded(true)
          onLoad()
        }
      },
      {
        threshold: 0.1, // Trigger when 10% of the section is visible
        rootMargin: '50px' // Start loading 50px before the section comes into view
      }
    )

    const currentRef = sectionRef.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [onLoad, hasLoaded, authLoading, user])

  const handleRefresh = async () => {
    if (onRefresh) {
      try {
        await onRefresh()
        toast.success("History refreshed!")
      } catch {
        toast.error("Failed to refresh history")
      }
    }
  }

  return (
    <div ref={sectionRef} className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {icon}
              <div>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </div>
            </div>
            {onRefresh && hasLoaded && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {authLoading ? (
            // Authentication loading
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <div className="text-center">
                <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
                <p className="text-sm">Loading authentication...</p>
              </div>
            </div>
          ) : !user ? (
            // Not authenticated
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <div className="text-center">
                <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Please log in to view {title.toLowerCase()}</p>
              </div>
            </div>
          ) : !isVisible ? (
            // Placeholder while waiting to load
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <div className="text-center">
                <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Scroll down to load {title.toLowerCase()}</p>
              </div>
            </div>
          ) : loading ? (
            // Loading state
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground">Loading {title.toLowerCase()}...</p>
              </div>
            </div>
          ) : error ? (
            // Error state
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
                <p className="text-destructive mb-2">Failed to load {title.toLowerCase()}</p>
                <p className="text-sm text-muted-foreground mb-4">{error}</p>
                <Button variant="outline" size="sm" onClick={onLoad}>
                  Try Again
                </Button>
              </div>
            </div>
          ) : !Array.isArray(data) || data.length === 0 ? (
            // Empty state or invalid data
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <div className="text-center">
                <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{emptyMessage}</p>
                {!Array.isArray(data) && (
                  <p className="text-xs text-destructive mt-2">
                    Invalid data format received
                  </p>
                )}
              </div>
            </div>
          ) : (
            // Content
            renderContent(data)
          )}
        </CardContent>
      </Card>
    </div>
  )
}
