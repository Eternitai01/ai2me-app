"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Paperclip } from "lucide-react";
import {
  CLARIFY_OTHER_OPTION_ID,
  DEFAULT_CLARIFY_INTRO,
  formatClarificationQaBlock,
  type ClarifyAnswer,
  type ClarifyQuestion,
} from "@/lib/clarify";

export interface ClarifyStepperProps {
  intro?: string | null;
  questions: ClarifyQuestion[];
  /** When set, show submitted Q/A summary (read-only). */
  submittedAnswers?: ClarifyAnswer[] | null;
  disabled?: boolean;
  /** Final-step CTA label (default: Generate). */
  submitLabel?: string;
  onSubmit: (answers: ClarifyAnswer[]) => void;
  onSkip: () => void;
}

function emptyAnswers(questions: ClarifyQuestion[]): Record<string, ClarifyAnswer> {
  const map: Record<string, ClarifyAnswer> = {};
  for (const q of questions) {
    map[q.id] = {
      question_id: q.id,
      selected_option_ids: [],
      other_text: "",
      details: "",
    };
  }
  return map;
}

export function ClarifyStepper({
  intro,
  questions,
  submittedAnswers,
  disabled,
  submitLabel = "Generate",
  onSubmit,
  onSkip,
}: ClarifyStepperProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState(() => emptyAnswers(questions));

  const total = Math.max(questions.length, 1);
  const current = questions[step];
  const progress = Math.round(((step + 1) / total) * 100);
  const currentAnswer = current ? answers[current.id] : undefined;
  const allowOther = current?.allow_other !== false;
  const allowDetails = current?.allow_details !== false;
  const otherSelected = Boolean(
    currentAnswer?.selected_option_ids.includes(CLARIFY_OTHER_OPTION_ID)
  );

  const canProceed = useMemo(() => {
    if (!current || !currentAnswer) return false;
    if (currentAnswer.selected_option_ids.length === 0) return false;
    if (otherSelected && !currentAnswer.other_text?.trim()) return false;
    return true;
  }, [current, currentAnswer, otherSelected]);

  if (submittedAnswers && submittedAnswers.length > 0) {
    return (
      <div className="mt-2 rounded-xl border border-[var(--chat-border)] bg-[var(--chat-bg-secondary)] px-4 py-3">
        <pre className="whitespace-pre-wrap text-xs text-[var(--chat-text-secondary)] font-sans leading-relaxed">
          {formatClarificationQaBlock(questions, submittedAnswers)}
        </pre>
        <div className="mt-2 text-right text-[10px] uppercase tracking-wide text-[var(--chat-text-muted)]">
          Submitted
        </div>
      </div>
    );
  }

  if (!current) return null;

  const toggleOption = (optionId: string) => {
    if (disabled || !current) return;
    setAnswers((prev) => {
      const cur = prev[current.id] || {
        question_id: current.id,
        selected_option_ids: [],
      };
      let selected = [...cur.selected_option_ids];
      if (current.type === "single") {
        selected = [optionId];
      } else {
        if (selected.includes(optionId)) {
          selected = selected.filter((id) => id !== optionId);
        } else {
          selected = [...selected, optionId];
        }
      }
      return {
        ...prev,
        [current.id]: { ...cur, selected_option_ids: selected },
      };
    });
  };

  const setOtherText = (text: string) => {
    if (!current) return;
    setAnswers((prev) => {
      const cur = prev[current.id];
      let selected = [...(cur?.selected_option_ids || [])];
      if (text.trim() && !selected.includes(CLARIFY_OTHER_OPTION_ID)) {
        if (current.type === "single") selected = [CLARIFY_OTHER_OPTION_ID];
        else selected = [...selected, CLARIFY_OTHER_OPTION_ID];
      }
      if (!text.trim()) {
        selected = selected.filter((id) => id !== CLARIFY_OTHER_OPTION_ID);
      }
      return {
        ...prev,
        [current.id]: {
          question_id: current.id,
          selected_option_ids: selected,
          other_text: text,
          details: cur?.details || "",
        },
      };
    });
  };

  const setDetails = (text: string) => {
    if (!current) return;
    setAnswers((prev) => ({
      ...prev,
      [current.id]: {
        ...(prev[current.id] || { question_id: current.id, selected_option_ids: [] }),
        details: text,
      },
    }));
  };

  const goNext = () => {
    if (!canProceed) return;
    if (step < total - 1) {
      setStep((s) => s + 1);
      return;
    }
    const ordered = questions.map((q) => answers[q.id]).filter(Boolean);
    onSubmit(ordered);
  };

  return (
    <div className="mt-2 space-y-2">
      <p className="text-sm text-[var(--chat-text-secondary)] leading-relaxed">
        {(intro && intro.trim()) || DEFAULT_CLARIFY_INTRO}
      </p>

      <div className="rounded-xl border border-[var(--chat-border)] bg-[var(--chat-bg-secondary)] overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[var(--chat-border)]">
          <h3 className="text-sm font-semibold text-[var(--chat-text-primary)] truncate">
            {current.title}
          </h3>
          <div className="flex items-center gap-2 shrink-0 text-[var(--chat-text-muted)]">
            <span className="text-xs font-medium tabular-nums">{progress}%</span>
            <button
              type="button"
              aria-label="Previous question"
              disabled={step === 0 || disabled}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className="p-1 rounded-md hover:bg-[var(--chat-bg-hover)] disabled:opacity-30"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              aria-label="Next question"
              disabled={!canProceed || disabled}
              onClick={goNext}
              className="p-1 rounded-md hover:bg-[var(--chat-bg-hover)] disabled:opacity-30"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="p-3 space-y-2">
          {current.options.map((opt) => {
            const selected = currentAnswer?.selected_option_ids.includes(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                disabled={disabled}
                onClick={() => toggleOption(opt.id)}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border text-left text-sm transition-colors ${
                  selected
                    ? "border-[var(--chat-accent)] bg-[var(--chat-bg-primary)] text-[var(--chat-text-primary)]"
                    : "border-[var(--chat-border)] bg-transparent text-[var(--chat-text-secondary)] hover:bg-[var(--chat-bg-hover)]"
                }`}
              >
                <span>{opt.label}</span>
                <span
                  className={`w-4 h-4 shrink-0 border flex items-center justify-center ${
                    current.type === "multi" ? "rounded-[3px]" : "rounded-full"
                  } ${
                    selected
                      ? "border-[var(--chat-accent)] bg-[var(--chat-accent)]"
                      : "border-[var(--chat-text-muted)]"
                  }`}
                >
                  {selected && (
                    <span
                      className={
                        current.type === "multi"
                          ? "text-[10px] text-white leading-none"
                          : "w-1.5 h-1.5 rounded-full bg-white"
                      }
                    >
                      {current.type === "multi" ? "✓" : null}
                    </span>
                  )}
                </span>
              </button>
            );
          })}

          {allowOther && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => toggleOption(CLARIFY_OTHER_OPTION_ID)}
              className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border text-left text-sm transition-colors ${
                otherSelected
                  ? "border-[var(--chat-accent)] bg-[var(--chat-bg-primary)] text-[var(--chat-text-primary)]"
                  : "border-[var(--chat-border)] text-[var(--chat-text-secondary)] hover:bg-[var(--chat-bg-hover)]"
              }`}
            >
              <span>Other</span>
              <span
                className={`w-4 h-4 shrink-0 rounded-full border ${
                  otherSelected
                    ? "border-[var(--chat-accent)] bg-[var(--chat-accent)]"
                    : "border-[var(--chat-text-muted)]"
                } flex items-center justify-center`}
              >
                {otherSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
              </span>
            </button>
          )}

          {allowOther && otherSelected && (
            <input
              type="text"
              value={currentAnswer?.other_text || ""}
              onChange={(e) => setOtherText(e.target.value)}
              disabled={disabled}
              placeholder="Type your answer"
              className="w-full px-3 py-2 rounded-lg border border-[var(--chat-border)] bg-[var(--chat-bg-primary)] text-sm text-[var(--chat-text-primary)] placeholder:text-[var(--chat-text-muted)] outline-none focus:border-[var(--chat-accent)]"
            />
          )}

          {allowDetails && (
            <div className="relative">
              <input
                type="text"
                value={currentAnswer?.details || ""}
                onChange={(e) => setDetails(e.target.value)}
                disabled={disabled}
                placeholder="Additional details (optional)"
                className="w-full pr-9 px-3 py-2 rounded-lg border border-[var(--chat-border)] bg-[var(--chat-bg-primary)] text-sm text-[var(--chat-text-primary)] placeholder:text-[var(--chat-text-muted)] outline-none focus:border-[var(--chat-accent)]"
              />
              <Paperclip
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--chat-text-muted)] pointer-events-none"
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-t border-[var(--chat-border)]">
          <button
            type="button"
            disabled={disabled}
            onClick={onSkip}
            className="text-xs text-[var(--chat-text-muted)] hover:text-[var(--chat-text-secondary)]"
          >
            Skip & generate
          </button>
          <button
            type="button"
            disabled={!canProceed || disabled}
            onClick={goNext}
            className="px-3 py-1.5 rounded-md text-xs font-semibold bg-[var(--chat-accent)] text-white disabled:opacity-40"
          >
            {step < total - 1 ? "Next" : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
