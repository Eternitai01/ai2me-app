"use client"

import { useEffect, useState, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, CreditCard, ArrowLeft, RefreshCw, Copy, Check } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { toast } from "sonner"

export default function CreditPurchaseSuccessPageClient() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const { user, loading: authLoading } = useAuth()
    const [isLoading, setIsLoading] = useState(true)
    const [paymentData, setPaymentData] = useState<{ message: string; credits_purchased: string; status: string; session_id?: string; payment_id?: string; amount_usd?: number } | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [copiedId, setCopiedId] = useState<string | null>(null)

    const sessionId = searchParams.get('session_id')
    const payment = searchParams.get('payment')

    const handleRefreshCredits = useCallback(async () => {
        if (!user) return

        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL?.replace('/v1', '') || 'http://localhost:8000'
            const response = await fetch(`${backendUrl}/api/credits/balance`, {
                credentials: 'include' // Include cookies for authentication
            })

            if (response.ok) {
                toast.success("Credit balance updated!")
                // Refresh the page to show updated balance
                window.location.reload()
            }
        } catch (error) {
            console.error('Failed to refresh credits:', error)
            toast.error("Failed to refresh credit balance")
        }
    }, [user])

    useEffect(() => {
        // Wait for authentication to load
        if (authLoading) {
            return
        }

        const verifyPayment = async () => {
            if (!sessionId) {
                setError("Missing session ID")
                setIsLoading(false)
                return
            }

            if (!user) {
                setError("Authentication required. Redirecting to home...")
                setTimeout(() => {
                    router.push('/')
                }, 2000)
                setIsLoading(false)
                return
            }

            try {
                const response = await fetch(`/api/stripe/verify-session?session_id=${encodeURIComponent(sessionId)}`, {
                    credentials: 'include' // Include cookies for authentication
                })

                if (!response.ok) {
                    const errorData = await response.json()
                    console.error('Backend error response:', errorData)
                    throw new Error(errorData.detail || 'Failed to verify payment')
                }

                const data = await response.json()
                setPaymentData(data.data) // Access the data property from the response
                toast.success("Payment verified successfully!")

            } catch (error) {
                console.error('Payment verification error:', error)

                // If payment verification fails, check if credits were added anyway
                if (error instanceof Error && error.message.includes('Payment session not found')) {
                    // Check credit balance to see if payment was processed
                    try {
                        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL?.replace('/v1', '') || 'http://localhost:8000'
                        const balanceResponse = await fetch(`${backendUrl}/api/credits/balance`, {
                            credentials: 'include'
                        })
                        if (balanceResponse.ok) {
                            const balanceData = await balanceResponse.json()
                            // If credits were added, show success message
                            if (balanceData.data && balanceData.data.total_purchased > 0) {
                                setPaymentData({
                                    message: 'Payment processed successfully (verified via credit balance)',
                                    credits_purchased: 'Credits added to account',
                                    status: 'succeeded'
                                })
                                toast.success("Payment processed successfully!")
                                return
                            }
                        }
                    } catch (balanceError) {
                        console.error('Error checking credit balance:', balanceError)
                    }
                }

                setError(error instanceof Error ? error.message : 'Failed to verify payment')
                toast.error("Failed to verify payment")
            } finally {
                setIsLoading(false)
            }
        }

        // Check if we have a session ID (from Stripe redirect) or payment=success parameter
        if (sessionId) {
            verifyPayment()
        } else if (payment === 'success' && sessionId) {
            verifyPayment()
        } else {
            // If no session ID, try to get it from the URL hash or other sources
            // Check if we can find session_id in other places
            const hashParams = new URLSearchParams(window.location.hash.substring(1))
            const hashSessionId = hashParams.get('session_id')

            if (hashSessionId) {
                // Update the URL to include the session_id
                const newUrl = new URL(window.location.href)
                newUrl.searchParams.set('session_id', hashSessionId)
                window.history.replaceState({}, '', newUrl.toString())
                // Retry verification
                setTimeout(() => {
                    window.location.reload()
                }, 1000)
                return
            }

            setError(`Invalid payment callback - missing session ID. URL: ${window.location.href}`)
            setIsLoading(false)

            // Add a manual verification option
            setTimeout(() => {
                const shouldRetry = window.confirm(
                    'Payment verification failed. This might be due to a webhook delay. Would you like to check your credit balance to see if the payment was processed?'
                )
                if (shouldRetry) {
                    handleRefreshCredits()
                }
            }, 2000)
        }
    }, [sessionId, payment, user, authLoading, handleRefreshCredits, router])

    const copyToClipboard = async (text: string, id: string) => {
        try {
            await navigator.clipboard.writeText(text)
            setCopiedId(id)
            toast.success("Copied to clipboard!")
            setTimeout(() => setCopiedId(null), 2000)
        } catch (error) {
            console.error('Failed to copy:', error)
            toast.error("Failed to copy to clipboard")
        }
    }

    if (authLoading || isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">
                        {authLoading ? 'Loading authentication...' : 'Verifying your payment...'}
                    </p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="max-w-2xl mx-auto space-y-6">
                <Card className="border-destructive">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive">
                            <CreditCard className="h-5 w-5" />
                            Payment Verification Failed
                        </CardTitle>
                        <CardDescription>
                            There was an issue verifying your payment. Please contact support if the problem persists.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 bg-destructive/10 rounded-lg">
                            <p className="text-sm text-destructive font-medium">Error Details:</p>
                            <p className="text-sm text-destructive/80 mt-1">{error}</p>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => router.push('/dashboard/credits')}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Credits
                            </Button>
                            <Button onClick={() => window.location.reload()}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Try Again
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Success Header */}
            <Card className="border-green-200 bg-green-50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-700">
                        <CheckCircle className="h-5 w-5" />
                        Payment Successful!
                    </CardTitle>
                    <CardDescription className="text-green-600">
                        Your credits have been added to your account successfully.
                    </CardDescription>
                </CardHeader>
            </Card>

            {/* Payment Details */}
            {paymentData && (
                <Card>
                    <CardHeader>
                        <CardTitle>Payment Details</CardTitle>
                        <CardDescription>Your credit purchase has been processed</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-4">
                            {/* Amount and Credits in 2-column grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Amount Paid</p>
                                    <p className="font-semibold">${paymentData.amount_usd}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Credits Added</p>
                                    <p className="font-semibold">{Number(paymentData.credits_purchased).toLocaleString('en-US')}</p>
                                </div>
                            </div>

                            {/* IDs in single column with proper wrapping */}
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Session ID</p>
                                    <div className="flex items-center gap-2 bg-gray-100 p-2 rounded border">
                                        <p className="font-mono text-xs break-all flex-1">
                                            {paymentData.session_id}
                                        </p>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => copyToClipboard(paymentData.session_id || '', 'session')}
                                            className="h-6 w-6 p-0"
                                        >
                                            {copiedId === 'session' ? (
                                                <Check className="h-3 w-3 text-green-600" />
                                            ) : (
                                                <Copy className="h-3 w-3" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Payment ID</p>
                                    <div className="flex items-center gap-2 bg-gray-100 p-2 rounded border">
                                        <p className="font-mono text-xs break-all flex-1">
                                            {paymentData.payment_id}
                                        </p>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => copyToClipboard(paymentData.payment_id || '', 'payment')}
                                            className="h-6 w-6 p-0"
                                        >
                                            {copiedId === 'payment' ? (
                                                <Check className="h-3 w-3 text-green-600" />
                                            ) : (
                                                <Copy className="h-3 w-3" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Actions */}
            <Card>
                <CardContent className="pt-6">
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Your credits are now available for use. You can start making API calls immediately.
                        </p>
                        <div className="flex gap-3">
                            <Button onClick={() => router.push('/dashboard/credits')}>
                                <CreditCard className="h-4 w-4 mr-2" />
                                View Credits
                            </Button>
                            <Button variant="outlineBlack" onClick={handleRefreshCredits}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Refresh Balance
                            </Button>
                            <Button variant="outlineBlack" onClick={() => router.push('/dashboard')}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Dashboard
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
