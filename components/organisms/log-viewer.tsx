"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Terminal,
  Search,
  Filter,
  Download,
  RefreshCw,
  AlertCircle,
  Info,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { glueJobApi } from "@/lib/glue-job-api";
import { toast } from "sonner";

interface LogViewerProps {
  connectorId: string;
  jobId: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // in seconds
}

export function LogViewer({
  connectorId,
  jobId,
  autoRefresh = false,
  refreshInterval = 10,
}: LogViewerProps) {
  const [logs, setLogs] = useState<
    Array<{ timestamp: string; level: string; message: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [levelFilter, setLevelFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [limit, setLimit] = useState(100);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(autoRefresh);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const options: any = { limit };
      if (levelFilter !== "ALL") {
        options.level = levelFilter;
      }
      if (searchTerm) {
        options.search = searchTerm;
      }

      const response = await glueJobApi.getJobLogs(connectorId, jobId, options);
      setLogs(response.logs);
    } catch (err: any) {
      console.error("Error fetching logs:", err);
      setError(err.message || "Failed to fetch logs");
      toast.error("Failed to fetch logs");
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchLogs();
  }, [connectorId, jobId]);

  // Auto-refresh
  useEffect(() => {
    if (!isAutoRefreshing) return;

    const interval = setInterval(fetchLogs, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [isAutoRefreshing, refreshInterval, levelFilter, searchTerm, limit]);

  const handleSearch = () => {
    fetchLogs();
  };

  const handleDownload = () => {
    const logText = logs
      .map(
        (log) => `[${log.timestamp}] [${log.level}] ${log.message}`
      )
      .join("\n");

    const blob = new Blob([logText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `glue-job-${jobId}-logs.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Logs downloaded");
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "ERROR":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "WARN":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case "INFO":
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Terminal className="h-4 w-4 text-gray-500" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "ERROR":
        return "text-red-600 bg-red-50";
      case "WARN":
        return "text-orange-600 bg-orange-50";
      case "INFO":
        return "text-blue-600 bg-blue-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        fractionalSecondDigits: 3,
      });
    } catch {
      return timestamp;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            <CardTitle>Job Logs</CardTitle>
            <Badge variant="secondary">{logs.length} events</Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAutoRefreshing(!isAutoRefreshing)}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${
                  isAutoRefreshing ? "animate-spin" : ""
                }`}
              />
              {isAutoRefreshing ? "Auto ON" : "Auto OFF"}
            </Button>

            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mt-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-9"
              />
            </div>
          </div>

          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-32">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Levels</SelectItem>
              <SelectItem value="ERROR">Error</SelectItem>
              <SelectItem value="WARN">Warning</SelectItem>
              <SelectItem value="INFO">Info</SelectItem>
              <SelectItem value="DEBUG">Debug</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={handleSearch} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md mb-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <p className="font-medium">{error}</p>
            </div>
          </div>
        )}

        {loading && logs.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-gray-500">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <p>Loading logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Terminal className="h-12 w-12 mb-2 opacity-20" />
            <p>No logs found</p>
            <p className="text-sm mt-1">
              {searchTerm || levelFilter !== "ALL"
                ? "Try adjusting your filters"
                : "Logs will appear here once the job starts"}
            </p>
          </div>
        ) : (
          <div className="space-y-1 max-h-[600px] overflow-y-auto font-mono text-sm">
            {logs.map((log, index) => (
              <div
                key={index}
                className={`flex gap-3 p-2 rounded hover:bg-gray-50 ${getLevelColor(
                  log.level
                )}`}
              >
                <div className="flex items-start gap-2 min-w-0 flex-1">
                  <span className="text-xs text-gray-500 whitespace-nowrap mt-0.5">
                    {formatTimestamp(log.timestamp)}
                  </span>

                  <div className="flex items-center gap-1 min-w-[60px]">
                    {getLevelIcon(log.level)}
                    <span className="text-xs font-medium">{log.level}</span>
                  </div>

                  <p className="flex-1 break-words whitespace-pre-wrap">
                    {log.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

