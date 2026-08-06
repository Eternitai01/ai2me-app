/**
 * Custom React hook for managing compliance analytics data
 */

import { useState, useEffect, useCallback } from 'react';
import {
  ComplianceAnalytics,
  BlockchainMetrics,
  RegulatoryCompliance,
  TimeRange,
} from '@/types/analytics';
import {
  getComplianceAnalytics,
  getBlockchainMetrics,
  getRegulatoryCompliance,
} from '@/lib/analytics-api';

export interface UseComplianceAnalyticsReturn {
  // Compliance Analytics
  complianceAnalytics: ComplianceAnalytics | null;
  analyticsLoading: boolean;
  analyticsError: string | null;
  refreshAnalytics: () => Promise<void>;

  // Blockchain Metrics
  blockchainMetrics: BlockchainMetrics | null;
  metricsLoading: boolean;
  metricsError: string | null;
  refreshMetrics: () => Promise<void>;

  // Regulatory Compliance
  regulatoryCompliance: RegulatoryCompliance | null;
  complianceLoading: boolean;
  complianceError: string | null;
  refreshCompliance: () => Promise<void>;

  // Time Range Management
  timeRange: TimeRange;
  setTimeRange: (timeRange: TimeRange) => void;

  // Global actions
  refreshAll: () => Promise<void>;
  lastUpdated: Date | null;
}

export function useComplianceAnalytics(
  initialTimeRange?: TimeRange
): UseComplianceAnalyticsReturn {
  // Time Range State
  const [timeRange, setTimeRange] = useState<TimeRange>(
    initialTimeRange || {
      start: new Date(Date.now() - 30 * 24 * 3600000).toISOString(), // 30 days ago
      end: new Date().toISOString(),
      period: '30d'
    }
  );

  // Compliance Analytics State
  const [complianceAnalytics, setComplianceAnalytics] = useState<ComplianceAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  // Blockchain Metrics State
  const [blockchainMetrics, setBlockchainMetrics] = useState<BlockchainMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState<string | null>(null);

  // Regulatory Compliance State
  const [regulatoryCompliance, setRegulatoryCompliance] = useState<RegulatoryCompliance | null>(null);
  const [complianceLoading, setComplianceLoading] = useState(false);
  const [complianceError, setComplianceError] = useState<string | null>(null);

  // Global State
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Compliance Analytics Functions
  const refreshAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    
    try {
      const analytics = await getComplianceAnalytics(timeRange);
      setComplianceAnalytics(analytics);
      setAnalyticsError(null);
      setLastUpdated(new Date());
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch compliance analytics';
      setAnalyticsError(errorMessage);
      console.error('Compliance analytics error:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  }, [timeRange]);

  // Blockchain Metrics Functions
  const refreshMetrics = useCallback(async () => {
    setMetricsLoading(true);
    setMetricsError(null);
    
    try {
      const metrics = await getBlockchainMetrics(timeRange);
      setBlockchainMetrics(metrics);
      setMetricsError(null);
      setLastUpdated(new Date());
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch blockchain metrics';
      setMetricsError(errorMessage);
      console.error('Blockchain metrics error:', error);
    } finally {
      setMetricsLoading(false);
    }
  }, [timeRange]);

  // Regulatory Compliance Functions
  const refreshCompliance = useCallback(async () => {
    setComplianceLoading(true);
    setComplianceError(null);
    
    try {
      const compliance = await getRegulatoryCompliance();
      setRegulatoryCompliance(compliance);
      setComplianceError(null);
      setLastUpdated(new Date());
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch regulatory compliance';
      setComplianceError(errorMessage);
      console.error('Regulatory compliance error:', error);
    } finally {
      setComplianceLoading(false);
    }
  }, []);

  // Global Refresh Function
  const refreshAll = useCallback(async () => {
    await Promise.all([
      refreshAnalytics(),
      refreshMetrics(),
      refreshCompliance(),
    ]);
  }, [refreshAnalytics, refreshMetrics, refreshCompliance]);

  // Auto-refresh when time range changes
  useEffect(() => {
    refreshAnalytics();
    refreshMetrics();
  }, [refreshAnalytics, refreshMetrics]);

  // Initial data load
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Auto-refresh every 60 seconds for analytics data
  useEffect(() => {
    const interval = setInterval(() => {
      refreshAll();
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [refreshAll]);

  return {
    // Compliance Analytics
    complianceAnalytics,
    analyticsLoading,
    analyticsError,
    refreshAnalytics,

    // Blockchain Metrics
    blockchainMetrics,
    metricsLoading,
    metricsError,
    refreshMetrics,

    // Regulatory Compliance
    regulatoryCompliance,
    complianceLoading,
    complianceError,
    refreshCompliance,

    // Time Range Management
    timeRange,
    setTimeRange,

    // Global
    refreshAll,
    lastUpdated,
  };
}
