/**
 * Shared clarification questionnaire types (Sheets / Docs / Slides).
 * Keep in sync with api/app/schemas/clarify.py
 */

export type ClarifyAgentId = "ai-sheets" | "ai-docs" | "ai-slides";

export type ClarifyQuestionType = "single" | "multi";

export interface ClarifyOption {
  id: string;
  label: string;
}

export interface ClarifyQuestion {
  id: string;
  title: string;
  type: ClarifyQuestionType;
  options: ClarifyOption[];
  /** Show an Other option for custom text (default true). */
  allow_other?: boolean;
  /** Show optional free-text details under options (default true). */
  allow_details?: boolean;
}

/** Sentinel option id for the "Other" choice. */
export const CLARIFY_OTHER_OPTION_ID = "__other__";

export interface ClarifyAnswer {
  question_id: string;
  selected_option_ids: string[];
  other_text?: string | null;
  details?: string | null;
}

export interface ClarifyRequest {
  question: string;
  agent_id: ClarifyAgentId;
  session_id?: string | null;
  is_follow_up?: boolean;
  current_context_summary?: string | null;
  preferences?: Record<string, unknown> | null;
}

export interface ClarifyResponse {
  /** When true, skip the stepper and generate immediately. */
  sufficient: boolean;
  intro?: string | null;
  questions: ClarifyQuestion[];
  reason?: string | null;
}

export const DEFAULT_CLARIFY_INTRO =
  "Before I build it, let me ask a few quick questions to tailor it to your needs.";

export function formatClarificationQaBlock(
  questions: ClarifyQuestion[],
  answers: ClarifyAnswer[]
): string {
  const byId = new Map(questions.map((q) => [q.id, q]));
  const blocks: string[] = [];

  for (const ans of answers) {
    const q = byId.get(ans.question_id);
    const title = q?.title ?? ans.question_id;
    const optMap = new Map((q?.options ?? []).map((o) => [o.id, o.label]));
    const labels: string[] = [];

    for (const oid of ans.selected_option_ids) {
      if (oid === CLARIFY_OTHER_OPTION_ID) continue;
      labels.push(optMap.get(oid) ?? oid);
    }
    if (ans.other_text?.trim()) {
      labels.push(ans.other_text.trim());
    }

    let answerText = labels.length ? labels.join(", ") : "(no selection)";
    if (ans.details?.trim()) {
      answerText = `${answerText}; ${ans.details.trim()}`;
    }
    blocks.push(`Q: ${title}\nA: ${answerText}`);
  }

  return blocks.join("\n\n");
}

/** Soft validation for model-produced clarify payloads before rendering. */
export function normalizeClarifyResponse(raw: unknown): ClarifyResponse | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const sufficient = Boolean(obj.sufficient);

  if (sufficient) {
    return {
      sufficient: true,
      intro: typeof obj.intro === "string" ? obj.intro : null,
      questions: [],
      reason: typeof obj.reason === "string" ? obj.reason : null,
    };
  }

  const questionsRaw = Array.isArray(obj.questions) ? obj.questions : [];
  const questions: ClarifyQuestion[] = [];

  for (const item of questionsRaw) {
    if (!item || typeof item !== "object") continue;
    const q = item as Record<string, unknown>;
    const id = typeof q.id === "string" ? q.id.trim() : "";
    const title = typeof q.title === "string" ? q.title.trim() : "";
    const type = q.type === "multi" ? "multi" : q.type === "single" ? "single" : null;
    const optionsRaw = Array.isArray(q.options) ? q.options : [];
    const options: ClarifyOption[] = [];

    for (const opt of optionsRaw) {
      if (!opt || typeof opt !== "object") continue;
      const o = opt as Record<string, unknown>;
      const oid = typeof o.id === "string" ? o.id.trim() : "";
      const label = typeof o.label === "string" ? o.label.trim() : "";
      if (oid && label) options.push({ id: oid, label });
    }

    if (!id || !title || !type || options.length < 2) continue;

    questions.push({
      id,
      title,
      type,
      options: options.slice(0, 12),
      allow_other: q.allow_other !== false,
      allow_details: q.allow_details !== false,
    });
  }

  if (questions.length < 1) return null;

  return {
    sufficient: false,
    intro:
      typeof obj.intro === "string" && obj.intro.trim()
        ? obj.intro.trim()
        : DEFAULT_CLARIFY_INTRO,
    questions: questions.slice(0, 6),
    reason: typeof obj.reason === "string" ? obj.reason : null,
  };
}
