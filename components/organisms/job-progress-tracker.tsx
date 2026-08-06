"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  PlayCircle,
  CheckCircle,
  XCircle,
  StopCircle,
  Clock,
  DollarSign,
  Cpu,
  RefreshCw,
  FileText,
  Loader2,
} from "lucide-react";
import { glueJobApi, type JobStatusResponse } from "@/lib/glue-job-api";
import { toast } from "sonner";

interface JobProgressTrackerProps {
  connectorId: string;
  jobId: string;
  onComplete?: () => void;
  onError?: (error: string) => void;
  onViewLogs?: () => void;
  onRestart?: () => void;
}

export function JobProgressTracker({
  connectorId,
  jobId,
  onComplete,
  onError,
  onViewLogs,
  onRestart,
}: JobProgressTrackerProps) {
  const [status, setStatus] = useState<JobStatusResponse | null>(null);
  const [isPolling, setIsPolling] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Poll for status updates
  useEffect(() => {
    if (!isPolling) return;

    const fetchStatus = async () => {
      try {
        const statusData = await glueJobApi.getJobStatus(jobId);
        setStatus(statusData);
        setError(null);

        // Stop polling if job is complete
        if (
          statusData.status === "SUCCEEDED" ||
          statusData.status === "FAILED" ||
          statusData.status === "STOPPED" ||
          statusData.status === "TIMEOUT"
        ) {
          setIsPolling(false);

          if (statusData.status === "SUCCEEDED") {
            toast.success("Job completed successfully!");
            onComplete?.();
          } else {
            toast.error(`Job ${statusData.status.toLowerCase()}`);
            onError?.(statusData.error_message || "Job failed");
          }
        }
      } catch (err: any) {
        setError(err.message || "Failed to fetch job status");
        setIsPolling(false);
      }
    };

    // Initial fetch
    fetchStatus();

    // Poll every 5 seconds
    const interval = setInterval(fetchStatus, 5000);

    return () => clearInterval(interval);
  }, [isPolling, jobId, onComplete, onError]);

  const handleRefresh = async () => {
    setIsPolling(true);
  };

  const handleCancel = async () => {
    if (!status) return;

    setIsCancelling(true);
    try {
      await glueJobApi.cancelJob(connectorId, jobId);
      toast.success("Job cancelled successfully");
      setIsPolling(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel job");
    } finally {
      setIsCancelling(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "RUNNING":
      case "STARTING":
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case "SUCCEEDED":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "FAILED":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "STOPPED":
        return <StopCircle className="h-5 w-5 text-gray-500" />;
      case "TIMEOUT":
        return <Clock className="h-5 w-5 text-orange-500" />;
      default:
        return <PlayCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      RUNNING: "default",
      STARTING: "secondary",
      SUCCEEDED: "outline",
      FAILED: "destructive",
      STOPPED: "secondary",
      TIMEOUT: "destructive",
    };

    const colors: Record<string, string> = {
      RUNNING: "bg-blue-500 text-white",
      STARTING: "bg-gray-500 text-white",
      SUCCEEDED: "bg-green-500 text-white",
      FAILED: "bg-red-500 text-white",
      STOPPED: "bg-gray-400 text-white",
      TIMEOUT: "bg-orange-500 text-white",
    };

    return (
      <Badge className={colors[status] || "bg-gray-400 text-white"}>
        {status}
      </Badge>
    );
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatCost = (cost: number | null) => {
    if (cost === null || cost === undefined) return "N/A";
    // Add 10% platform markup to AWS Glue cost
    const costWithMarkup = cost * 1.10;
    return `$${costWithMarkup.toFixed(4)}`;
  };

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            <p className="font-medium">Error: {error}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="mt-4"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!status) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            <p>Loading job status...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isRunning = status.status === "RUNNING" || status.status === "STARTING";
  const progress = status.progress_percentage || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon(status.status)}
            <div>
              <CardTitle className="text-lg">{status.job_name}</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Run ID: {status.job_run_id?.substring(0, 12)}...
              </p>
            </div>
          </div>
          {getStatusBadge(status.status)}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        {isRunning && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Execution Time */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              <span>Duration</span>
            </div>
            <p className="text-sm font-medium">
              {formatDuration(status.execution_time)}
            </p>
          </div>

          {/* DPU */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Cpu className="h-3 w-3" />
              <span>DPU</span>
            </div>
            <p className="text-sm font-medium">
              {status.dpu_seconds
                ? `${Math.floor(status.dpu_seconds / 60)} DPU-min`
                : "N/A"}
            </p>
          </div>

          {/* Cost */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <DollarSign className="h-3 w-3" />
              <span>Est. Cost</span>
            </div>
            <p className="text-sm font-medium">
              {formatCost(status.estimated_cost)}
            </p>
          </div>

          {/* Started */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <PlayCircle className="h-3 w-3" />
              <span>Started</span>
            </div>
            <p className="text-sm font-medium">
              {status.started_on
                ? new Date(status.started_on).toLocaleTimeString()
                : "N/A"}
            </p>
          </div>
        </div>

        {/* Error Message */}
        {status.error_message && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600 font-medium mb-1">Error:</p>
            <p className="text-sm text-red-700">{status.error_message}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {onViewLogs && (
            <Button variant="outline" size="sm" onClick={onViewLogs}>
              <FileText className="h-4 w-4 mr-2" />
              View Logs
            </Button>
          )}

          {isRunning && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isPolling}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${isPolling ? "animate-spin" : ""}`}
                />
                {isPolling ? "Auto-refresh ON" : "Refresh"}
              </Button>

              <Button
                variant="destructive"
                size="sm"
                onClick={handleCancel}
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <StopCircle className="h-4 w-4 mr-2" />
                )}
                Cancel Job
              </Button>
            </>
          )}

          {/* Show Restart button when job has failed or stopped */}
          {(status.status === "FAILED" || status.status === "STOPPED" || status.status === "TIMEOUT") && onRestart && (
            <Button
              variant="default"
              size="sm"
              onClick={onRestart}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <PlayCircle className="h-4 w-4 mr-2" />
              Restart Job
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

