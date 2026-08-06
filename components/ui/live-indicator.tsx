/**
 * Live Indicator Components
 * Visual indicators for real-time status and activity
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Wifi, 
  WifiOff, 
  Circle, 
  Activity, 
  Zap, 
  AlertTriangle,
  CheckCircle2,
  Loader2
} from 'lucide-react';

interface LiveIndicatorProps {
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  label?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  className?: string;
}

export function LiveIndicator({ 
  status, 
  label, 
  showIcon = true, 
  size = 'md',
  pulse = false,
  className 
}: LiveIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          color: 'bg-green-500 text-white',
          icon: Wifi,
          defaultLabel: 'Connected',
          dotColor: 'bg-green-500',
        };
      case 'disconnected':
        return {
          color: 'bg-gray-500 text-white',
          icon: WifiOff,
          defaultLabel: 'Disconnected',
          dotColor: 'bg-gray-500',
        };
      case 'connecting':
        return {
          color: 'bg-yellow-500 text-white',
          icon: Loader2,
          defaultLabel: 'Connecting',
          dotColor: 'bg-yellow-500',
        };
      case 'error':
        return {
          color: 'bg-red-500 text-white',
          icon: AlertTriangle,
          defaultLabel: 'Error',
          dotColor: 'bg-red-500',
        };
      default:
        return {
          color: 'bg-gray-500 text-white',
          icon: Circle,
          defaultLabel: 'Unknown',
          dotColor: 'bg-gray-500',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;
  const displayLabel = label || config.defaultLabel;

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <Badge 
      variant="secondary" 
      className={cn(
        config.color,
        sizeClasses[size],
        pulse && 'animate-pulse',
        className
      )}
    >
      <div className="flex items-center gap-2">
        {showIcon && (
          <Icon 
            className={cn(
              iconSizes[size],
              status === 'connecting' && 'animate-spin'
            )} 
          />
        )}
        <span>{displayLabel}</span>
        <div 
          className={cn(
            'w-2 h-2 rounded-full',
            config.dotColor,
            pulse && 'animate-ping'
          )}
        />
      </div>
    </Badge>
  );
}

interface ServiceHealthIndicatorProps {
  service: string;
  status: 'healthy' | 'degraded' | 'offline';
  responseTime?: number;
  lastCheck?: string;
  className?: string;
}

export function ServiceHealthIndicator({ 
  service, 
  status, 
  responseTime, 
  lastCheck,
  className 
}: ServiceHealthIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'healthy':
        return {
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          icon: CheckCircle2,
          label: 'Healthy',
        };
      case 'degraded':
        return {
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          icon: AlertTriangle,
          label: 'Degraded',
        };
      case 'offline':
        return {
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          icon: AlertTriangle,
          label: 'Offline',
        };
      default:
        return {
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          icon: Circle,
          label: 'Unknown',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={cn('flex items-center justify-between p-3 rounded-lg border', config.bgColor, className)}>
      <div className="flex items-center gap-3">
        <Icon className={cn('h-5 w-5', config.color)} />
        <div>
          <div className="font-medium capitalize">{service}</div>
          <div className={cn('text-sm', config.color)}>{config.label}</div>
        </div>
      </div>
      
      <div className="text-right text-sm text-muted-foreground">
        {responseTime && (
          <div className="font-mono">{responseTime.toFixed(1)}ms</div>
        )}
        {lastCheck && (
          <div className="text-xs">
            {new Date(lastCheck).toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
}

interface ActivityIndicatorProps {
  active: boolean;
  label: string;
  count?: number;
  rate?: number;
  unit?: string;
  className?: string;
}

export function ActivityIndicator({ 
  active, 
  label, 
  count, 
  rate, 
  unit = 'per min',
  className 
}: ActivityIndicatorProps) {
  return (
    <div className={cn('flex items-center gap-3 p-3 rounded-lg border', className)}>
      <div className="relative">
        <Activity className={cn(
          'h-5 w-5',
          active ? 'text-green-500' : 'text-gray-400'
        )} />
        {active && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-ping" />
        )}
      </div>
      
      <div className="flex-1">
        <div className="font-medium">{label}</div>
        <div className="text-sm text-muted-foreground">
          {count !== undefined && (
            <span className="mr-3">{count.toLocaleString()} items</span>
          )}
          {rate !== undefined && (
            <span>{rate.toFixed(1)} {unit}</span>
          )}
        </div>
      </div>
      
      <div className={cn(
        'px-2 py-1 rounded-full text-xs font-medium',
        active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
      )}>
        {active ? 'Active' : 'Idle'}
      </div>
    </div>
  );
}

interface MetricIndicatorProps {
  label: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  threshold?: {
    warning: number;
    critical: number;
  };
  className?: string;
}

export function MetricIndicator({ 
  label, 
  value, 
  unit, 
  trend, 
  threshold,
  className 
}: MetricIndicatorProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <Zap className="h-4 w-4 text-green-500" />;
      case 'down':
        return <Zap className="h-4 w-4 text-red-500 rotate-180" />;
      case 'stable':
        return <Circle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getValueColor = () => {
    if (!threshold) return 'text-foreground';
    
    if (value >= threshold.critical) return 'text-red-600';
    if (value >= threshold.warning) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className={cn('flex items-center justify-between p-3 rounded-lg border', className)}>
      <div>
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className={cn('text-lg font-bold font-mono', getValueColor())}>
          {value.toFixed(1)} {unit}
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {getTrendIcon()}
        <div className="text-xs text-muted-foreground capitalize">{trend}</div>
      </div>
    </div>
  );
}

interface AlertIndicatorProps {
  severity: 'low' | 'medium' | 'high' | 'critical';
  count: number;
  latestAlert?: string;
  className?: string;
}

export function AlertIndicator({ 
  severity, 
  count, 
  latestAlert,
  className 
}: AlertIndicatorProps) {
  const getSeverityConfig = () => {
    switch (severity) {
      case 'critical':
        return {
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          borderColor: 'border-red-200',
          icon: AlertTriangle,
        };
      case 'high':
        return {
          color: 'text-orange-600',
          bgColor: 'bg-orange-100',
          borderColor: 'border-orange-200',
          icon: AlertTriangle,
        };
      case 'medium':
        return {
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          borderColor: 'border-yellow-200',
          icon: AlertTriangle,
        };
      case 'low':
        return {
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          borderColor: 'border-blue-200',
          icon: AlertTriangle,
        };
    }
  };

  const config = getSeverityConfig();
  const Icon = config.icon;

  if (count === 0) {
    return (
      <div className={cn('flex items-center gap-2 p-3 rounded-lg border bg-green-50 border-green-200', className)}>
        <CheckCircle2 className="h-5 w-5 text-green-600" />
        <span className="text-green-800 font-medium">No active alerts</span>
      </div>
    );
  }

  return (
    <div className={cn(
      'flex items-center justify-between p-3 rounded-lg border',
      config.bgColor,
      config.borderColor,
      className
    )}>
      <div className="flex items-center gap-3">
        <div className="relative">
          <Icon className={cn('h-5 w-5', config.color)} />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        </div>
        
        <div>
          <div className={cn('font-medium capitalize', config.color)}>
            {count} {severity} Alert{count !== 1 ? 's' : ''}
          </div>
          {latestAlert && (
            <div className="text-sm text-muted-foreground truncate max-w-48">
              {latestAlert}
            </div>
          )}
        </div>
      </div>
      
      <Badge variant="secondary" className={cn(config.color)}>
        {count}
      </Badge>
    </div>
  );
}

interface ConnectionStatsProps {
  isConnected: boolean;
  messagesReceived: number;
  uptime: number;
  lastMessageTime: Date | null;
  className?: string;
}

export function ConnectionStats({ 
  isConnected, 
  messagesReceived, 
  uptime, 
  lastMessageTime,
  className 
}: ConnectionStatsProps) {
  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  return (
    <div className={cn('grid grid-cols-2 gap-4 p-4 rounded-lg border bg-muted/50', className)}>
      <div className="text-center">
        <div className="text-2xl font-bold font-mono">{messagesReceived.toLocaleString()}</div>
        <div className="text-xs text-muted-foreground">Messages Received</div>
      </div>
      
      <div className="text-center">
        <div className="text-2xl font-bold font-mono">{formatUptime(uptime)}</div>
        <div className="text-xs text-muted-foreground">Uptime</div>
      </div>
      
      <div className="col-span-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>Status:</span>
        <LiveIndicator 
          status={isConnected ? 'connected' : 'disconnected'} 
          size="sm"
          pulse={isConnected}
        />
      </div>
      
      {lastMessageTime && (
        <div className="col-span-2 text-xs text-muted-foreground text-center">
          Last message: {lastMessageTime.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}
