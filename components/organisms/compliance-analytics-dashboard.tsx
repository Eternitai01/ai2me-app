/**
 * Compliance Analytics Dashboard Component
 * Main dashboard for blockchain compliance analytics and metrics
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  RefreshCw,
  Download,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Calendar
} from 'lucide-react';

// Import our chart components
import {
  ComplianceScoreChart,
  StorageDistributionChart,
  VerificationTrendsChart,
  PerformanceMetricsChart,
  CostAnalyticsChart,
} from '@/components/ui/compliance-chart';

// Import metric cards
import {
  ComplianceScoreCard,
  TransactionMetricCard,
  PerformanceMetricCard,
  CostMetricCard,
  StorageMetricCard,
  SystemHealthCard,
} from '@/components/ui/metric-card';

import { useComplianceAnalytics } from '@/hooks/use-compliance-analytics';
import { TimeRange } from '@/types/analytics';
import { cn } from '@/lib/utils';

interface ComplianceAnalyticsDashboardProps {
  className?: string;
}

export function ComplianceAnalyticsDashboard({ className }: ComplianceAnalyticsDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'24h' | '7d' | '30d' | '90d' | '1y'>('30d');

  const {
    complianceAnalytics,
    analyticsLoading,
    analyticsError,
    metricsLoading,
    metricsError,
    setTimeRange,
    refreshAll,
    lastUpdated,
  } = useComplianceAnalytics();

  const handlePeriodChange = (period: '24h' | '7d' | '30d' | '90d' | '1y') => {
    setSelectedPeriod(period);
    const newTimeRange: TimeRange = {
      start: new Date(Date.now() - getPeriodMs(period)).toISOString(),
      end: new Date().toISOString(),
      period,
    };
    setTimeRange(newTimeRange);
  };

  const getPeriodMs = (period: string) => {
    switch (period) {
      case '24h': return 24 * 60 * 60 * 1000;
      case '7d': return 7 * 24 * 60 * 60 * 1000;
      case '30d': return 30 * 24 * 60 * 60 * 1000;
      case '90d': return 90 * 24 * 60 * 60 * 1000;
      case '1y': return 365 * 24 * 60 * 60 * 1000;
      default: return 30 * 24 * 60 * 60 * 1000;
    }
  };

  const isLoading = analyticsLoading || metricsLoading;
  const hasError = analyticsError || metricsError;

  if (hasError) {
    return (
      <div className={cn('space-y-6', className)}>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {analyticsError || metricsError}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Compliance Analytics</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Comprehensive blockchain compliance metrics and insights
            {lastUpdated && (
              <span className="block text-[10px] text-muted-foreground/70 mt-1">
                Last updated: {lastUpdated.toLocaleString()}
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger className="flex-1 sm:w-44 h-8 text-xs">
              <Calendar className="h-3.5 w-3.5 mr-1.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2 flex-1 sm:flex-none">
            <Button
              variant="outline"
              onClick={refreshAll}
              disabled={isLoading}
              className="flex-1 sm:flex-none h-8 text-xs px-2"
            >
              <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5', isLoading && 'animate-spin')} />
              Refresh
            </Button>

            <Button variant="outline" className="flex-1 sm:flex-none h-8 text-xs px-2">
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <ComplianceScoreCard
              score={complianceAnalytics?.overallScore || 0}
              previousScore={complianceAnalytics?.scoreHistory?.[0]?.score}
            />

            <TransactionMetricCard
              total={complianceAnalytics?.verificationMetrics.totalTransactions || 0}
              verified={complianceAnalytics?.verificationMetrics.verifiedTransactions || 0}
              pending={complianceAnalytics?.verificationMetrics.pendingTransactions || 0}
              failed={complianceAnalytics?.verificationMetrics.failedTransactions || 0}
            />

            <PerformanceMetricCard
              averageTime={complianceAnalytics?.verificationMetrics.averageVerificationTime || 0}
              throughput={complianceAnalytics?.performanceMetrics.throughput.current || 0}
              uptime={complianceAnalytics?.performanceMetrics.systemHealth.uptime || 0}
            />

            <CostMetricCard
              totalCost={complianceAnalytics?.costAnalytics.totalCost || 0}
              previousCost={complianceAnalytics?.costAnalytics.trends?.[0]?.total}
            />
          </>
        )}
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="w-full justify-start overflow-x-auto overflow-y-hidden h-auto p-1 bg-muted/50 scrollbar-hide flex-nowrap whitespace-nowrap">
          <TabsTrigger value="overview" className="flex-1 sm:flex-none">Overview</TabsTrigger>
          <TabsTrigger value="compliance" className="flex-1 sm:flex-none">Compliance</TabsTrigger>
          <TabsTrigger value="performance" className="flex-1 sm:flex-none">Performance</TabsTrigger>
          <TabsTrigger value="storage" className="flex-1 sm:flex-none">Storage</TabsTrigger>
          <TabsTrigger value="costs" className="flex-1 sm:flex-none">Costs</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-48" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-64 w-full" />
                  </CardContent>
                </Card>
              ))
            ) : (
              <>
                {complianceAnalytics && (
                  <>
                    <ComplianceScoreChart
                      data={complianceAnalytics.scoreHistory}
                      showComponents={true}
                    />

                    <StorageDistributionChart
                      data={complianceAnalytics.storageDistribution.breakdown}
                    />

                    <VerificationTrendsChart
                      data={complianceAnalytics.verificationMetrics.verificationTrends}
                    />

                    <PerformanceMetricsChart
                      data={complianceAnalytics.performanceMetrics.responseTime.trends}
                    />
                  </>
                )}
              </>
            )}
          </div>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {isLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-48" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-64 w-full" />
                  </CardContent>
                </Card>
              ))
            ) : (
              <>
                {complianceAnalytics && (
                  <>
                    <ComplianceScoreChart
                      data={complianceAnalytics.scoreHistory}
                      showComponents={true}
                    />

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="h-5 w-5 text-blue-600" />
                          Compliance Frameworks
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-4">
                          <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <div className="font-medium">GDPR</div>
                              <div className="text-sm text-muted-foreground">General Data Protection Regulation</div>
                            </div>
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              98.5% Compliant
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <div className="font-medium">SOX</div>
                              <div className="text-sm text-muted-foreground">Sarbanes-Oxley Act</div>
                            </div>
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              96.2% Compliant
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <div className="font-medium">HIPAA</div>
                              <div className="text-sm text-muted-foreground">Health Insurance Portability</div>
                            </div>
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                              94.1% Partial
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </>
            )}
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-48" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-64 w-full" />
                  </CardContent>
                </Card>
              ))
            ) : (
              <>
                {complianceAnalytics && (
                  <>
                    <PerformanceMetricsChart
                      data={complianceAnalytics.performanceMetrics.responseTime.trends}
                    />

                    <Card>
                      <CardHeader>
                        <CardTitle>Throughput Trends</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64 flex items-center justify-center text-muted-foreground">
                          <div className="text-center">
                            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Throughput chart will be displayed here</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <SystemHealthCard
                      cpu={complianceAnalytics.performanceMetrics.systemHealth.resourceUsage.cpu}
                      memory={complianceAnalytics.performanceMetrics.systemHealth.resourceUsage.memory}
                      storage={complianceAnalytics.performanceMetrics.systemHealth.resourceUsage.storage}
                      network={complianceAnalytics.performanceMetrics.systemHealth.resourceUsage.network}
                    />

                    <Card>
                      <CardHeader>
                        <CardTitle>System Status</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Queue Length</span>
                            <Badge variant="secondary">
                              {complianceAnalytics.performanceMetrics.systemHealth.queueLength} items
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-sm">Error Rate</span>
                            <Badge variant={complianceAnalytics.performanceMetrics.systemHealth.errorRate < 1 ? "secondary" : "destructive"}>
                              {complianceAnalytics.performanceMetrics.systemHealth.errorRate.toFixed(2)}%
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-sm">Uptime</span>
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              {complianceAnalytics.performanceMetrics.systemHealth.uptime.toFixed(2)}%
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </>
            )}
          </div>
        </TabsContent>

        {/* Storage Tab */}
        <TabsContent value="storage" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {isLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-48" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-64 w-full" />
                  </CardContent>
                </Card>
              ))
            ) : (
              <>
                {complianceAnalytics && (
                  <>
                    <StorageDistributionChart
                      data={complianceAnalytics.storageDistribution.breakdown}
                    />

                    <StorageMetricCard
                      totalSize={complianceAnalytics.storageDistribution.trends[0]?.totalSize || 0}
                      s3Count={complianceAnalytics.storageDistribution.trends[0]?.s3 || 0}
                      aclCount={complianceAnalytics.storageDistribution.trends[0]?.azureACL || 0}
                      polygonCount={complianceAnalytics.storageDistribution.trends[0]?.polygon || 0}
                    />
                  </>
                )}
              </>
            )}
          </div>
        </TabsContent>

        {/* Costs Tab */}
        <TabsContent value="costs" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {isLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-48" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-64 w-full" />
                  </CardContent>
                </Card>
              ))
            ) : (
              <>
                {complianceAnalytics && (
                  <>
                    <CostAnalyticsChart
                      data={complianceAnalytics.costAnalytics.trends}
                    />

                    <Card>
                      <CardHeader>
                        <CardTitle>Cost Breakdown</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Storage Costs</span>
                            <span className="font-mono text-sm">
                              ${(
                                complianceAnalytics.costAnalytics.breakdown.storage.s3 +
                                complianceAnalytics.costAnalytics.breakdown.storage.azureACL +
                                complianceAnalytics.costAnalytics.breakdown.storage.polygon
                              ).toFixed(2)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-sm">Compute Costs</span>
                            <span className="font-mono text-sm">
                              ${(
                                complianceAnalytics.costAnalytics.breakdown.compute.processing +
                                complianceAnalytics.costAnalytics.breakdown.compute.verification
                              ).toFixed(2)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-sm">Network Costs</span>
                            <span className="font-mono text-sm">
                              ${(
                                complianceAnalytics.costAnalytics.breakdown.network.dataTransfer +
                                complianceAnalytics.costAnalytics.breakdown.network.apiCalls
                              ).toFixed(2)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t">
                            <span className="text-sm font-medium">Total Cost</span>
                            <span className="font-mono text-sm font-bold">
                              ${complianceAnalytics.costAnalytics.totalCost.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
