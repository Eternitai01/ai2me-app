"use client";

/** Loading state for the code phase: staggered "lines of code" of varying width. */
const LINE_WIDTHS = ["w-5/6", "w-2/3", "w-11/12", "w-1/2", "w-3/4", "w-4/5"];

export function CodeSkeleton() {
  return (
    <div
      className="animate-pulse space-y-2 rounded-md bg-neutral-900/90 p-3"
      aria-label="Generating code"
      role="status"
    >
      {LINE_WIDTHS.map((width, index) => (
        <div key={index} className="flex items-center gap-2">
          <div className="h-3 w-6 shrink-0 rounded bg-neutral-700" />
          <div className={`h-3 rounded bg-neutral-700 ${width}`} />
        </div>
      ))}
    </div>
  );
}

export default CodeSkeleton;
