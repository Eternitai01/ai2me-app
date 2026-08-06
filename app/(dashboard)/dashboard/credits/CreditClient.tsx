"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CreditCard, Plus, History, RefreshCw } from "lucide-react"
import { PaymentModal } from "@/components/organisms/payment-modal"
import { LazyHistorySection } from "@/components/lazy/lazy-history-section"
import { LazyCreditBalance } from "@/components/lazy/lazy-credit-balance"
import { LazyLowBalanceAlert } from "@/components/lazy/lazy-low-balance-alert"
import { useLazyCreditData } from "@/hooks/use-lazy-credit-data"
import { useAuth } from "@/context/AuthContext"
import { toast } from "sonner"

export default function CreditsClient() {
    const [paymentModalOpen, setPaymentModalOpen] = useState(false)
    const { user } = useAuth()
    const searchParams = useSearchParams()
    const router = useRouter()

    const {
        creditBalance,
        creditBalanceLoading,
        creditBalanceError,
        loadCreditBalance,
        purchaseHistory,
        purchaseHistoryLoading,
        purchaseHistoryError,
        loadPurchaseHistory,
        creditHistory,
        creditHistoryLoading,
        creditHistoryError,
        loadCreditHistory,
        refreshCreditBalance,
        lastUpdated
    } = useLazyCreditData()

    // Refresh credit balance only
    const refreshAllData = async () => {
        if (!user) return

        try {
            await refreshCreditBalance()
            toast.success("Credit balance updated!")
        } catch (error) {
            console.error('Failed to refresh credit balance:', error)
            toast.error("Failed to refresh credit balance")
        }
    }

    // Calculate derived values (only when credit balance is loaded)
    // const currentBalance = creditBalance?.available_credits || 0
    // const totalCredits = creditBalance?.total_purchased || 0

    // Handle payment callbacks
    useEffect(() => {
        const payment = searchParams.get('payment')
        const sessionId = searchParams.get('session_id')

        if (payment === 'success' && sessionId) {
            // Redirect to success page with session ID
            router.push(`/dashboard/credits/success?session_id=${sessionId}`)
        } else if (payment === 'cancelled') {
            // Redirect to cancelled page
            router.push('/dashboard/credits/cancelled')
        }
    }, [searchParams, router])

    // No longer show skeleton - page loads immediately with lazy components

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold">Credits Management</h1>
                    <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
                        Monitor your credit balance, usage history, and purchase options.
                        {lastUpdated && (
                            <span className="block text-xs text-muted-foreground/70 mt-1">
                                Last updated: {lastUpdated.toLocaleTimeString()}
                            </span>
                        )}
                    </p>
                </div>
                <Button
                    variant="outline"
                    onClick={refreshAllData}
                    disabled={creditBalanceLoading}
                    className="flex items-center gap-2 w-full sm:w-auto justify-center"
                >
                    <RefreshCw className={`h-4 w-4 ${creditBalanceLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Low Balance Alert - Lazy Loaded */}
            <LazyLowBalanceAlert
                creditBalance={creditBalance}
                loading={creditBalanceLoading}
                error={creditBalanceError}
                onLoad={loadCreditBalance}
            />

            {/* Current Balance - Lazy Loaded */}
            <LazyCreditBalance
                creditBalance={creditBalance}
                loading={creditBalanceLoading}
                error={creditBalanceError}
                onLoad={loadCreditBalance}
                onRefresh={refreshCreditBalance}
                onAddCredits={() => setPaymentModalOpen(true)}
            />

            {/* Quick Purchase Options */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Quick Purchase
                    </CardTitle>
                    <CardDescription>Choose from our most popular credit packages</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        {[
                            { credits: 10000, price: 10, popular: false },
                            { credits: 25000, price: 25, popular: true },
                            { credits: 50000, price: 50, popular: false },
                            { credits: 100000, price: 100, popular: false }
                        ].map((pkg, index) => (
                            <div
                                key={index}
                                className={`relative p-3 sm:p-4 border rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${pkg.popular ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border hover:border-primary/50'
                                    }`}
                                onClick={() => setPaymentModalOpen(true)}
                            >
                                {pkg.popular && (
                                    <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 sm:left-4 sm:translate-x-0 text-[10px] sm:text-xs">Most Popular</Badge>
                                )}
                                <div className="text-center space-y-1 sm:space-y-2">
                                    <div className="text-xl sm:text-2xl font-bold">{pkg.credits.toLocaleString('en-US')}</div>
                                    <div className="text-[10px] sm:text-sm text-muted-foreground uppercase tracking-wider font-medium">credits</div>
                                    <div className="text-base sm:text-lg font-semibold">${pkg.price}</div>
                                    <div className="text-[10px] text-muted-foreground/70 sm:hidden lg:block">
                                        $1.00 per 1K
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>




            {/* Purchase History - Lazy Loaded */}
            <LazyHistorySection
                title="Purchase History"
                description="Your credit purchase transactions"
                icon={<History className="h-5 w-5" />}
                data={Array.isArray(purchaseHistory) ? purchaseHistory : []}
                loading={purchaseHistoryLoading}
                error={purchaseHistoryError}
                onLoad={loadPurchaseHistory}
                onRefresh={loadPurchaseHistory}
                renderContent={(data) => (
                    <div className="overflow-x-auto scrollbar-hide">
                        <table className="w-full min-w-[600px]">
                            <thead>
                                <tr className="border-b text-muted-foreground/70 text-xs uppercase tracking-wider">
                                    <th className="text-left py-3 font-semibold">Date</th>
                                    <th className="text-left py-3 font-semibold">Plan</th>
                                    <th className="text-left py-3 font-semibold">Credits</th>
                                    <th className="text-left py-3 font-semibold">Amount</th>
                                    <th className="text-left py-3 font-semibold">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(data as Array<{ created_at: string; credits_purchased: number; amount_usd: number; status: string }>).map((purchase, index) => (
                                    <tr key={index} className="border-b">
                                        <td className="py-3">{new Date(purchase.created_at).toLocaleDateString()}</td>
                                        <td className="py-3">Credit Purchase</td>
                                        <td className="py-3">{Number(purchase.credits_purchased).toLocaleString('en-US')}</td>
                                        <td className="py-3">${Number(purchase.amount_usd).toFixed(2)}</td>
                                        <td className="py-3">
                                            <Badge variant={purchase.status === "succeeded" ? "default" : "secondary"}>
                                                {purchase.status}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                emptyMessage="No purchase history found"
            />

            {/* Credit History - Lazy Loaded */}
            <LazyHistorySection
                title="Credit Usage History"
                description="Your credit usage and transaction history"
                icon={<CreditCard className="h-5 w-5" />}
                data={Array.isArray(creditHistory) ? creditHistory : []}
                loading={creditHistoryLoading}
                error={creditHistoryError}
                onLoad={loadCreditHistory}
                onRefresh={loadCreditHistory}
                renderContent={(data) => (
                    <div className="space-y-4">
                        {(data as Array<{ description: string; created_at: string; transaction_id: string; amount: number; transaction_type: string; balance_after: number }>).map((transaction, index) => (
                            <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="space-y-1">
                                    <div className="font-medium">{transaction.description}</div>
                                    <div className="text-sm text-muted-foreground">
                                        {new Date(transaction.created_at).toLocaleString('en-US')}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Transaction ID: {transaction.transaction_id}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`font-semibold ${transaction.transaction_type === 'usage' ? 'text-red-600' : 'text-green-600'
                                        }`}>
                                        {transaction.transaction_type === 'usage' ? '-' : '+'}
                                        {Math.abs(transaction.amount).toLocaleString('en-US')} credits
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        Balance: {transaction.balance_after.toLocaleString('en-US')}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                emptyMessage="No credit usage history found"
            />

            {/* Payment Modal */}
            <PaymentModal open={paymentModalOpen} onOpenChange={setPaymentModalOpen} type="credits" />

            {/* Floating Action Button */}
            <div className="fixed bottom-6 right-6 z-50">
                <Button
                    onClick={() => setPaymentModalOpen(true)}
                    size="lg"
                    className="rounded-full h-14 w-14 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                    <Plus className="h-6 w-6" />
                </Button>
            </div>
        </div>
    )
}
