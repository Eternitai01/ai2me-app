/**
 * Open a blank AI workspace in a new browser tab.
 * Generic for any App Router workspace path (e.g. /ai-sheets, /ai-docs, /ai-slides).
 * Appends ?new=<timestamp> so the target page can force a clean workspace.
 */
import { toast } from "sonner";

export function openWorkspaceInNewTab(workspacePath: string): boolean {
  const base = workspacePath.startsWith("/")
    ? workspacePath.replace(/\/$/, "") || "/"
    : `/${workspacePath.replace(/\/$/, "")}`;
  const url = `${base}?new=${Date.now()}`;
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (!opened) {
    toast.error("Allow pop-ups to open a new chat in another tab");
    return false;
  }
  return true;
}
