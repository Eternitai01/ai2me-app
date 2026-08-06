import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, RefreshCw, Clock, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from "sonner";
import { catalogApi } from '@/lib/catalog-api';

interface CrawlerStatusProps {
    connectorId: string;
    crawlerName: string | null;
    open: boolean;
    onClose: () => void;
}

export function CrawlerStatus({ connectorId, crawlerName: initialCrawlerName, open, onClose }: CrawlerStatusProps) {
    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [starting, setStarting] = useState(false);
    const [error, setError] = useState<string>('');
    const [actualCrawlerName, setActualCrawlerName] = useState<string | null>(initialCrawlerName);

    const fetchStatus = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await catalogApi.getCrawlerStatus(connectorId);
            setStatus(data);
            // Update crawler name from API response
            if (data?.crawler_name) {
                setActualCrawlerName(data.crawler_name);
            }
        } catch (err: any) {
            const errMsg = err.response?.data?.detail || err.message || 'Failed to fetch crawler status';
            // If 404, it means no crawler exists
            if (err.response?.status === 404) {
                setActualCrawlerName(null);
                setError('');
            } else {
                setError(errMsg);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleStartCrawler = async () => {
        setStarting(true);
        setError('');
        try {
            await catalogApi.startCrawler(connectorId);
            toast.success("Crawler started successfully!");
            // Poll for updates
            setTimeout(fetchStatus, 2000);
        } catch (err: any) {
            const errMsg = err.response?.data?.detail || err.message || 'Failed to start crawler';
            setError(errMsg);
            toast.error(errMsg);
        } finally {
            setStarting(false);
        }
    };

    useEffect(() => {
        if (open) {
            // Always fetch status when opened - this will get the actual crawler name from API
            fetchStatus();
        }
    }, [open, connectorId]);

    const getStateColor = (state?: string) => {
        switch (state) {
            case 'RUNNING': return 'bg-blue-500';
            case 'READY': return 'bg-green-500';
            case 'STOPPING': return 'bg-yellow-500';
            default: return 'bg-gray-500';
        }
    };

    const getStatusIcon = (crawlStatus?: string) => {
        switch (crawlStatus) {
            case 'SUCCEEDED': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
            case 'FAILED': return <AlertCircle className="h-4 w-4 text-red-600" />;
            case 'RUNNING': return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
            default: return <Clock className="h-4 w-4 text-gray-500" />;
        }
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        Crawler Management
                    </DialogTitle>
                    <DialogDescription>
                        {actualCrawlerName ? `Manage crawler: ${actualCrawlerName}` : 'No crawler configured'}
                    </DialogDescription>
                </DialogHeader>

                {loading && !status ? (
                    <div className="text-center py-6">
                        <Loader2 className="h-8 w-8 mx-auto text-gray-400 animate-spin mb-3" />
                        <p className="text-gray-500">Loading crawler status...</p>
                    </div>
                ) : !actualCrawlerName ? (
                    <div className="text-center py-6">
                        <AlertCircle className="h-12 w-12 mx-auto text-yellow-500 mb-3" />
                        <p className="text-gray-600">No crawler has been created yet.</p>
                        <p className="text-sm text-gray-500 mt-2">
                            Use &quot;Setup Catalog&quot; from the connector menu to create a crawler.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
                                {error}
                            </div>
                        )}

                        {/* Status Display */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                                <p className="text-sm text-gray-500">Crawler State</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge className={`${getStateColor(status?.state)} text-white`}>
                                        {status?.state || 'UNKNOWN'}
                                    </Badge>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-500">Last Crawl</p>
                                <div className="flex items-center gap-2 mt-1">
                                    {getStatusIcon(status?.last_crawl?.status)}
                                    <span className="text-sm font-medium">
                                        {status?.last_crawl?.status || 'Never'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                            <Button
                                onClick={handleStartCrawler}
                                disabled={starting || status?.state === 'RUNNING'}
                                className="flex-1 bg-black text-white hover:bg-gray-800"
                            >
                                {starting ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Play className="h-4 w-4 mr-2" />
                                )}
                                {starting ? 'Starting...' : 'Run Crawler'}
                            </Button>
                            <Button 
                                variant="outline" 
                                onClick={fetchStatus} 
                                disabled={loading}
                            >
                                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>

                        <Button variant="outline" onClick={onClose} className="w-full">
                            Close
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
