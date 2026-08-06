"use client"

import { useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertTriangle, CreditCard, X } from "lucide-react"
import { useAuth } from "@/context/AuthContext"

interface CreditWarningBannerProps {
  creditBalance?: {
    available_credits: number
    is_low_balance: boolean
    is_critical_balance: boolean
  }
  onAddCredits: () => void
  onDismiss?: () => void
}

export function CreditWarningBanner({ 
  creditBalance, 
  onAddCredits, 
  onDismiss 
}: CreditWarningBannerProps) {
  const [dismissed, setDismissed] = useState(false)
  const { user } = useAuth()

  // Don't show if user is not authenticated
  if (!user || dismissed) {
    return null
  }

  // Don't show if no credit balance data
  if (!creditBalance) {
    return null
  }

  // Don't show if balance is not low
  if (!creditBalance.is_low_balance && !creditBalance.is_critical_balance) {
    return null
  }

  const isCritical = creditBalance.is_critical_balance
  const availableCredits = Math.round(creditBalance.available_credits)

  const handleDismiss = () => {
    setDismissed(true)
    onDismiss?.()
  }

  return (
    <Alert className={`mb-6 border-l-4 ${
      isCritical 
        ? 'border-red-500 bg-red-50 dark:bg-red-950/20' 
        : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <AlertTriangle className={`h-5 w-5 mt-0.5 ${
            isCritical ? 'text-red-600' : 'text-yellow-600'
          }`} />
          <div className="flex-1">
            <AlertDescription className="text-sm">
              {isCritical ? (
                <>
                  <strong className="font-semibold">Critical Credit Balance!</strong>
                  <br />
                  You have only <span className="font-mono font-semibold">{availableCredits} credits</span> remaining. 
                  Add more credits now to continue using AI services.
                </>
              ) : (
                <>
                  <strong className="font-semibold">Low Credit Balance</strong>
                  <br />
                  You have <span className="font-mono font-semibold">{availableCredits} credits</span> remaining. 
                  Consider adding more credits to avoid service interruption.
                </>
              )}
            </AlertDescription>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 ml-4">
          <Button
            onClick={onAddCredits}
            size="sm"
            className={`${
              isCritical 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-yellow-600 hover:bg-yellow-700 text-white'
            }`}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Add Credits
          </Button>
          
          <Button
            onClick={handleDismiss}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Alert>
  )
}
