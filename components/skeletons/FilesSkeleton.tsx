"use client";

/** Loading state for the files phase: a short list of file rows. */
const ROW_WIDTHS = ["w-2/3", "w-1/2", "w-3/4", "w-2/5"];

export function FilesSkeleton() {
  return (
    <div className="animate-pulse space-y-2" aria-label="Collecting files" role="status">
      {ROW_WIDTHS.map((width, index) => (
        <div key={index} className="flex items-center gap-2">
          <div className="h-3 w-3 shrink-0 rounded-sm bg-neutral-200 dark:bg-neutral-700" />
          <div className={`h-3 rounded bg-neutral-200 dark:bg-neutral-700 ${width}`} />
        </div>
      ))}
    </div>
  );
}

export default FilesSkeleton;
