"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Loader2, 
  RefreshCw, 
  Play,
  ArrowRight,
  Database,
  Table,
  Columns,
  AlertCircle,
  PartyPopper
} from 'lucide-react';
import { validationApi, ValidationResult, ActivationCheck } from '@/lib/validation-api';

interface ValidationResultsProps {
  connectorId: string;
  connectorName: string;
  open: boolean;
  onClose: () => void;
  onActivated?: () => void;
}

export function ValidationResults({
  connectorId,
  connectorName,
  open,
  onClose,
  onActivated
}: ValidationResultsProps) {
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [activationCheck, setActivationCheck] = useState<ActivationCheck | null>(null);
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState<string>('');

  // Load latest validation on open
  useEffect(() => {
    if (open) {
      loadLatestValidation();
      checkActivation();
    }
  }, [open, connectorId]);

  const loadLatestValidation = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await validationApi.getLatestValidation(connectorId);
      setResult(data);
    } catch (err: unknown) {
      // No validation results yet is OK
      if ((err as { response?: { status: number } })?.response?.status !== 404) {
        setError('Failed to load validation results');
      }
    } finally {
      setLoading(false);
    }
  };

  const checkActivation = async () => {
    try {
      const data = await validationApi.checkCanActivate(connectorId);
      setActivationCheck(data);
    } catch (err) {
      console.error('Failed to check activation status', err);
    }
  };

  const handleRunValidation = async () => {
    setValidating(true);
    setError('');
    try {
      const data = await validationApi.triggerValidation(connectorId);
      setResult(data);
      await checkActivation();
      
      if (data.status === 'passed') {
        toast.success('Validation passed! All checks completed successfully.');
      } else if (data.status === 'warning') {
        toast.warning(`Validation completed with ${data.warning_count} warnings.`);
      } else {
        toast.error(`Validation failed with ${data.error_count} errors.`);
      }
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Validation failed';
      setError(message);
      toast.error(message);
    } finally {
      setValidating(false);
    }
  };

  const handleActivate = async () => {
    setActivating(true);
    try {
      const response = await validationApi.activateConnector(connectorId);
      if (response.success) {
        toast.success('🎉 Connector activated successfully!');
        onActivated?.();
        onClose();
      }
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: { message?: string; blocking_reasons?: string[] } | string } } })?.response?.data?.detail;
      
      if (typeof detail === 'object' && detail?.blocking_reasons) {
        // Show detailed blocking reasons
        const reasons = detail.blocking_reasons.join('\n• ');
        toast.error(`Cannot activate: \n• ${reasons}`, { duration: 6000 });
        // Refresh activation check to update UI
        await checkActivation();
      } else {
        const message = typeof detail === 'string' ? detail : 'Failed to activate connector';
        toast.error(message);
      }
    } finally {
      setActivating(false);
    }
  };

  // Auto-run validation when dialog opens if no validation exists but ETL job succeeded
  useEffect(() => {
    const autoValidate = async () => {
      if (open && !result && !loading && !validating && activationCheck) {
        // Check if there's an ETL job success but no validation
        const hasEtlSuccess = !activationCheck.blocking_reasons?.some(
          (r: string) => r.toLowerCase().includes('no successful etl')
        );
        const needsValidation = activationCheck.blocking_reasons?.some(
          (r: string) => r.toLowerCase().includes('no validation')
        );
        
        if (hasEtlSuccess && needsValidation) {
          // Auto-trigger validation
          toast.info('Running validation after ETL completion...');
          await handleRunValidation();
        }
      }
    };
    autoValidate();
  }, [open, result, loading, validating, activationCheck]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'passed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1" /> Passed</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" /> Failed</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertTriangle className="h-3 w-3 mr-1" /> Warning</Badge>;
      case 'running':
        return <Badge className="bg-blue-100 text-blue-800"><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Running</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getMatchBadge = (match: string) => {
    switch (match) {
      case 'match':
        return <Badge className="bg-green-100 text-green-800">Match</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-100 text-yellow-800">Partial</Badge>;
      case 'mismatch':
        return <Badge className="bg-red-100 text-red-800">Mismatch</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()} modal={true}>
      <DialogContent 
        className="max-w-3xl max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Validation Results: {connectorName}
          </DialogTitle>
          <DialogDescription>
            Data quality validation and activation status
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleRunValidation}
              disabled={validating}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {validating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Validating...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run Validation
                </>
              )}
            </Button>
            
            <Button
              onClick={handleActivate}
              disabled={activating || !activationCheck?.can_activate}
              className="bg-green-600 hover:bg-green-700"
            >
              {activating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Activating...
                </>
              ) : (
                <>
                  <PartyPopper className="h-4 w-4 mr-2" />
                  Activate Connector
                </>
              )}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Activation Prerequisites */}
          {activationCheck && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Activation Prerequisites</CardTitle>
                <CardDescription>
                  {activationCheck.can_activate 
                    ? '✅ All prerequisites met - ready to activate!'
                    : '⚠️ Complete the following before activation'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(activationCheck.prerequisites).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      {value ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className={value ? 'text-green-700' : 'text-gray-600'}>
                        {key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </span>
                    </div>
                  ))}
                </div>
                
                {activationCheck.blocking_reasons.length > 0 && (
                  <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                    <p className="text-sm font-medium text-yellow-800 mb-2">Blocking Reasons:</p>
                    <ul className="text-sm text-yellow-700 list-disc list-inside">
                      {activationCheck.blocking_reasons.map((reason, i) => (
                        <li key={i}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Validation Results */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : result ? (
            <Tabs defaultValue="summary">
              <TabsList>
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="row-counts">Row Counts</TabsTrigger>
                <TabsTrigger value="schema">Schema</TabsTrigger>
                <TabsTrigger value="quality">Quality</TabsTrigger>
                <TabsTrigger value="issues">Issues ({result.issue_count})</TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-gray-500">Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {getStatusBadge(result.status)}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-gray-500">Quality Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <Progress value={(result.quality_score || 0) * 100} className="h-2 flex-1" />
                        <span className="text-sm font-medium">
                          {((result.quality_score || 0) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-gray-500">Issues Found</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        {result.error_count > 0 && (
                          <Badge className="bg-red-100 text-red-800">{result.error_count} Errors</Badge>
                        )}
                        {result.warning_count > 0 && (
                          <Badge className="bg-yellow-100 text-yellow-800">{result.warning_count} Warnings</Badge>
                        )}
                        {result.issue_count === 0 && (
                          <Badge className="bg-green-100 text-green-800">No Issues</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <p className="text-sm text-gray-500">
                  Last validated: {result.validated_at ? new Date(result.validated_at).toLocaleString() : 'Never'}
                </p>
              </TabsContent>

              <TabsContent value="row-counts">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Table className="h-5 w-5" />
                      Row Count Validation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <p className="text-2xl font-bold">{result.source_row_count?.toLocaleString() || '—'}</p>
                        <p className="text-sm text-gray-500">Source Rows</p>
                      </div>
                      
                      <ArrowRight className="h-6 w-6 text-gray-400" />
                      
                      <div className="text-center">
                        <p className="text-2xl font-bold">{result.target_row_count?.toLocaleString() || '—'}</p>
                        <p className="text-sm text-gray-500">Target Rows</p>
                      </div>
                      
                      <div className="text-center">
                        {getMatchBadge(result.row_count_match)}
                        {result.row_count_difference !== null && result.row_count_difference !== 0 && (
                          <p className="text-sm text-gray-500 mt-1">
                            Difference: {result.row_count_difference?.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="schema">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Columns className="h-5 w-5" />
                      Schema Validation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Schema Match:</span>
                      {getMatchBadge(result.schema_match)}
                    </div>
                    
                    {result.schema_issues && result.schema_issues.length > 0 && (
                      <div className="space-y-2">
                        <p className="font-medium">Schema Issues:</p>
                        {result.schema_issues.map((issue, i) => (
                          <Alert key={i} variant={issue.severity === 'error' ? 'destructive' : 'default'}>
                            <AlertDescription>
                              <strong>{issue.type}:</strong> {issue.message}
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="quality">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Data Quality Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500">Quality Score</p>
                        <p className="text-xl font-bold">
                          {((result.quality_score || 0) * 100).toFixed(0)}%
                        </p>
                      </div>
                      
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500">Null Percentage</p>
                        <p className="text-xl font-bold">
                          {result.null_percentage !== null ? `${(result.null_percentage * 100).toFixed(1)}%` : '—'}
                        </p>
                      </div>
                      
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500">Duplicate Percentage</p>
                        <p className="text-xl font-bold">
                          {result.duplicate_percentage !== null ? `${(result.duplicate_percentage * 100).toFixed(1)}%` : '—'}
                        </p>
                      </div>
                    </div>

                    {result.column_metrics && Object.keys(result.column_metrics).length > 0 && (
                      <div className="mt-4">
                        <p className="font-medium mb-2">Column Metrics:</p>
                        <div className="border rounded-lg divide-y">
                          {Object.entries(result.column_metrics).map(([field, metrics]) => (
                            <div key={field} className="p-3 flex items-center justify-between">
                              <span className="font-mono text-sm">{field}</span>
                              <div className="flex gap-2">
                                {metrics.is_pii && (
                                  <Badge variant="outline" className="text-orange-600">PII</Badge>
                                )}
                                {metrics.has_validation_rules && (
                                  <Badge variant="outline" className="text-blue-600">Has Rules</Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="issues">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Validation Issues</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {result.issues && result.issues.length > 0 ? (
                      <div className="space-y-2">
                        {result.issues.map((issue, i) => (
                          <Alert key={i} variant={issue.severity === 'error' ? 'destructive' : 'default'}>
                            <AlertTitle className="flex items-center gap-2">
                              {issue.severity === 'error' ? (
                                <XCircle className="h-4 w-4" />
                              ) : (
                                <AlertTriangle className="h-4 w-4" />
                              )}
                              {issue.type}
                            </AlertTitle>
                            <AlertDescription>{issue.message}</AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-2" />
                        <p>No issues found!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-2" />
              <p>No validation results yet.</p>
              <p className="text-sm">Click "Run Validation" to check data quality.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

