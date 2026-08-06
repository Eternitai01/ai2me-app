"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Loader2, ExternalLink, Unplug } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DriveStatus {
  connected: boolean;
  email?: string;
  provider_user_id?: string;
  connected_at?: string;
}

export function GoogleDriveConnector() {
  const [status, setStatus] = useState<DriveStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/connectors/google-drive/status");
      const data = await res.json();
      setStatus(data);
    } catch {
      setStatus({ connected: false });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Handle redirect back from Google OAuth
  useEffect(() => {
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");

    if (connected === "google_drive") {
      toast.success("Google Drive connected successfully!");
      fetchStatus();
      // Clean up query params
      router.replace("/connectors");
    } else if (error?.startsWith("google_drive")) {
      const messages: Record<string, string> = {
        google_drive_denied: "Google Drive authorization was denied.",
        google_drive_no_code: "OAuth callback missing authorization code.",
        google_drive_token_exchange: "Failed to exchange authorization code.",
        google_drive_store_failed: "Failed to save Google Drive credentials.",
        google_drive_callback_error: "An unexpected error occurred.",
        google_drive_not_authenticated: "You must be logged in to connect Google Drive.",
      };
      toast.error(messages[error] ?? "Google Drive connection failed.");
      router.replace("/connectors");
    }
  }, [searchParams, fetchStatus, router]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const res = await fetch("/api/connectors/google-drive/auth");
      const { auth_url, error } = await res.json();
      if (error) throw new Error(error);
      window.location.href = auth_url;
    } catch (err) {
      console.error(err);
      toast.error("Failed to initiate Google Drive connection.");
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Disconnect Google Drive? AI context from your Drive will stop working.")) return;
    setDisconnecting(true);
    try {
      const cookieToken = document.cookie
        .split("; ")
        .find((c) => c.startsWith("auth-token="))
        ?.split("=")[1];

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
      const res = await fetch(`${backendUrl}/v1/google-drive/disconnect`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${cookieToken}`,
        },
      });

      if (res.ok) {
        toast.success("Google Drive disconnected.");
        setStatus({ connected: false });
      } else {
        throw new Error("Disconnect failed");
      }
    } catch {
      toast.error("Failed to disconnect Google Drive.");
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:bg-accent/30 transition-colors">
      {/* Icon + info */}
      <div className="flex items-center gap-4">
        {/* Google Drive icon */}
        <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-white border border-border shadow-sm">
          <svg viewBox="0 0 87.3 78" className="w-6 h-6" xmlns="http://www.w3.org/2000/svg">
            <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
            <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
            <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
            <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
            <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
            <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 27h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
          </svg>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">Google Drive</span>
            {status?.connected && (
              <span className="flex items-center gap-1 text-xs text-emerald-500 font-medium">
                <CheckCircle2 className="w-3 h-3" /> Connected
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {status?.connected
              ? `Connected as ${status.email}`
              : "Read files from Google Drive for AI context"}
          </p>
        </div>
      </div>

      {/* Action button */}
      <div className="flex items-center gap-2">
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        ) : status?.connected ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/60"
          >
            {disconnecting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Unplug className="w-3.5 h-3.5" />
            )}
            <span className="ml-1.5">Disconnect</span>
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={handleConnect}
            disabled={connecting}
          >
            {connecting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ExternalLink className="w-3.5 h-3.5" />
            )}
            <span className="ml-1.5">Connect</span>
          </Button>
        )}
      </div>
    </div>
  );
}
