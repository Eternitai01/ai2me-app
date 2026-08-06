"use client";

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
    AlertCircle, 
    CheckCircle2, 
    Network, 
    Sparkles, 
    Shield,
    Loader2 
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { getUserFriendlyError } from '@/lib/error-messages';
import apiService from "@/lib/axios";

interface GlueConnectionWizardProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    connectorId: string;
    connectorName: string;
    connectorType: string;
    onConnectionCreated: () => void;
}

interface VPCConfig {
    vpc_id: string;
    subnet_ids: string[];
    security_group_ids: string[];
    source: string;
    suggested_subnet?: string;
    suggested_security_group?: string;
}

export function GlueConnectionWizard({
    open,
    onOpenChange,
    connectorId,
    connectorName,
    connectorType,
    onConnectionCreated
}: GlueConnectionWizardProps) {
    // S3 connectors always use manual mode (no VPC auto-discovery for S3)
    const [mode, setMode] = useState<'auto' | 'manual'>(connectorType === 's3' ? 'manual' : 'auto');
    const [loading, setLoading] = useState(false);
    const [discovering, setDiscovering] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Auto-discovered config
    const [discoveredConfig, setDiscoveredConfig] = useState<VPCConfig | null>(null);

    // Form State
    const [connectionName, setConnectionName] = useState(
        `${connectorName.toLowerCase().replace(/\s+/g, '-')}-conn`
    );
    const [subnetId, setSubnetId] = useState('');
    const [securityGroupIds, setSecurityGroupIds] = useState('');

    // Auto-discover VPC configuration when dialog opens (only for database connectors)
    useEffect(() => {
        if (open && mode === 'auto' && connectorType !== 's3') {
            autoDiscoverConfig();
        }
    }, [open, mode, connectorType]);

    const autoDiscoverConfig = async () => {
        try {
            setDiscovering(true);
            setError(null);

            const response = await apiService.get<VPCConfig>(
                `/connectors/${connectorId}/vpc-discovery`
            );

            setDiscoveredConfig(response);
            
            // Pre-fill with suggested values
            if (response.suggested_subnet) {
                setSubnetId(response.suggested_subnet);
            }
            if (response.suggested_security_group) {
                setSecurityGroupIds(response.suggested_security_group);
            }

            toast.success("VPC configuration discovered automatically!");
        } catch (err: any) {
            const friendlyError = getUserFriendlyError(err, {
                operation: 'VPC Auto-Discovery',
                connectorType: connectorType,
                step: 'connection'
            });
            
            setError(`${friendlyError.message}\n\n${friendlyError.action}`);
            toast.error(friendlyError.title, {
                description: friendlyError.message
            });
        } finally {
            setDiscovering(false);
        }
    };

    const handleCreateConnection = async () => {
        try {
            setLoading(true);
            setError(null);

            if (!connectionName) {
                toast.error("Validation Error", {
                    description: "Connection name is required. Please enter a unique connection name."
                });
                throw new Error("Connection name is required");
            }

            if (!subnetId || !securityGroupIds) {
                toast.error("Validation Error", {
                    description: "Subnet ID and Security Group IDs are required for VPC connection setup."
                });
                throw new Error("Subnet and Security Group are required");
            }

            const response = await apiService.post<{ connection_name: string; status: string; message?: string }>(
                `/connectors/${connectorId}/glue-connection`,
                {
                    connection_name: connectionName,
                    subnet_id: subnetId,
                    security_group_ids: securityGroupIds.split(',').map(s => s.trim())
                }
            );

            setSuccess(true);
            
            // Handle both "created" and "exists" as success
            if (response.status === 'exists') {
                toast.success("Connection Ready!", {
                    description: `Connection '${connectionName}' already exists and is ready to use. You can proceed to Setup Catalog.`
                });
            } else {
                toast.success("Glue connection created successfully!");
            }
            
            setTimeout(() => {
                onConnectionCreated();
                onOpenChange(false);
                resetState();
            }, 1500);

        } catch (err: any) {
            const friendlyError = getUserFriendlyError(err, {
                operation: 'Create Glue Connection',
                connectorType: connectorType,
                step: 'connection'
            });
            
            setError(`${friendlyError.message}\n\n${friendlyError.action}`);
            toast.error(friendlyError.title, {
                description: `${friendlyError.message}\n\nAction: ${friendlyError.action}`
            });
        } finally {
            setLoading(false);
        }
    };

    const resetState = () => {
        setMode('auto');
        setDiscoveredConfig(null);
        setConnectionName(`${connectorName.toLowerCase().replace(/\s+/g, '-')}-conn`);
        setSubnetId('');
        setSecurityGroupIds('');
        setError(null);
        setSuccess(false);
    };

    return (
        <Dialog open={open} onOpenChange={(open) => {
            if (!open) resetState();
            onOpenChange(open);
        }}>
            <DialogContent className="max-w-xl sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Network className="h-5 w-5" />
                        Setup Glue Connection
                    </DialogTitle>
                    <DialogDescription>
                        Create an AWS Glue Connection for <strong>{connectorName}</strong> to enable
                        VPC access for ETL jobs.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Mode Selection - Only for database connectors, not S3 */}
                    {connectorType !== 's3' && (
                        <div className="flex gap-2 mb-4">
                            <Button
                                type="button"
                                variant={mode === 'auto' ? 'default' : 'outline'}
                                onClick={() => setMode('auto')}
                                className={`flex-1 ${mode === 'auto' ? 'bg-black text-white hover:bg-gray-800' : 'bg-white text-black border-gray-300 hover:bg-gray-50'}`}
                            >
                                <Sparkles className="h-4 w-4 mr-2" />
                                Auto-Discover
                            </Button>
                            <Button
                                type="button"
                                variant={mode === 'manual' ? 'default' : 'outline'}
                                onClick={() => setMode('manual')}
                                className={`flex-1 ${mode === 'manual' ? 'bg-black text-white hover:bg-gray-800' : 'bg-white text-black border-gray-300 hover:bg-gray-50'}`}
                            >
                                Manual Setup
                            </Button>
                        </div>
                    )}

                    {/* Auto Mode */}
                    {mode === 'auto' && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-blue-500" />
                                    Automatic Configuration
                                </CardTitle>
                                <CardDescription>
                                    We&apos;ll automatically detect the VPC configuration from your database endpoint
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {discovering && (
                                    <Alert>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <AlertTitle>Discovering Configuration...</AlertTitle>
                                        <AlertDescription>
                                            Analyzing your {connectorType} endpoint to find the best VPC configuration
                                        </AlertDescription>
                                    </Alert>
                                )}

                                {discoveredConfig && !discovering && (
                                    <Alert className="border-green-500 bg-green-50">
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                        <AlertTitle className="text-green-800">Configuration Discovered!</AlertTitle>
                                        <AlertDescription className="text-green-700 space-y-2">
                                            <p className="font-medium">Source: {discoveredConfig.source.replace(/_/g, ' ').toUpperCase()}</p>
                                            <div className="text-xs space-y-1 mt-2">
                                                <p><strong>VPC:</strong> {discoveredConfig.vpc_id}</p>
                                                <p><strong>Subnets:</strong> {discoveredConfig.subnet_ids.join(', ')}</p>
                                                <p><strong>Security Groups:</strong> {discoveredConfig.security_group_ids.join(', ')}</p>
                                            </div>
                                        </AlertDescription>
                                    </Alert>
                                )}

                                {!discovering && !discoveredConfig && (
                                    <Button 
                                        onClick={autoDiscoverConfig} 
                                        variant="outline"
                                        className="w-full"
                                    >
                                        <Sparkles className="h-4 w-4 mr-2" />
                                        Retry Auto-Discovery
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Manual Mode */}
                    {mode === 'manual' && (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Manual Configuration Required</AlertTitle>
                            <AlertDescription>
                                You&apos;ll need to provide VPC details from your AWS Console.
                                Visit AWS Console → VPC → Subnets/Security Groups to find these values.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Connection Name */}
                    <div className="space-y-2">
                        <Label htmlFor="connectionName">Connection Name</Label>
                        <Input
                            id="connectionName"
                            value={connectionName}
                            onChange={(e) => setConnectionName(e.target.value)}
                            placeholder="my-database-connection"
                        />
                        <p className="text-xs text-gray-500">
                            Must be unique within your AWS Glue account
                        </p>
                    </div>

                    {/* Subnet ID */}
                    <div className="space-y-2">
                        <Label htmlFor="subnetId">
                            Subnet ID
                            {discoveredConfig && <span className="text-green-600 ml-2">(Auto-selected)</span>}
                        </Label>
                        <Input
                            id="subnetId"
                            value={subnetId}
                            onChange={(e) => setSubnetId(e.target.value)}
                            placeholder="subnet-xxxxx"
                            readOnly={mode === 'auto' && !!discoveredConfig}
                            className={mode === 'auto' && discoveredConfig ? 'bg-green-50' : ''}
                        />
                        {discoveredConfig && discoveredConfig.subnet_ids.length > 1 && (
                            <p className="text-xs text-gray-500">
                                Other available subnets: {discoveredConfig.subnet_ids.slice(1).join(', ')}
                            </p>
                        )}
                    </div>

                    {/* Security Group IDs */}
                    <div className="space-y-2">
                        <Label htmlFor="securityGroups">
                            Security Group IDs
                            {discoveredConfig && <span className="text-green-600 ml-2">(Auto-selected)</span>}
                        </Label>
                        <Input
                            id="securityGroups"
                            value={securityGroupIds}
                            onChange={(e) => setSecurityGroupIds(e.target.value)}
                            placeholder="sg-xxxxx (comma-separated for multiple)"
                            readOnly={mode === 'auto' && !!discoveredConfig}
                            className={mode === 'auto' && discoveredConfig ? 'bg-green-50' : ''}
                        />
                        <p className="text-xs text-gray-500">
                            Separate multiple security groups with commas
                        </p>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Success Display */}
                    {success && (
                        <Alert className="border-green-500 bg-green-50">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <AlertTitle className="text-green-800">Success!</AlertTitle>
                            <AlertDescription className="text-green-700">
                                Glue connection created successfully
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleCreateConnection}
                        disabled={loading || !subnetId || !securityGroupIds || !connectionName}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <Shield className="h-4 w-4 mr-2" />
                                Create Connection
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

