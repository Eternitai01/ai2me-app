/**
 * Transaction Search & Analytics Component
 * Advanced search interface for blockchain transactions with analytics
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  Filter,
  Download,
  Eye,
  ExternalLink,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  BarChart3,
  PieChart,
  RefreshCw,
  Zap
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';

// Search interfaces
interface SearchFilters {
  transactionId: string;
  provider: string;
  model: string;
  status: string;
  dateRange: {
    start: string;
    end: string;
  };
  creditRange: {
    min: number;
    max: number;
  };
}

interface SearchResult {
  transactionId: string;
  provider: string;
  model: string;
  credits: number;
  status: 'verified' | 'pending' | 'failed';
  blockchainStatus: string;
  timestamp: string;
  processingTime: number;
  failureReason?: string;
  s3Location?: string;
  azureACLId?: string;
  polygonTxHash?: string;
  metadata: Record<string, unknown>;
}

interface SearchAnalytics {
  totalResults: number;
  statusBreakdown: {
    verified: number;
    pending: number;
    failed: number;
  };
  providerBreakdown: Record<string, number>;
  modelBreakdown: Record<string, number>;
  averageProcessingTime: number;
  totalCredits: number;
  timeRange: {
    earliest: string;
    latest: string;
  };
}

interface TransactionSearchAnalyticsProps {
  className?: string;
}

export function TransactionSearchAnalytics({ className }: TransactionSearchAnalyticsProps) {
  // Search state
  const [filters, setFilters] = useState<SearchFilters>({
    transactionId: '',
    provider: '',
    model: '',
    status: '',
    dateRange: {
      start: new Date(Date.now() - 7 * 24 * 3600000).toISOString().split('T')[0], // 7 days ago
      end: new Date().toISOString().split('T')[0], // today
    },
    creditRange: {
      min: 0,
      max: 1000,
    },
  });

  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchAnalytics, setSearchAnalytics] = useState<SearchAnalytics | null>(null);
  const [loading, setLoading] = useState(false);

  // Generate mock search results
  const generateSearchResults = useCallback((filters: SearchFilters): { results: SearchResult[]; analytics: SearchAnalytics } => {
    const providers = ['Anthropic', 'OpenAI', 'Google', 'Azure'];
    const models = ['Claude-3', 'GPT-4', 'GPT-3.5', 'Gemini Pro', 'Azure OpenAI'];
    const statuses: ('verified' | 'pending' | 'failed')[] = ['verified', 'pending', 'failed'];
    const blockchainStatuses = ['confirmed', 'processing', 'failed', 'pending'];

    // Generate realistic number of results
    const resultCount = Math.floor(Math.random() * 200) + 50;
    const results: SearchResult[] = [];

    for (let i = 0; i < resultCount; i++) {
      const provider = providers[Math.floor(Math.random() * providers.length)];
      const model = models[Math.floor(Math.random() * models.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const credits = Math.floor(Math.random() * 200) + 10;
      const processingTime = Math.random() * 60 + 5; // 5-65 seconds

      // Generate timestamp within date range
      const startTime = new Date(filters.dateRange.start).getTime();
      const endTime = new Date(filters.dateRange.end).getTime();
      const timestamp = new Date(startTime + Math.random() * (endTime - startTime));

      const result: SearchResult = {
        transactionId: `tx-${Math.random().toString(36).substr(2, 6)}`,
        provider,
        model,
        credits,
        status,
        blockchainStatus: blockchainStatuses[Math.floor(Math.random() * blockchainStatuses.length)],
        timestamp: timestamp.toISOString(),
        processingTime,
        failureReason: status === 'failed' ? 'Network timeout' : undefined,
        s3Location: `s3://AI2me-compliance/tx-${Math.random().toString(36).substr(2, 6)}.json`,
        azureACLId: status !== 'failed' ? `acl-${Math.random().toString(36).substr(2, 8)}` : undefined,
        polygonTxHash: status === 'verified' ? `0x${Math.random().toString(16).substr(2, 64)}` : undefined,
        metadata: {
          requestSize: Math.floor(Math.random() * 5000) + 500,
          responseSize: Math.floor(Math.random() * 10000) + 1000,
          userAgent: 'AI2me-Client/1.0',
        },
      };

      // Apply filters
      if (filters.transactionId && !result.transactionId.includes(filters.transactionId)) continue;
      if (filters.provider && result.provider !== filters.provider) continue;
      if (filters.model && result.model !== filters.model) continue;
      if (filters.status && result.status !== filters.status) continue;
      if (result.credits < filters.creditRange.min || result.credits > filters.creditRange.max) continue;

      results.push(result);
    }

    // Sort by timestamp (newest first)
    results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Calculate analytics
    const statusBreakdown = results.reduce(
      (acc, tx) => {
        acc[tx.status]++;
        return acc;
      },
      { verified: 0, pending: 0, failed: 0 }
    );

    const providerBreakdown = results.reduce((acc, tx) => {
      acc[tx.provider] = (acc[tx.provider] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const modelBreakdown = results.reduce((acc, tx) => {
      acc[tx.model] = (acc[tx.model] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const analytics: SearchAnalytics = {
      totalResults: results.length,
      statusBreakdown,
      providerBreakdown,
      modelBreakdown,
      averageProcessingTime: results.reduce((sum, tx) => sum + tx.processingTime, 0) / results.length,
      totalCredits: results.reduce((sum, tx) => sum + tx.credits, 0),
      timeRange: {
        earliest: results[results.length - 1]?.timestamp || '',
        latest: results[0]?.timestamp || '',
      },
    };

    return { results, analytics };
  }, []);

  // Perform search
  const performSearch = useCallback(async () => {
    setLoading(true);

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const { results, analytics } = generateSearchResults(filters);
      setSearchResults(results);
      setSearchAnalytics(analytics);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, generateSearchResults, setLoading, setSearchResults, setSearchAnalytics]);

  // Auto-search when filters change (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [filters, performSearch]);

  const handleFilterChange = (key: keyof SearchFilters, value: unknown) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const exportResults = async (format: 'csv' | 'json') => {
    try {
      const data = format === 'json'
        ? JSON.stringify({ results: searchResults, analytics: searchAnalytics }, null, 2)
        : convertToCSV(searchResults);

      const blob = new Blob([data], {
        type: format === 'json' ? 'application/json' : 'text/csv'
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transaction-search-${format}-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const convertToCSV = (results: SearchResult[]): string => {
    const headers = [
      'Transaction ID', 'Provider', 'Model', 'Credits', 'Status',
      'Blockchain Status', 'Timestamp', 'Processing Time', 'S3 Location'
    ];

    const csvContent = [
      headers.join(','),
      ...results.map(tx => [
        tx.transactionId,
        tx.provider,
        tx.model,
        tx.credits,
        tx.status,
        tx.blockchainStatus,
        tx.timestamp,
        tx.processingTime.toFixed(2),
        tx.s3Location || ''
      ].join(','))
    ].join('\n');

    return csvContent;
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
            <Search className="h-6 w-6 text-primary" />
            Transaction Search & Analytics
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Advanced search and pattern analysis for blockchain transactions
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => exportResults('json')}
            disabled={searchResults.length === 0}
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none h-8 px-2 text-xs"
          >
            <Download className="h-3.5 w-3.5 mr-1" />
            JSON
          </Button>
          <Button
            onClick={() => exportResults('csv')}
            disabled={searchResults.length === 0}
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none h-8 px-2 text-xs"
          >
            <Download className="h-3.5 w-3.5 mr-1" />
            CSV
          </Button>
        </div>
      </div>

      {/* Search Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Search Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="transactionId">Transaction ID</Label>
              <Input
                id="transactionId"
                placeholder="tx-abc123..."
                value={filters.transactionId}
                onChange={(e) => handleFilterChange('transactionId', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="provider">Provider</Label>
              <Select
                value={filters.provider}
                onValueChange={(value) => handleFilterChange('provider', value === 'all' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Providers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Providers</SelectItem>
                  <SelectItem value="Anthropic">Anthropic</SelectItem>
                  <SelectItem value="OpenAI">OpenAI</SelectItem>
                  <SelectItem value="Google">Google</SelectItem>
                  <SelectItem value="Azure">Azure</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="model">Model</Label>
              <Select
                value={filters.model}
                onValueChange={(value) => handleFilterChange('model', value === 'all' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Models" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Models</SelectItem>
                  <SelectItem value="Claude-3">Claude-3</SelectItem>
                  <SelectItem value="GPT-4">GPT-4</SelectItem>
                  <SelectItem value="GPT-3.5">GPT-3.5</SelectItem>
                  <SelectItem value="Gemini Pro">Gemini Pro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => handleFilterChange('status', value === 'all' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date Range</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  value={filters.dateRange.start}
                  onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, start: e.target.value })}
                />
                <Input
                  type="date"
                  value={filters.dateRange.end}
                  onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, end: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Credit Range</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder="Min credits"
                  value={filters.creditRange.min}
                  onChange={(e) => handleFilterChange('creditRange', { ...filters.creditRange, min: parseInt(e.target.value) || 0 })}
                />
                <Input
                  type="number"
                  placeholder="Max credits"
                  value={filters.creditRange.max}
                  onChange={(e) => handleFilterChange('creditRange', { ...filters.creditRange, max: parseInt(e.target.value) || 1000 })}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button onClick={performSearch} disabled={loading}>
              <Search className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
              Search
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setFilters({
                  transactionId: '',
                  provider: '',
                  model: '',
                  status: '',
                  dateRange: {
                    start: new Date(Date.now() - 7 * 24 * 3600000).toISOString().split('T')[0],
                    end: new Date().toISOString().split('T')[0],
                  },
                  creditRange: { min: 0, max: 1000 },
                });
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      <Tabs defaultValue="results" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <TabsList className="w-full sm:w-auto h-9 p-1 bg-muted/50">
            <TabsTrigger value="results" className="flex-1 sm:flex-none h-7">Search Results</TabsTrigger>
            <TabsTrigger value="analytics" className="flex-1 sm:flex-none h-7">Analytics</TabsTrigger>
          </TabsList>

          {searchAnalytics && (
            <div className="flex flex-wrap items-center gap-2 text-[10px] sm:text-sm text-muted-foreground">
              <span>{searchAnalytics.totalResults.toLocaleString()} results</span>
              <span>•</span>
              <span>{searchAnalytics.totalCredits.toLocaleString()} credits</span>
              <span className="hidden xs:inline">•</span>
              <span className="hidden xs:inline">{searchAnalytics.averageProcessingTime.toFixed(1)}s avg</span>
            </div>
          )}
        </div>

        {/* Results Tab */}
        <TabsContent value="results">
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="h-96">
                {loading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="text-center">
                      <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                      <p>Searching transactions...</p>
                    </div>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No transactions found matching your criteria</p>
                    <p className="text-sm">Try adjusting your search filters</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {searchResults.map((tx) => (
                      <div key={tx.transactionId} className="p-4 hover:bg-muted/50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-mono text-sm font-medium">
                                {tx.transactionId}
                              </span>
                              <Badge variant="secondary" className={cn(
                                tx.provider === 'Anthropic' ? 'bg-orange-100 text-orange-800' :
                                  tx.provider === 'OpenAI' ? 'bg-green-100 text-green-800' :
                                    tx.provider === 'Google' ? 'bg-blue-100 text-blue-800' :
                                      'bg-gray-100 text-gray-800'
                              )}>
                                {tx.provider}
                              </Badge>
                              <Badge variant="outline">
                                {tx.model}
                              </Badge>
                              <Badge variant={
                                tx.status === 'verified' ? 'default' :
                                  tx.status === 'failed' ? 'destructive' :
                                    'secondary'
                              }>
                                {tx.status}
                              </Badge>
                            </div>

                            <div className="text-sm text-muted-foreground mb-2">
                              <span>{tx.credits} credits</span>
                              <span className="mx-2">•</span>
                              <span>{tx.processingTime.toFixed(1)}s processing</span>
                              <span className="mx-2">•</span>
                              <span>{formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true })}</span>
                            </div>

                            <div className="text-xs text-muted-foreground">
                              Blockchain: {tx.blockchainStatus}
                              {tx.failureReason && (
                                <>
                                  <span className="mx-2">•</span>
                                  <span className="text-red-600">Error: {tx.failureReason}</span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              Details
                            </Button>
                            {tx.polygonTxHash && (
                              <Button variant="ghost" size="sm">
                                <ExternalLink className="h-4 w-4 mr-1" />
                                Explorer
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          {searchAnalytics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Status Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Status Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>Verified</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">{searchAnalytics.statusBreakdown.verified.toLocaleString()}</span>
                        <Badge variant="secondary">
                          {((searchAnalytics.statusBreakdown.verified / searchAnalytics.totalResults) * 100).toFixed(1)}%
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        <span>Pending</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">{searchAnalytics.statusBreakdown.pending.toLocaleString()}</span>
                        <Badge variant="secondary">
                          {((searchAnalytics.statusBreakdown.pending / searchAnalytics.totalResults) * 100).toFixed(1)}%
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span>Failed</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">{searchAnalytics.statusBreakdown.failed.toLocaleString()}</span>
                        <Badge variant="secondary">
                          {((searchAnalytics.statusBreakdown.failed / searchAnalytics.totalResults) * 100).toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Provider Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Provider Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {Object.entries(searchAnalytics.providerBreakdown).map(([provider, count]) => (
                      <div key={provider} className="flex items-center justify-between">
                        <span>{provider}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono">{count.toLocaleString()}</span>
                          <Badge variant="secondary">
                            {((count / searchAnalytics.totalResults) * 100).toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Average Processing Time</span>
                      <span className="font-mono text-sm">
                        {searchAnalytics.averageProcessingTime.toFixed(1)}s
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Credits</span>
                      <span className="font-mono text-sm">
                        {searchAnalytics.totalCredits.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm">Success Rate</span>
                      <span className="font-mono text-sm text-green-600">
                        {((searchAnalytics.statusBreakdown.verified / searchAnalytics.totalResults) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Time Range Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Time Range Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Earliest Transaction</span>
                      <span className="text-sm font-mono">
                        {searchAnalytics.timeRange.earliest ?
                          format(new Date(searchAnalytics.timeRange.earliest), 'MMM dd, HH:mm') :
                          'N/A'
                        }
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm">Latest Transaction</span>
                      <span className="text-sm font-mono">
                        {searchAnalytics.timeRange.latest ?
                          format(new Date(searchAnalytics.timeRange.latest), 'MMM dd, HH:mm') :
                          'N/A'
                        }
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Results</span>
                      <span className="text-sm font-mono font-bold">
                        {searchAnalytics.totalResults.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
