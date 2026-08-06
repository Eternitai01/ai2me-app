"use client";

import type { AIPhase, PhaseMap } from "@/hooks/useAIStream";

const PHASES: AIPhase[] = ["code", "files"];

const LABELS: Record<AIPhase, string> = {
  prd: "Generating PRD...",
  code: "Generating code...",
  files: "Listing files...",
};

function isDone(status: string) {
  return status === "done";
}

function isActive(status: string) {
  return status === "loading" || status === "streaming";
}

function isError(status: string) {
  return status === "error";
}

type PhaseProgressBarProps = {
  phases: PhaseMap;
  visible: boolean;
  /** When true, treat any "done" phase as failed (stream ended with error before all phases completed) */
  streamFailed?: boolean;
};

export function PhaseProgressBar({ phases, visible, streamFailed }: PhaseProgressBarProps) {
  if (!visible) {
    return null;
  }

  return (
    <div className="rounded-lg border border-[var(--chat-border)] bg-[var(--chat-bg-secondary)] px-3 py-2">
      <div className="flex items-center gap-4">
        {PHASES.map((phase) => {
          const status = phases[phase].status;
          const done = isDone(status);
          const active = isActive(status);
          const failed = isError(status) || (streamFailed && done);

          return (
            <div key={phase} className="flex items-center gap-2 min-w-0">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  failed
                    ? "bg-red-500"
                    : done
                    ? "bg-emerald-400"
                    : active
                    ? "bg-sky-400 animate-pulse"
                    : "bg-[var(--chat-text-muted)]/40"
                }`}
              />
              <span className={`text-xs truncate ${
                failed ? "text-red-400" : "text-[var(--chat-text-secondary)]"
              }`}>
                {failed ? `${phase.toUpperCase()} failed` : active ? LABELS[phase] : phase.toUpperCase()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
