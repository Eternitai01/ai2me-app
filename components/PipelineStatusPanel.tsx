"use client";

import { useEffect, useRef, useState } from "react";
import { DeployStatus } from "@/hooks/useAIStream";
import { Globe, Loader2, CheckCircle2, XCircle, Package, Hammer, Upload } from "lucide-react";

const PIPELINE_STEPS = [
  { key: "installing", label: "Installing dependencies", icon: Package },
  { key: "building",   label: "Building with Vite",       icon: Hammer },
  { key: "uploading",  label: "Uploading to CDN",         icon: Upload },
  { key: "ready",      label: "Preview ready",            icon: Globe },
] as const;

type StepKey = typeof PIPELINE_STEPS[number]["key"];
const STEP_ORDER: StepKey[] = PIPELINE_STEPS.map((s) => s.key);

function stepIndex(status: string | undefined): number {
  if (!status) return -1;
  return STEP_ORDER.indexOf(status as StepKey);
}

function formatElapsed(secs: number): string {
  if (secs < 60) return `${secs}s`;
  return `${Math.floor(secs / 60)}m ${secs % 60}s`;
}

interface PipelineStatusPanelProps {
  deployStatus: DeployStatus | null;
}

export function PipelineStatusPanel({ deployStatus }: PipelineStatusPanelProps) {
  const status = deployStatus?.status;
  const message = deployStatus?.message;
  const currentIdx = stepIndex(status);
  const isFailed = status === "failed";
  const isReady = status === "ready";

  // Live elapsed timer
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number | null>(null);
  useEffect(() => {
    if (!status || status === "ready" || status === "failed") {
      startRef.current = null;
      return;
    }
    if (!startRef.current) startRef.current = Date.now();
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current!) / 1000)), 1000);
    return () => clearInterval(t);
  }, [status]);

  // Idle
  if (!status) {
    return (
      <div className="flex flex-col items-center gap-3 max-w-xs">
        <div className="w-12 h-12 rounded-2xl bg-[var(--chat-accent)]/10 flex items-center justify-center">
          <Globe size={22} className="text-[var(--chat-accent)]" />
        </div>
        <p className="text-sm font-semibold text-[var(--chat-text-primary)]">No preview yet</p>
        <p className="text-xs text-[var(--chat-text-secondary)]">
          Send a prompt on the left. Your app will appear here.
        </p>
      </div>
    );
  }

  // Phase-specific estimated total time so remaining is meaningful
  const phaseTotals: Record<string, number> = { installing: 120, building: 90, uploading: 30 };
  const activeStep = PIPELINE_STEPS.find((s) => s.key === status);
  const phaseDuration = (activeStep && phaseTotals[activeStep.key]) ?? 120;
  const remaining = Math.max(0, phaseDuration - elapsed);
  const remainingLabel =
    isReady || isFailed
      ? ""
      : remaining <= 10
      ? "almost done…"
      : remaining < 60
      ? `~${remaining}s remaining`
      : `~${Math.ceil(remaining / 60)}m remaining`;

  return (
    <div className="flex flex-col items-start gap-2 w-full max-w-sm font-mono text-xs">
      {/* Header with elapsed timer */}
      <div className="flex items-center justify-between w-full mb-1">
        <p className="text-[var(--chat-text-secondary)] text-[11px] uppercase tracking-widest">Build pipeline</p>
        {!isReady && !isFailed && status && (
          <span className="text-[var(--chat-text-muted)] text-[11px] tabular-nums">
            {formatElapsed(elapsed)}
            {remainingLabel && ` · ${remainingLabel}`}
          </span>
        )}
      </div>

      {PIPELINE_STEPS.map((step, idx) => {
        const done = isReady ? true : currentIdx > idx;
        const active = !isFailed && currentIdx === idx;

        return (
          <div key={step.key} className="flex items-center gap-2 w-full">
            <span className="w-4 flex-shrink-0 flex items-center justify-center">
              {active ? (
                <Loader2 size={14} className="text-[var(--chat-accent)] animate-spin" />
              ) : done ? (
                <CheckCircle2 size={14} className="text-emerald-500" />
              ) : (
                <span className="w-3 h-3 rounded-full border border-[var(--chat-border)] inline-block" />
              )}
            </span>
            <span
              className={
                active
                  ? "text-[var(--chat-text-primary)] font-semibold"
                  : done
                  ? "text-emerald-500"
                  : "text-[var(--chat-text-secondary)]"
              }
            >
              {active && message ? message : done ? `✓ ${step.label}` : step.label}
            </span>
          </div>
        );
      })}

      {/* Error */}
      {isFailed && (
        <div className="mt-2 flex items-start gap-2 text-red-400">
          <XCircle size={14} className="flex-shrink-0 mt-0.5" />
          <span className="break-all">{deployStatus?.error || "Build failed"}</span>
        </div>
      )}

      {/* Done */}
      {isReady && deployStatus?.preview_url && (
        <div className="mt-2 flex items-center gap-2 text-emerald-400 break-all">
          <Globe size={14} className="flex-shrink-0" />
          <span>{deployStatus.preview_url}</span>
        </div>
      )}
    </div>
  );
}
