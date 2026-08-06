/**
 * Status indicator component for displaying operational status
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertCircle, XCircle, Clock } from 'lucide-react';

export type StatusType = 'operational' | 'degraded' | 'offline' | 'pending' | 'ready';

interface StatusIndicatorProps {
  status: StatusType;
  label: string;
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig = {
  operational: {
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-200',
    icon: CheckCircle2,
    label: 'Operational',
  },
  ready: {
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200',
    icon: CheckCircle2,
    label: 'Ready',
  },
  degraded: {
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-200',
    icon: AlertCircle,
    label: 'Degraded',
  },
  offline: {
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-200',
    icon: XCircle,
    label: 'Offline',
  },
  pending: {
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200',
    icon: Clock,
    label: 'Pending',
  },
};

const sizeConfig = {
  sm: {
    text: 'text-xs',
    padding: 'px-2 py-1',
    icon: 'h-3 w-3',
  },
  md: {
    text: 'text-sm',
    padding: 'px-3 py-1.5',
    icon: 'h-4 w-4',
  },
  lg: {
    text: 'text-base',
    padding: 'px-4 py-2',
    icon: 'h-5 w-5',
  },
};

export function StatusIndicator({
  status,
  label,
  className,
  showIcon = true,
  size = 'md',
}: StatusIndicatorProps) {
  const config = statusConfig[status];
  const sizeStyles = sizeConfig[size];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border font-medium',
        config.color,
        config.bgColor,
        config.borderColor,
        sizeStyles.text,
        sizeStyles.padding,
        className
      )}
    >
      {showIcon && <Icon className={sizeStyles.icon} />}
      <span>{label || config.label}</span>
    </div>
  );
}

// Specialized status indicators for common use cases
export function StorageStatusIndicator({ 
  status, 
  storageType 
}: { 
  status: StatusType; 
  storageType: string; 
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium">{storageType}</span>
      <StatusIndicator status={status} label="" size="sm" />
    </div>
  );
}

export function VerificationStatusBadge({ 
  status 
}: { 
  status: 'pending' | 'submitted' | 'confirmed' | 'failed' 
}) {
  const statusMap: Record<string, StatusType> = {
    confirmed: 'operational',
    submitted: 'ready',
    pending: 'pending',
    failed: 'offline',
  };

  return (
    <StatusIndicator 
      status={statusMap[status]} 
      label={status.charAt(0).toUpperCase() + status.slice(1)}
      size="sm"
    />
  );
}
