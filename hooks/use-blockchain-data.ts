/**
 * Custom React hook for managing blockchain and compliance data
 */

import { useState, useEffect, useCallback } from 'react';
import {
  ComplianceStatus,
  TransactionVerification,
  AuditTrailEntry,
  BlockchainHealthStatus,
  VerificationFilters,
  AuditTrailFilters,
} from '@/types/blockchain';
import {
  getComplianceStatus,
  getRecentTransactionVerifications,
  getAuditTrail,
  getBlockchainHealth,
} from '@/lib/blockchain-api';

export interface UseBlockchainDataReturn {
  // Compliance Status
  complianceStatus: ComplianceStatus | null;
  complianceLoading: boolean;
  complianceError: string | null;
  refreshCompliance: () => Promise<void>;

  // Transaction Verifications
  transactionVerifications: TransactionVerification[];
  verificationsLoading: boolean;
  verificationsError: string | null;
  refreshVerifications: () => Promise<void>;
  updateTransactionStatuses: () => Promise<void>;
  syncBlockchain: () => Promise<void>;
  updateVerificationFilters: (filters: VerificationFilters) => void;

  // Audit Trail
  auditTrail: AuditTrailEntry[];
  auditLoading: boolean;
  auditError: string | null;
  refreshAuditTrail: () => Promise<void>;
  updateAuditFilters: (filters: AuditTrailFilters) => void;

  // Health Status
  healthStatus: BlockchainHealthStatus | null;
  healthLoading: boolean;
  healthError: string | null;
  refreshHealth: () => Promise<void>;

  // Global actions
  refreshAll: () => Promise<void>;
  lastUpdated: Date | null;
}

export function useBlockchainData(): UseBlockchainDataReturn {
  // Compliance Status State
  const [complianceStatus, setComplianceStatus] = useState<ComplianceStatus | null>(null);
  const [complianceLoading, setComplianceLoading] = useState(false);
  const [complianceError, setComplianceError] = useState<string | null>(null);

  // Transaction Verifications State
  const [transactionVerifications, setTransactionVerifications] = useState<TransactionVerification[]>([]);
  const [verificationsLoading, setVerificationsLoading] = useState(false);
  const [verificationsError, setVerificationsError] = useState<string | null>(null);
  const [verificationFilters, setVerificationFilters] = useState<VerificationFilters>({});

  // Audit Trail State
  const [auditTrail, setAuditTrail] = useState<AuditTrailEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [auditFilters, setAuditFilters] = useState<AuditTrailFilters>({});

  // Health Status State
  const [healthStatus, setHealthStatus] = useState<BlockchainHealthStatus | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthError, setHealthError] = useState<string | null>(null);

  // Global State
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Compliance Status Functions
  const refreshCompliance = useCallback(async () => {
    setComplianceLoading(true);
    setComplianceError(null);
    
    try {
      const status = await getComplianceStatus();
      setComplianceStatus(status);
      setComplianceError(null); // Clear any previous errors on success
      setLastUpdated(new Date());
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch compliance status';
      setComplianceError(errorMessage);
      console.error('Compliance status error:', error);
      
      // Set fallback compliance status to prevent UI crashes
      setComplianceStatus({
        overallScore: 0,
        storageStatus: {
          s3: 'offline',
          azureACL: 'offline',
          polygon: 'offline',
        },
        encryptionStatus: false,
        lastUpdated: new Date().toISOString(),
        totalTransactions: 0,
        verifiedTransactions: 0,
      });
    } finally {
      setComplianceLoading(false);
    }
  }, []);

  // Transaction Verifications Functions
  const refreshVerifications = useCallback(async () => {
    setVerificationsLoading(true);
    setVerificationsError(null);
    
    try {
      const verifications = await getRecentTransactionVerifications(verificationFilters);
      setTransactionVerifications(verifications);
      setLastUpdated(new Date());
    } catch (error) {
      setVerificationsError(error instanceof Error ? error.message : 'Failed to fetch transaction verifications');
      console.error('Transaction verifications error:', error);
    } finally {
      setVerificationsLoading(false);
    }
  }, [verificationFilters]);

  // Update Transaction Statuses Function
  const updateTransactionStatuses = useCallback(async () => {
    setVerificationsLoading(true);
    setVerificationsError(null);
    
    try {
      // Call the blockchain API to update transaction statuses
      const response = await fetch('/api/blockchain/transactions/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update transaction statuses: ${response.statusText}`);
      }
      
      await response.json();
      await refreshVerifications();
    } catch (error) {
      setVerificationsError(error instanceof Error ? error.message : 'Failed to update transaction statuses');
      console.error('Update transaction statuses error:', error);
    } finally {
      setVerificationsLoading(false);
    }
  }, [refreshVerifications]);

  // Sync Blockchain Function
  const syncBlockchain = useCallback(async () => {
    setVerificationsLoading(true);
    setVerificationsError(null);
    
    try {
      // Call the blockchain sync API
      const response = await fetch('/api/blockchain/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to sync blockchain: ${response.statusText}`);
      }
      
      await response.json();
      await refreshVerifications();
    } catch (error) {
      setVerificationsError(error instanceof Error ? error.message : 'Failed to sync blockchain');
      console.error('Blockchain sync error:', error);
    } finally {
      setVerificationsLoading(false);
    }
  }, [refreshVerifications]);

  // Audit Trail Functions
  const refreshAuditTrail = useCallback(async () => {
    setAuditLoading(true);
    setAuditError(null);
    
    try {
      const trail = await getAuditTrail(auditFilters);
      setAuditTrail(trail);
      setLastUpdated(new Date());
    } catch (error) {
      setAuditError(error instanceof Error ? error.message : 'Failed to fetch audit trail');
      console.error('Audit trail error:', error);
    } finally {
      setAuditLoading(false);
    }
  }, [auditFilters]);

  // Health Status Functions
  const refreshHealth = useCallback(async () => {
    setHealthLoading(true);
    setHealthError(null);
    
    try {
      const health = await getBlockchainHealth();
      setHealthStatus(health);
      setLastUpdated(new Date());
    } catch (error) {
      setHealthError(error instanceof Error ? error.message : 'Failed to fetch health status');
      console.error('Health status error:', error);
    } finally {
      setHealthLoading(false);
    }
  }, []);

  // Global Refresh Function
  const refreshAll = useCallback(async () => {
    await Promise.all([
      refreshCompliance(),
      refreshVerifications(),
      refreshAuditTrail(),
      refreshHealth(),
    ]);
  }, [refreshCompliance, refreshVerifications, refreshAuditTrail, refreshHealth]);

  // Filter Update Functions
  const updateVerificationFilters = useCallback((filters: VerificationFilters) => {
    setVerificationFilters(filters);
  }, []);

  const updateAuditFilters = useCallback((filters: AuditTrailFilters) => {
    setAuditFilters(filters);
  }, []);

  // Auto-refresh on filter changes
  useEffect(() => {
    refreshVerifications();
  }, [refreshVerifications]);

  useEffect(() => {
    refreshAuditTrail();
  }, [refreshAuditTrail]);

  // Initial data load
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Auto-refresh every 30 seconds for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      refreshAll();
    }, 30000); // Refresh every 30 seconds for dynamic content

    return () => clearInterval(interval);
  }, [refreshAll]);

  return {
    // Compliance Status
    complianceStatus,
    complianceLoading,
    complianceError,
    refreshCompliance,

    // Transaction Verifications
    transactionVerifications,
    verificationsLoading,
    verificationsError,
    refreshVerifications,
    updateTransactionStatuses,
    syncBlockchain,
    updateVerificationFilters,

    // Audit Trail
    auditTrail,
    auditLoading,
    auditError,
    refreshAuditTrail,
    updateAuditFilters,

    // Health Status
    healthStatus,
    healthLoading,
    healthError,
    refreshHealth,

    // Global
    refreshAll,
    lastUpdated,
  };
}
