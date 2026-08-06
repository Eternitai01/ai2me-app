"use client";

/** Loading state for the PRD phase: a title bar plus a few paragraph lines. */
export function PrdSkeleton() {
  return (
    <div className="animate-pulse space-y-3" aria-label="Generating PRD" role="status">
      <div className="h-5 w-1/2 rounded bg-neutral-200 dark:bg-neutral-700" />
      <div className="h-3 w-full rounded bg-neutral-200 dark:bg-neutral-700" />
      <div className="h-3 w-11/12 rounded bg-neutral-200 dark:bg-neutral-700" />
      <div className="h-3 w-4/5 rounded bg-neutral-200 dark:bg-neutral-700" />
      <div className="h-4 w-1/3 rounded bg-neutral-200 dark:bg-neutral-700" />
      <div className="h-3 w-full rounded bg-neutral-200 dark:bg-neutral-700" />
      <div className="h-3 w-3/4 rounded bg-neutral-200 dark:bg-neutral-700" />
    </div>
  );
}

export default PrdSkeleton;
