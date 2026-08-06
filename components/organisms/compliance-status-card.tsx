/**
 * Compliance Status Card Component
 * Displays 3-tier storage status and overall compliance metrics
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  Database,
  Lock,
  RefreshCw,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { StatusIndicator, StorageStatusIndicator } from '@/components/ui/status-indicator';
import { ComplianceScoreProgress } from '@/components/ui/progress-bar';
import { ComplianceStatus } from '@/types/blockchain';
import { cn } from '@/lib/utils';

interface ComplianceStatusCardProps {
  complianceStatus: ComplianceStatus | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  className?: string;
}

export function ComplianceStatusCard({
  complianceStatus,
  loading,
  error,
  onRefresh,
  className,
}: ComplianceStatusCardProps) {
  if (error) {
    return (
      <Card className={cn('border-red-200', className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Compliance Status - Error
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
            >
              <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
              Retry
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (loading && !complianceStatus) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-8 w-20" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <div className="space-y-3">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
          <Skeleton className="h-4 w-32" />
        </CardContent>
      </Card>
    );
  }

  const getComplianceLevel = (score: number) => {
    if (score >= 95) return { level: 'Excellent', color: 'text-green-600' };
    if (score >= 85) return { level: 'Good', color: 'text-black-600' };
    if (score >= 70) return { level: 'Fair', color: 'text-yellow-600' };
    return { level: 'Poor', color: 'text-red-600' };
  };

  const complianceLevel = complianceStatus ? getComplianceLevel(complianceStatus.overallScore) : null;

  return (
    <Card className={className}>
      <CardHeader className="pb-3 px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
            <Shield className="h-5 w-5 text-blue-600" />
            Compliance Status
          </CardTitle>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {complianceStatus && complianceLevel && (
              <Badge variant="secondary" className={cn("text-[10px] sm:text-xs shrink-0", complianceLevel.color)}>
                {complianceLevel.level}
              </Badge>
            )}
            <Button
              variant="outlineBlack"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
              className="flex-1 sm:flex-none h-8 text-xs px-2"
            >
              <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5', loading && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {complianceStatus && (
          <>
            {/* Overall Compliance Score */}
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Overall Compliance</span>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-sm font-mono",
                    complianceStatus.overallScore >= 95 ? "text-green-600" :
                      complianceStatus.overallScore >= 85 ? "text-blue-600" :
                        complianceStatus.overallScore >= 70 ? "text-yellow-600" : "text-red-600"
                  )}>
                    {complianceStatus.overallScore.toFixed(1)}%
                  </span>
                  {loading && <div className="animate-pulse h-2 w-2 bg-blue-500 rounded-full" />}
                </div>
              </div>
              <ComplianceScoreProgress score={complianceStatus.overallScore} />

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  {complianceStatus.verifiedTransactions.toLocaleString()} verified
                </span>
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {((complianceStatus.verifiedTransactions / complianceStatus.totalTransactions) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                Total: {complianceStatus.totalTransactions.toLocaleString()} transactions
              </div>
            </div>

            {/* 3-Tier Storage Status */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Database className="h-4 w-4" />
                3-Tier Storage Architecture
              </h4>

              <div className="grid gap-3">
                <StorageStatusIndicator
                  status={complianceStatus.storageStatus.s3}
                  storageType="S3 Encrypted Storage"
                />
                <StorageStatusIndicator
                  status={complianceStatus.storageStatus.azureACL}
                  storageType="Azure Confidential Ledger"
                />
                <StorageStatusIndicator
                  status={complianceStatus.storageStatus.polygon}
                  storageType="Polygon Blockchain"
                />
              </div>
            </div>

            {/* Security Features */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Security Features
              </h4>

              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">AES-256-GCM Encryption</span>
                  <StatusIndicator
                    status={complianceStatus.encryptionStatus ? 'operational' : 'offline'}
                    label={complianceStatus.encryptionStatus ? 'Active' : 'Inactive'}
                    size="sm"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Tamper-Proof Logging</span>
                  <StatusIndicator
                    status={complianceStatus.storageStatus.azureACL === 'operational' ? 'operational' : 'offline'}
                    label={complianceStatus.storageStatus.azureACL === 'operational' ? 'Active' : 'Inactive'}
                    size="sm"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Blockchain Anchoring</span>
                  <StatusIndicator
                    status={complianceStatus.storageStatus.polygon}
                    label={complianceStatus.storageStatus.polygon === 'ready' ? 'Ready' :
                      complianceStatus.storageStatus.polygon === 'pending' ? 'Pending' : 'Offline'}
                    size="sm"
                  />
                </div>
              </div>
            </div>

            {/* Compliance Information */}
            <div className="pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Info className="h-3 w-3" />
                <span>
                  Last updated: {new Date(complianceStatus.lastUpdated).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Compliance Standards */}
            <div className="pt-2">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  GDPR Ready
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  SOX Compliant
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  HIPAA Ready
                </Badge>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
