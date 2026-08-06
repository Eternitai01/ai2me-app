/**
 * Blockchain Management Interface Component
 * Administrative controls and system management for blockchain services
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Settings,
  Play,
  Pause,
  RotateCcw,
  Trash2,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Server,
  Database,
  Wrench,
  Shield,
  Activity,
  RefreshCw,
  Loader2
} from 'lucide-react';

import {
  pauseQueue,
  resumeQueue,
  clearFailedTransactions,
  processQueueNow,
  getBatchConfiguration,
  updateBatchConfiguration,
  getSystemConfiguration,
  updateSystemConfiguration,
  getFailedTransactions,
  retryFailedTransaction,
  retryAllFailedTransactions,
  getSystemStats,
  getMaintenanceOperations,
  executeMaintenanceOperation,
  BatchConfiguration,
  SystemConfiguration,
  FailedTransaction,
  SystemStats,
  MaintenanceOperation,
} from '@/lib/management-api';

import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface BlockchainManagementInterfaceProps {
  className?: string;
}

export function BlockchainManagementInterface({ className }: BlockchainManagementInterfaceProps) {
  // State management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Configuration state
  const [batchConfig, setBatchConfig] = useState<BatchConfiguration | null>(null);
  const [systemConfig, setSystemConfig] = useState<SystemConfiguration | null>(null);
  const [failedTransactions, setFailedTransactions] = useState<FailedTransaction[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [maintenanceOps, setMaintenanceOps] = useState<MaintenanceOperation[]>([]);

  // Loading states for individual operations
  const [operationLoading, setOperationLoading] = useState<Record<string, boolean>>({});

  // Load initial data
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [batchConf, systemConf, failedTx, stats, maintenance] = await Promise.all([
        getBatchConfiguration(),
        getSystemConfiguration(),
        getFailedTransactions(),
        getSystemStats(),
        getMaintenanceOperations(),
      ]);

      setBatchConfig(batchConf);
      setSystemConfig(systemConf);
      setFailedTransactions(failedTx);
      setSystemStats(stats);
      setMaintenanceOps(maintenance);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load management data');
    } finally {
      setLoading(false);
    }
  };

  const handleOperation = async (operation: string, operationFn: () => Promise<unknown>) => {
    setOperationLoading(prev => ({ ...prev, [operation]: true }));
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await operationFn();
      setSuccessMessage((result as { message?: string })?.message || `${operation} completed successfully`);

      // Refresh relevant data
      if (operation.includes('queue') || operation.includes('transaction')) {
        const [failedTx, stats] = await Promise.all([
          getFailedTransactions(),
          getSystemStats(),
        ]);
        setFailedTransactions(failedTx);
        setSystemStats(stats);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${operation}`);
    } finally {
      setOperationLoading(prev => ({ ...prev, [operation]: false }));
    }
  };

  const handleConfigUpdate = async (
    configType: 'batch' | 'system',
    config: Partial<BatchConfiguration> | Partial<SystemConfiguration>
  ) => {
    setLoading(true);
    setError(null);

    try {
      if (configType === 'batch') {
        const updated = await updateBatchConfiguration(config as Partial<BatchConfiguration>);
        setBatchConfig(updated);
        setSuccessMessage('Batch configuration updated successfully');
      } else {
        const updated = await updateSystemConfiguration(config as Partial<SystemConfiguration>);
        setSystemConfig(updated);
        setSuccessMessage('System configuration updated successfully');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleMaintenanceOperation = async (operationId: string) => {
    setOperationLoading(prev => ({ ...prev, [operationId]: true }));
    setError(null);

    try {
      const result = await executeMaintenanceOperation(operationId);
      setMaintenanceOps(prev =>
        prev.map(op => op.id === operationId ? result : op)
      );
      setSuccessMessage(`Maintenance operation "${result.description}" started`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute maintenance operation');
    } finally {
      setOperationLoading(prev => ({ ...prev, [operationId]: false }));
    }
  };

  if (loading && !batchConfig) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading management interface...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            System Management
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Administrative controls and system configuration
          </p>
        </div>

        <Button onClick={loadAllData} disabled={loading} className="w-full sm:w-auto h-8 text-xs shrink-0">
          <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5', loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Status Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* System Overview */}
      {systemStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-100">
                  <Activity className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="font-medium">Uptime</div>
                  <div className="text-sm text-muted-foreground">
                    {Math.floor(systemStats.uptime / 3600)}h {Math.floor((systemStats.uptime % 3600) / 60)}m
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-100">
                  <Database className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium">Queue Length</div>
                  <div className="text-sm text-muted-foreground">
                    {systemStats.queueLength} pending
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-purple-100">
                  <Zap className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <div className="font-medium">Success Rate</div>
                  <div className="text-sm text-muted-foreground">
                    {systemStats.totalTransactions > 0
                      ? ((systemStats.successfulTransactions / systemStats.totalTransactions) * 100).toFixed(1)
                      : '0.0'}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-orange-100">
                  <Server className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <div className="font-medium">System Load</div>
                  <div className="text-sm text-muted-foreground">
                    CPU: {(systemStats.systemLoad?.cpu ?? 0).toFixed(0)}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Management Tabs */}
      <Tabs defaultValue="queue" className="space-y-6">
        <TabsList className="w-full justify-start overflow-x-auto overflow-y-hidden h-auto p-1 bg-muted/50 scrollbar-hide flex-nowrap whitespace-nowrap">
          <TabsTrigger value="queue" className="flex-1 sm:flex-none">Queue</TabsTrigger>
          <TabsTrigger value="batch" className="flex-1 sm:flex-none">Batch</TabsTrigger>
          <TabsTrigger value="system" className="flex-1 sm:flex-none">System</TabsTrigger>
          <TabsTrigger value="failed" className="flex-1 sm:flex-none">Failed</TabsTrigger>
          <TabsTrigger value="maintenance" className="flex-1 sm:flex-none">Maintenance</TabsTrigger>
        </TabsList>

        {/* Queue Management */}
        <TabsContent value="queue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Queue Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-3">
                <Button
                  onClick={() => handleOperation('pause-queue', pauseQueue)}
                  disabled={operationLoading['pause-queue']}
                  variant="outline"
                  className="h-9 text-xs"
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </Button>

                <Button
                  onClick={() => handleOperation('resume-queue', resumeQueue)}
                  disabled={operationLoading['resume-queue']}
                  variant="outline"
                  className="h-9 text-xs"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Resume
                </Button>

                <Button
                  onClick={() => handleOperation('process-queue', processQueueNow)}
                  disabled={operationLoading['process-queue']}
                  className="h-9 text-xs"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Process
                </Button>

                <Button
                  onClick={() => handleOperation('clear-failed', clearFailedTransactions)}
                  disabled={operationLoading['clear-failed']}
                  variant="destructive"
                  className="h-9 text-xs"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>

              {systemStats && (
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <Label className="text-sm text-muted-foreground">Queue Length</Label>
                    <div className="text-2xl font-bold">{systemStats.queueLength}</div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Active Connections</Label>
                    <div className="text-2xl font-bold">{systemStats.activeConnections}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Batch Configuration */}
        <TabsContent value="batch" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Batch Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {batchConfig && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="batchSize">Batch Size</Label>
                      <Input
                        id="batchSize"
                        type="number"
                        value={batchConfig.batchSize}
                        onChange={(e) => setBatchConfig(prev => prev ? { ...prev, batchSize: parseInt(e.target.value) } : null)}
                        min="1"
                        max="100"
                      />
                    </div>

                    <div>
                      <Label htmlFor="processingInterval">Processing Interval (minutes)</Label>
                      <Input
                        id="processingInterval"
                        type="number"
                        value={batchConfig.processingInterval}
                        onChange={(e) => setBatchConfig(prev => prev ? { ...prev, processingInterval: parseInt(e.target.value) } : null)}
                        min="1"
                        max="60"
                      />
                    </div>

                    <div>
                      <Label htmlFor="maxBatchAge">Max Batch Age (minutes)</Label>
                      <Input
                        id="maxBatchAge"
                        type="number"
                        value={batchConfig.maxBatchAge}
                        onChange={(e) => setBatchConfig(prev => prev ? { ...prev, maxBatchAge: parseInt(e.target.value) } : null)}
                        min="5"
                        max="1440"
                      />
                    </div>

                    <div>
                      <Label htmlFor="retryAttempts">Retry Attempts</Label>
                      <Input
                        id="retryAttempts"
                        type="number"
                        value={batchConfig.retryAttempts}
                        onChange={(e) => setBatchConfig(prev => prev ? { ...prev, retryAttempts: parseInt(e.target.value) } : null)}
                        min="0"
                        max="10"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="autoBatch"
                      checked={batchConfig.autoBatch}
                      onCheckedChange={(checked) => setBatchConfig(prev => prev ? { ...prev, autoBatch: checked } : null)}
                    />
                    <Label htmlFor="autoBatch">Enable Auto-Batching</Label>
                  </div>

                  <Separator />

                  <div className="flex gap-4">
                    <Button
                      onClick={() => handleConfigUpdate('batch', batchConfig)}
                      disabled={loading}
                    >
                      Save Configuration
                    </Button>

                    <Button
                      onClick={() => handleOperation('trigger-batch', async () => {
                        const { triggerBatchProcessing } = await import('@/lib/management-api');
                        return triggerBatchProcessing();
                      })}
                      disabled={operationLoading['trigger-batch']}
                      variant="outline"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Trigger Batch
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Configuration */}
        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                System Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {systemConfig && (
                <>
                  <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="maintenanceMode"
                        checked={systemConfig.maintenanceMode}
                        onCheckedChange={(checked) => setSystemConfig(prev => prev ? { ...prev, maintenanceMode: checked } : null)}
                      />
                      <Label htmlFor="maintenanceMode" className="text-xs sm:text-sm">Maintenance</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="processingEnabled"
                        checked={systemConfig.processingEnabled}
                        onCheckedChange={(checked) => setSystemConfig(prev => prev ? { ...prev, processingEnabled: checked } : null)}
                      />
                      <Label htmlFor="processingEnabled" className="text-xs sm:text-sm">Processing</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="alertsEnabled"
                        checked={systemConfig.alertsEnabled}
                        onCheckedChange={(checked) => setSystemConfig(prev => prev ? { ...prev, alertsEnabled: checked } : null)}
                      />
                      <Label htmlFor="alertsEnabled" className="text-xs sm:text-sm">Alerts</Label>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label htmlFor="maxConcurrent">Max Concurrent Transactions</Label>
                    <Input
                      id="maxConcurrent"
                      type="number"
                      value={systemConfig.maxConcurrentTransactions}
                      onChange={(e) => setSystemConfig(prev => prev ? { ...prev, maxConcurrentTransactions: parseInt(e.target.value) } : null)}
                      min="1"
                      max="50"
                      className="max-w-xs"
                    />
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-3">Timeout Settings (milliseconds)</h4>
                    <div className="grid grid-cols-1 xs:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="s3Timeout" className="text-xs font-semibold">S3 Upload</Label>
                        <Input
                          id="s3Timeout"
                          type="number"
                          className="h-8 text-xs"
                          value={systemConfig.timeoutSettings.s3Upload}
                          onChange={(e) => setSystemConfig(prev => prev ? {
                            ...prev,
                            timeoutSettings: { ...prev.timeoutSettings, s3Upload: parseInt(e.target.value) }
                          } : null)}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="aclTimeout" className="text-xs font-semibold">ACL Logging</Label>
                        <Input
                          id="aclTimeout"
                          type="number"
                          className="h-8 text-xs"
                          value={systemConfig.timeoutSettings.aclLogging}
                          onChange={(e) => setSystemConfig(prev => prev ? {
                            ...prev,
                            timeoutSettings: { ...prev.timeoutSettings, aclLogging: parseInt(e.target.value) }
                          } : null)}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="blockchainTimeout" className="text-xs font-semibold">Blockchain</Label>
                        <Input
                          id="blockchainTimeout"
                          type="number"
                          className="h-8 text-xs"
                          value={systemConfig.timeoutSettings.blockchainSubmission}
                          onChange={(e) => setSystemConfig(prev => prev ? {
                            ...prev,
                            timeoutSettings: { ...prev.timeoutSettings, blockchainSubmission: parseInt(e.target.value) }
                          } : null)}
                        />
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleConfigUpdate('system', systemConfig)}
                    disabled={loading}
                  >
                    Save Configuration
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Failed Transactions */}
        <TabsContent value="failed" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Failed Transactions
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {failedTransactions.length} failed
                  </Badge>
                  <Button
                    onClick={() => handleOperation('retry-all', retryAllFailedTransactions)}
                    disabled={operationLoading['retry-all'] || failedTransactions.length === 0}
                    size="sm"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Retry All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {failedTransactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p className="text-green-600 font-medium">No failed transactions</p>
                    <p className="text-sm">All transactions are processing successfully</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {failedTransactions.map((tx) => (
                      <div key={tx.transactionId} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-mono text-sm font-medium">
                                {tx.transactionId}
                              </span>
                              <Badge variant="secondary">
                                {tx.provider}
                              </Badge>
                              <Badge variant="outline">
                                {tx.model}
                              </Badge>
                            </div>

                            <div className="text-sm text-muted-foreground mb-2">
                              <span>Failed at: {tx.failureStage.replace('_', ' ')}</span>
                              <span className="mx-2">•</span>
                              <span>{tx.credits} credits</span>
                              <span className="mx-2">•</span>
                              <span>{formatDistanceToNow(new Date(tx.failedAt), { addSuffix: true })}</span>
                            </div>

                            <div className="text-sm">
                              <span className="font-medium">Reason: </span>
                              <span className="text-red-600">{tx.failureReason}</span>
                            </div>

                            <div className="text-xs text-muted-foreground mt-1">
                              Retry attempts: {tx.retryCount}
                            </div>
                          </div>

                          <Button
                            onClick={() => handleOperation(`retry-${tx.transactionId}`, () => retryFailedTransaction(tx.transactionId))}
                            disabled={!tx.canRetry || operationLoading[`retry-${tx.transactionId}`]}
                            size="sm"
                            variant="outline"
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Retry
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance Operations */}
        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Maintenance Operations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {maintenanceOps.map((op) => (
                  <div key={op.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{op.description}</h4>
                          <Badge variant={
                            op.status === 'completed' ? 'default' :
                              op.status === 'running' ? 'secondary' :
                                op.status === 'failed' ? 'destructive' :
                                  'outline'
                          }>
                            {op.status}
                          </Badge>
                          {op.requiresDowntime && (
                            <Badge variant="destructive" className="text-xs">
                              Downtime Required
                            </Badge>
                          )}
                        </div>

                        <div className="text-sm text-muted-foreground mb-2">
                          Estimated duration: {op.estimatedDuration} minutes
                        </div>

                        {op.status === 'running' && (
                          <div className="space-y-2">
                            <Progress value={op.progress} className="w-full" />
                            <div className="text-xs text-muted-foreground">
                              Progress: {op.progress}%
                            </div>
                          </div>
                        )}

                        {op.status === 'completed' && op.completedAt && (
                          <div className="text-xs text-green-600">
                            Completed {formatDistanceToNow(new Date(op.completedAt), { addSuffix: true })}
                          </div>
                        )}
                      </div>

                      <Button
                        onClick={() => handleMaintenanceOperation(op.id)}
                        disabled={op.status === 'running' || op.status === 'completed' || operationLoading[op.id]}
                        size="sm"
                      >
                        {operationLoading[op.id] ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Play className="h-4 w-4 mr-2" />
                        )}
                        Execute
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
