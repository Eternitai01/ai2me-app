"use client";

import { useState } from "react";
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
  TrendingUp,
  AlertTriangle,
  Target,
  Zap,
} from "lucide-react";

export default function CostManagementPage() {
  const [timeRange, setTimeRange] = useState("30d");
  const [budgetAlert, setBudgetAlert] = useState("500");

  // Mock data
  const spendingData = [
    {
      date: "Week 1",
      total: 125.5,
      openai: 75.2,
      anthropic: 35.8,
      google: 14.5,
    },
    {
      date: "Week 2",
      total: 142.3,
      openai: 85.4,
      anthropic: 38.9,
      google: 18.0,
    },
    {
      date: "Week 3",
      total: 118.75,
      openai: 68.25,
      anthropic: 32.5,
      google: 18.0,
    },
    {
      date: "Week 4",
      total: 156.8,
      openai: 92.4,
      anthropic: 42.4,
      google: 22.0,
    },
  ];

  const providerCosts = [
    { name: "OpenAI", value: 321.25, percentage: 58, color: "#4f46e5" },
    { name: "Anthropic", value: 149.6, percentage: 27, color: "#3b82f6" },
    { name: "Google", value: 72.5, percentage: 13, color: "#10b981" },
    { name: "Azure", value: 11.2, percentage: 2, color: "#f59e0b" },
  ];

  const optimizationSavings = [
    { category: "Smart Routing", savings: 45.2, percentage: 12 },
    { category: "Model Selection", savings: 32.8, percentage: 8 },
    { category: "Caching", savings: 28.5, percentage: 7 },
    { category: "Rate Limiting", savings: 15.3, percentage: 4 },
  ];

  const forecastData = [
    { month: "Jan", actual: 543.25, forecast: 520.0 },
    { month: "Feb", actual: 612.8, forecast: 580.0 },
    { month: "Mar", actual: null, forecast: 645.0 },
    { month: "Apr", actual: null, forecast: 680.0 },
  ];

  const currentSpend = 543.25;
  const monthlyBudget = 1000;
  const budgetUsed = (currentSpend / monthlyBudget) * 100;

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
            <SelectTrigger className="w-32">
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
        {budgetUsed > 80 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You&apos;ve used {budgetUsed.toFixed(1)}% of your monthly budget.
              Consider reviewing your usage patterns.
            </AlertDescription>
          </Alert>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${currentSpend}</div>
              <div className="space-y-2 mt-2">
                <Progress value={budgetUsed} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  ${currentSpend} of ${monthlyBudget} budget used
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
              <div className="text-2xl font-bold">$23.45</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">-8%</span> from last month
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
              <div className="text-2xl font-bold">$6.02</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">-12%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Savings This Month
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$121.80</div>
              <p className="text-xs text-muted-foreground">
                From smart routing & optimization
              </p>
            </CardContent>
          </Card>
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
                <BarChart data={spendingData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
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
                                  style={{ backgroundColor: entry.color || entry.stroke || entry.fill }}
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
                  <Bar
                    dataKey="openai"
                    stackId="a"
                    fill="#4f46e5"
                    name="OpenAI"
                  />
                  <Bar
                    dataKey="anthropic"
                    stackId="a"
                    fill="#3b82f6"
                    name="Anthropic"
                  />
                  <Bar
                    dataKey="google"
                    stackId="a"
                    fill="#10b981"
                    name="Google"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Provider Cost Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Cost by Provider</CardTitle>
              <CardDescription>Monthly spending distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={providerCosts}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: $${value}`}
                  >
                    {providerCosts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
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
                              <span className="text-muted-foreground mr-1">Cost:</span>
                              <span className="font-bold">
                                ${typeof data.value === "number" ? data.value.toLocaleString() : data.value}
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
            </CardContent>
          </Card>
        </div>

        {/* Cost Optimization */}
        <Card>
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
            {optimizationSavings.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="font-medium">{item.category}</div>
                  <div className="text-sm text-muted-foreground">
                    {item.percentage}% cost reduction
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">
                    ${item.savings}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    saved this month
                  </div>
                </div>
              </div>
            ))}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between font-semibold">
                <span>Total Savings</span>
                <span className="text-green-600">$121.80</span>
              </div>
            </div>
          </CardContent>
        </Card>

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
                <LineChart data={forecastData}>
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
                                  style={{ backgroundColor: entry.color || entry.stroke || entry.fill }}
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
                    dataKey="forecast"
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
              <CardDescription>Set spending limits and alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="budget">Monthly Budget</Label>
                <Input id="budget" value={`$${monthlyBudget}`} readOnly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="alert">Alert Threshold</Label>
                <div className="flex gap-2">
                  <Input
                    id="alert"
                    value={budgetAlert}
                    onChange={(e) => setBudgetAlert(e.target.value)}
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
                  <span>{budgetUsed.toFixed(1)}%</span>
                </div>
                <Progress value={budgetUsed} className="h-2" />
              </div>
              <Button className="w-full">Configure Budget Alerts</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </ExecutiveOnly>
  );
}
