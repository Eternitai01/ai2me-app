/**
 * Audit Trail Viewer Component
 * Displays searchable compliance event timeline and audit history
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  FileText,
  RefreshCw,
  Search,
  Download,
  Filter,
  Clock,
  Database,
  Cloud,
  Shield,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { AuditTrailEntry, AuditTrailFilters } from '@/types/blockchain';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { exportAuditTrail } from '@/lib/blockchain-api';

interface AuditTrailViewerProps {
  auditTrail: AuditTrailEntry[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onUpdateFilters: (filters: AuditTrailFilters) => void;
  className?: string;
}

export function AuditTrailViewer({
  auditTrail,
  loading,
  error,
  onRefresh,
  onUpdateFilters,
  className,
}: AuditTrailViewerProps) {
  const [filters, setFilters] = useState<AuditTrailFilters>({
    transactionId: '',
    eventType: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);

  const handleFilterChange = (key: keyof AuditTrailFilters, value: string) => {
    const newFilters = { ...filters, [key]: value === 'all' ? undefined : value };
    setFilters(newFilters);
    onUpdateFilters(newFilters);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    const newFilters = { ...filters, transactionId: value || undefined };
    setFilters(newFilters);
    onUpdateFilters(newFilters);
  };

  const toggleEntryExpansion = (entryId: string) => {
    const newExpanded = new Set(expandedEntries);
    if (newExpanded.has(entryId)) {
      newExpanded.delete(entryId);
    } else {
      newExpanded.add(entryId);
    }
    setExpandedEntries(newExpanded);
  };

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      setIsExporting(true);
      const blob = await exportAuditTrail(format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-trail-${format}-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'transaction_created':
        return <CheckCircle2 className="h-4 w-4 text-blue-600" />;
      case 's3_stored':
        return <Cloud className="h-4 w-4 text-green-600" />;
      case 'acl_logged':
        return <Shield className="h-4 w-4 text-purple-600" />;
      case 'blockchain_submitted':
        return <Database className="h-4 w-4 text-orange-600" />;
      case 'verification_completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'transaction_created':
        return 'bg-blue-100 text-blue-800';
      case 's3_stored':
        return 'bg-green-100 text-green-800';
      case 'acl_logged':
        return 'bg-purple-100 text-purple-800';
      case 'blockchain_submitted':
        return 'bg-orange-100 text-orange-800';
      case 'verification_completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatEventType = (eventType: string) => {
    return eventType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (error) {
    return (
      <Card className={cn('border-red-200', className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Audit Trail - Error
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
              <FileText className="h-5 w-5 text-blue-600" />
              Audit Trail
              {loading && (
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground ml-2">
                  <div className="animate-pulse h-1 w-1 bg-green-500 rounded-full" />
                  <span className="hidden xs:inline">Live</span>
                </div>
              )}
            </CardTitle>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('json')}
              disabled={isExporting}
              className="h-8 px-2 text-xs flex-1 sm:flex-none"
            >
              <Download className="h-3.5 w-3.5 mr-1" />
              JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('csv')}
              disabled={isExporting}
              className="h-8 px-2 text-xs flex-1 sm:flex-none"
            >
              <Download className="h-3.5 w-3.5 mr-1" />
              CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
              className="h-8 px-2 text-xs flex-1 sm:flex-none"
            >
              <RefreshCw className={cn('h-3.5 w-3.5 mr-1', loading && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <div className="flex items-center gap-2 h-9 min-w-0">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
            <Select
              value={filters.eventType || 'all'}
              onValueChange={(value) => handleFilterChange('eventType', value)}
            >
              <SelectTrigger className="flex-1 sm:w-44 h-9 text-sm">
                <SelectValue placeholder="All Events" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="transaction_created">Tx Created</SelectItem>
                <SelectItem value="s3_stored">S3 Stored</SelectItem>
                <SelectItem value="acl_logged">ACL Logged</SelectItem>
                <SelectItem value="blockchain_submitted">Blockchain</SelectItem>
                <SelectItem value="verification_completed">Verified</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loading && auditTrail.length === 0 ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : auditTrail.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No audit trail entries found matching your criteria.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => {
                setFilters({ transactionId: '', eventType: '' });
                setSearchTerm('');
                onUpdateFilters({});
              }}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {auditTrail.map((entry, index) => {
              const isExpanded = expandedEntries.has(entry.id);
              const isLast = index === auditTrail.length - 1;

              return (
                <div key={entry.id} className="relative">
                  {/* Timeline line */}
                  {!isLast && (
                    <div className="absolute left-5 top-12 w-0.5 h-full bg-gray-200" />
                  )}

                  <div className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                    {/* Event Icon */}
                    <div className="flex-shrink-0 w-10 h-10 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center">
                      {getEventIcon(entry.eventType)}
                    </div>

                    {/* Event Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-3 min-w-0">
                            <Badge
                              variant="secondary"
                              className={cn('text-[10px] sm:text-xs w-fit whitespace-nowrap', getEventColor(entry.eventType))}
                            >
                              {formatEventType(entry.eventType)}
                            </Badge>
                            <span className="font-mono text-[10px] sm:text-sm text-muted-foreground truncate max-w-[100px] xs:max-w-none" title={entry.transactionId}>
                              {entry.transactionId}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground text-right shrink-0">
                          <span>{format(new Date(entry.timestamp), 'MMM dd, HH:mm:ss')}</span>
                          <span className="hidden sm:inline">({formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })})</span>
                        </div>
                      </div>

                      {/* Event Details Preview */}
                      <div className="text-xs sm:text-sm text-muted-foreground mb-2 flex flex-wrap gap-y-1">
                        {entry.details.provider && (
                          <span className="mr-4 whitespace-nowrap">Provider: {entry.details.provider}</span>
                        )}
                        {entry.details.model && (
                          <span className="mr-4 whitespace-nowrap">Model: {entry.details.model}</span>
                        )}
                        {entry.details.status && (
                          <span className="mr-4 whitespace-nowrap">Status: {entry.details.status}</span>
                        )}
                      </div>

                      {/* Expand/Collapse Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => toggleEntryExpansion(entry.id)}
                      >
                        {isExpanded ? (
                          <>
                            <ChevronDown className="h-3 w-3 mr-1" />
                            Less Details
                          </>
                        ) : (
                          <>
                            <ChevronRight className="h-3 w-3 mr-1" />
                            More Details
                          </>
                        )}
                      </Button>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            {Object.entries(entry.details).map(([key, value]) => (
                              <div key={key}>
                                <span className="font-medium text-gray-600">
                                  {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}:
                                </span>
                                <div className="text-gray-900 font-mono mt-1 break-all overflow-hidden text-[10px] sm:text-xs">
                                  {typeof value === 'string' && value.startsWith('http') ? (
                                    <a
                                      href={value}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline flex items-center gap-1 break-all"
                                    >
                                      <span className="truncate">{value}</span>
                                      <ExternalLink className="h-3 w-3 shrink-0" />
                                    </a>
                                  ) : (
                                    String(value)
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Load More Button (for future pagination) */}
            <div className="pt-4 border-t border-gray-100">
              <Button variant="outline" className="w-full" size="sm">
                Load More Events
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
