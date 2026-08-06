"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  AlertCircle, 
  RefreshCw, 
  Loader2, 
  CheckCircle2, 
  XCircle,
  Lightbulb,
  Clock,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { glueJobApi } from '@/lib/glue-job-api';

interface ErrorDisplayProps {
  open: boolean;
  onClose: () => void;
  connectorId: string;
  jobId: string;
  jobName: string;
  onRetrySuccess?: () => void;
}

interface ErrorAnalysis {
  error_type: string | null;
  confidence: number;
  error_message: string | null;
  user_friendly_message: string;
  resolution_suggestions: string[];
  is_retryable: boolean;
  max_retries: number;
  analyzed_at: string;
}

const ERROR_TYPE_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  connection_error: { label: 'Connection Error', color: 'bg-orange-100 text-orange-800', icon: <AlertCircle className="h-4 w-4" /> },
  permission_error: { label: 'Permission Error', color: 'bg-red-100 text-red-800', icon: <XCircle className="h-4 w-4" /> },
  schema_error: { label: 'Schema Error', color: 'bg-purple-100 text-purple-800', icon: <AlertCircle className="h-4 w-4" /> },
  data_error: { label: 'Data Error', color: 'bg-yellow-100 text-yellow-800', icon: <AlertCircle className="h-4 w-4" /> },
  timeout_error: { label: 'Timeout', color: 'bg-blue-100 text-blue-800', icon: <Clock className="h-4 w-4" /> },
  resource_error: { label: 'Resource Error', color: 'bg-indigo-100 text-indigo-800', icon: <AlertCircle className="h-4 w-4" /> },
  catalog_error: { label: 'Catalog Error', color: 'bg-teal-100 text-teal-800', icon: <AlertCircle className="h-4 w-4" /> },
  configuration_error: { label: 'Configuration Error', color: 'bg-gray-100 text-gray-800', icon: <AlertCircle className="h-4 w-4" /> },
  unknown_error: { label: 'Unknown Error', color: 'bg-gray-100 text-gray-800', icon: <AlertCircle className="h-4 w-4" /> },
};

export function ErrorDisplay({ 
  open, 
  onClose, 
  connectorId, 
  jobId, 
  jobName,
  onRetrySuccess 
}: ErrorDisplayProps) {
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [analysis, setAnalysis] = useState<ErrorAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchErrorAnalysis();
    }
  }, [open, connectorId, jobId]);

  const fetchErrorAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await glueJobApi.analyzeError(connectorId, jobId);
      setAnalysis(result);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to analyze error');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async () => {
    setRetrying(true);
    try {
      const result = await glueJobApi.retryJob(connectorId, jobId);
      toast.success(result.message);
      onRetrySuccess?.();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to retry job');
    } finally {
      setRetrying(false);
    }
  };

  const getErrorTypeInfo = (errorType: string | null) => {
    if (!errorType) return ERROR_TYPE_LABELS.unknown_error;
    return ERROR_TYPE_LABELS[errorType] || ERROR_TYPE_LABELS.unknown_error;
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()} modal={true}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Error Analysis: {jobName}
          </DialogTitle>
          <DialogDescription>
            Understanding what went wrong and how to fix it
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : analysis ? (
            <>
              {/* Error Type Badge */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">Error Type:</span>
                <Badge className={getErrorTypeInfo(analysis.error_type).color}>
                  {getErrorTypeInfo(analysis.error_type).icon}
                  <span className="ml-1">{getErrorTypeInfo(analysis.error_type).label}</span>
                </Badge>
                {analysis.confidence > 0 && (
                  <span className="text-xs text-gray-400">
                    ({Math.round(analysis.confidence * 100)}% confidence)
                  </span>
                )}
              </div>

              {/* User-Friendly Message */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>What Happened</AlertTitle>
                <AlertDescription className="mt-2">
                  {analysis.user_friendly_message}
                </AlertDescription>
              </Alert>

              {/* Resolution Suggestions */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-500" />
                    How to Fix This
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.resolution_suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <ArrowRight className="h-4 w-4 mt-0.5 text-blue-500 flex-shrink-0" />
                        <span className="text-sm">{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Original Error Message (Collapsible) */}
              {analysis.error_message && (
                <details className="group">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                    View technical details
                  </summary>
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap break-words font-mono">
                      {analysis.error_message}
                    </pre>
                  </div>
                </details>
              )}

              {/* Retry Section */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2">
                  {analysis.is_retryable ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-700">
                        This error can be retried (max {analysis.max_retries} attempts)
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-red-700">
                        This error requires manual intervention
                      </span>
                    </>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={onClose}>
                    Close
                  </Button>
                  {analysis.is_retryable && (
                    <Button 
                      onClick={handleRetry} 
                      disabled={retrying}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {retrying ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Retrying...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Retry Job
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-2" />
              <p>No error found for this job.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

