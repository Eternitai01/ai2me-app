/**
 * Custom React hook for managing real-time blockchain data
 * Integrates with WebSocket client for live updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  blockchainWebSocket, 
  WebSocketMessage, 
  TransactionUpdate, 
  ServiceHealth, 
  QueueStatus, 
  AlertNotification, 
  MetricUpdate 
} from '@/lib/websocket-client';

export interface UseRealTimeDataReturn {
  // Connection Status
  isConnected: boolean;
  connectionError: string | null;
  reconnecting: boolean;

  // Real-time Data
  liveTransactions: TransactionUpdate[];
  serviceHealth: Map<string, ServiceHealth>;
  queueStatus: QueueStatus | null;
  activeAlerts: AlertNotification[];
  liveMetrics: Map<string, MetricUpdate>;

  // Connection Management
  connect: () => Promise<void>;
  disconnect: () => void;
  
  // Alert Management
  acknowledgeAlert: (alertId: string) => void;
  clearAlert: (alertId: string) => void;
  
  // Data Management
  clearTransactionHistory: () => void;
  
  // Statistics
  stats: {
    messagesReceived: number;
    lastMessageTime: Date | null;
    uptime: number;
  };
}

export function useRealTimeData(): UseRealTimeDataReturn {
  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [reconnecting, setReconnecting] = useState(false);

  // Real-time data state
  const [liveTransactions, setLiveTransactions] = useState<TransactionUpdate[]>([]);
  const [serviceHealth, setServiceHealth] = useState<Map<string, ServiceHealth>>(new Map());
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<AlertNotification[]>([]);
  const [liveMetrics, setLiveMetrics] = useState<Map<string, MetricUpdate>>(new Map());

  // Statistics
  const [messagesReceived, setMessagesReceived] = useState(0);
  const [lastMessageTime, setLastMessageTime] = useState<Date | null>(null);
  const [connectionStartTime, setConnectionStartTime] = useState<Date | null>(null);

  // Refs for cleanup
  const handlersRef = useRef<Array<() => void>>([]);

  // Connection management
  const connect = useCallback(async () => {
    try {
      setConnectionError(null);
      setReconnecting(true);
      
      await blockchainWebSocket.connect();
      
      setIsConnected(true);
      setReconnecting(false);
      setConnectionStartTime(new Date());
      
    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : 'Connection failed');
      setIsConnected(false);
      setReconnecting(false);
      console.error('Failed to connect to real-time service:', error);
    }
  }, []);

  const disconnect = useCallback(() => {
    blockchainWebSocket.disconnect();
    setIsConnected(false);
    setConnectionStartTime(null);
  }, []);

  // Alert management
  const acknowledgeAlert = useCallback((alertId: string) => {
    setActiveAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, acknowledged: true }
          : alert
      )
    );
  }, []);

  const clearAlert = useCallback((alertId: string) => {
    setActiveAlerts(prev => prev.filter(alert => alert.id !== alertId));
  }, []);

  // Data management
  const clearTransactionHistory = useCallback(() => {
    setLiveTransactions([]);
  }, []);

  // Message handlers
  useEffect(() => {
    const handleTransactionUpdate = (message: WebSocketMessage) => {
      const update = message.data as TransactionUpdate;
      setLiveTransactions(prev => {
        const existing = prev.find(tx => tx.transactionId === update.transactionId);
        if (existing) {
          // Update existing transaction
          return prev.map(tx => 
            tx.transactionId === update.transactionId ? update : tx
          );
        } else {
          // Add new transaction (keep last 100 transactions)
          return [update, ...prev].slice(0, 100);
        }
      });
    };

    const handleServiceHealth = (message: WebSocketMessage) => {
      const health = message.data as ServiceHealth;
      setServiceHealth(prev => {
        const newMap = new Map(prev);
        newMap.set(health.service, health);
        return newMap;
      });
    };

    const handleQueueStatus = (message: WebSocketMessage) => {
      const status = message.data as QueueStatus;
      setQueueStatus(status);
    };

    const handleAlert = (message: WebSocketMessage) => {
      const alert = message.data as AlertNotification;
      setActiveAlerts(prev => {
        // Avoid duplicate alerts
        if (prev.some(a => a.id === alert.id)) {
          return prev;
        }
        // Keep last 50 alerts
        return [alert, ...prev].slice(0, 50);
      });
    };

    const handleMetricUpdate = (message: WebSocketMessage) => {
      const metric = message.data as MetricUpdate;
      setLiveMetrics(prev => {
        const newMap = new Map(prev);
        newMap.set(metric.metric, metric);
        return newMap;
      });
    };

    const handleGenericMessage = (message: WebSocketMessage) => {
      console.log('Received generic message:', message);
      setMessagesReceived(prev => prev + 1);
      setLastMessageTime(new Date());
    };

    // Register event handlers
    blockchainWebSocket.on('transaction_update', handleTransactionUpdate);
    blockchainWebSocket.on('service_health', handleServiceHealth);
    blockchainWebSocket.on('queue_status', handleQueueStatus);
    blockchainWebSocket.on('alert', handleAlert);
    blockchainWebSocket.on('metric_update', handleMetricUpdate);
    blockchainWebSocket.on('message', handleGenericMessage);

    // Store cleanup functions
    handlersRef.current = [
      () => blockchainWebSocket.off('transaction_update', handleTransactionUpdate),
      () => blockchainWebSocket.off('service_health', handleServiceHealth),
      () => blockchainWebSocket.off('queue_status', handleQueueStatus),
      () => blockchainWebSocket.off('alert', handleAlert),
      () => blockchainWebSocket.off('metric_update', handleMetricUpdate),
      () => blockchainWebSocket.off('message', handleGenericMessage),
    ];

    return () => {
      // Cleanup event handlers
      handlersRef.current.forEach(cleanup => cleanup());
      handlersRef.current = [];
    };
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Monitor connection status
  useEffect(() => {
    const checkConnection = () => {
      const connected = blockchainWebSocket.isConnected;
      if (connected !== isConnected) {
        setIsConnected(connected);
        if (!connected) {
          setConnectionStartTime(null);
        }
      }
    };

    const interval = setInterval(checkConnection, 1000);
    return () => clearInterval(interval);
  }, [isConnected]);

  // Calculate uptime
  const uptime = connectionStartTime 
    ? (Date.now() - connectionStartTime.getTime()) / 1000 
    : 0;

  return {
    // Connection Status
    isConnected,
    connectionError,
    reconnecting,

    // Real-time Data
    liveTransactions,
    serviceHealth,
    queueStatus,
    activeAlerts,
    liveMetrics,

    // Connection Management
    connect,
    disconnect,

    // Alert Management
    acknowledgeAlert,
    clearAlert,

    // Data Management
    clearTransactionHistory,

    // Statistics
    stats: {
      messagesReceived,
      lastMessageTime,
      uptime,
    },
  };
}
