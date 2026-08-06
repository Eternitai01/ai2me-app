"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, ChevronDown, ChevronRight, FileCode2, Loader2 } from "lucide-react";

import { CodeSkeleton } from "@/components/skeletons/CodeSkeleton";
import { FilesSkeleton } from "@/components/skeletons/FilesSkeleton";
import type { AIPhase, AIStreamStatus, AIStreamStep, CodeDeltaFile, PhaseMap } from "@/hooks/useAIStream";

/**
 * Renders the live AI Builder stream: one card per phase, plus per-file code panels that
 * follow the model as it writes.
 *
 * All three phases are displayed. The server generates and streams the files phase, so
 * hiding it would mean paying for tokens and bandwidth nobody ever sees.
 */

const PHASES: AIPhase[] = ["code", "files"];

const PHASE_LABELS: Record<AIPhase, string> = {
  prd: "PRD",
  code: "Code",
  files: "Files",
};

/**
 * Note: there is deliberately no `decodeStreamedContent` here.
 *
 * The server unescapes file content before emitting `code_delta`, so real newlines travel
 * on the wire and `JSON.parse` restores them. Re-unescaping client-side would corrupt any
 * file that legitimately contains the two-character sequence \n — e.g. `split("\\n")`.
 */

type PhaseCardProps = {
  phase: AIPhase;
  state: PhaseMap[AIPhase];
  steps: AIStreamStep[];
  children?: React.ReactNode;
};

/** The `phase_step` reasoning trace — what the server is doing right now. */
function ThinkingBlock({ steps }: { steps: AIStreamStep[] }) {
  if (!steps.length) return null;
  return (
    <ol className="mb-3 space-y-1 border-l-2 border-[var(--chat-border)] pl-3">
      {steps.map((step, index) => (
        <li
          key={`${step.message}-${index}`}
          className="text-xs text-[var(--chat-text-muted)]"
        >
          {step.message}
        </li>
      ))}
    </ol>
  );
}

function PhaseStatusIcon({ status }: { status: PhaseMap[AIPhase]["status"] }) {
  if (status === "loading" || status === "streaming") {
    return <Loader2 className="h-4 w-4 animate-spin text-[var(--chat-accent)]" />;
  }
  if (status === "done") return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
  if (status === "error") return <AlertCircle className="h-4 w-4 text-red-500" />;
  return <div className="h-4 w-4 rounded-full border border-[var(--chat-border)]" />;
}

function PhaseCard({ phase, state, steps, children }: PhaseCardProps) {
  if (state.status === "idle") return null;

  const showSkeleton = state.status === "loading" && !state.content;

  return (
    <section className="rounded-xl border border-[var(--chat-border)] bg-[var(--chat-bg-secondary)] p-4">
      <header className="mb-3 flex items-center gap-2">
        <PhaseStatusIcon status={state.status} />
        <h3 className="text-sm font-semibold text-[var(--chat-text-primary)]">
          {PHASE_LABELS[phase]}
        </h3>
        {state.status === "streaming" && (
          <span className="text-xs text-[var(--chat-text-muted)]">streaming…</span>
        )}
      </header>

      <ThinkingBlock steps={steps} />

      {state.status === "error" && (
        <p className="mb-3 rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-500">
          {state.error || "This phase failed."}
        </p>
      )}

      {/* No PrdSkeleton: it mimics document lines, and the PRD body no longer renders
          in this column — the sub-steps above are the progress indicator here. */}
      {showSkeleton && phase === "code" && <CodeSkeleton />}
      {showSkeleton && phase === "files" && <FilesSkeleton />}

      {children}
    </section>
  );
}

type CodeFilePanelProps = {
  file: CodeDeltaFile;
  open: boolean;
  onToggle: () => void;
  panelRef?: (node: HTMLDivElement | null) => void;
};

function CodeFilePanel({ file, open, onToggle, panelRef }: CodeFilePanelProps) {
  const lineCount = useMemo(() => file.content.split("\n").length, [file.content]);
  const preRef = useRef<HTMLPreElement>(null);

  // Auto-scroll the code block to the bottom as new lines stream in.
  useEffect(() => {
    const el = preRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [file.content]);

  return (
    <div ref={panelRef} className="overflow-hidden rounded-lg border border-[var(--chat-border)]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-2 bg-[var(--chat-bg-tertiary)] px-3 py-2 text-left transition-colors hover:bg-[var(--chat-bg-secondary)]"
      >
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[var(--chat-text-muted)]" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--chat-text-muted)]" />
        )}
        <FileCode2 className="h-3.5 w-3.5 shrink-0 text-[var(--chat-text-muted)]" />
        <span className="truncate font-mono text-xs text-[var(--chat-text-primary)]">
          {file.path}
        </span>
        <span className="ml-auto shrink-0 text-[10px] text-[var(--chat-text-muted)]">
          {lineCount} lines
        </span>
      </button>
      {open && (
        <pre ref={preRef} className="max-h-72 overflow-auto bg-neutral-900 p-3 text-[11px] leading-5 text-neutral-100">
          <code>{file.content}</code>
        </pre>
      )}
    </div>
  );
}

export type AIResponseViewProps = {
  phases: PhaseMap;
  steps: AIStreamStep[];
  codeDeltaFiles: CodeDeltaFile[];
  status: AIStreamStatus;
  error?: string | null;
  delayed?: boolean;
  onRetry?: () => void;
};

export function AIResponseView({
  phases,
  steps,
  codeDeltaFiles,
  status,
  error,
  delayed,
  onRetry,
}: AIResponseViewProps) {
  const [openPaths, setOpenPaths] = useState<Record<string, boolean>>({});
  const [elapsedSecs, setElapsedSecs] = useState(0);
  const codeStartRef = useRef<number | null>(null);

  // Live elapsed timer — starts when code phase begins, stops when done
  useEffect(() => {
    const isActive = phases.code.status === "loading" || phases.code.status === "streaming";
    if (isActive) {
      if (!codeStartRef.current) codeStartRef.current = Date.now();
      const t = setInterval(() => {
        setElapsedSecs(Math.floor((Date.now() - codeStartRef.current!) / 1000));
      }, 1000);
      return () => clearInterval(t);
    } else {
      codeStartRef.current = null;
      setElapsedSecs(0);
    }
  }, [phases.code.status]);
  const [retrying, setRetrying] = useState(false);

  // Reset retrying state when error clears or status changes away from error
  useEffect(() => {
    if (!error || status === "connecting" || status === "streaming") {
      setRetrying(false);
    }
  }, [error, status]);
  const panelRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const prevSignaturesRef = useRef<Record<string, string>>({});

  const codePhaseActive = phases.code.status === "loading" || phases.code.status === "streaming";

  // A cheap change-detector: length plus the tail. Comparing whole file bodies every render
  // would be wasteful, and the tail is exactly where an in-progress file grows.
  const signatures = useMemo(() => {
    const map: Record<string, string> = {};
    for (const file of codeDeltaFiles) {
      map[file.path] = `${file.content.length}:${file.content.slice(-120)}`;
    }
    return map;
  }, [codeDeltaFiles]);

  // Follow the model: auto-open whichever file just changed and scroll it into view.
  // Only while the code phase is live — once it ends, stop yanking the viewport around.
  useEffect(() => {
    if (!codePhaseActive) {
      prevSignaturesRef.current = signatures;
      return;
    }
    let changedPath: string | null = null;
    for (const [path, signature] of Object.entries(signatures)) {
      if (prevSignaturesRef.current[path] !== signature) changedPath = path;
    }
    prevSignaturesRef.current = signatures;
    if (!changedPath) return;

    setOpenPaths((prev) => (prev[changedPath as string] ? prev : { ...prev, [changedPath as string]: true }));
    panelRefs.current[changedPath]?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [signatures, codePhaseActive]);

  // Code phase finished — collapse the panels so the user sees the whole file list at once.
  useEffect(() => {
    if (phases.code.status === "done" || phases.code.status === "error") {
      setOpenPaths({});
    }
  }, [phases.code.status]);

  // Stream over — drop all local view state so the next run starts clean.
  useEffect(() => {
    if (status === "done") {
      setOpenPaths({});
      prevSignaturesRef.current = {};
    }
  }, [status]);

  const stepsByPhase = useMemo(() => {
    const map: Record<AIPhase, AIStreamStep[]> = { prd: [], code: [], files: [] };
    for (const step of steps) map[step.phase]?.push(step);
    return map;
  }, [steps]);

  return (
    <div className="space-y-4 p-4">
      {delayed && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-600 dark:text-amber-400">
          Code generation can take a few moments — installing dependencies and building the app.
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-500">
          <span className="flex-1">{error}</span>
          {onRetry && !retrying && (
            <button
              type="button"
              onClick={() => { setRetrying(true); onRetry(); }}
              className="shrink-0 rounded-md border border-red-500/40 px-2 py-1 font-medium transition-colors hover:bg-red-500/20"
            >
              Retry
            </button>
          )}
          {retrying && (
            <Loader2 className="w-3 h-3 animate-spin shrink-0" />
          )}
        </div>
      )}

      {PHASES.map((phase) => (
        <PhaseCard key={phase} phase={phase} state={phases[phase]} steps={stepsByPhase[phase]}>
          {/*
            The PRD body is deliberately NOT rendered here. The chat column shows the
            phase and its sub-steps only; the document itself streams into the
            "Rendered PRD Document" preview panel (page.tsx `markdown`), which reads
            the same phases.prd.content. Inlining it here duplicated the whole
            document into the chat and buried the actual progress.
          */}

          {phase === "code" && codeDeltaFiles.length > 0 && (
            <div className="rounded-lg border border-[var(--chat-border)] bg-[var(--chat-bg-secondary)] px-3 py-2.5">
              <div className="flex items-center gap-2 text-xs text-[var(--chat-text-secondary)]">
                <div className="flex gap-[3px] shrink-0">
                  {[0,1,2].map(i => (
                    <span
                      key={i}
                      className="inline-block w-1 h-1 rounded-full bg-[var(--chat-accent)] animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
                <span className="font-medium text-[var(--chat-text-primary)]">
                  {phases.code.status === "done"
                    ? `${codeDeltaFiles.length} file${codeDeltaFiles.length !== 1 ? "s" : ""} written`
                    : `Writing ${codeDeltaFiles.length} file${codeDeltaFiles.length !== 1 ? "s" : ""}…`}
                </span>
              </div>
              {phases.code.status !== "done" && (() => {
                const n = codeDeltaFiles.length;
                // ~8s per file for Bedrock Sonnet in parallel batches, plus ~3min for npm+build
                const estimatedTotalSecs = Math.max(180, n * 8 + 180);
                const remainingSecs = Math.max(0, estimatedTotalSecs - elapsedSecs);
                const remainingMins = Math.ceil(remainingSecs / 60);
                const elapsedStr = elapsedSecs >= 60
                  ? `${Math.floor(elapsedSecs / 60)}m ${elapsedSecs % 60}s`
                  : `${elapsedSecs}s`;
                const label = remainingMins <= 1
                  ? "Less than a minute remaining"
                  : `About ${remainingMins} min${remainingMins !== 1 ? 's' : ''} remaining`;
                return (
                  <p className="mt-1.5 text-[11px] text-[var(--chat-text-muted)] leading-relaxed">
                    {n > 0 ? `${n} file${n !== 1 ? 's' : ''} planned` : 'Planning files'}
                    {' · '}
                    <span className="tabular-nums">{elapsedStr} elapsed</span>
                    {' · '}
                    {label}
                  </p>
                );
              })()}
            </div>
          )}

          {phase === "files" && phases.files.content.trim() && (
            <pre className="whitespace-pre-wrap font-mono text-xs text-[var(--chat-text-secondary)]">
              {phases.files.content}
            </pre>
          )}
        </PhaseCard>
      ))}
    </div>
  );
}

export default AIResponseView;
