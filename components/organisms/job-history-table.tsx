"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Cpu,
  RefreshCw,
  History,
  Loader2,
  AlertCircle,
  StopCircle,
} from "lucide-react";
import { glueJobApi } from "@/lib/glue-job-api";
import { toast } from "sonner";

interface JobHistoryTableProps {
  connectorId: string;
  jobId: string;
  onSelectRun?: (runId: string) => void;
}

export function JobHistoryTable({
  connectorId,
  jobId,
  onSelectRun,
}: JobHistoryTableProps) {
  const [history, setHistory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await glueJobApi.getJobHistory(connectorId, jobId, 1, 10);
      setHistory(data);
    } catch (err: any) {
      console.error("Error fetching job history:", err);
      setError(err.message || "Failed to fetch job history");
      toast.error("Failed to fetch job history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [connectorId, jobId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SUCCEEDED":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "FAILED":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "STOPPED":
        return <StopCircle className="h-4 w-4 text-gray-500" />;
      case "TIMEOUT":
        return <Clock className="h-4 w-4 text-orange-500" />;
      case "RUNNING":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      SUCCEEDED: "bg-green-500 text-white",
      FAILED: "bg-red-500 text-white",
      STOPPED: "bg-gray-400 text-white",
      TIMEOUT: "bg-orange-500 text-white",
      RUNNING: "bg-blue-500 text-white",
      STARTING: "bg-gray-500 text-white",
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
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const formatCost = (cost: number) => {
    // Add 10% platform markup to AWS Glue cost
    const costWithMarkup = cost * 1.10;
    return `$${costWithMarkup.toFixed(4)}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const formatNumber = (num: number | null) => {
    if (num === null || num === undefined) return "N/A";
    return num.toLocaleString();
  };

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-600 mb-4">
            <AlertCircle className="h-5 w-5" />
            <p className="font-medium">Error: {error}</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchHistory}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5" />
            <CardTitle>Job History</CardTitle>
            {history && (
              <Badge variant="secondary">{history.total_runs} runs</Badge>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchHistory}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {loading && !history ? (
          <div className="flex items-center justify-center py-12 text-gray-500">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <p>Loading job history...</p>
          </div>
        ) : !history || history.runs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <History className="h-12 w-12 mb-2 opacity-20" />
            <p>No job runs yet</p>
            <p className="text-sm mt-1">History will appear here after job execution</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>DPU</TableHead>
                  <TableHead>Rows</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Run ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.runs.map((run: any, index: number) => (
                  <TableRow
                    key={run.run_id}
                    className={
                      onSelectRun ? "cursor-pointer hover:bg-gray-50" : ""
                    }
                    onClick={() => onSelectRun?.(run.run_id)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(run.status)}
                        {getStatusBadge(run.status)}
                      </div>
                    </TableCell>

                    <TableCell className="text-sm">
                      {formatDate(run.started_at)}
                    </TableCell>

                    <TableCell className="text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-gray-400" />
                        {formatDuration(run.execution_time_seconds)}
                      </div>
                    </TableCell>

                    <TableCell className="text-sm">
                      <div className="flex items-center gap-1">
                        <Cpu className="h-3 w-3 text-gray-400" />
                        {run.dpu_seconds
                          ? `${Math.floor(run.dpu_seconds / 60)} min`
                          : "N/A"}
                      </div>
                    </TableCell>

                    <TableCell className="text-sm">
                      {formatNumber(run.rows_processed)}
                    </TableCell>

                    <TableCell className="text-sm font-medium">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-gray-400" />
                        {formatCost(run.estimated_cost)}
                      </div>
                    </TableCell>

                    <TableCell className="text-xs text-gray-500 font-mono">
                      {run.run_id.substring(0, 12)}...
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Summary Stats */}
        {history && history.runs.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-gray-500">Total Runs</p>
                <p className="text-lg font-semibold">{history.total_runs}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-gray-500">Success Rate</p>
                <p className="text-lg font-semibold">
                  {(
                    (history.runs.filter((r: any) => r.status === "SUCCEEDED")
                      .length /
                      history.runs.length) *
                    100
                  ).toFixed(0)}
                  %
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-gray-500">Total Cost</p>
                <p className="text-lg font-semibold">
                  {formatCost(
                    history.runs.reduce(
                      (sum: number, r: any) => sum + (r.estimated_cost || 0),
                      0
                    )
                  )}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-gray-500">Avg Duration</p>
                <p className="text-lg font-semibold">
                  {formatDuration(
                    Math.floor(
                      history.runs.reduce(
                        (sum: number, r: any) =>
                          sum + (r.execution_time_seconds || 0),
                        0
                      ) / history.runs.length
                    )
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

