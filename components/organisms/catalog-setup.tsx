"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Database, Loader2, CheckCircle2, XCircle, AlertCircle, RefreshCw, Table, ArrowLeft } from 'lucide-react';
import { catalogApi, CrawlerStatus, CatalogTable } from '@/lib/catalog-api';

interface CatalogSetupProps {
  connectorId: string;
  connectorName: string;
  connectorType: 'postgres' | 's3';
  connectionName?: string;
  s3Path?: string;
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function CatalogSetup({
  connectorId,
  connectorName,
  connectorType,
  connectionName,
  s3Path,
  open,
  onClose,
  onComplete
}: CatalogSetupProps) {
  const [step, setStep] = useState<'database' | 'crawler' | 'tables'>('database');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [databaseName, setDatabaseName] = useState<string>('');
  const [crawlerName, setCrawlerName] = useState<string>('');
  const [crawlerStatus, setCrawlerStatus] = useState<CrawlerStatus | null>(null);
  const [tables, setTables] = useState<CatalogTable[]>([]);
  const [error, setError] = useState<string>('');
  
  // Crawler configuration
  const [jdbcPath, setJdbcPath] = useState<string>('public/%');
  const [tablePrefix, setTablePrefix] = useState<string>('');

  // Load existing state when dialog opens
  useEffect(() => {
    if (open) {
      loadExistingState();
    }
  }, [open, connectorId]);

  const loadExistingState = async () => {
    try {
      setInitialLoading(true);
      setError('');
      
      // Check if database exists
      try {
        const dbInfo = await catalogApi.getDatabase(connectorId);
        if (dbInfo && dbInfo.database_name) {
          setDatabaseName(dbInfo.database_name);
          
          // Check if crawler exists
          try {
            const status = await catalogApi.getCrawlerStatus(connectorId);
            if (status && status.crawler_name) {
              setCrawlerName(status.crawler_name);
              setCrawlerStatus(status);
              
              // If crawler succeeded, load tables and go to tables step
              if (status.last_crawl?.status === 'SUCCEEDED') {
                await loadTables();
                setStep('tables');
              } else if (status.state === 'RUNNING') {
                // Crawler is running, go to crawler step
                setStep('crawler');
              } else if (status.last_crawl?.status === 'FAILED') {
                // Crawler failed, show error and stay on crawler step
                setStep('crawler');
                setError(`Last crawler run failed: ${status.last_crawl.error_message || 'Unknown error'}. You can try running it again.`);
              } else {
                // Crawler exists but hasn't run successfully yet
                setStep('crawler');
              }
            } else {
              // No crawler, go to crawler step
              setStep('crawler');
            }
          } catch {
            // No crawler exists, go to crawler step
            setStep('crawler');
          }
        }
      } catch {
        // No database exists, stay on database step
        setStep('database');
      }
    } catch (err) {
      console.error('Error loading existing state:', err);
    } finally {
      setInitialLoading(false);
    }
  };

  // Polling for crawler status
  useEffect(() => {
    if (step === 'crawler' && crawlerName && crawlerStatus?.state === 'RUNNING') {
      const interval = setInterval(async () => {
        try {
          const status = await catalogApi.getCrawlerStatus(connectorId);
          setCrawlerStatus(status);
          
          // If crawler succeeded, move to tables view
          if (status.last_crawl?.status === 'SUCCEEDED') {
            clearInterval(interval);
            toast.success('Crawler completed successfully!');
            await loadTables();
            setStep('tables');
          } else if (status.last_crawl?.status === 'FAILED') {
            clearInterval(interval);
            setError(`Crawler failed: ${status.last_crawl.error_message || 'Unknown error'}`);
          }
        } catch {
          // Crawler might not exist yet, ignore error
        }
      }, 5000); // Poll every 5 seconds

      return () => clearInterval(interval);
    }
  }, [step, crawlerName, crawlerStatus?.state, connectorId]);

  const handleCreateDatabase = async () => {
    try {
      setLoading(true);
      setError('');
      
      const result = await catalogApi.createDatabase(
        connectorId,
        `Catalog database for ${connectorName}`
      );
      
      // Check if result has the expected structure
      if (!result || !result.database_name) {
        throw new Error('Invalid response from server: missing database_name');
      }
      
      setDatabaseName(result.database_name);
      toast.success(`Catalog database created: ${result.database_name}`);
      setStep('crawler');
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to create catalog database';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('Create database error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCrawler = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Validate required fields with clear error messages
      if (connectorType === 's3' && !s3Path) {
        const errorMsg = '❌ S3 Path Missing: The S3 path is required but not configured. Please check your connector configuration.';
        setError(errorMsg);
        toast.error('S3 Path Required', { description: 'Please check your connector configuration.' });
        return;
      }
      
      if (connectorType === 'postgres' && !connectionName) {
        const errorMsg = '⚠️ Glue Connection Required\n\nBefore creating a crawler, you need to set up a Glue Connection:\n\n1. Close this dialog\n2. Click "Setup Connection" from the connector menu\n3. Complete the VPC configuration\n4. Then return here to create the crawler';
        setError(errorMsg);
        toast.error('Glue Connection Required', { 
          description: 'Please set up the Glue Connection first via "Setup Connection" in the connector menu.',
          duration: 8000
        });
        return;
      }
      
      const config = connectorType === 'postgres'
        ? {
            crawler_type: 'postgres' as const,
            connection_name: connectionName || '',
            jdbc_path: jdbcPath || 'public/%',
            table_prefix: tablePrefix
          }
        : {
            crawler_type: 's3' as const,
            s3_path: s3Path || '',
            table_prefix: tablePrefix
          };
      
      const result = await catalogApi.createCrawler(connectorId, config);
      setCrawlerName(result.crawler_name);
      
      // Start the crawler immediately
      await catalogApi.startCrawler(connectorId);
      toast.success('Crawler created and started!');
      
      // Start polling for status
      const status = await catalogApi.getCrawlerStatus(connectorId);
      setCrawlerStatus(status);
    } catch (err: any) {
      let errorMsg = err.response?.data?.detail || err.message || 'Failed to create crawler';
      
      // Detect specific AWS Glue errors and provide helpful guidance
      if (errorMsg.includes('JDBC Connection not registered') || errorMsg.includes('Connection not registered')) {
        errorMsg = '⚠️ Glue Connection Not Found\n\nThe crawler cannot find a registered JDBC connection. This usually means:\n\n1. The Glue Connection was not set up, OR\n2. The connection name doesn\'t match\n\n👉 Solution: Close this dialog, click "Setup Connection" from the connector menu, then return here.';
        toast.error('Connection Not Found', { 
          description: 'Please set up the Glue Connection first via "Setup Connection".',
          duration: 8000
        });
      } else if (errorMsg.includes('role') || errorMsg.includes('TrustPolicy')) {
        errorMsg = '⚠️ IAM Role Error\n\nAWS Glue cannot assume the configured IAM role. Please check:\n\n1. The GLUE_ROLE_ARN environment variable is set correctly\n2. The role has proper trust policy for Glue service\n3. The role has necessary permissions';
        toast.error('IAM Role Error', { 
          description: 'Check the Glue IAM role configuration.',
          duration: 8000
        });
      } else if (errorMsg.includes('Availability Zone') || errorMsg.includes('does not correspond to subnet')) {
        errorMsg = '⚠️ Availability Zone Mismatch\n\nThe subnet selected for the Glue Connection is in an Availability Zone that AWS Glue doesn\'t support.\n\n👉 Solution:\n1. Go back to "Setup Connection"\n2. Select a different subnet in a supported AZ (try eu-north-1b or eu-north-1c)\n3. Recreate the connection with the new subnet';
        toast.error('AZ Not Supported', { 
          description: 'Try a different subnet in another Availability Zone.',
          duration: 8000
        });
      }
      
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const loadTables = async () => {
    try {
      const catalogTables = await catalogApi.listTables(connectorId);
      setTables(catalogTables);
    } catch (err: any) {
      console.error('Failed to load tables:', err);
    }
  };

  const handleComplete = () => {
    toast.success('Catalog setup complete!');
    onComplete();
    onClose();
  };

  const getCrawlerStateColor = (state: string) => {
    switch (state) {
      case 'READY': return 'bg-green-500';
      case 'RUNNING': return 'bg-blue-500 animate-pulse';
      case 'STOPPING': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getCrawlerStatusColor = (status?: string) => {
    switch (status) {
      case 'SUCCEEDED': return 'text-green-600';
      case 'FAILED': return 'text-red-600';
      case 'CANCELLED': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  // Prevent closing unless explicitly requested via buttons or X
  const handleOpenChange = (isOpen: boolean) => {
    // Only allow closing via explicit user action (X button or Cancel/Close buttons)
    if (!isOpen) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} modal={true}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Setup Glue Data Catalog
          </DialogTitle>
          <DialogDescription>
            Configure AWS Glue Data Catalog for {connectorName} to enable ETL jobs
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'database' ? 'bg-blue-500 text-white' : 
                databaseName ? 'bg-green-500 text-white' : 'bg-gray-200'
              }`}>
                {databaseName ? <CheckCircle2 className="h-4 w-4" /> : '1'}
              </div>
              <span className="text-sm font-medium">Database</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-200 mx-2" />
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'crawler' ? 'bg-blue-500 text-white' : 
                crawlerName ? 'bg-green-500 text-white' : 'bg-gray-200'
              }`}>
                {crawlerStatus?.last_crawl?.status === 'SUCCEEDED' ? <CheckCircle2 className="h-4 w-4" /> : '2'}
              </div>
              <span className="text-sm font-medium">Crawler</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-200 mx-2" />
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'tables' ? 'bg-blue-500 text-white' : 
                tables.length > 0 ? 'bg-green-500 text-white' : 'bg-gray-200'
              }`}>
                {tables.length > 0 ? <CheckCircle2 className="h-4 w-4" /> : '3'}
              </div>
              <span className="text-sm font-medium">Tables</span>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {initialLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading catalog status...</span>
            </div>
          )}

          {/* Step 1: Create Database */}
          {!initialLoading && step === 'database' && (
            <div className="space-y-4">
              <Alert>
                <Database className="h-4 w-4" />
                <AlertTitle>Create Catalog Database</AlertTitle>
                <AlertDescription>
                  A Glue catalog database will be created for your organization. 
                  This database will store metadata about your data sources.
                </AlertDescription>
              </Alert>

              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={onClose}
                  className="border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateDatabase} 
                  disabled={loading}
                  className="bg-black text-white hover:bg-gray-800"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Database
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Create & Run Crawler */}
          {!initialLoading && step === 'crawler' && (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Configure Crawler</AlertTitle>
                <AlertDescription>
                  The crawler will scan your {connectorType === 'postgres' ? 'PostgreSQL database' : 'S3 bucket'} 
                  and catalog the schema information.
                </AlertDescription>
              </Alert>

              {!crawlerName ? (
                <>
                  {connectorType === 'postgres' && (
                    <div className="space-y-2">
                      <Label htmlFor="jdbc-path">JDBC Path</Label>
                      <Input
                        id="jdbc-path"
                        placeholder="public/% (schema/table pattern)"
                        value={jdbcPath}
                        onChange={(e) => setJdbcPath(e.target.value)}
                      />
                      <p className="text-sm text-gray-500">
                        Use % as wildcard. Example: public/% for all tables in public schema
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="table-prefix">Table Prefix (Optional)</Label>
                    <Input
                      id="table-prefix"
                      placeholder="e.g., prod_"
                      value={tablePrefix}
                      onChange={(e) => setTablePrefix(e.target.value)}
                    />
                    <p className="text-sm text-gray-500">
                      Prefix to add to cataloged table names
                    </p>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setStep('database')}
                      className="border-gray-300 text-gray-700 hover:bg-gray-100"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    <Button 
                      onClick={handleCreateCrawler} 
                      disabled={loading || (connectorType === 'postgres' && !jdbcPath)}
                      className="bg-black text-white hover:bg-gray-800"
                    >
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create & Start Crawler
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {/* Crawler Status */}
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Crawler: {crawlerName}</span>
                      <Badge className={getCrawlerStateColor(crawlerStatus?.state || 'UNKNOWN')}>
                        {crawlerStatus?.state || 'UNKNOWN'}
                      </Badge>
                    </div>

                    {crawlerStatus?.last_crawl && (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Last Run:</span>
                          <span className={getCrawlerStatusColor(crawlerStatus.last_crawl.status)}>
                            {crawlerStatus.last_crawl.status}
                          </span>
                        </div>
                        {crawlerStatus.last_crawl.start_time && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Started:</span>
                            <span>{new Date(crawlerStatus.last_crawl.start_time).toLocaleString()}</span>
                          </div>
                        )}
                        {crawlerStatus.last_crawl.error_message && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-700 text-sm font-medium mb-2">Error Details:</p>
                            <p className="text-red-600 text-xs">{crawlerStatus.last_crawl.error_message}</p>
                            
                            {/* Special handling for AZ error */}
                            {crawlerStatus.last_crawl.error_message.includes('Availability Zone') && (
                              <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                                <p className="font-medium text-yellow-800 mb-1">🔧 How to fix:</p>
                                <ol className="list-decimal list-inside text-yellow-700 space-y-1">
                                  <li>Go to AWS Glue Console → Connections</li>
                                  <li>Delete the current connection</li>
                                  <li>Recreate using a subnet in a supported AZ (e.g., eu-north-1b or eu-north-1c)</li>
                                  <li>Return here and retry the crawler</li>
                                </ol>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {crawlerStatus?.state === 'RUNNING' && (
                      <div className="flex items-center gap-2 text-blue-600">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Crawling in progress...</span>
                      </div>
                    )}

                    {/* Show action buttons if crawler is ready or stopped (failed) */}
                    {(crawlerStatus?.state === 'READY' || crawlerStatus?.state === 'STOPPING' || crawlerStatus?.state === 'STOPPED') && (
                      <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                        <Button 
                          variant={crawlerStatus.last_crawl?.status === 'FAILED' ? 'destructive' : 'default'}
                          onClick={async () => {
                            try {
                              setLoading(true);
                              setError('');
                              await catalogApi.startCrawler(connectorId);
                              toast.success('Crawler started!');
                              const status = await catalogApi.getCrawlerStatus(connectorId);
                              setCrawlerStatus(status);
                            } catch (err: any) {
                              const errorMsg = err.response?.data?.detail || err.message || 'Failed to start crawler';
                              setError(errorMsg);
                              toast.error(errorMsg);
                            } finally {
                              setLoading(false);
                            }
                          }}
                          disabled={loading}
                          className={crawlerStatus.last_crawl?.status === 'FAILED' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}
                        >
                          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          <RefreshCw className="mr-2 h-4 w-4" />
                          {crawlerStatus.last_crawl?.status === 'FAILED' ? 'Retry Crawler' : 'Run Again'}
                        </Button>
                        {crawlerStatus.last_crawl?.status === 'SUCCEEDED' && (
                          <Button 
                            onClick={async () => {
                              await loadTables();
                              setStep('tables');
                            }}
                            className="bg-black text-white hover:bg-gray-800"
                          >
                            View Tables
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 3: View Cataloged Tables */}
          {!initialLoading && step === 'tables' && (
            <div className="space-y-4">
              <Alert>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle>Catalog Ready!</AlertTitle>
                <AlertDescription>
                  Found {tables.length} table{tables.length !== 1 ? 's' : ''} in the catalog. 
                  You can now create ETL jobs.
                </AlertDescription>
              </Alert>

              {/* Tables List */}
              <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
                {tables.map((table) => (
                  <div key={table.name} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Table className="h-4 w-4 text-gray-500" />
                        <div>
                          <div className="font-medium">{table.name}</div>
                          <div className="text-sm text-gray-500">
                            {table.columns.length} columns • {table.row_count} rows
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline">{table.table_type}</Badge>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={loadTables}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
                <Button onClick={handleComplete}>
                  Complete Setup
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

