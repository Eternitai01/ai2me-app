/**
 * WebSocket Client for Real-Time Blockchain Monitoring
 * Handles real-time data streaming from blockchain services
 */

export interface WebSocketMessage {
  type: 'transaction_update' | 'service_health' | 'queue_status' | 'alert' | 'metric_update';
  timestamp: string;
  data: unknown;
}

export interface TransactionUpdate {
  transactionId: string;
  status: 'pending' | 'processing' | 'verified' | 'failed';
  progress: number;
  stage: 's3_upload' | 'acl_logging' | 'blockchain_submission' | 'verification';
  metadata?: Record<string, unknown>;
}

export interface ServiceHealth {
  service: 'database' | 'blockchain' | 'storage' | 'queue';
  status: 'healthy' | 'degraded' | 'offline';
  responseTime: number;
  lastCheck: string;
  metrics?: Record<string, number>;
}

export interface QueueStatus {
  length: number;
  processing: number;
  throughput: number;
  averageWaitTime: number;
  oldestItem: string;
}

export interface AlertNotification {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  source: string;
  acknowledged: boolean;
  timestamp: string;
}

export interface MetricUpdate {
  metric: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  timestamp: string;
}

export type WebSocketEventHandler = (message: WebSocketMessage) => void;

export class BlockchainWebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 1000;
  private isConnecting = false;
  private eventHandlers: Map<string, WebSocketEventHandler[]> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(url?: string) {
    // Use the blockchain API URL environment variable to construct WebSocket URL
    const blockchainApiUrl = process.env.NEXT_PUBLIC_BLOCKCHAIN_API_URL;
    const wsUrl = this.constructWebSocketUrl(blockchainApiUrl);
    
    this.url = url || wsUrl || (process.env.NODE_ENV === 'production' 
      ? 'wss://us.bc.ai2me.com/ws'
      : 'ws://localhost:8003/ws')
    console.log('[WebSocket] Using URL:', this.url);
  }

  /**
   * Convert HTTP/HTTPS URL to WebSocket URL with /ws path
   */
  private constructWebSocketUrl(apiUrl?: string): string | null {
    if (!apiUrl) return null;
    
    try {
      // Convert https:// to wss:// and http:// to ws://
      const wsUrl = apiUrl
        .replace(/^https:\/\//, 'wss://')
        .replace(/^http:\/\//, 'ws://');
      
      // Add /ws path if not already present
      return wsUrl.endsWith('/ws') ? wsUrl : `${wsUrl}/ws`;
    } catch (error) {
      console.error('Failed to construct WebSocket URL from:', apiUrl, error);
      return null;
    }
  }

  /**
   * Connect to WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        reject(new Error('Connection already in progress'));
        return;
      }

      this.isConnecting = true;

      try {
        const simulate = process.env.NEXT_PUBLIC_ENABLE_WS_SIMULATION === 'true';
        // In development or when explicitly enabled, simulate WebSocket with mock data
        if (process.env.NODE_ENV === 'development' || simulate) {
          this.simulateWebSocket();
          this.isConnecting = false;
          resolve();
          return;
        }

        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          this.stopHeartbeat();
          this.isConnecting = false;
          
          if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnecting = false;
          reject(error);
        };

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * Simulate WebSocket for development
   */
  private simulateWebSocket() {
    
    // Simulate connection events
    setTimeout(() => {
      this.emit('service_health', {
        service: 'database',
        status: 'healthy',
        responseTime: Math.random() * 10 + 2,
        lastCheck: new Date().toISOString(),
      });
    }, 1000);

    // Start simulation intervals
    this.startSimulation();
  }

  /**
   * Start simulation intervals for development
   */
  private startSimulation() {
    // Transaction updates every 5 seconds
    setInterval(() => {
      const transactionUpdate: TransactionUpdate = {
        transactionId: `tx-${Math.random().toString(36).substr(2, 6)}`,
        status: ['pending', 'processing', 'verified', 'failed'][Math.floor(Math.random() * 4)] as 'pending' | 'processing' | 'verified' | 'failed',
        progress: Math.floor(Math.random() * 100),
        stage: ['s3_upload', 'acl_logging', 'blockchain_submission', 'verification'][Math.floor(Math.random() * 4)] as 's3_upload' | 'acl_logging' | 'blockchain_submission' | 'verification',
      };
      
      this.emit('transaction_update', transactionUpdate);
    }, 5000);

    // Service health updates every 10 seconds
    setInterval(() => {
      const services = ['database', 'blockchain', 'storage', 'queue'];
      const service = services[Math.floor(Math.random() * services.length)];
      
      const healthUpdate: ServiceHealth = {
        service: service as 'database' | 'blockchain' | 'storage' | 'queue',
        status: Math.random() > 0.8 ? 'degraded' : 'healthy',
        responseTime: Math.random() * 50 + 5,
        lastCheck: new Date().toISOString(),
        metrics: {
          cpu: Math.random() * 100,
          memory: Math.random() * 100,
          connections: Math.floor(Math.random() * 100),
        }
      };
      
      this.emit('service_health', healthUpdate);
    }, 10000);

    // Queue status updates every 3 seconds
    setInterval(() => {
      const queueUpdate: QueueStatus = {
        length: Math.floor(Math.random() * 100),
        processing: Math.floor(Math.random() * 10),
        throughput: Math.random() * 50 + 10,
        averageWaitTime: Math.random() * 300 + 30,
        oldestItem: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      };
      
      this.emit('queue_status', queueUpdate);
    }, 3000);

    // Metric updates every 2 seconds
    setInterval(() => {
      const metrics = ['gas_price', 'block_time', 'success_rate', 'error_rate'];
      const metric = metrics[Math.floor(Math.random() * metrics.length)];
      
      const metricUpdate: MetricUpdate = {
        metric,
        value: Math.random() * 100,
        unit: metric === 'gas_price' ? 'gwei' : metric === 'block_time' ? 'seconds' : '%',
        trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'stable',
        timestamp: new Date().toISOString(),
      };
      
      this.emit('metric_update', metricUpdate);
    }, 2000);

    // Occasional alerts
    setInterval(() => {
      if (Math.random() > 0.7) { // 30% chance every 30 seconds
        const alert: AlertNotification = {
          id: `alert-${Math.random().toString(36).substr(2, 8)}`,
          severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as 'low' | 'medium' | 'high' | 'critical',
          title: 'System Alert',
          message: 'This is a simulated alert for development testing',
          source: 'blockchain-monitor',
          acknowledged: false,
          timestamp: new Date().toISOString(),
        };
        
        this.emit('alert', alert);
      }
    }, 30000);
  }

  /**
   * Emit a message to event handlers
   */
  private emit(type: string, data: unknown) {
    const message: WebSocketMessage = {
      type: type as 'transaction_update' | 'service_health' | 'queue_status' | 'alert' | 'metric_update',
      timestamp: new Date().toISOString(),
      data,
    };
    
    this.handleMessage(message);
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect() {
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
  }

  /**
   * Subscribe to WebSocket events
   */
  on(eventType: string, handler: WebSocketEventHandler) {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }

  /**
   * Unsubscribe from WebSocket events
   */
  off(eventType: string, handler: WebSocketEventHandler) {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Send message to WebSocket server
   */
  send(message: unknown) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }

  /**
   * Get connection status
   */
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(message: WebSocketMessage) {
    const handlers = this.eventHandlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error('Error in WebSocket event handler:', error);
        }
      });
    }

    // Also notify generic message handlers
    const genericHandlers = this.eventHandlers.get('message');
    if (genericHandlers) {
      genericHandlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error('Error in generic WebSocket handler:', error);
        }
      });
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);
    
    
    setTimeout(() => {
      this.connect().catch(error => {
        console.error('Reconnection failed:', error);
      });
    }, delay);
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping', timestamp: new Date().toISOString() });
      }
    }, 30000); // Send ping every 30 seconds
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}

// Export singleton instance
export const blockchainWebSocket = new BlockchainWebSocketClient();
