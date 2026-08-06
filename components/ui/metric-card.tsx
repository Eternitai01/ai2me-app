/**
 * Metric Card Components
 * Reusable metric display cards for analytics dashboards
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertCircle,
  CheckCircle2,
  Zap,
  DollarSign,
  Activity,
  Shield,
  Database
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    direction: 'up' | 'down' | 'stable';
    value: string;
    label?: string;
  };
  status?: 'success' | 'warning' | 'error' | 'info';
  icon?: React.ReactNode;
  progress?: {
    value: number;
    max?: number;
    color?: 'default' | 'success' | 'warning' | 'error';
  };
  className?: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  trend,
  status,
  icon,
  progress,
  className,
}: MetricCardProps) {
  const getTrendIcon = () => {
    if (!trend) return null;
    
    switch (trend.direction) {
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
    if (!trend) return '';
    
    switch (trend.direction) {
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

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'info':
        return 'border-blue-200 bg-blue-50';
      default:
        return '';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'info':
        return <AlertCircle className="h-4 w-4 text-blue-600" />;
      default:
        return null;
    }
  };

  const getProgressColor = () => {
    if (!progress) return '';
    
    switch (progress.color) {
      case 'success':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return '';
    }
  };

  return (
    <Card className={cn('h-full', getStatusColor(), className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {icon}
              <p className="text-sm font-medium text-muted-foreground truncate">
                {title}
              </p>
              {getStatusIcon()}
            </div>
            
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-foreground">
                {typeof value === 'number' ? value.toLocaleString() : value}
              </p>
              {trend && (
                <div className={cn('flex items-center gap-1 text-sm', getTrendColor())}>
                  {getTrendIcon()}
                  <span>{trend.value}</span>
                  {trend.label && (
                    <span className="text-muted-foreground">({trend.label})</span>
                  )}
                </div>
              )}
            </div>
            
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">
                {subtitle}
              </p>
            )}
            
            {progress && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Progress</span>
                  <span>{progress.value}%</span>
                </div>
                <Progress 
                  value={progress.value} 
                  className={cn("h-2", getProgressColor())}
                />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Specialized metric cards for common use cases
interface ComplianceScoreCardProps {
  score: number;
  previousScore?: number;
  target?: number;
}

export function ComplianceScoreCard({ score, previousScore, target = 95 }: ComplianceScoreCardProps) {
  const trend = previousScore 
    ? {
        direction: score > previousScore ? 'up' as const : score < previousScore ? 'down' as const : 'stable' as const,
        value: `${Math.abs(score - previousScore).toFixed(1)}%`,
        label: 'vs previous'
      }
    : undefined;

  const status = score >= target ? 'success' : score >= target - 5 ? 'warning' : 'error';

  return (
    <MetricCard
      title="Compliance Score"
      value={`${score.toFixed(1)}%`}
      subtitle={`Target: ${target}%`}
      trend={trend}
      status={status}
      icon={<Shield className="h-4 w-4" />}
      progress={{
        value: score,
        max: 100,
        color: status
      }}
    />
  );
}

interface TransactionMetricCardProps {
  total: number;
  verified: number;
  pending: number;
  failed: number;
}

export function TransactionMetricCard({ total, verified, pending, failed }: TransactionMetricCardProps) {
  const successRate = total > 0 ? (verified / total) * 100 : 0;
  const status = successRate >= 95 ? 'success' : successRate >= 90 ? 'warning' : 'error';

  return (
    <MetricCard
      title="Transactions"
      value={total.toLocaleString()}
      subtitle={`${verified.toLocaleString()} verified, ${pending.toLocaleString()} pending, ${failed.toLocaleString()} failed`}
      trend={{
        direction: successRate >= 95 ? 'up' : 'down',
        value: `${successRate.toFixed(1)}%`,
        label: 'success rate'
      }}
      status={status}
      icon={<Activity className="h-4 w-4" />}
    />
  );
}

interface PerformanceMetricCardProps {
  averageTime: number;
  throughput: number;
  uptime: number;
}

export function PerformanceMetricCard({ averageTime, throughput, uptime }: PerformanceMetricCardProps) {
  const status = uptime >= 99.9 ? 'success' : uptime >= 99 ? 'warning' : 'error';

  return (
    <MetricCard
      title="Performance"
      value={`${averageTime.toFixed(1)}s`}
      subtitle={`${throughput} tx/min throughput`}
      trend={{
        direction: uptime >= 99.9 ? 'up' : 'stable',
        value: `${uptime.toFixed(2)}%`,
        label: 'uptime'
      }}
      status={status}
      icon={<Zap className="h-4 w-4" />}
      progress={{
        value: uptime,
        max: 100,
        color: status
      }}
    />
  );
}

interface CostMetricCardProps {
  totalCost: number;
  previousCost?: number;
  budget?: number;
}

export function CostMetricCard({ totalCost, previousCost, budget }: CostMetricCardProps) {
  const trend = previousCost 
    ? {
        direction: totalCost > previousCost ? 'up' as const : totalCost < previousCost ? 'down' as const : 'stable' as const,
        value: `$${Math.abs(totalCost - previousCost).toFixed(2)}`,
        label: 'vs previous'
      }
    : undefined;

  const budgetUsed = budget ? (totalCost / budget) * 100 : 0;
  const status = budget 
    ? budgetUsed <= 80 ? 'success' : budgetUsed <= 95 ? 'warning' : 'error'
    : 'info';

  return (
    <MetricCard
      title="Total Cost"
      value={`$${totalCost.toFixed(2)}`}
      subtitle={budget ? `Budget: $${budget.toFixed(2)}` : 'Current period'}
      trend={trend}
      status={status}
      icon={<DollarSign className="h-4 w-4" />}
      progress={budget ? {
        value: budgetUsed,
        max: 100,
        color: status === 'info' ? 'default' : status
      } : undefined}
    />
  );
}

interface StorageMetricCardProps {
  totalSize: number;
  s3Count: number;
  aclCount: number;
  polygonCount: number;
}

export function StorageMetricCard({ totalSize, s3Count, aclCount, polygonCount }: StorageMetricCardProps) {
  const fullComplianceRate = s3Count > 0 ? (polygonCount / s3Count) * 100 : 0;
  const status = fullComplianceRate >= 90 ? 'success' : fullComplianceRate >= 75 ? 'warning' : 'error';

  return (
    <MetricCard
      title="Storage Distribution"
      value={`${(totalSize / 1024).toFixed(1)} GB`}
      subtitle={`S3: ${s3Count.toLocaleString()}, ACL: ${aclCount.toLocaleString()}, Polygon: ${polygonCount.toLocaleString()}`}
      trend={{
        direction: fullComplianceRate >= 90 ? 'up' : 'stable',
        value: `${fullComplianceRate.toFixed(1)}%`,
        label: 'full compliance'
      }}
      status={status}
      icon={<Database className="h-4 w-4" />}
    />
  );
}

interface SystemHealthCardProps {
  cpu: number;
  memory: number;
  storage: number;
  network: number;
}

export function SystemHealthCard({ cpu, memory, storage, network }: SystemHealthCardProps) {
  const avgUsage = (cpu + memory + storage + network) / 4;
  const status = avgUsage <= 70 ? 'success' : avgUsage <= 85 ? 'warning' : 'error';

  return (
    <MetricCard
      title="System Health"
      value={`${avgUsage.toFixed(0)}%`}
      subtitle={`CPU: ${cpu}%, Memory: ${memory}%, Storage: ${storage}%, Network: ${network}%`}
      trend={{
        direction: avgUsage <= 70 ? 'up' : avgUsage <= 85 ? 'stable' : 'down',
        value: 'Avg Usage',
        label: 'resource utilization'
      }}
      status={status}
      icon={<Activity className="h-4 w-4" />}
      progress={{
        value: avgUsage,
        max: 100,
        color: status
      }}
    />
  );
}
