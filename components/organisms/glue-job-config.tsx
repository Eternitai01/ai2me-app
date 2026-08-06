"use client";

import { useState } from "react";
import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Code, Play, Settings, Clock, Zap, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { glueJobApi } from "@/lib/glue-job-api";

interface GlueJobConfigProps {
  connectorId: string;
  connectorName: string;
  jobId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onJobCreated?: () => void;
  onJobStarted?: (jobId: string) => void;
}

export function GlueJobConfig({
  connectorId,
  connectorName,
  jobId,
  isOpen,
  onClose,
  onJobCreated,
  onJobStarted,
}: GlueJobConfigProps) {
  const [dpu, setDpu] = useState(2);
  const [timeout, setTimeout] = useState(60);
  const [maxRetries, setMaxRetries] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [jobArn, setJobArn] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check job status when modal opens
  React.useEffect(() => {
    if (isOpen && jobId) {
      checkJobStatus();
    }
  }, [isOpen, jobId]);

  const checkJobStatus = async () => {
    if (!jobId) return;
    
    setIsLoading(true);
    try {
      const jobs = await glueJobApi.listJobs(connectorId, 1, 10);
      if (jobs.jobs && jobs.jobs.length > 0) {
        const job = jobs.jobs[0];
        setJobStatus(job.status);
        setJobArn(job.glue_job_arn);
        setDpu(job.dpu_allocated || 2);
        setTimeout(job.timeout_minutes || 60);
        setMaxRetries(job.max_retries || 1);
      }
    } catch (error) {
      console.error("Error checking job status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateJob = async () => {
    if (!jobId) {
      toast.error("No script generated. Please generate script first.");
      return;
    }

    setIsCreating(true);
    const toastId = toast.loading("Creating Glue job in AWS...");

    try {
      const data = await glueJobApi.createJob(connectorId, {
        job_id: jobId,
        dpu,
        timeout_minutes: timeout,
        max_retries: maxRetries,
      });

      toast.dismiss(toastId);
      toast.success("Glue job created in AWS!");

      setJobStatus("created");
      setJobArn(data.job_arn);
      
      // Auto-start the job immediately
      const startToastId = toast.loading("Starting ETL import job...");
      
      try {
        const runData = await glueJobApi.startImport(connectorId, jobId);
        
        toast.dismiss(startToastId);
        toast.success(
          `Job started successfully!`,
          {
            description: `Run ID: ${runData.run_id.slice(0, 12)}... Monitor in AWS Glue console.`,
            duration: 5000,
          }
        );

        onJobStarted?.(jobId);
        
        setTimeout(() => {
          onClose();
          setTimeout(() => {
            onJobCreated?.();
          }, 3000);
        }, 2000);
      } catch (startError: any) {
        toast.dismiss(startToastId);
        toast.error(startError.message || "Job created but failed to start. You can start it manually from AWS Glue console.");
        setJobStatus("created"); // Keep as created so user can try again
      }
    } catch (error: any) {
      toast.dismiss(toastId);
      toast.error(error.message || "Failed to create Glue job");
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleStartJob = async () => {
    if (!jobId) return;

    setIsStarting(true);
    const toastId = toast.loading("Starting ETL import job...");

    try {
      const data = await glueJobApi.startImport(connectorId, jobId);

      toast.dismiss(toastId);
      toast.success(
        `Job started! Run ID: ${data.run_id.slice(0, 8)}...`,
        {
          description: "Monitor progress in the jobs dashboard",
        }
      );

      setJobStatus("running");
      
      // Close dialog after short delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error: any) {
      toast.dismiss(toastId);
      toast.error(error.message || "Failed to start import job");
      console.error(error);
    } finally {
      setIsStarting(false);
    }
  };

  const estimatedCost = ((dpu * timeout) / 60 * 0.44).toFixed(2); // $0.44 per DPU-hour

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 flex-shrink-0" />
            Configure Glue ETL Job
          </DialogTitle>
          <DialogDescription className="break-words">
            Configure AWS Glue job for <span className="font-semibold">{connectorName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status Indicator */}
          {jobStatus && (
            <Alert className={jobStatus === "created" ? "border-green-200 bg-green-50 dark:bg-green-950" : ""}>
              <AlertDescription className="flex items-center gap-2">
                {jobStatus === "created" ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                )}
                <span>
                  {jobStatus === "created"
                    ? "Job created in AWS Glue. Ready to start import."
                    : `Job status: ${jobStatus}`}
                </span>
              </AlertDescription>
            </Alert>
          )}

          {/* DPU Configuration */}
          <div>
            <Label htmlFor="dpu" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Data Processing Units (DPU)
            </Label>
            <Select
              value={dpu.toString()}
              onValueChange={(v) => setDpu(Number(v))}
              disabled={jobStatus === "created"}
            >
              <SelectTrigger id="dpu" className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 DPU (Standard)</SelectItem>
                <SelectItem value="5">5 DPU (Medium)</SelectItem>
                <SelectItem value="10">10 DPU (Large)</SelectItem>
                <SelectItem value="20">20 DPU (X-Large)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              More DPUs = faster processing, higher cost
            </p>
          </div>

          {/* Timeout */}
          <div>
            <Label htmlFor="timeout" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Timeout (minutes)
            </Label>
            <Input
              id="timeout"
              type="number"
              value={timeout}
              onChange={(e) => setTimeout(Number(e.target.value))}
              min={10}
              max={2880}
              className="mt-2"
              disabled={jobStatus === "created"}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Job will be terminated if it exceeds this time
            </p>
          </div>

          {/* Max Retries */}
          <div>
            <Label htmlFor="retries">Max Retries</Label>
            <Select
              value={maxRetries.toString()}
              onValueChange={(v) => setMaxRetries(Number(v))}
              disabled={jobStatus === "created"}
            >
              <SelectTrigger id="retries" className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0 (No retries)</SelectItem>
                <SelectItem value="1">1 retry</SelectItem>
                <SelectItem value="2">2 retries</SelectItem>
                <SelectItem value="3">3 retries</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Automatic retry attempts on failure
            </p>
          </div>

          {/* Cost Estimate */}
          <Alert>
            <AlertDescription className="flex items-center justify-between">
              <span className="text-sm">Estimated cost per run:</span>
              <Badge variant="outline" className="text-base font-bold">
                ${estimatedCost}
              </Badge>
            </AlertDescription>
          </Alert>

          {jobArn && (
            <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
              <div className="font-semibold mb-1">Job ARN:</div>
              <code className="break-all">{jobArn}</code>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 flex-col sm:flex-row">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            {jobStatus === "running" ? "Close" : "Cancel"}
          </Button>

          {jobStatus !== "created" && jobStatus !== "running" && (
            <Button
              onClick={handleCreateJob}
              disabled={isCreating || !jobId || isLoading}
              className="gap-2 w-full sm:w-auto"
            >
              <Play className="h-4 w-4" />
              {isCreating ? "Creating & Starting Job..." : "Create & Start Job"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

