/**
 * Pre-create an AI Sheets session before the first chat message / Open Files persist.
 * Mirrors Web Builder `/api/ai/new-project` with agent_id: "ai-sheets".
 *
 * Phase 1 Open Files should:
 *   const { session_id } = await ensureSheetsSession(currentId);
 *   setSessionId(session_id);
 *   router.replace(`/ai-sheets?session_id=${session_id}`);
 */

export type EnsureSheetsSessionResult = {
  session_id: string;
  agent_id: string;
};

export class EnsureSheetsSessionError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "EnsureSheetsSessionError";
    this.status = status;
  }
}

export type EnsureSheetsSessionOptions = {
  title?: string;
  /** Called only when a new session is created (not when reusing existing). */
  onCreated?: (sessionId: string) => void;
};

/**
 * @param existingSessionId — reuse when already bound (no network call)
 */
export async function ensureSheetsSession(
  existingSessionId?: string | null,
  options?: EnsureSheetsSessionOptions
): Promise<EnsureSheetsSessionResult> {
  const trimmed = existingSessionId?.trim();
  if (trimmed) {
    return { session_id: trimmed, agent_id: "ai-sheets" };
  }

  const response = await fetch("/api/ai/new-project", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      agent_id: "ai-sheets",
      title: options?.title ?? "AI Sheets",
    }),
  });

  let data: {
    session_id?: string;
    agent_id?: string;
    detail?: string;
  } = {};
  try {
    data = await response.json();
  } catch {
    throw new EnsureSheetsSessionError(
      "Invalid response creating AI Sheets session",
      response.status
    );
  }

  if (!response.ok || !data.session_id) {
    throw new EnsureSheetsSessionError(
      data.detail || "Failed to create AI Sheets session",
      response.status
    );
  }

  options?.onCreated?.(data.session_id);

  return {
    session_id: data.session_id,
    agent_id: data.agent_id || "ai-sheets",
  };
}
