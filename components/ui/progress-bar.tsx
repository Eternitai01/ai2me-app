/**
 * Enhanced progress bar component for verification progress
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  status?: 'default' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusConfig = {
  default: {
    bg: 'bg-primary',
    text: 'text-primary',
  },
  success: {
    bg: 'bg-green-500',
    text: 'text-green-600',
  },
  warning: {
    bg: 'bg-yellow-500',
    text: 'text-yellow-600',
  },
  error: {
    bg: 'bg-red-500',
    text: 'text-red-600',
  },
};

const sizeConfig = {
  sm: {
    height: 'h-1',
    text: 'text-xs',
  },
  md: {
    height: 'h-2',
    text: 'text-sm',
  },
  lg: {
    height: 'h-3',
    text: 'text-base',
  },
};

export function ProgressBar({
  value,
  max = 100,
  label,
  showPercentage = true,
  status = 'default',
  size = 'md',
  className,
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const config = statusConfig[status];
  const sizeStyles = sizeConfig[size];

  return (
    <div className={cn('w-full', className)}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {label && (
            <span className={cn('font-medium', config.text, sizeStyles.text)}>
              {label}
            </span>
          )}
          {showPercentage && (
            <span className={cn('font-mono', config.text, sizeStyles.text)}>
              {percentage.toFixed(0)}%
            </span>
          )}
        </div>
      )}
      
      <div className={cn('w-full bg-gray-200 rounded-full overflow-hidden', sizeStyles.height)}>
        <div
          className={cn('transition-all duration-500 ease-out rounded-full', config.bg, sizeStyles.height)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Specialized progress bars for blockchain verification
export function VerificationProgress({ 
  progress, 
  status 
}: { 
  progress: number; 
  status: 'pending' | 'submitted' | 'confirmed' | 'failed' 
}) {
  const statusMap = {
    confirmed: 'success' as const,
    submitted: 'default' as const,
    pending: 'default' as const,
    failed: 'error' as const,
  };

  return (
    <ProgressBar
      value={progress}
      status={statusMap[status]}
      showPercentage={false}
      size="sm"
    />
  );
}

export function ComplianceScoreProgress({ 
  score 
}: { 
  score: number 
}) {
  const getStatus = (score: number) => {
    if (score >= 95) return 'success';
    if (score >= 85) return 'warning';
    return 'error';
  };

  return (
    <ProgressBar
      value={score}
      label="Compliance Score"
      status={getStatus(score)}
      showPercentage={true}
      size="md"
    />
  );
}
