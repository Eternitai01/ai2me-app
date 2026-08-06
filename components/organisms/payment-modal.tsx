"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CreditCard, Lock, Loader2 } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { toast } from "sonner"

interface PaymentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: "credits"
}

export function PaymentModal({ open, onOpenChange, type }: PaymentModalProps) {
  const [selectedAmount, setSelectedAmount] = useState("10000")
  const [customAmount, setCustomAmount] = useState("")
  const [useCustomAmount, setUseCustomAmount] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuth()

  const creditPackages = [
    { credits: "10000", price: "$10", amount_usd: 10, popular: false },
    { credits: "25000", price: "$25", amount_usd: 25, popular: true },
    { credits: "50000", price: "$50", amount_usd: 50, popular: false },
    { credits: "100000", price: "$100", amount_usd: 100, popular: false },
  ]

  const handleStripePayment = async () => {
    if (type !== "credits") {
      toast.error("Only credit purchases are supported at this time")
      return
    }

    if (!user) {
      toast.error("Please log in to purchase credits")
      return
    }

    // Validate amount
    let amountUsd = 0
    if (useCustomAmount) {
      const customAmountNum = parseFloat(customAmount)
      if (isNaN(customAmountNum) || customAmountNum <= 0) {
        toast.error("Please enter a valid amount")
        return
      }
      if (customAmountNum < 5) {
        toast.error("Minimum purchase amount is $5")
        return
      }
      if (customAmountNum > 1000) {
        toast.error("Maximum purchase amount is $1000")
        return
      }
      amountUsd = customAmountNum
    } else {
      const selectedPackage = creditPackages.find(pkg => pkg.credits === selectedAmount)
      if (!selectedPackage) {
        toast.error("Please select a valid credit package")
        return
      }
      amountUsd = selectedPackage.amount_usd
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({
          amount_usd: amountUsd,
          success_url: `${window.location.origin}/dashboard/credits/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${window.location.origin}/dashboard/credits/cancelled`,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to create checkout session')
      }

      const data = await response.json()


      // Redirect to Stripe checkout
      window.location.href = data.checkout_url

    } catch (error) {
      console.error('Payment error:', error)
      toast.error(error instanceof Error ? error.message : 'Payment failed')
    } finally {
      setIsLoading(false)
    }
  }

  // Removed plans array - only supporting credit purchases

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[80vw] max-w-[800px] border-1 border-gray-500 max-h-[90vh] flex flex-col p-0"
        style={{ maxWidth: '800px', width: '80vw' }}
      >
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Purchase Credits</DialogTitle>
          <DialogDescription>
            Add credits to your account for continued API usage
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-4">
          <div className="space-y-3">
            <Label className="text-base font-semibold">Select Credit Package</Label>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {creditPackages.map((pkg) => (
                <div
                  key={pkg.credits}
                  className={`relative p-3 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg ${selectedAmount === pkg.credits
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border hover:border-primary/50 hover:shadow-md"
                    }`}
                  onClick={() => setSelectedAmount(pkg.credits)}
                >
                  {pkg.popular && (
                    <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground text-[10px] px-2 h-4">
                      Most Popular
                    </Badge>
                  )}
                  <div className="text-center space-y-1">
                    <div className="text-2xl font-bold text-primary">{pkg.credits.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground font-medium">credits</div>
                    <div className="text-lg font-bold text-green-600">{pkg.price}</div>
                    <div className="text-[10px] text-muted-foreground">$1.00 per 1K credits</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Custom Amount Option */}
            <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="custom-amount"
                  checked={useCustomAmount}
                  onChange={(e) => setUseCustomAmount(e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                />
                <Label htmlFor="custom-amount" className="text-sm font-semibold cursor-pointer">
                  Enter custom amount
                </Label>
              </div>

              {useCustomAmount && (
                <div className="space-y-2">
                  <Label htmlFor="custom-amount-input" className="text-xs font-semibold">Amount (USD)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                    <Input
                      id="custom-amount-input"
                      type="number"
                      placeholder="Enter amount"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="pl-6 h-9 text-sm"
                      min="5"
                      max="1000"
                      step="0.01"
                    />
                  </div>
                  <div className="bg-blue-50 p-2 rounded-lg">
                    <p className="text-xs text-blue-800">
                      <span className="font-semibold">You&apos;ll get:</span> {customAmount ? (parseFloat(customAmount) * 1000).toLocaleString() : '0'} credits
                    </p>
                    <p className="text-[10px] text-blue-600 mt-0.5">
                      Minimum: $5.00 | Maximum: $1000.00
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          <Card className="border-2">
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-base">
                  <span className="font-semibold">Subtotal</span>
                  <span className="font-bold text-primary">
                    {useCustomAmount
                      ? `$${customAmount || '0.00'}`
                      : creditPackages.find((p) => p.credits === selectedAmount)?.price
                    }
                  </span>
                </div>
                <div className="flex items-center justify-between text-base">
                  <span className="font-semibold">Credits</span>
                  <span className="font-bold text-green-600">
                    {useCustomAmount
                      ? `${customAmount ? (parseFloat(customAmount) * 1000).toLocaleString() : '0'} credits`
                      : `${selectedAmount} credits`
                    }
                  </span>
                </div>
                <Separator className="my-2" />
                <div className="flex items-center justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">
                    {useCustomAmount
                      ? `$${customAmount || '0.00'}`
                      : creditPackages.find((p) => p.credits === selectedAmount)?.price
                    }
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
            <Lock className="h-3 w-3" />
            <span>Secured by 256-bit SSL encryption</span>
            <span className="mx-1">•</span>
            <CreditCard className="h-3 w-3" />
            <span>Powered by Stripe</span>
          </div>

          <div className="flex gap-3 pb-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-10 text-sm font-semibold"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 h-10 text-sm font-semibold"
              variant={"outlineBlack"}
              onClick={handleStripePayment}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4 mr-2" />
              )}
              Purchase Credits
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
