"use client"

import React, { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Activity, TrendingUp, Clock, AlertCircle, RefreshCw, AlertTriangle } from "lucide-react"
import { useLazyAnalytics } from "@/hooks/use-lazy-analytics"
import { useTimeRange } from "@/hooks/use-time-range"
import { formatNumber, formatPercentage } from "@/hooks/analytics-utils"

// Types
interface UsageSummaryData {
  total_credits_used: number
  total_requests: number
  average_credits_per_request: number
  usage_trend: {
    direction: string
    percentage_change: number
  }
  generated_at: string
}

interface RecentUsageData {
  transactions: Array<{
    transaction_id: string
    credits_used: number
    balance_after: number
    description: string
    api_request_id: string
    created_at: string
    provider_name: string
    model_name: string
    metadata: {
      credits_used: number
      api_request_id: string
      deduction_timestamp: string
    }
  }>
  total_count: number
  returned_count: number
  generated_at: string
}

interface ModelUsageData {
  provider_usage: Array<{
    provider: string
    requests: number
    credits_used: number
    percentage: number
  }>
  model_usage: Array<{
    model: string
    requests: number
    credits_used: number
    percentage: number
  }>
  total_requests: number
  total_credits: number
  generated_at: string
}

interface UsageTrendsData {
  daily_usage: Array<{
    date: string
    credits_used: number
    request_count: number
  }>
  total_credits_used: number
  average_daily_usage: number
  generated_at: string
}

interface BalanceHistoryData {
  current_balance: number
  balance_history: Array<{
    date: string
    balance: number
    transaction_type: string
    amount: number
    description: string
    credits_used?: number
    credits_added?: number
  }>
  balance_trend: {
    direction: string
    change: number
  }
  generated_at: string
}

export default function AnalyticsDashboard() {
  // Time range hook
  const {
    selectedRange,
    selectRange,
    getAnalyticsParams,
    getRangeSummary,
    timeRanges
  } = useTimeRange()
  const timeRangeParams = getAnalyticsParams()

  // Analytics hooks
  const {
    data: usageSummary,
    loading: summaryLoading,
    error: summaryError,
    refetch: refetchSummary
  } = useLazyAnalytics<UsageSummaryData>('usage-summary', timeRangeParams)

  // Memoize params to prevent infinite re-renders
  const recentUsageParams = useMemo(() => ({ limit: 20, offset: 0 }), [])

  const {
    data: recentUsage,
    loading: usageLoading,
    error: usageError,
    refetch: refetchUsage
  } = useLazyAnalytics<RecentUsageData>('recent-usage', recentUsageParams)

  const {
    data: balanceHistory,
    loading: historyLoading,
    error: historyError,
    refetch: refetchHistory
  } = useLazyAnalytics<BalanceHistoryData>('balance-history', timeRangeParams)

  // Debug the raw data received
  if (process.env.NODE_ENV === 'development' && balanceHistory) {
  }

  const {
    data: modelUsage,
    loading: modelLoading,
    error: modelError,
    refetch: refetchModel
  } = useLazyAnalytics<ModelUsageData>('model-usage', timeRangeParams)

  const {
    data: usageTrends,
    loading: trendsLoading,
    error: trendsError,
    refetch: refetchTrends
  } = useLazyAnalytics<UsageTrendsData>('usage-trends', timeRangeParams)

  // Loading state
  const isLoading = summaryLoading || usageLoading || historyLoading || modelLoading || trendsLoading
  const hasError = summaryError || usageError || historyError || modelError || trendsError

  // Data will be fetched automatically by the hooks on mount and when params change

  // Refresh all data
  const handleRefresh = () => {
    refetchSummary()
    refetchUsage()
    refetchHistory()
    refetchModel()
    refetchTrends()
  }

  // Transform data for charts
  const chartData = balanceHistory?.balance_history?.map(item => {
    const transformedItem = {
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      balance: item.balance,
      creditsAdded: item.credits_added || 0,
      creditsUsed: item.credits_used || 0
    }

    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
    }

    return transformedItem
  }) || []

  // Use analytics data for model usage
  const transactions = recentUsage?.transactions || []

  // Create pie chart data from model usage API
  const pieChartData = modelUsage?.model_usage?.map((model, index) => ({
    name: model.model,
    value: model.percentage,
    color: `hsl(${(index * 137.5) % 360}, 70%, 50%)` // Golden angle for good color distribution
  })) || []

  // Create provider chart data
  const providerChartData = modelUsage?.provider_usage?.map((provider, index) => ({
    name: provider.provider,
    value: provider.percentage,
    color: `hsl(${(index * 137.5) % 360}, 70%, 50%)`
  })) || []

  // Error state
  if (hasError) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Usage Analytics</h1>
            <p className="text-muted-foreground mt-2">Detailed metrics and performance analysis of your AI usage.</p>
          </div>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">Error loading analytics data</span>
            </div>
            <p className="text-red-600 mt-2">
              {summaryError || usageError || historyError}
            </p>
            <Button onClick={handleRefresh} variant="outline" size="sm" className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Usage Analytics</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">Detailed metrics and performance analysis of your AI usage.</p>
        </div>
        <div className="flex flex-row items-center gap-2 sm:gap-4 overflow-x-auto pb-1 sm:pb-0">
          <Select value={selectedRange} onValueChange={selectRange}>
            <SelectTrigger className="w-[120px] sm:w-36 bg-background text-foreground !rounded-full h-10 cursor-pointer border border-border ">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeRanges.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleRefresh}  variant="outlineBlack" size="sm" disabled={isLoading} className="whitespace-nowrap">
            <RefreshCw className={`h-4 w-4 mr-1 sm:mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Credits Used</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {usageSummary ? formatNumber(usageSummary.total_credits_used) : '0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {usageSummary?.usage_trend?.percentage_change ? (
                    <span className={usageSummary.usage_trend.percentage_change > 0 ? "text-green-600" : "text-red-600"}>
                      {usageSummary.usage_trend.percentage_change > 0 ? "+" : ""}{formatPercentage(usageSummary.usage_trend.percentage_change)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">No trend data</span>
                  )} from last period
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {usageSummary ? formatNumber(usageSummary.total_requests) : '0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {usageSummary ? formatNumber(usageSummary.average_credits_per_request) : '0'} avg credits/request
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credits Remaining</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {balanceHistory ? formatNumber(balanceHistory.current_balance) : '0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {balanceHistory && balanceHistory.current_balance < 1000 && (
                    <span className="text-orange-600">Low balance warning</span>
                  )}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Transactions</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {usageLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatNumber(recentUsage?.total_count || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Last {getRangeSummary()}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="balance" className="space-y-6">
        <TabsList className="w-full justify-start overflow-x-auto overflow-y-hidden h-auto p-1 bg-muted/50 scrollbar-hide flex-nowrap whitespace-nowrap">
          <TabsTrigger value="balance" className="flex-shrink-0">Balance History</TabsTrigger>
          <TabsTrigger value="usage" className="flex-shrink-0">Usage Trends</TabsTrigger>
          <TabsTrigger value="models" className="flex-shrink-0">Model Usage</TabsTrigger>
          <TabsTrigger value="transactions" className="flex-shrink-0">Recent Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="balance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Credit Balance History</CardTitle>
              <CardDescription>Your credit balance over time with usage and additions</CardDescription>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="date"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      minTickGap={20}
                    />
                    <YAxis
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-popover text-popover-foreground p-3 border border-border rounded-lg shadow-lg">
                              <p className="font-medium mb-2">{label}</p>
                              {payload.map((entry: any, index: number) => (
                                <div key={index} className="flex items-center gap-2">
                                  <div
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: entry.color || entry.stroke || entry.fill }}
                                  />
                                  <span className="text-sm text-muted-foreground">
                                    {entry.name}:
                                  </span>
                                  <span className="text-sm font-bold">
                                    {typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="balance"
                      stroke="#4f46e5"
                      name="Balance"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="creditsAdded"
                      stroke="#10b981"
                      name="Credits Added"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="creditsUsed"
                      stroke="#ef4444"
                      name="Credits Used"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Usage Trends</CardTitle>
              <CardDescription>Daily credit usage patterns</CardDescription>
            </CardHeader>
            <CardContent>
              {trendsLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={usageTrends?.daily_usage?.map(day => ({
                    date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    creditsUsed: day.credits_used,
                    requestCount: day.request_count
                  })) || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="date"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      minTickGap={20}
                    />
                    <YAxis
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-popover text-popover-foreground p-3 border border-border rounded-lg shadow-lg">
                              <p className="font-medium mb-2">{label}</p>
                              {payload.map((entry: any, index: number) => (
                                <div key={index} className="flex items-center gap-2">
                                  <div
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: entry.color || entry.stroke || entry.fill }}
                                  />
                                  <span className="text-sm text-muted-foreground">
                                    {entry.name}:
                                  </span>
                                  <span className="text-sm font-bold">
                                    {typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="creditsUsed" fill="#ef4444" name="Credits Used" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Model Usage Distribution</CardTitle>
                <CardDescription>Breakdown of requests by AI model</CardDescription>
              </CardHeader>
              <CardContent>
                {modelLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => {
                          const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
                          return isMobile || percent === undefined ? null : `${name}: ${(percent * 100).toFixed(0)}%`;
                        }}
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0];
                            return (
                              <div className="bg-popover text-popover-foreground p-3 border border-border rounded-lg shadow-lg">
                                <div className="flex items-center gap-2 mb-2">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: data.payload.fill || data.color }}
                                  />
                                  <span className="font-medium">{data.name}</span>
                                </div>
                                <div className="text-sm">
                                  <span className="text-muted-foreground mr-1">Percentage:</span>
                                  <span className="font-bold">
                                    {typeof data.value === "number" ? data.value.toLocaleString() : data.value}%
                                  </span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Provider Usage Distribution</CardTitle>
                <CardDescription>Breakdown of requests by AI provider</CardDescription>
              </CardHeader>
              <CardContent>
                {modelLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={providerChartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => {
                          const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
                          return isMobile || percent === undefined ? null : `${name}: ${(percent * 100).toFixed(0)}%`;
                        }}
                      >
                        {providerChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0];
                            return (
                              <div className="bg-popover text-popover-foreground p-3 border border-border rounded-lg shadow-lg">
                                <div className="flex items-center gap-2 mb-2">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: data.payload.fill || data.color }}
                                  />
                                  <span className="font-medium">{data.name}</span>
                                </div>
                                <div className="text-sm">
                                  <span className="text-muted-foreground mr-1">Percentage:</span>
                                  <span className="font-bold">
                                    {typeof data.value === "number" ? data.value.toLocaleString() : data.value}%
                                  </span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Your latest credit usage transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {usageLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div key={transaction.transaction_id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-3 sm:gap-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 sm:mt-0 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-sm sm:text-base">{transaction.description}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {transaction.provider_name} • {transaction.model_name}
                          </p>
                          <p className="text-[10px] text-muted-foreground/70 sm:hidden mt-1">
                            {new Date(transaction.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 border-t sm:border-0 pt-3 sm:pt-0">
                        <div className="hidden sm:block text-[10px] text-right text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleString()}
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-[10px] h-5 bg-green-500/10 text-green-600 border-green-500/20">
                            Completed
                          </Badge>
                          <span className="font-semibold text-sm whitespace-nowrap">{formatNumber(transaction.credits_used)} credits</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {transactions.length === 0 && !usageLoading && (
                    <div className="text-center py-8 text-muted-foreground">
                      No transactions found for the selected time range.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
