"use client";

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
    CheckCircle2, 
    Circle, 
    Database, 
    Map, 
    Zap, 
    AlertCircle,
    ArrowRight,
    HelpCircle,
    Loader2
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

interface ConnectorSetupWizardProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    connectorId: string;
    connectorName: string;
    connectorType: string;
    onComplete: () => void;
}

type Step = {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    required: boolean;
    applicableTo: string[]; // connector types this step applies to
};

type StepStatus = 'pending' | 'in_progress' | 'completed' | 'skipped' | 'error';

export function ConnectorSetupWizard({
    open,
    onOpenChange,
    connectorId,
    connectorName,
    connectorType,
    onComplete
}: ConnectorSetupWizardProps) {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [stepStatuses, setStepStatuses] = useState<Record<string, StepStatus>>({});
    
    // IMPORTANT: This wizard is a GUIDE ONLY - it shows you the steps but doesn't perform actions.
    // You need to use the connector's dropdown menu to execute each step.
    
    // Define the complete workflow
    const allSteps: Step[] = [
        {
            id: 'discover',
            title: 'Discover Schema',
            description: 'Automatically detect tables, columns, and data types',
            icon: <Database className="h-5 w-5" />,
            required: true,
            applicableTo: ['postgresql', 'postgres', 'mysql', 's3', 'redshift']
        },
        {
            id: 'connection',
            title: 'Setup Connection (Optional for Dev)',
            description: 'Configure VPC networking - only needed for AWS Glue jobs with private databases',
            icon: <Zap className="h-5 w-5" />,
            required: false, // Made optional
            applicableTo: ['postgresql', 'postgres', 'mysql', 'redshift'] // Not for S3
        },
        {
            id: 'catalog',
            title: 'Setup Catalog (S3 Only)',
            description: 'Create Glue Data Catalog - required for S3, optional for databases (uses direct JDBC)',
            icon: <Database className="h-5 w-5" />,
            required: false, // Only required for S3, optional for PostgreSQL (uses direct JDBC)
            applicableTo: ['s3'] // Only show for S3 connectors
        },
        {
            id: 'mapping',
            title: 'Map Fields',
            description: 'Define how source fields map to target schema',
            icon: <Map className="h-5 w-5" />,
            required: true,
            applicableTo: ['postgresql', 'postgres', 'mysql', 's3', 'redshift']
        },
        {
            id: 'etl',
            title: 'Create ETL Job',
            description: 'Generate and run automated data pipeline',
            icon: <CheckCircle2 className="h-5 w-5" />,
            required: true,
            applicableTo: ['postgresql', 'postgres', 'mysql', 's3', 'redshift']
        }
    ];

    // Filter steps based on connector type (normalize to lowercase)
    const normalizedType = connectorType?.toLowerCase() || '';
    const steps = allSteps.filter(step => 
        step.applicableTo.some(type => type.toLowerCase() === normalizedType)
    );

    const currentStep = steps[currentStepIndex];
    const progress = currentStep ? ((currentStepIndex + 1) / steps.length) * 100 : 0;

    // Initialize step statuses
    useEffect(() => {
        if (open && steps.length > 0) {
            const initialStatuses: Record<string, StepStatus> = {};
            steps.forEach((step, index) => {
                initialStatuses[step.id] = index === 0 ? 'in_progress' : 'pending';
            });
            setStepStatuses(initialStatuses);
            setCurrentStepIndex(0);
        }
    }, [open, steps.length]);

    const handleStepComplete = () => {
        // Mark current step as completed
        setStepStatuses(prev => ({
            ...prev,
            [currentStep.id]: 'completed'
        }));

        // Move to next step
        if (currentStepIndex < steps.length - 1) {
            setStepStatuses(prev => ({
                ...prev,
                [steps[currentStepIndex + 1].id]: 'in_progress'
            }));
            setCurrentStepIndex(currentStepIndex + 1);
        } else {
            // All steps completed
            onComplete();
            onOpenChange(false);
        }
    };

    const handleSkipStep = () => {
        if (!currentStep.required) {
            setStepStatuses(prev => ({
                ...prev,
                [currentStep.id]: 'skipped'
            }));
            if (currentStepIndex < steps.length - 1) {
                setStepStatuses(prev => ({
                    ...prev,
                    [steps[currentStepIndex + 1].id]: 'in_progress'
                }));
                setCurrentStepIndex(currentStepIndex + 1);
            }
        }
    };

    const getStepIcon = (step: Step, status: StepStatus) => {
        if (status === 'completed') {
            return <CheckCircle2 className="h-5 w-5 text-green-600" />;
        }
        if (status === 'in_progress') {
            return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
        }
        if (status === 'error') {
            return <AlertCircle className="h-5 w-5 text-red-600" />;
        }
        return <Circle className="h-5 w-5 text-gray-400" />;
    };

    const getStepGuidance = (stepId: string): React.ReactNode => {
        const guides: Record<string, React.ReactNode> = {
            discover: (
                <Alert>
                    <HelpCircle className="h-4 w-4" />
                    <AlertTitle>What happens next?</AlertTitle>
                    <AlertDescription>
                        {connectorType === 's3' 
                            ? "We'll analyze your S3 bucket structure and detect file formats (CSV, JSON, Parquet). This creates a data catalog for easy querying."
                            : "We'll query your database to discover all tables, columns, data types, and relationships. This provides a complete schema map for data integration."}
                    </AlertDescription>
                </Alert>
            ),
            connection: (
                <Alert>
                    <HelpCircle className="h-4 w-4" />
                    <AlertTitle>When is VPC Setup needed?</AlertTitle>
                    <AlertDescription>
                        <strong>Only required for AWS Glue jobs</strong> accessing private databases (RDS, Redshift in VPC).
                        <br /><br />
                        <strong>Skip this step if:</strong>
                        <ul className="list-disc list-inside mt-2">
                            <li>Using a local/dev database (localhost, docker)</li>
                            <li>Testing with sample data</li>
                            <li>Database is publicly accessible</li>
                        </ul>
                        <br />
                        AWS Glue runs in an isolated environment and needs VPC networking to access private databases.
                    </AlertDescription>
                </Alert>
            ),
            catalog: (
                <Alert>
                    <HelpCircle className="h-4 w-4" />
                    <AlertTitle>Glue Data Catalog</AlertTitle>
                    <AlertDescription>
                        <strong>Critical for ETL jobs!</strong> The Glue Data Catalog stores metadata about your data sources.
                        <br /><br />
                        <strong>What happens:</strong>
                        <ul className="list-disc list-inside mt-2">
                            <li>Create a catalog database for your organization</li>
                            <li>Run a crawler to scan and catalog your data</li>
                            <li>Verify cataloged tables and schema</li>
                        </ul>
                        <br />
                        Without this step, ETL jobs will fail because they won't be able to read your data.
                    </AlertDescription>
                </Alert>
            ),
            mapping: (
                <Alert>
                    <HelpCircle className="h-4 w-4" />
                    <AlertTitle>Field Mapping</AlertTitle>
                    <AlertDescription>
                        Map source fields to your target schema. You can apply transformations (UPPER, LOWER, TRIM) and handle data type conversions.
                        We'll suggest mappings based on field names and types.
                    </AlertDescription>
                </Alert>
            ),
            etl: (
                <Alert>
                    <HelpCircle className="h-4 w-4" />
                    <AlertTitle>ETL Job Creation</AlertTitle>
                    <AlertDescription>
                        We'll generate a PySpark script and create an AWS Glue job. 
                        You can configure job parameters (DPU, timeout, retry) and start the data pipeline immediately.
                    </AlertDescription>
                </Alert>
            )
        };
        return guides[stepId] || null;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl">
                        Setup Guide: {connectorName}
                    </DialogTitle>
                    <DialogDescription>
                        <span className="text-orange-600 font-medium">📋 This is a step-by-step GUIDE only.</span> Use the connector&apos;s dropdown menu (3-dots) to perform each action.
                    </DialogDescription>
                </DialogHeader>

                {/* Progress Bar */}
                <div className="space-y-2 py-4">
                    <div className="flex justify-between text-sm text-gray-600">
                        <span>Step {currentStepIndex + 1} of {steps.length}</span>
                        <span>{Math.round(progress)}% Complete</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>

                {/* Step Timeline */}
                <div className="flex items-center justify-between py-4">
                    {steps.map((step, index) => (
                        <React.Fragment key={step.id}>
                            <div className="flex flex-col items-center">
                                <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                                    stepStatuses[step.id] === 'completed' 
                                        ? 'border-green-600 bg-green-50' 
                                        : stepStatuses[step.id] === 'in_progress'
                                        ? 'border-blue-600 bg-blue-50'
                                        : 'border-gray-300 bg-white'
                                }`}>
                                    {getStepIcon(step, stepStatuses[step.id] || 'pending')}
                                </div>
                                <span className={`text-xs mt-2 text-center max-w-[80px] ${
                                    stepStatuses[step.id] === 'in_progress' ? 'font-semibold' : ''
                                }`}>
                                    {step.title}
                                </span>
                            </div>
                            {index < steps.length - 1 && (
                                <div className={`flex-1 h-0.5 mx-2 ${
                                    stepStatuses[step.id] === 'completed' 
                                        ? 'bg-green-600' 
                                        : 'bg-gray-300'
                                }`} />
                            )}
                        </React.Fragment>
                    ))}
                </div>

                {/* Current Step Content */}
                {currentStep && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                {currentStep.icon}
                                {currentStep.title}
                            </CardTitle>
                            <CardDescription>
                                {currentStep.description}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {getStepGuidance(currentStep.id)}

                        {/* Step-specific instructions */}
                        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                            <h4 className="font-semibold text-sm">Instructions:</h4>
                            {currentStep.id === 'discover' && (
                                <ol className="list-decimal list-inside space-y-1 text-sm">
                                    <li>Click the "Discover Schema" button in the connector dropdown menu</li>
                                    <li>Wait for the discovery process to complete (usually 10-30 seconds)</li>
                                    <li>Review the discovered schema in the modal that appears</li>
                                    <li>Click "Continue" below when discovery is complete</li>
                                </ol>
                            )}
                            {currentStep.id === 'connection' && (
                                <div className="space-y-2">
                                    <p className="text-sm font-semibold text-orange-600">
                                        ⚠️ Optional Step - Skip if using local/dev database
                                    </p>
                                    <ol className="list-decimal list-inside space-y-1 text-sm">
                                        <li>Click "Setup Connection" in the connector dropdown</li>
                                        <li>Try "Auto-Discover" first - we'll detect your VPC configuration automatically</li>
                                        <li>If auto-discover fails, switch to "Manual Setup" and enter VPC details</li>
                                        <li>Click "Create Connection" and wait for confirmation</li>
                                        <li><strong>OR click "Skip" below</strong> if not using AWS Glue with private databases</li>
                                    </ol>
                                </div>
                            )}
                            {currentStep.id === 'catalog' && (
                                <ol className="list-decimal list-inside space-y-1 text-sm">
                                    <li>Click "Setup Catalog" in the connector dropdown (or use the button below)</li>
                                    <li>Create a catalog database for your organization</li>
                                    <li>Configure and start the crawler to scan your data</li>
                                    <li>Wait for the crawler to complete (usually 1-5 minutes)</li>
                                    <li>Verify the cataloged tables appear correctly</li>
                                </ol>
                            )}
                            {currentStep.id === 'mapping' && (
                                <ol className="list-decimal list-inside space-y-1 text-sm">
                                    <li>Click "Map Fields" in the connector dropdown</li>
                                    <li>For each source field, select a target column from the dropdown</li>
                                    <li>Optionally add transformations (UPPER, LOWER, TRIM)</li>
                                    <li>Click "Save Mappings" when done</li>
                                </ol>
                            )}
                            {currentStep.id === 'etl' && (
                                <ol className="list-decimal list-inside space-y-1 text-sm">
                                    <li>Click "Generate ETL Job" in the connector dropdown</li>
                                    <li>Review the generated PySpark script</li>
                                    <li>Click "Create & Start Job" to deploy and run the pipeline</li>
                                    <li>Monitor job progress in real-time</li>
                                </ol>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-4">
                            <Button
                                onClick={handleStepComplete}
                                className="flex-1"
                            >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Mark as Complete <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                            {!currentStep.required && (
                                <Button
                                    onClick={handleSkipStep}
                                    variant="outline"
                                >
                                    Skip
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
                )}

                {/* Help Text */}
                <div className="text-xs text-gray-500 text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <strong>💡 Reminder:</strong> This wizard is a GUIDE - it tracks your progress but doesn&apos;t perform actions.<br/>
                    Use the connector&apos;s dropdown menu (⋮) to execute each step, then click &quot;Mark as Complete&quot; here.
                </div>
            </DialogContent>
        </Dialog>
    );
}

