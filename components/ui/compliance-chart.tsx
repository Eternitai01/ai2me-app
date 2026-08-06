/**
 * Compliance Chart Components
 * Reusable chart components for blockchain compliance analytics
 */

import React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

// Chart color palette
const CHART_COLORS = {
  primary: '#3b82f6',
  secondary: '#10b981',
  accent: '#f59e0b',
  danger: '#ef4444',
  warning: '#f59e0b',
  success: '#10b981',
  muted: '#6b7280',
};

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

interface ChartCardProps {
  title: string;
  subtitle?: string;
  value?: string | number;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  children: React.ReactNode;
  className?: string;
}

export function ChartCard({
  title,
  subtitle,
  value,
  trend,
  trendValue,
  children,
  className,
}: ChartCardProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'stable':
        return <Minus className="h-4 w-4 text-gray-600" />;
      default:
        return null;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      case 'stable':
        return 'text-gray-600';
      default:
        return '';
    }
  };

  return (
    <Card className={cn('h-full', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-medium">{title}</CardTitle>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          {value && (
            <div className="text-right">
              <div className="text-2xl font-bold">{value}</div>
              {trend && trendValue && (
                <div className={cn('flex items-center gap-1 text-sm', getTrendColor())}>
                  {getTrendIcon()}
                  <span>{trendValue}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

interface ComplianceScoreChartProps {
  data: Array<{
    timestamp: string;
    score: number;
    s3?: number;
    azureACL?: number;
    polygon?: number;
  }>;
  showComponents?: boolean;
}

export function ComplianceScoreChart({ data, showComponents = false }: ComplianceScoreChartProps) {
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const currentScore = data[data.length - 1]?.score || 0;
  const previousScore = data[data.length - 2]?.score || 0;
  const trend = currentScore > previousScore ? 'up' : currentScore < previousScore ? 'down' : 'stable';
  const trendValue = `${Math.abs(currentScore - previousScore).toFixed(1)}%`;

  return (
    <ChartCard
      title="Compliance Score Trend"
      subtitle="Overall compliance score over time"
      value={`${currentScore.toFixed(1)}%`}
      trend={trend}
      trendValue={trendValue}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatTimestamp}
            stroke="#64748b"
            fontSize={12}
          />
          <YAxis
            domain={[80, 100]}
            stroke="#64748b"
            fontSize={12}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-popover text-popover-foreground p-3 border border-border rounded-lg shadow-lg">
                    <p className="font-medium mb-2">Date: {formatTimestamp(label as string)}</p>
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
                          {entry.value.toFixed(1)}%
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
            dataKey="score"
            stroke={CHART_COLORS.primary}
            strokeWidth={3}
            dot={{ fill: CHART_COLORS.primary, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: CHART_COLORS.primary, strokeWidth: 2 }}
          />
          {showComponents && (
            <>
              <Line
                type="monotone"
                dataKey="s3"
                stroke={CHART_COLORS.success}
                strokeWidth={2}
                strokeDasharray="5 5"
                name="S3"
              />
              <Line
                type="monotone"
                dataKey="azureACL"
                stroke={CHART_COLORS.warning}
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Azure ACL"
              />
              <Line
                type="monotone"
                dataKey="polygon"
                stroke={CHART_COLORS.accent}
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Polygon"
              />
            </>
          )}
          <Legend />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

interface StorageDistributionChartProps {
  data: {
    s3Only: { count: number; percentage: number };
    s3AndACL: { count: number; percentage: number };
    fullCompliance: { count: number; percentage: number };
  };
}

export function StorageDistributionChart({ data }: StorageDistributionChartProps) {
  const pieData = [
    { name: 'S3 Only', value: data.s3Only.count, percentage: data.s3Only.percentage },
    { name: 'S3 + ACL', value: data.s3AndACL.count, percentage: data.s3AndACL.percentage },
    { name: 'Full Compliance', value: data.fullCompliance.count, percentage: data.fullCompliance.percentage },
  ];

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: unknown }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as { name: string; value: number; percentage: number };
      return (
        <div className="bg-popover text-popover-foreground p-3 border border-border rounded-lg shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            Count: {data.value.toLocaleString()}
          </p>
          <p className="text-sm text-muted-foreground">
            Percentage: {data.percentage.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percentage } = props;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${percentage.toFixed(0)}%`}
      </text>
    );
  };

  return (
    <ChartCard
      title="Storage Distribution"
      subtitle="Transaction storage tier breakdown"
      value={`${data.fullCompliance.percentage.toFixed(1)}%`}
      trend="up"
      trendValue="Full Compliance"
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={CustomLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

interface VerificationTrendsChartProps {
  data: Array<{
    timestamp: string;
    verified: number;
    pending: number;
    failed: number;
  }>;
}

export function VerificationTrendsChart({ data }: VerificationTrendsChartProps) {
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const totalTransactions = data.reduce((sum, item) => sum + item.verified + item.pending + item.failed, 0);
  const totalVerified = data.reduce((sum, item) => sum + item.verified, 0);
  const successRate = totalTransactions > 0 ? (totalVerified / totalTransactions) * 100 : 0;

  return (
    <ChartCard
      title="Verification Trends"
      subtitle="Transaction verification status over time"
      value={`${successRate.toFixed(1)}%`}
      trend="up"
      trendValue="Success Rate"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatTimestamp}
            stroke="#64748b"
            fontSize={12}
          />
          <YAxis stroke="#64748b" fontSize={12} />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-popover text-popover-foreground p-3 border border-border rounded-lg shadow-lg">
                    <p className="font-medium mb-2">Date: {formatTimestamp(label as string)}</p>
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
                          {entry.value.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="verified"
            stackId="1"
            stroke={CHART_COLORS.success}
            fill={CHART_COLORS.success}
            name="Verified"
          />
          <Area
            type="monotone"
            dataKey="pending"
            stackId="1"
            stroke={CHART_COLORS.warning}
            fill={CHART_COLORS.warning}
            name="Pending"
          />
          <Area
            type="monotone"
            dataKey="failed"
            stackId="1"
            stroke={CHART_COLORS.danger}
            fill={CHART_COLORS.danger}
            name="Failed"
          />
          <Legend />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

interface PerformanceMetricsChartProps {
  data: Array<{
    timestamp: string;
    s3: number;
    acl: number;
    blockchain: number;
    total: number;
  }>;
}

export function PerformanceMetricsChart({ data }: PerformanceMetricsChartProps) {
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit'
    });
  };

  const avgTotal = data.reduce((sum, item) => sum + item.total, 0) / data.length;

  return (
    <ChartCard
      title="Response Time Trends"
      subtitle="Average response times by component"
      value={`${avgTotal.toFixed(1)}s`}
      trend="down"
      trendValue="Avg Total"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatTimestamp}
            stroke="#64748b"
            fontSize={12}
          />
          <YAxis
            stroke="#64748b"
            fontSize={12}
            label={{ value: 'Seconds', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-popover text-popover-foreground p-3 border border-border rounded-lg shadow-lg">
                    <p className="font-medium mb-2">Time: {formatTimestamp(label as string)}</p>
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
                          {entry.value.toFixed(1)}s
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
            dataKey="s3"
            stroke={CHART_COLORS.success}
            strokeWidth={2}
            name="S3 Upload"
          />
          <Line
            type="monotone"
            dataKey="acl"
            stroke={CHART_COLORS.warning}
            strokeWidth={2}
            name="ACL Logging"
          />
          <Line
            type="monotone"
            dataKey="blockchain"
            stroke={CHART_COLORS.primary}
            strokeWidth={2}
            name="Blockchain"
          />
          <Line
            type="monotone"
            dataKey="total"
            stroke={CHART_COLORS.danger}
            strokeWidth={3}
            strokeDasharray="5 5"
            name="Total"
          />
          <Legend />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

interface CostAnalyticsChartProps {
  data: Array<{
    timestamp: string;
    storage: number;
    compute: number;
    network: number;
    total: number;
  }>;
}

export function CostAnalyticsChart({ data }: CostAnalyticsChartProps) {
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const totalCost = data.reduce((sum, item) => sum + item.total, 0);

  return (
    <ChartCard
      title="Cost Analytics"
      subtitle="Operational costs breakdown over time"
      value={`$${totalCost.toFixed(2)}`}
      trend="up"
      trendValue="Total"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatTimestamp}
            stroke="#64748b"
            fontSize={12}
          />
          <YAxis
            stroke="#64748b"
            fontSize={12}
            label={{ value: 'USD ($)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-popover text-popover-foreground p-3 border border-border rounded-lg shadow-lg">
                    <p className="font-medium mb-2">Date: {formatTimestamp(label as string)}</p>
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
                          ${entry.value.toFixed(2)}
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
            dataKey="storage"
            stackId="cost"
            fill={CHART_COLORS.primary}
            name="Storage"
          />
          <Bar
            dataKey="compute"
            stackId="cost"
            fill={CHART_COLORS.success}
            name="Compute"
          />
          <Bar
            dataKey="network"
            stackId="cost"
            fill={CHART_COLORS.warning}
            name="Network"
          />
          <Legend />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
