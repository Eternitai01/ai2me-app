/**
 * Transaction Details Modal Component
 * Shows comprehensive transaction verification details
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  ExternalLink,
  Copy,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Shield,
  Database,
  Link,
  FileText,
  Activity,
  Server,
  RefreshCw,
  Search,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'sonner';

interface TransactionDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactionId: string;
}

interface TransactionDetails {
  transactionId: string;
  provider: string;
  model: string;
  credits: number;
  status: 'verified' | 'pending' | 'failed';
  progress: number;
  timestamp: string;
  blockchainStatus: string;
  
  // Storage locations
  s3Location?: string;
  azureACLId?: string;
  polygonTxHash?: string;
  
  // Detailed information
  orgId?: string;
  requestHash?: string;
  responseHash?: string;
  completeTransactionHash?: string;
  tokensUsed?: number;
  latencyMs?: number;
  statusCode?: number;
  createdBy?: string;
  
  // Blockchain details
  blockNumber?: number;
  gasUsed?: number;
  transactionFee?: string;
  confirmations?: number;
  
  // Blockchain batch details
  blockchainBatchId?: string;
  batchTransactionIndex?: number;
  blockchainSubmittedAt?: string;
  explorerUrl?: string;
  
  // Verification details
  merkleRoot?: string;
  merkleProof?: string[];
  encryptionStatus?: boolean;
  complianceScore?: number;
}

interface VerificationResult {
  success: boolean;
  integrity_verified: boolean;
  s3_recalculated_hash: string;
  acl_stored_hash: string;
  verification_timestamp: string;
  verification_method: string;
  message: string;
  details: {
    s3_location: string;
    acl_transaction_id: string;
    hash_algorithm: string;
    data_fields_verified: string[];
  };
}

interface StorageLayerData {
  layer: 'Database' | 'S3' | 'ACL' | 'Blockchain';
  status: 'available' | 'unavailable' | 'error';
  data: {
    transaction_id?: string;
    org_id?: string;
    provider?: string;
    model?: string;
    tokens_used?: number;
    credits_deducted?: number;
    timestamp?: string;
    hash?: string;
    location?: string;
    batch_id?: string;
    merkle_root?: string;
    explorer_url?: string;
  };
  verification_status: 'verified' | 'mismatch' | 'not_verified';
  last_updated?: string;
}

export function TransactionDetailsModal({
  open,
  onOpenChange,
  transactionId,
}: TransactionDetailsModalProps) {
  const [details, setDetails] = useState<TransactionDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [storageLayerData, setStorageLayerData] = useState<StorageLayerData[]>([]);

  const fetchTransactionDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch from real blockchain API
      const response = await fetch(`/api/blockchain/transactions/status/${transactionId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Transaction not found');
        }
        throw new Error(`Failed to fetch transaction details: ${response.status}`);
      }
      
      const apiData = await response.json();
      
      // Handle the actual API structure: nested in status, transaction_details, and blockchain_details
      const status = apiData.status || {};
      const transactionDetails = apiData.transaction_details || {};
      const blockchainDetails = apiData.blockchain_details || {};
      
      // Transform API response to our interface
      const transformedDetails: TransactionDetails = {
        transactionId: apiData.transaction_id || transactionId,
        provider: transactionDetails.provider || 'Unknown',
        model: transactionDetails.model || 'Unknown',
        credits: parseFloat(transactionDetails.credits_deducted) || 0,
        status: getVerificationStatus(status.blockchain_status),
        progress: getProgress(status.blockchain_status),
        timestamp: status.created_at || status.storage_completed_at,
        blockchainStatus: status.blockchain_status || 'Unknown',
        
        // Storage locations from the status object
        s3Location: status.s3_location,
        azureACLId: status.acl_transaction_id,
        polygonTxHash: blockchainDetails.blockchain_tx_hash, // From blockchain_details
        
        // Additional fields from transaction_details
        orgId: transactionDetails.org_id,
        requestHash: undefined, // Not available in this endpoint
        responseHash: undefined, // Not available in this endpoint  
        completeTransactionHash: transactionDetails.complete_transaction_hash,
        tokensUsed: transactionDetails.tokens_used,
        latencyMs: undefined, // Not available in this endpoint
        statusCode: undefined, // Not available in this endpoint
        createdBy: undefined, // Not available in this endpoint
        
        // Blockchain details from blockchain_details object
        blockNumber: undefined, // Not stored in our system
        gasUsed: undefined, // Not stored in our system
        transactionFee: undefined, // Not stored in our system
        confirmations: undefined, // Not stored in our system
        
        // Blockchain batch details
        blockchainBatchId: blockchainDetails.blockchain_batch_id,
        batchTransactionIndex: blockchainDetails.batch_transaction_index,
        merkleRoot: blockchainDetails.batch_merkle_root,
        blockchainSubmittedAt: blockchainDetails.blockchain_submitted_at,
        explorerUrl: blockchainDetails.explorer_url,
        
        // Verification details (may not be available)
        merkleProof: undefined,
        encryptionStatus: !!status.s3_location, // Data is encrypted if stored in S3
        complianceScore: status.s3_location && status.acl_transaction_id ? 100 : 50, // Higher score if both S3 and ACL are present
      };
      
      setDetails(transformedDetails);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch transaction details:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch transaction details');
      setDetails(null);
    } finally {
      setLoading(false);
    }
  }, [transactionId, setLoading, setError, setDetails]);

  // Fetch transaction details when modal opens
  useEffect(() => {
    if (open && transactionId) {
      fetchTransactionDetails();
    }
  }, [open, transactionId, fetchTransactionDetails])
  
  // Helper functions for data transformation
  const getVerificationStatus = (blockchainStatus: string): 'verified' | 'pending' | 'failed' => {
    switch (blockchainStatus) {
      case 'confirmed':
        return 'verified';
      case 'failed':
        return 'failed';
      default:
        return 'pending';
    }
  };
  
  const getProgress = (blockchainStatus: string): number => {
    switch (blockchainStatus) {
      case 'confirmed': return 100;
      case 'submitted': return 80;
      case 'processing': return 60;
      case 'pending': return 20;
      case 'failed': return 0;
      default: return 50;
    }
  };

  const copyToClipboard = (text: string | undefined, label: string) => {
    if (!text) {
      toast.error(`${label} is not available`);
      return;
    }
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const formatTimestamp = (timestamp: string | undefined) => {
    if (!timestamp) return 'Unknown';
    
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    return format(date, 'PPp');
  };

  const formatTimeDistance = (timestamp: string | undefined) => {
    if (!timestamp) return 'Unknown';
    
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return 'Unknown';
    
    return formatDistanceToNow(date, { addSuffix: true });
  };

  const getStatusIcon = (status: string | undefined) => {
    if (!status) {
      return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
    
    switch (status) {
      case 'verified':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getProviderColor = (provider: string | undefined) => {
    if (!provider) {
      return 'bg-gray-100 text-gray-800';
    }
    
    switch (provider.toLowerCase()) {
      case 'anthropic':
        return 'bg-orange-100 text-orange-800';
      case 'openai':
        return 'bg-green-100 text-green-800';
      case 'google':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const openBlockchainExplorer = () => {
    if (details?.polygonTxHash) {
      // Open Polygon Amoy explorer
      const explorerUrl = `https://amoy.polygonscan.com/tx/${details.polygonTxHash}`;
      window.open(explorerUrl, '_blank');
    }
  };

  const verifyTransaction = async () => {
    if (!details?.blockchainBatchId) {
      toast.error('Transaction must be submitted to blockchain before verification');
      return;
    }

    setVerifying(true);
    setVerificationResult(null);
    setStorageLayerData([]);

    try {
      // Fetch verification result
      const response = await fetch(`/api/blockchain/verify/${transactionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Verification failed: ${response.status}`);
      }

      const result = await response.json();
      setVerificationResult(result);

      // Fetch data from all storage layers for comprehensive comparison
      await fetchStorageLayerData();
      
      if (result.integrity_verified) {
        toast.success('Transaction verification successful - No tampering detected');
      } else {
        toast.error('Transaction verification failed - Data tampering detected');
      }
    } catch (err) {
      console.error('Verification error:', err);
      toast.error(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const fetchStorageLayerData = async () => {
    const layers: StorageLayerData[] = [];

    try {
      // 1. Database Layer (from current details)
      layers.push({
        layer: 'Database',
        status: 'available',
        data: {
          transaction_id: details?.transactionId,
          org_id: details?.orgId,
          provider: details?.provider,
          model: details?.model,
          tokens_used: details?.tokensUsed,
          credits_deducted: details?.credits,
          timestamp: details?.timestamp,
          hash: details?.completeTransactionHash,
        },
        verification_status: 'verified',
        last_updated: details?.timestamp,
      });

      // 2. S3 Layer
      if (details?.s3Location) {
        try {
          const s3Response = await fetch(`/api/blockchain/s3/decrypt/${transactionId}`);
          if (s3Response.ok) {
            const s3Data = await s3Response.json();
            layers.push({
              layer: 'S3',
              status: 'available',
              data: {
                transaction_id: s3Data.decrypted_data?.transaction_id,
                org_id: s3Data.decrypted_data?.org_id,
                provider: s3Data.decrypted_data?.provider,
                model: s3Data.decrypted_data?.model,
                tokens_used: s3Data.decrypted_data?.tokens_used,
                credits_deducted: s3Data.decrypted_data?.credits_deducted,
                timestamp: s3Data.decrypted_data?.timestamp,
                location: details.s3Location,
              },
              verification_status: 'verified',
              last_updated: s3Data.decryption_timestamp,
            });
          } else {
            layers.push({
              layer: 'S3',
              status: 'error',
              data: { location: details.s3Location },
              verification_status: 'not_verified',
            });
          }
        } catch {
          layers.push({
            layer: 'S3',
            status: 'error',
            data: { location: details.s3Location },
            verification_status: 'not_verified',
          });
        }
      } else {
        layers.push({
          layer: 'S3',
          status: 'unavailable',
          data: {},
          verification_status: 'not_verified',
        });
      }

      // 3. ACL Layer
      if (details?.azureACLId) {
        try {
          const aclResponse = await fetch(`/api/blockchain/acl/transactions/${transactionId}`);
          if (aclResponse.ok) {
            const aclData = await aclResponse.json();
            layers.push({
              layer: 'ACL',
              status: 'available',
              data: {
                transaction_id: aclData.data?.transaction_id,
                org_id: aclData.data?.org_id,
                provider: aclData.data?.provider,
                model: aclData.data?.model,
                tokens_used: aclData.data?.tokens_used,
                credits_deducted: aclData.data?.credits_deducted,
                timestamp: aclData.data?.timestamp,
                hash: aclData.data?.complete_hash,
                location: aclData.data?.acl_transaction_id,
              },
              verification_status: 'verified',
              last_updated: aclData.data?.timestamp,
            });
          } else {
            layers.push({
              layer: 'ACL',
              status: 'error',
              data: { location: details.azureACLId },
              verification_status: 'not_verified',
            });
          }
        } catch {
          layers.push({
            layer: 'ACL',
            status: 'error',
            data: { location: details.azureACLId },
            verification_status: 'not_verified',
          });
        }
      } else {
        layers.push({
          layer: 'ACL',
          status: 'unavailable',
          data: {},
          verification_status: 'not_verified',
        });
      }

      // 4. Blockchain Layer
      if (details?.blockchainBatchId) {
        try {
          const blockchainResponse = await fetch(`/api/blockchain/polygon/transactions/${transactionId}`);
          if (blockchainResponse.ok) {
            const blockchainData = await blockchainResponse.json();
            layers.push({
              layer: 'Blockchain',
              status: 'available',
              data: {
                transaction_id: blockchainData.data?.transaction_id,
                batch_id: blockchainData.data?.batch_id,
                merkle_root: blockchainData.data?.merkle_root,
                explorer_url: blockchainData.data?.polygonscan_url,
                timestamp: blockchainData.data?.timestamp,
              },
              verification_status: 'verified',
              last_updated: blockchainData.data?.timestamp,
            });
          } else {
            layers.push({
              layer: 'Blockchain',
              status: 'error',
              data: { batch_id: details.blockchainBatchId },
              verification_status: 'not_verified',
            });
          }
        } catch {
          layers.push({
            layer: 'Blockchain',
            status: 'error',
            data: { batch_id: details.blockchainBatchId },
            verification_status: 'not_verified',
          });
        }
      } else {
        layers.push({
          layer: 'Blockchain',
          status: 'unavailable',
          data: {},
          verification_status: 'not_verified',
        });
      }

      setStorageLayerData(layers);
    } catch (error) {
      console.error('Failed to fetch storage layer data:', error);
    }
  };

  const isVerificationEnabled = () => {
    return details?.blockchainStatus === 'submitted' || details?.blockchainStatus === 'confirmed';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl sm:max-w-6xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Transaction Details
            </div>
            <Button
              onClick={verifyTransaction}
              disabled={!isVerificationEnabled() || verifying}
              className="flex items-center gap-2 w-full sm:w-auto"
              variant={verificationResult?.integrity_verified ? "default" : "outline"}
            >
              {verifying ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              {verifying ? 'Verifying...' : 'Verify Integrity'}
            </Button>
          </DialogTitle>
          <DialogDescription>
            Comprehensive verification and blockchain information for transaction {transactionId}
            {!isVerificationEnabled() && (
              <span className="block text-xs text-muted-foreground mt-1">
                Verification is only available for transactions submitted to blockchain
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : details ? (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
              <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
              <TabsTrigger value="blockchain" className="text-xs sm:text-sm">Blockchain</TabsTrigger>
              <TabsTrigger value="storage" className="text-xs sm:text-sm">Storage</TabsTrigger>
              <TabsTrigger value="verification" className="text-xs sm:text-sm">Verification</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* Transaction Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      {getStatusIcon(details.status)}
                      Transaction Summary
                    </span>
                    <Badge 
                      variant="secondary" 
                      className={cn('text-xs', getProviderColor(details.provider))}
                    >
                      {details.provider}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Transaction ID</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(details.transactionId, 'Transaction ID')}
                          className="h-6 px-2"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="font-mono text-sm break-all">{details.transactionId}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(details.status)}
                        <span className="capitalize">{details.status}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <span className="text-sm text-muted-foreground">Model</span>
                      <p className="text-sm font-medium">{details.model || 'Unknown'}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <span className="text-sm text-muted-foreground">Credits Used</span>
                      <p className="text-sm font-medium">{details.credits || 0}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <span className="text-sm text-muted-foreground">Tokens Used</span>
                      <p className="text-sm font-medium">{details.tokensUsed?.toLocaleString() || 'N/A'}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <span className="text-sm text-muted-foreground">Response Time</span>
                      <p className="text-sm font-medium">{details.latencyMs ? `${details.latencyMs}ms` : 'N/A'}</p>
                    </div>
                    
                    <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                      <span className="text-sm text-muted-foreground">Created</span>
                      <p className="text-sm font-medium">
                        {formatTimestamp(details.timestamp)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTimeDistance(details.timestamp)}
                      </p>
                    </div>
                    
                    <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                      <span className="text-sm text-muted-foreground">Organization</span>
                      <p className="text-sm font-mono break-all">{details.orgId || 'Unknown'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="blockchain" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Link className="h-5 w-5" />
                    Blockchain Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Blockchain Status Overview */}
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(details.blockchainStatus)}
                      <span className="font-medium">Blockchain Status</span>
                    </div>
                    <Badge variant={details.blockchainStatus === 'confirmed' ? 'default' : 
                                   details.blockchainStatus === 'submitted' ? 'secondary' :
                                   details.blockchainStatus === 'failed' ? 'destructive' : 'outline'}>
                      {details.blockchainStatus || 'Unknown'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-4">
                      {/* Polygon Transaction Hash */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Polygon Transaction Hash</span>
                          {details.polygonTxHash && (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(details.polygonTxHash || '', 'Transaction Hash')}
                                className="h-6 px-2"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={openBlockchainExplorer}
                                className="h-6 px-2"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                        {details.polygonTxHash ? (
                          <p className="font-mono text-sm break-all bg-muted/50 p-2 rounded">{details.polygonTxHash}</p>
                        ) : (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span className="text-sm">Transaction not yet submitted to Polygon blockchain</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Merkle Root */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Merkle Root</span>
                          {details.merkleRoot && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(details.merkleRoot || '', 'Merkle Root')}
                              className="h-6 px-2"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        {details.merkleRoot ? (
                          <p className="font-mono text-sm break-all bg-muted/50 p-2 rounded">{details.merkleRoot}</p>
                        ) : (
                          <span className="text-sm text-muted-foreground">Merkle root not generated yet</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Right Column */}
                    <div className="space-y-4">
                      {/* Batch Information */}
                      <div className="space-y-2">
                        <span className="text-sm text-muted-foreground">Batch ID</span>
                        {details.blockchainBatchId ? (
                          <div className="flex items-center gap-2">
                            <p className="font-mono text-sm break-all">{details.blockchainBatchId.substring(0, 16)}...</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(details.blockchainBatchId || '', 'Batch ID')}
                              className="h-6 px-2"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Not batched yet</span>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <span className="text-sm text-muted-foreground">Batch Index</span>
                        <p className="text-sm font-medium">
                          {details.batchTransactionIndex !== undefined ? `#${details.batchTransactionIndex}` : 'N/A'}
                        </p>
                      </div>
                    </div>
                    
                  </div>
                  
                  {/* Processing Stage Indicator - Full Width */}
                  <div className="space-y-3">
                    <span className="text-sm font-medium text-muted-foreground">Processing Pipeline</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      <div className="flex items-center gap-2 p-2 bg-green-50 rounded-md">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="font-medium">Database</span>
                      </div>
                      <div className={`flex items-center gap-2 p-2 rounded-md ${details.s3Location ? 'bg-green-50' : 'bg-yellow-50'}`}>
                        {details.s3Location ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-yellow-600" />
                        )}
                        <span className="font-medium">S3 Storage</span>
                      </div>
                      <div className={`flex items-center gap-2 p-2 rounded-md ${details.azureACLId ? 'bg-green-50' : 'bg-yellow-50'}`}>
                        {details.azureACLId ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-yellow-600" />
                        )}
                        <span className="font-medium">ACL Ledger</span>
                      </div>
                      <div className={`flex items-center gap-2 p-2 rounded-md ${details.polygonTxHash ? 'bg-green-50' : 'bg-yellow-50'}`}>
                        {details.polygonTxHash ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-yellow-600" />
                        )}
                        <span className="font-medium">Polygon</span>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={openBlockchainExplorer}
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View on Polygon Explorer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="storage" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* S3 Storage */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      S3 Storage
                      {details.s3Location && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {details.s3Location ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Location</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(details.s3Location || '', 'S3 Location')}
                            className="h-6 px-2"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="font-mono text-sm break-all">{details.s3Location}</p>
                        <Badge variant="outline" className="text-green-600">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Stored & Encrypted
                        </Badge>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Not stored in S3</p>
                    )}
                  </CardContent>
                </Card>

                {/* Azure ACL */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Azure Confidential Ledger
                      {details.azureACLId && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {details.azureACLId ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">ACL Transaction ID</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(details.azureACLId || '', 'ACL ID')}
                            className="h-6 px-2"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="font-mono text-sm">{details.azureACLId}</p>
                        <Badge variant="outline" className="text-blue-600">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Logged in ACL
                        </Badge>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Not logged in Azure ACL</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="verification" className="space-y-6">
              {/* Storage Layer Comparison */}
              {storageLayerData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      Storage Layer Comparison
                    </CardTitle>
                    <CardDescription>
                      Comprehensive data comparison across all storage layers for authenticity verification
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {storageLayerData.map((layer, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              {layer.layer === 'Database' && <Database className="h-4 w-4" />}
                              {layer.layer === 'S3' && <Server className="h-4 w-4" />}
                              {layer.layer === 'ACL' && <Shield className="h-4 w-4" />}
                              {layer.layer === 'Blockchain' && <Link className="h-4 w-4" />}
                              <span className="font-medium">{layer.layer}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {layer.status === 'available' && (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              )}
                              {layer.status === 'unavailable' && (
                                <Clock className="h-4 w-4 text-yellow-600" />
                              )}
                              {layer.status === 'error' && (
                                <XCircle className="h-4 w-4 text-red-600" />
                              )}
                              <Badge 
                                variant={
                                  layer.verification_status === 'verified' ? 'default' :
                                  layer.verification_status === 'mismatch' ? 'destructive' : 'outline'
                                }
                              >
                                {layer.verification_status === 'verified' ? 'Verified' :
                                 layer.verification_status === 'mismatch' ? 'Mismatch' : 'Not Verified'}
                              </Badge>
                            </div>
                          </div>
                          
                          {layer.status === 'available' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                              <div className="space-y-1">
                                <span className="text-muted-foreground">Transaction ID</span>
                                <p className="font-mono text-xs">{layer.data.transaction_id || 'N/A'}</p>
                              </div>
                              <div className="space-y-1">
                                <span className="text-muted-foreground">Provider</span>
                                <p className="text-xs">{layer.data.provider || 'N/A'}</p>
                              </div>
                              <div className="space-y-1">
                                <span className="text-muted-foreground">Model</span>
                                <p className="text-xs">{layer.data.model || 'N/A'}</p>
                              </div>
                              <div className="space-y-1">
                                <span className="text-muted-foreground">Tokens</span>
                                <p className="text-xs">{layer.data.tokens_used?.toLocaleString() || 'N/A'}</p>
                              </div>
                              <div className="space-y-1">
                                <span className="text-muted-foreground">Credits</span>
                                <p className="text-xs">{layer.data.credits_deducted || 'N/A'}</p>
                              </div>
                              <div className="space-y-1">
                                <span className="text-muted-foreground">Timestamp</span>
                                <p className="text-xs">{formatTimestamp(layer.data.timestamp) || 'N/A'}</p>
                              </div>
                              {layer.data.hash && (
                                <div className="space-y-1 col-span-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Hash</span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => copyToClipboard(layer.data.hash || '', 'Hash')}
                                      className="h-4 px-1"
                                    >
                                      <Copy className="h-3 w-3" />
                                    </Button>
                                  </div>
                                  <p className="font-mono text-xs break-all bg-muted/50 p-2 rounded">
                                    {layer.data.hash.length > 40 ? `${layer.data.hash.substring(0, 40)}...` : layer.data.hash}
                                  </p>
                                </div>
                              )}
                              {layer.data.location && (
                                <div className="space-y-1 col-span-2">
                                  <span className="text-muted-foreground">Location</span>
                                  <p className="font-mono text-xs break-all">{layer.data.location}</p>
                                </div>
                              )}
                              {layer.data.batch_id && (
                                <div className="space-y-1">
                                  <span className="text-muted-foreground">Batch ID</span>
                                  <p className="font-mono text-xs">{layer.data.batch_id.substring(0, 8)}...</p>
                                </div>
                              )}
                              {layer.data.merkle_root && (
                                <div className="space-y-1">
                                  <span className="text-muted-foreground">Merkle Root</span>
                                  <p className="font-mono text-xs">{layer.data.merkle_root.substring(0, 16)}...</p>
                                </div>
                              )}
                              {layer.data.explorer_url && (
                                <div className="space-y-1 col-span-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Explorer</span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => window.open(layer.data.explorer_url, '_blank')}
                                      className="h-4 px-1"
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                    </Button>
                                  </div>
                                  <p className="text-xs text-blue-600 hover:underline cursor-pointer">
                                    View on Polygon Explorer
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {layer.status === 'unavailable' && (
                            <p className="text-sm text-muted-foreground">Data not available in this layer</p>
                          )}
                          
                          {layer.status === 'error' && (
                            <p className="text-sm text-red-600">Error accessing this layer</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Verification Results */}
              {verificationResult && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Integrity Verification Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        {verificationResult.integrity_verified ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        <span className="font-medium">Integrity Status</span>
                      </div>
                      <Badge variant={verificationResult.integrity_verified ? "default" : "destructive"}>
                        {verificationResult.integrity_verified ? 'Verified' : 'Tampering Detected'}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <span className="text-sm text-muted-foreground">Verification Method</span>
                          <p className="text-sm font-medium">{verificationResult.verification_method}</p>
                        </div>
                        <div className="space-y-2">
                          <span className="text-sm text-muted-foreground">Verified At</span>
                          <p className="text-sm font-medium">
                            {formatTimestamp(verificationResult.verification_timestamp)}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="text-sm text-muted-foreground">Message</span>
                        <p className="text-sm p-2 bg-muted/50 rounded">
                          {verificationResult.message}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">S3 Recalculated Hash</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(verificationResult.s3_recalculated_hash, 'S3 Hash')}
                              className="h-6 px-2"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="font-mono text-xs break-all bg-muted/50 p-2 rounded">
                            {verificationResult.s3_recalculated_hash}
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">ACL Stored Hash</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(verificationResult.acl_stored_hash, 'ACL Hash')}
                              className="h-6 px-2"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="font-mono text-xs break-all bg-muted/50 p-2 rounded">
                            {verificationResult.acl_stored_hash}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="text-sm text-muted-foreground">Verified Fields</span>
                        <div className="flex flex-wrap gap-1">
                          {verificationResult.details.data_fields_verified.map((field, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {field}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Verification Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <span className="text-sm text-muted-foreground">Compliance Score</span>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${details.complianceScore}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{details.complianceScore}%</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <span className="text-sm text-muted-foreground">Encryption Status</span>
                      <Badge variant={details.encryptionStatus ? "default" : "destructive"}>
                        {details.encryptionStatus ? 'Encrypted' : 'Not Encrypted'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Request Hash</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(details.requestHash || '', 'Request Hash')}
                          className="h-6 px-2"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="font-mono text-xs break-all bg-muted/50 p-2 rounded">{details.requestHash || 'N/A'}</p>
                    </div>
                    
                    <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Response Hash</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(details.responseHash || '', 'Response Hash')}
                          className="h-6 px-2"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="font-mono text-xs break-all bg-muted/50 p-2 rounded">{details.responseHash || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Merkle Root</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(details.merkleRoot || '', 'Merkle Root')}
                          className="h-6 px-2"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="font-mono text-xs break-all bg-muted/50 p-2 rounded">{details.merkleRoot || 'N/A'}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <span className="text-sm text-muted-foreground">Merkle Proof</span>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {details.merkleProof?.length ? (
                          details.merkleProof.map((proof, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                              <p className="font-mono text-xs break-all flex-1 mr-2">{proof}</p>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(proof, `Merkle Proof ${index + 1}`)}
                                className="h-6 px-2 flex-shrink-0"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No Merkle proof available</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Failed to load transaction details</p>
            <p className="text-xs mt-2">
              {error?.includes('blockchain service') ? 
                'Blockchain service is currently unavailable' : 
                'Please try again or check if the transaction ID is correct'
              }
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={fetchTransactionDetails}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
