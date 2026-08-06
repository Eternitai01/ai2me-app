/**
 * Transaction Verification Panel Component
 * Displays recent transactions with their verification status and progress
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  RefreshCw, 
  ExternalLink, 
  Clock, 
  CheckCircle2, 
  XCircle,
  AlertTriangle,
  Eye,
  Filter,
  ArrowRight
} from 'lucide-react';
import { VerificationStatusBadge } from '@/components/ui/status-indicator';
import { VerificationProgress } from '@/components/ui/progress-bar';
import { TransactionVerification, VerificationFilters } from '@/types/blockchain';
import { TransactionDetailsModal } from '@/components/organisms/transaction-details-modal';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface TransactionVerificationPanelProps {
  transactions: TransactionVerification[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onUpdateStatus: () => void;
  onSyncBlockchain: () => void;
  onUpdateFilters: (filters: VerificationFilters) => void;
  className?: string;
}

export function TransactionVerificationPanel({
  transactions,
  loading,
  error,
  onRefresh,
  onUpdateStatus,
  onSyncBlockchain,
  onUpdateFilters,
  className,
}: TransactionVerificationPanelProps) {
  const [filters, setFilters] = useState<VerificationFilters>({
    status: 'all',
    provider: '',
  });
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  const handleFilterChange = (key: keyof VerificationFilters, value: string) => {
    const newFilters = { ...filters, [key]: value === 'all' ? undefined : value };
    setFilters(newFilters);
    onUpdateFilters(newFilters);
  };

  const handleViewDetails = (transactionId: string) => {
    setSelectedTransactionId(transactionId);
    setDetailsModalOpen(true);
  };

  const handleOpenExplorer = (transactionId: string, polygonTxHash?: string) => {
    if (polygonTxHash) {
      // Open Polygon Amoy explorer
      const explorerUrl = `https://amoy.polygonscan.com/tx/${polygonTxHash}`;
      window.open(explorerUrl, '_blank');
    } else {
      // Fallback to general search
      const explorerUrl = `https://amoy.polygonscan.com/`;
      window.open(explorerUrl, '_blank');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'submitted':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getProviderColor = (provider: string) => {
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

  if (error) {
    return (
      <Card className={cn('border-red-200', className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Transaction Verification - Error
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

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-blue-600" />
            Recent Transaction Verifications
            {loading && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <div className="animate-pulse h-1.5 w-1.5 bg-blue-500 rounded-full" />
                <span>Updating...</span>
              </div>
            )}
          </CardTitle>
          
          {/* Action Buttons - Responsive Layout */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="text-xs text-muted-foreground self-start sm:self-center">
              {transactions.length} transactions
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outlineBlack"
                size="sm"
                onClick={onRefresh}
                disabled={loading}
                className="flex-1 sm:flex-none"
              >
                <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onUpdateStatus}
                disabled={loading}
                className="bg-blue-600 text-white hover:bg-blue-700 flex-1 sm:flex-none"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Update Status
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onSyncBlockchain}
                disabled={loading}
                className="bg-green-50 hover:bg-green-100 border-green-200 text-green-700 hover:text-black-800 flex-1 sm:flex-none"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync Blockchain
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 pt-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Select
            value={filters.provider || 'all'}
            onValueChange={(value) => handleFilterChange('provider', value)}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Providers</SelectItem>
              <SelectItem value="Anthropic">Anthropic</SelectItem>
              <SelectItem value="OpenAI">OpenAI</SelectItem>
              <SelectItem value="Google">Google</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {loading && transactions.length === 0 ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-6 w-16" />
                </div>
                <Skeleton className="h-2 w-full" />
                <div className="flex items-center justify-between text-sm">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No transactions found matching your filters.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => {
                setFilters({ status: 'all', provider: '' });
                onUpdateFilters({});
              }}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div
                key={transaction.transactionId}
                className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
              >
                {/* Transaction Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(transaction.status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium">
                          {transaction.transactionId}
                        </span>
                        <Badge 
                          variant="secondary" 
                          className={cn('text-xs', getProviderColor(transaction.provider))}
                        >
                          {transaction.provider}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {transaction.model} • {transaction.credits} credits • {' '}
                        {formatDistanceToNow(new Date(transaction.timestamp), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                  <VerificationStatusBadge status={transaction.status} />
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <VerificationProgress 
                    progress={transaction.progress} 
                    status={transaction.status} 
                  />
                </div>

                {/* Transaction Details */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="font-medium">Status: {transaction.blockchainStatus}</span>
                    <div className="flex flex-wrap items-center gap-2">
                      {transaction.s3Location && (
                        <span className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-md">
                          <CheckCircle2 className="h-3 w-3" />
                          S3 Stored
                        </span>
                      )}
                      {transaction.azureACLId && (
                        <span className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md">
                          <CheckCircle2 className="h-3 w-3" />
                          ACL Logged
                        </span>
                      )}
                      {transaction.polygonTxHash && (
                        <span className="flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded-md">
                          <CheckCircle2 className="h-3 w-3" />
                          Blockchain
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 px-3 text-xs hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200" 
                      onClick={() => handleViewDetails(transaction.transactionId)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Details
                    </Button>
                    {transaction.polygonTxHash && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 px-3 text-xs hover:bg-green-50 hover:text-green-600 hover:border-green-200"
                        onClick={() => handleOpenExplorer(transaction.transactionId, transaction.polygonTxHash)}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Explorer
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* View All Button */}
            <div className="pt-4 border-t border-gray-100">
              <Button variant="outline" className="w-full" size="sm">
                View All Transactions
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {/* Transaction Details Modal */}
      {selectedTransactionId && (
        <TransactionDetailsModal
          open={detailsModalOpen}
          onOpenChange={setDetailsModalOpen}
          transactionId={selectedTransactionId}
        />
      )}
    </Card>
  );
}
