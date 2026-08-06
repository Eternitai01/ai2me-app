"use client";

import { useEffect, useState } from "react";
import { ExecutiveOnly } from "@/components/guards/PermissionGuard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
} from "recharts";
import {
  DollarSign,
  TrendingDown,
  AlertTriangle,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import costManagementService, {
  CostManagementData,
} from "@/app/api/costManagement";

export default function CostManagementPage() {
  const [data, setData] = useState<CostManagementData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState("30d");
  const [budgetAlert, setBudgetAlert] = useState("500");

  const loadCostData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const costData =
        await costManagementService.getCostManagementOverview(timeRange);
      setData(costData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load cost data";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCostData();
  }, [timeRange]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(1)}%`;
  };

  const getChangeColor = (value: number) => {
    return value >= 0 ? "text-green-600" : "text-red-600";
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Failed to load cost data
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadCostData}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <ExecutiveOnly
      fallback={
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold">Access Restricted</h1>
            <p className="text-muted-foreground mt-2">
              This page is only accessible to Executives.
            </p>
          </div>
          <div className="text-center py-12">
            <DollarSign className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="text-xl font-semibold mb-2">Cost Management</h2>
            <p className="text-muted-foreground">
              Only users with Executive role can access cost management and
              financial data.
            </p>
          </div>
        </div>
      }
    >
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Cost Management</h1>
            <p className="text-muted-foreground mt-2">
              Track spending, forecasts, and cost optimization opportunities.
            </p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-38">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="12m">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Budget Alert */}
        {data && data.budget_management.usage_percentage > 80 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You&apos;ve used{" "}
              {data.budget_management.usage_percentage.toFixed(1)}% of your
              monthly budget. Consider reviewing your usage patterns.
            </AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                    <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-40 animate-pulse"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Array.from({ length: 2 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card>
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <div>
                        <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                        <div className="h-3 bg-gray-200 rounded w-24 mt-1 animate-pulse"></div>
                      </div>
                      <div className="h-5 bg-gray-200 rounded w-20 animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Array.from({ length: 2 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : data ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    This Month
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(data.metrics.this_month)}
                  </div>
                  <div className="space-y-2 mt-2">
                    <Progress
                      value={data.metrics.budget_usage_percentage}
                      className="h-2"
                    />
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(data.metrics.this_month)} of{" "}
                      {formatCurrency(data.budget_management.monthly_budget)}{" "}
                      budget used
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Daily Average
                  </CardTitle>
                  <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(data.metrics.daily_average)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <span
                      className={getChangeColor(
                        data.metrics.daily_average_change
                      )}
                    >
                      {formatPercentage(data.metrics.daily_average_change)}
                    </span>{" "}
                    from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Cost per 1K Calls
                  </CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(data.metrics.cost_per_1k_calls)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <span
                      className={getChangeColor(
                        data.metrics.cost_per_1k_change
                      )}
                    >
                      {formatPercentage(data.metrics.cost_per_1k_change)}
                    </span>{" "}
                    from last month
                  </p>
                </CardContent>
              </Card>

              {/* <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Savings This Month
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(data.metrics.savings_this_month)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    From smart routing & optimization
                  </p>
                </CardContent>
              </Card> */}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Spending Over Time */}
              <Card>
                <CardHeader>
                  <CardTitle>Spending Over Time</CardTitle>
                  <CardDescription>
                    Weekly spending breakdown by provider
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={data.spending_over_time.weekly_breakdown.map(
                        (week) => ({
                          week: week.week,
                          total: week.total,
                          ...week.by_provider,
                        })
                      )}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip
                        formatter={(value, name) => [`$${value}`, name]}
                        labelFormatter={(label) => `Week: ${label}`}
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-popover text-popover-foreground p-3 border border-border rounded-lg shadow-lg">
                                <p className="font-medium mb-2">{`Week: ${label}`}</p>
                                <div className="space-y-1">
                                  {payload.map((entry, index) => {
                                    if (entry.value > 0) {
                                      return (
                                        <div
                                          key={index}
                                          className="flex items-center justify-between gap-2"
                                        >
                                          <div className="flex items-center gap-2">
                                            <div
                                              className="w-2 h-2 rounded-full"
                                              style={{
                                                backgroundColor: entry.color,
                                              }}
                                            />
                                            <span className="text-sm">
                                              {entry.name}
                                            </span>
                                          </div>
                                          <span className="text-sm font-medium">
                                            ${entry.value.toFixed(2)}
                                          </span>
                                        </div>
                                      );
                                    }
                                    return null;
                                  })}
                                  <div className="border-t pt-1 mt-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-bold">
                                        Total
                                      </span>
                                      <span className="text-sm font-bold">
                                        $
                                        {payload
                                          .reduce(
                                            (sum, entry) =>
                                              sum + (entry.value || 0),
                                            0
                                          )
                                          .toFixed(2)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      {Object.keys(
                        data.spending_over_time.weekly_breakdown[0]
                          ?.by_provider || {}
                      ).map((provider, index) => (
                        <Bar
                          key={provider}
                          dataKey={provider}
                          stackId="a"
                          fill={
                            [
                              "#4f46e5",
                              "#3b82f6",
                              "#10b981",
                              "#f59e0b",
                              "#ef4444",
                              "#8b5cf6",
                              "#06b6d4",
                            ][index % 7]
                          }
                          name={provider}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Provider Cost Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Cost by Provider</CardTitle>
                  <CardDescription>
                    Monthly spending distribution
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Pie Chart */}
                    <div className="flex-1">
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={data.cost_by_provider.providers
                              .filter((provider) => provider.cost > 0)
                              .map((provider) => ({
                                name: provider.provider,
                                value: provider.cost,
                              }))}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={false}
                          >
                            {data.cost_by_provider.providers
                              .filter((provider) => provider.cost > 0)
                              .map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={
                                    [
                                      "#4f46e5",
                                      "#3b82f6",
                                      "#10b981",
                                      "#f59e0b",
                                      "#ef4444",
                                      "#8b5cf6",
                                      "#06b6d4",
                                    ][index % 7]
                                  }
                                />
                              ))}
                          </Pie>
                          <Tooltip
                            formatter={(value, name) => [
                              `$${typeof value === "number" ? value.toFixed(2) : value}`,
                              name
                            ]}
                            labelFormatter={(label) => `Provider: ${label}`}
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0];
                                return (
                                  <div className="bg-popover text-popover-foreground p-3 border border-border rounded-lg shadow-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                      <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: data.color }}
                                      />
                                      <span className="font-medium">{data.name}</span>
                                    </div>
                                    <div className="text-sm">
                                      <span className="text-muted-foreground">Cost: </span>
                                      <span className="font-bold">
                                        ${typeof data.value === "number" ? data.value.toFixed(2) : data.value}
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
                    </div>

                    {/* Provider List */}
                    <div className="flex-1">
                      <div className="space-y-2">
                        {data.cost_by_provider.providers
                          .filter((provider) => provider.cost > 0)
                          .map((provider, index) => (
                            <div
                              key={provider.provider}
                              className="flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{
                                    backgroundColor: [
                                      "#4f46e5",
                                      "#3b82f6",
                                      "#10b981",
                                      "#f59e0b",
                                      "#ef4444",
                                      "#8b5cf6",
                                      "#06b6d4",
                                    ][index % 7],
                                  }}
                                />
                                <span className="text-sm font-medium">
                                  {provider.provider}
                                </span>
                              </div>
                              <span className="text-sm font-bold">
                                ${provider.cost.toFixed(2)}
                              </span>
                            </div>
                          ))}
                        {data.cost_by_provider.providers.filter(
                          (provider) => provider.cost > 0
                        ).length === 0 && (
                            <div className="text-center text-muted-foreground py-4">
                              No usage data available
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Cost Optimization */}
            {/* <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Cost Optimization Savings
                </CardTitle>
                <CardDescription>
                  Savings achieved through intelligent routing and optimization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(data.cost_optimization.breakdown).map(
                  ([key, optimization]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <div className="font-medium">
                          {key
                            .replace("_", " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {optimization.percentage}% cost reduction
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">
                          {formatCurrency(optimization.savings)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          saved this month
                        </div>
                      </div>
                    </div>
                  )
                )}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between font-semibold">
                    <span>Total Savings</span>
                    <span className="text-green-600">
                      {formatCurrency(data.cost_optimization.total_savings)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card> */}

            {/* Forecasting & Budget */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Cost Forecast */}
              <Card>
                <CardHeader>
                  <CardTitle>Cost Forecast</CardTitle>
                  <CardDescription>
                    Predicted spending based on current usage patterns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={data.cost_forecast.monthly_projections}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
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
                                      style={{ backgroundColor: entry.stroke || entry.color }}
                                    />
                                    <span className="text-sm text-muted-foreground">
                                      {entry.name}:
                                    </span>
                                    <span className="text-sm font-bold">
                                      ${typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}
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
                        dataKey="actual"
                        stroke="#4f46e5"
                        name="Actual"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="projected"
                        stroke="#10b981"
                        strokeDasharray="5 5"
                        name="Forecast"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Budget Management */}
              <Card>
                <CardHeader>
                  <CardTitle>Budget Management</CardTitle>
                  <CardDescription>
                    Set spending limits and alerts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="budget">Monthly Budget</Label>
                    <Input
                      id="budget"
                      value={`$${data.budget_management.monthly_budget}`}
                      readOnly
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="alert">Alert Threshold</Label>
                    <div className="flex gap-2">
                      <Input
                        id="alert"
                        value={budgetAlert}
                        onChange={(e) => setBudgetAlert(e.target.value)}
                        readOnly
                        placeholder="500"
                      />
                      <Button variant="outline">Update</Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Get notified when spending reaches this amount
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Current Usage</span>
                      <span>
                        {data.budget_management.usage_percentage.toFixed(1)}%
                      </span>
                    </div>
                    <Progress
                      value={data.budget_management.usage_percentage}
                      className="h-2"
                    />
                  </div>
                  {/* <Button className="w-full">Configure Budget Alerts</Button> */}
                </CardContent>
              </Card>
            </div>
          </>
        ) : null}
      </div>
    </ExecutiveOnly>
  );
}
