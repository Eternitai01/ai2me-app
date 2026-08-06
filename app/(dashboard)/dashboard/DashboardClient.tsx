'use client';

import { useEffect, useCallback } from 'react';
import { useLanguage } from '@/lib/i18n';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Users, Activity, MessageSquare, BarChart2, Settings, Puzzle } from 'lucide-react';
import { LazyCreditBalance } from '@/components/lazy/lazy-credit-balance';
import { LazyLowBalanceAlert } from '@/components/lazy/lazy-low-balance-alert';
import { useLazyCreditData } from '@/hooks/use-lazy-credit-data';


export default function DashboardPageClient() {
    const { t } = useLanguage();
    const searchParams = useSearchParams();
    const router = useRouter();

    const {
        creditBalance,
        creditBalanceLoading,
        creditBalanceError,
        loadCreditBalance,
        refreshCreditBalance,
        lastUpdated
    } = useLazyCreditData();

    // Handle Stripe payment success
    const processStripePayment = useCallback(() => {
        const sessionId = searchParams.get('session_id');
        const payment = searchParams.get('payment');

        if (payment === 'success' && sessionId) {
            // Refresh credit balance after successful payment
            refreshCreditBalance();
            // Redirect to credits page
            router.push('/dashboard/credits');
        }
    }, [searchParams, refreshCreditBalance, router]);

    useEffect(() => {
        processStripePayment();
    }, [processStripePayment]);

    // No longer show skeleton - page loads immediately with lazy components

    return (
        <div className="space-y-6 md:pl-[10px]">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.title', 'Dashboard')}</h1>
                    <p className="text-muted-foreground">
                        {t('dashboard.welcome', "Welcome back! Here's an overview of your account.")}
                        {lastUpdated && (
                            <span className="block text-xs text-muted-foreground/70 mt-1">
                                {t('dashboard.last_updated', 'Last updated')}: {lastUpdated.toLocaleTimeString()}
                            </span>
                        )}
                    </p>
                </div>
                <div className="flex items-center gap-2 ">
                    <Button
                        variant="outlineBlack"
                        onClick={refreshCreditBalance}
                        disabled={creditBalanceLoading}
                    >
                        <Activity className="h-4 w-4 mr-2" />
                        {t('dashboard.refresh', 'Refresh')}
                    </Button>
                    <Button onClick={() => router.push('/dashboard/credits')}>
                        <CreditCard className="h-4 w-4 mr-2" />
                        {t('dashboard.credits', 'Credits')}
                    </Button>
                </div>
            </div>

            {/* Low Balance Alert - Lazy Loaded */}
            <LazyLowBalanceAlert
                creditBalance={creditBalance}
                loading={creditBalanceLoading}
                error={creditBalanceError}
                onLoad={loadCreditBalance}
            />

            {/* Credit Balance - Lazy Loaded */}
            <LazyCreditBalance
                creditBalance={creditBalance}
                loading={creditBalanceLoading}
                error={creditBalanceError}
                onLoad={loadCreditBalance}
                onRefresh={refreshCreditBalance}
                onAddCredits={() => router.push('/dashboard/credits')}
            />

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/dashboard/conversations')}>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-indigo-400" />
                            {t('dashboard.conversations', 'Conversations')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">{t('dashboard.conversations_desc', 'View all agent conversations and message history')}</p>
                    </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/dashboard/usage-analytics')}>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <BarChart2 className="h-5 w-5 text-emerald-400" />
                            {t('dashboard.usage_analytics', 'Usage Analytics')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">{t('dashboard.usage_analytics_desc', 'Track API usage, token consumption and costs')}</p>
                    </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/dashboard/credits')}>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-yellow-400" />
                            {t('dashboard.credits', 'Credits')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">{t('dashboard.credits_desc', 'Manage credit balance and purchase history')}</p>
                    </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/dashboard/connectors')}>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Puzzle className="h-5 w-5 text-blue-400" />
                            {t('dashboard.connectors', 'Connectors')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">{t('dashboard.connectors_desc', 'Connect your tools, CRMs and data sources')}</p>
                    </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/dashboard/subscription')}>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Activity className="h-5 w-5 text-purple-400" />
                            {t('dashboard.subscription', 'Subscription')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">{t('dashboard.subscription_desc', 'View your plan and manage your AgentOS247 subscription')}</p>
                    </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/dashboard/settings')}>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Settings className="h-5 w-5 text-gray-400" />
                            {t('dashboard.settings', 'Settings')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">{t('dashboard.settings_desc', 'Manage your account and organization settings')}</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}