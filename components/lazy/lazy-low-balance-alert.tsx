"use client"

import { useEffect, useRef, useState } from 'react'
import { AlertTriangle } from 'lucide-react'

interface LazyLowBalanceAlertProps {
  creditBalance: { available_credits: number; is_low_balance: boolean; is_critical_balance: boolean } | null
  loading: boolean
  error: string | null
  onLoad: () => Promise<void>
  className?: string
}

export function LazyLowBalanceAlert({
  creditBalance,
  loading,
  error,
  onLoad,
  className = ""
}: LazyLowBalanceAlertProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

  // Intersection Observer to detect when section comes into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsVisible(true)
          setHasLoaded(true)
          onLoad()
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
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
  }, [onLoad, hasLoaded])

  // Don't show anything if not visible, loading, error, or no low balance
  if (!isVisible || loading || error || !creditBalance?.is_low_balance) {
    return null
  }

  return (
    <div ref={sectionRef} className={className}>
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertTriangle className="h-4 w-4 text-orange-600 mr-2" />
          <p className="text-orange-800">
            Your credit balance is running low. Consider purchasing more credits.
          </p>
        </div>
      </div>
    </div>
  )
}
