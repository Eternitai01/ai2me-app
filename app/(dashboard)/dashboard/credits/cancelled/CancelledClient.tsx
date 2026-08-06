"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { XCircle, CreditCard, ArrowLeft, RefreshCw } from "lucide-react"

export default function CreditPurchaseCancelledPageClient() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)

    const sessionId = searchParams.get('session_id')

    useEffect(() => {
        // Simulate loading for better UX
        const timer = setTimeout(() => {
            setIsLoading(false)
        }, 1000)

        return () => clearTimeout(timer)
    }, [])

    const handleRetryPurchase = () => {
        router.push('/dashboard/credits')
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Processing...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Cancelled Header */}
            <Card className="border-orange-200 bg-orange-50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-700">
                        <XCircle className="h-5 w-5" />
                        Payment Cancelled
                    </CardTitle>
                    <CardDescription className="text-orange-600">
                        Your payment was cancelled. No charges have been made to your account.
                    </CardDescription>
                </CardHeader>
            </Card>

            {/* Information Card */}
            <Card>
                <CardHeader>
                    <CardTitle>What happened?</CardTitle>
                    <CardDescription>
                        Your credit purchase was cancelled before completion
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                            <div>
                                <p className="font-medium">No charges were made</p>
                                <p className="text-sm text-muted-foreground">
                                    Your payment method was not charged
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                            <div>
                                <p className="font-medium">No credits were added</p>
                                <p className="text-sm text-muted-foreground">
                                    Your credit balance remains unchanged
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                            <div>
                                <p className="font-medium">You can try again anytime</p>
                                <p className="text-sm text-muted-foreground">
                                    Return to the credits page to make a new purchase
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Session Info (if available) */}
            {sessionId && (
                <Card>
                    <CardHeader>
                        <CardTitle>Session Information</CardTitle>
                        <CardDescription>Reference details for this cancelled session</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div>
                                <p className="text-sm text-muted-foreground">Session ID</p>
                                <p className="font-mono text-xs">{sessionId}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Status</p>
                                <p className="text-orange-600 font-medium">Cancelled</p>
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
                            Ready to try again? You can purchase credits at any time.
                        </p>
                        <div className="flex gap-3">
                            <Button onClick={handleRetryPurchase}>
                                <CreditCard className="h-4 w-4 mr-2" />
                                Try Again
                            </Button>
                            <Button variant="outline" onClick={() => router.push('/dashboard/credits')}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Credits
                            </Button>
                            <Button variant="outline" onClick={() => router.push('/dashboard')}>
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
