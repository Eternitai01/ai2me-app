/**
 * Real-Time Blockchain Monitor Component
 * Live monitoring dashboard for blockchain services and transactions
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Activity,
  Zap,
  Database,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Wifi,
  Settings,
  RefreshCw,
  Pause,
  Play,
  Bell,
  BellOff
} from 'lucide-react';

// Import live indicator components
import {
  LiveIndicator,
  ServiceHealthIndicator,
  ActivityIndicator,
  MetricIndicator,
  ConnectionStats,
} from '@/components/ui/live-indicator';

import { useRealTimeData } from '@/hooks/use-real-time-data';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface RealTimeBlockchainMonitorProps {
  className?: string;
}

export function RealTimeBlockchainMonitor({ className }: RealTimeBlockchainMonitorProps) {
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [monitoringPaused, setMonitoringPaused] = useState(false);

  const {
    isConnected,
    connectionError,
    reconnecting,
    liveTransactions,
    serviceHealth,
    queueStatus,
    activeAlerts,
    liveMetrics,
    connect,
    disconnect,
    acknowledgeAlert,
    clearAlert,
    clearTransactionHistory,
    stats,
  } = useRealTimeData();

  const handleToggleMonitoring = () => {
    if (monitoringPaused) {
      connect();
      setMonitoringPaused(false);
    } else {
      disconnect();
      setMonitoringPaused(true);
    }
  };

  const getOverallSystemStatus = () => {
    const services = Array.from(serviceHealth.values());
    if (services.length === 0) return 'unknown';

    const offlineServices = services.filter(s => s.status === 'offline').length;
    const degradedServices = services.filter(s => s.status === 'degraded').length;

    if (offlineServices > 0) return 'critical';
    if (degradedServices > 0) return 'warning';
    return 'healthy';
  };

  const systemStatus = getOverallSystemStatus();
  const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical').length;
  const highAlerts = activeAlerts.filter(a => a.severity === 'high').length;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            Real-Time Monitor
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Live blockchain service monitoring and alerts
            {stats.lastMessageTime && (
              <span className="block text-[10px] text-muted-foreground/70 mt-1">
                Last update: {formatDistanceToNow(stats.lastMessageTime, { addSuffix: true })}
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="mr-2">
            <LiveIndicator
              status={isConnected ? 'connected' : reconnecting ? 'connecting' : 'disconnected'}
              pulse={isConnected}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAlertsEnabled(!alertsEnabled)}
              className="h-8 w-8 p-0"
              title={alertsEnabled ? "Disable Alerts" : "Enable Alerts"}
            >
              {alertsEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleMonitoring}
              className="h-8 w-8 p-0"
              title={monitoringPaused ? "Resume Monitoring" : "Pause Monitoring"}
            >
              {monitoringPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="h-8 w-8 p-0"
              title="Refresh Page"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Connection Error */}
      {connectionError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Connection Error: {connectionError}
            <Button
              variant="outline"
              size="sm"
              className="ml-3"
              onClick={connect}
            >
              Retry Connection
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                'p-2 rounded-full',
                systemStatus === 'healthy' ? 'bg-green-100' :
                  systemStatus === 'warning' ? 'bg-yellow-100' :
                    systemStatus === 'critical' ? 'bg-red-100' : 'bg-gray-100'
              )}>
                {systemStatus === 'healthy' ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : systemStatus === 'warning' ? (
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                )}
              </div>
              <div>
                <div className="font-medium">System Status</div>
                <div className={cn(
                  'text-sm capitalize',
                  systemStatus === 'healthy' ? 'text-green-600' :
                    systemStatus === 'warning' ? 'text-yellow-600' :
                      'text-red-600'
                )}>
                  {systemStatus}
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
                <div className="font-medium">Queue Status</div>
                <div className="text-sm text-muted-foreground">
                  {queueStatus?.length || 0} pending
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
                <div className="font-medium">Throughput</div>
                <div className="text-sm text-muted-foreground">
                  {queueStatus?.throughput.toFixed(1) || '0'} tx/min
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                'p-2 rounded-full',
                criticalAlerts > 0 ? 'bg-red-100' :
                  highAlerts > 0 ? 'bg-orange-100' : 'bg-green-100'
              )}>
                <Bell className={cn(
                  'h-5 w-5',
                  criticalAlerts > 0 ? 'text-red-600' :
                    highAlerts > 0 ? 'text-orange-600' : 'text-green-600'
                )} />
              </div>
              <div>
                <div className="font-medium">Active Alerts</div>
                <div className="text-sm text-muted-foreground">
                  {activeAlerts.length} total
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Monitoring Tabs */}
      <Tabs defaultValue="services" className="space-y-6">
        <TabsList className="w-full justify-start overflow-x-auto overflow-y-hidden h-auto p-1 bg-muted/50 scrollbar-hide flex-nowrap whitespace-nowrap">
          <TabsTrigger value="services" className="flex-1 sm:flex-none">Services</TabsTrigger>
          <TabsTrigger value="transactions" className="flex-1 sm:flex-none">Transactions</TabsTrigger>
          <TabsTrigger value="metrics" className="flex-1 sm:flex-none">Metrics</TabsTrigger>
          <TabsTrigger value="alerts" className="flex-1 sm:flex-none">Alerts</TabsTrigger>
          <TabsTrigger value="connection" className="flex-1 sm:flex-none">Connection</TabsTrigger>
        </TabsList>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-4">
          <div className="grid gap-4">
            {Array.from(serviceHealth.entries()).map(([serviceName, health]) => (
              <ServiceHealthIndicator
                key={serviceName}
                service={serviceName}
                status={health.status}
                responseTime={health.responseTime}
                lastCheck={health.lastCheck}
              />
            ))}

            {serviceHealth.size === 0 && (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No service health data available</p>
                  <p className="text-sm">Waiting for real-time updates...</p>
                </CardContent>
              </Card>
            )}
          </div>

          {queueStatus && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Queue Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ActivityIndicator
                  active={queueStatus.processing > 0}
                  label="Processing Queue"
                  count={queueStatus.length}
                  rate={queueStatus.throughput}
                  unit="tx/min"
                />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Processing:</span>
                    <span className="ml-2 font-mono">{queueStatus.processing}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Avg Wait:</span>
                    <span className="ml-2 font-mono">{queueStatus.averageWaitTime.toFixed(1)}s</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Live Transaction Updates</h3>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {liveTransactions.length} transactions
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={clearTransactionHistory}
              >
                Clear History
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <ScrollArea className="h-96">
                {liveTransactions.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No recent transaction updates</p>
                    <p className="text-sm">Live updates will appear here</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {liveTransactions.map((tx) => (
                      <div key={tx.transactionId} className="p-4 hover:bg-muted/50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-mono text-sm font-medium">
                            {tx.transactionId}
                          </div>
                          <Badge
                            variant={
                              tx.status === 'verified' ? 'default' :
                                tx.status === 'failed' ? 'destructive' :
                                  'secondary'
                            }
                          >
                            {tx.status}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>Stage: {tx.stage.replace('_', ' ')}</span>
                          <span>Progress: {tx.progress}%</span>
                        </div>

                        <div className="mt-2 bg-gray-200 rounded-full h-2">
                          <div
                            className={cn(
                              'h-2 rounded-full transition-all duration-500',
                              tx.status === 'verified' ? 'bg-green-500' :
                                tx.status === 'failed' ? 'bg-red-500' :
                                  'bg-blue-500'
                            )}
                            style={{ width: `${tx.progress}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-4">
          <div className="grid gap-4">
            {Array.from(liveMetrics.entries()).map(([metricName, metric]) => (
              <MetricIndicator
                key={metricName}
                label={metricName.replace('_', ' ').toUpperCase()}
                value={metric.value}
                unit={metric.unit}
                trend={metric.trend}
                threshold={
                  metricName === 'gas_price' ? { warning: 50, critical: 100 } :
                    metricName === 'error_rate' ? { warning: 5, critical: 10 } :
                      undefined
                }
              />
            ))}

            {liveMetrics.size === 0 && (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No live metrics available</p>
                  <p className="text-sm">Metrics will update in real-time</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Active Alerts</h3>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {activeAlerts.length} alerts
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAlertsEnabled(!alertsEnabled)}
              >
                {alertsEnabled ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                {alertsEnabled ? 'Disable' : 'Enable'}
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {activeAlerts.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p className="text-green-600 font-medium">No active alerts</p>
                  <p className="text-sm">System is operating normally</p>
                </CardContent>
              </Card>
            ) : (
              activeAlerts.map((alert) => (
                <Card key={alert.id} className={cn(
                  'border-l-4',
                  alert.severity === 'critical' ? 'border-l-red-500' :
                    alert.severity === 'high' ? 'border-l-orange-500' :
                      alert.severity === 'medium' ? 'border-l-yellow-500' :
                        'border-l-blue-500'
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={
                            alert.severity === 'critical' ? 'destructive' :
                              alert.severity === 'high' ? 'destructive' :
                                alert.severity === 'medium' ? 'secondary' :
                                  'secondary'
                          }>
                            {alert.severity.toUpperCase()}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                          </span>
                        </div>

                        <h4 className="font-medium mb-1">{alert.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
                        <p className="text-xs text-muted-foreground">Source: {alert.source}</p>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        {!alert.acknowledged && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => acknowledgeAlert(alert.id)}
                          >
                            Acknowledge
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => clearAlert(alert.id)}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Connection Tab */}
        <TabsContent value="connection" className="space-y-4">
          <ConnectionStats
            isConnected={isConnected}
            messagesReceived={stats.messagesReceived}
            uptime={stats.uptime}
            lastMessageTime={stats.lastMessageTime}
          />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Connection Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={connect}
                  disabled={isConnected || reconnecting}
                >
                  <Wifi className="h-4 w-4 mr-2" />
                  Connect
                </Button>

                <Button
                  variant="outline"
                  onClick={disconnect}
                  disabled={!isConnected}
                >
                  <Wifi className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>

                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reload Page
                </Button>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>WebSocket connection provides real-time updates for:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Transaction status changes</li>
                  <li>Service health monitoring</li>
                  <li>Queue status updates</li>
                  <li>System alerts and notifications</li>
                  <li>Performance metrics</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
