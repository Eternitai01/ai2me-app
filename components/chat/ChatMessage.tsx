"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Check, ThumbsUp, ThumbsDown, RotateCcw, User, Bot, FileText } from "lucide-react";
import { MessageAttachment, type MessageClarify } from "./ChatMessages";
import { ClarifyStepper } from "./ClarifyStepper";
import type { ClarifyAnswer } from "@/lib/clarify";
import { ProviderIcon } from "@/components/ui/provider-icon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { useCompanySettings } from "@/context/CompanySettingsContext";

interface ChatMessageProps {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp?: string;
  isLoading?: boolean;
  generationStatus?: string;
  providerName?: string;
  model?: string;
  onFeedback?: (rating: "up" | "down") => void;
  onRetry?: () => void;
  isError?: boolean;
  attachments?: MessageAttachment[];
  clarify?: MessageClarify;
  onClarifySubmit?: (answers: ClarifyAnswer[]) => void;
  onClarifySkip?: () => void;
}

function getAttachmentLabel(type?: string): string {
  if (!type) return "File";
  const t = type.toLowerCase();
  if (t === "pdf") return "PDF";
  if (t === "doc" || t === "docx") return "Document";
  if (t === "txt") return "Text";
  return type.toUpperCase();
}

function LoadingStatus({ generationStatus }: { generationStatus?: string }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const label =
    generationStatus === "completed" ? "Done" :
    generationStatus === "failed" ? "Failed" :
    generationStatus === "processing" ? "Generating your website…" :
    generationStatus === "pending" ? "Queued — starting…" :
    generationStatus && generationStatus.trim()
      ? generationStatus
      : "Working on it…";

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

  return (
    <div className="flex items-center gap-2 py-1">
      <div className="flex items-center gap-1">
        <div className="w-1.5 h-1.5 rounded-full bg-[var(--chat-accent)] chat-typing-dot" />
        <div className="w-1.5 h-1.5 rounded-full bg-[var(--chat-accent)] chat-typing-dot" />
        <div className="w-1.5 h-1.5 rounded-full bg-[var(--chat-accent)] chat-typing-dot" />
      </div>
      <span className="text-sm text-[var(--chat-text-secondary)]">
        {label}
      </span>
      <span className="text-xs text-[var(--chat-text-muted)] tabular-nums">{timeStr}</span>
    </div>
  );
}

export function ChatMessage({
  type,
  content,
  isLoading = false,
  generationStatus,
  providerName,
  model,
  onFeedback,
  onRetry,
  isError = false,
  attachments,
  clarify,
  onClarifySubmit,
  onClarifySkip,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<"up" | "down" | null>(null);
  const { user } = useAuth();
  const { contactImageUrl: userAvatarUrl } = useCompanySettings();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleFeedback = (rating: "up" | "down") => {
    setFeedbackGiven(rating);
    onFeedback?.(rating);
  };

  if (type === "user") {
    return (
      <div className="flex justify-end chat-message-enter">
        <div className="flex items-start gap-2 max-w-[90%] md:max-w-[85%]">
          {/* Content: attachments + bubble (same for file upload or normal chat) */}
          <div className="flex flex-col items-end gap-2">
            {(attachments?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-2 justify-end">
                {attachments!.map((att, idx) => (
                  <a
                    key={`${att.name}-${idx}`}
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`
                      inline-flex items-center gap-2 px-3 py-2 rounded-xl
                      bg-[var(--chat-bg-secondary)] border border-[var(--chat-border)]
                      text-[var(--chat-text-primary)] text-sm
                      transition-all duration-200
                      ${att.url ? 'hover:bg-[var(--chat-bg-hover)] cursor-pointer hover:border-[var(--chat-accent)]/50' : ''}
                    `}
                    style={{ borderRadius: 'var(--provider-message-radius, 0.75rem) var(--provider-message-radius, 0.75rem) 0.25rem var(--provider-message-radius, 0.75rem)' }}
                    onClick={(e) => {
                      if (!att.url) e.preventDefault();
                    }}
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[var(--chat-accent)]/20 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-[var(--chat-accent)]" />
                    </div>
                    <div className="flex flex-col items-start min-w-0">
                      <span className="font-medium truncate max-w-[180px]">{att.name}</span>
                      <span className="text-xs text-[var(--chat-text-muted)]">{getAttachmentLabel(att.type)}</span>
                    </div>
                  </a>
                ))}
              </div>
            )}
            <div
              className="
                chat-message-bubble
                px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl rounded-tr-sm
                bg-[var(--chat-user-bubble)]
                text-[var(--chat-user-bubble-text)]
                text-sm sm:text-[15px] leading-relaxed
                whitespace-pre-wrap break-words select-text cursor-text
                transition-all duration-200
              "
              style={{ borderRadius: 'var(--provider-message-radius, 1rem) var(--provider-message-radius, 1rem) 0.25rem var(--provider-message-radius, 1rem)' }}
            >
              {content}
            </div>
          </div>
          {/* User avatar: right of content, golden ring, same for normal and file-upload messages */}
          <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden">
            <Avatar className="w-8 h-8">
              <AvatarImage
                src={userAvatarUrl || undefined}
                alt={user?.full_name || "User"}
                className="object-cover"
              />
              <AvatarFallback className="w-8 h-8 bg-[var(--chat-accent)] text-[var(--chat-user-bubble-text)] text-xs font-medium">
                {user?.full_name ? (
                  user.full_name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)
                ) : (
                  <User className="w-4 h-4" />
                )}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <div className="flex justify-start chat-message-enter">
      <div className="flex items-start gap-3 max-w-[94%] md:max-w-[85%]">
        {/* AI Avatar — always show generic bot icon, never provider branding */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center overflow-hidden">
          <div className="w-full h-full bg-[var(--chat-bg-tertiary)] border border-[var(--chat-border)] rounded-full flex items-center justify-center">
            <Bot className="w-4 h-4 text-[var(--chat-accent)]" />
          </div>
        </div>

        <div className="flex-1 space-y-2">
          {/* Provider info — hidden per product decision */}
          {false && providerName && !isLoading && (
            <div className="flex items-center gap-2 text-xs text-[var(--chat-text-muted)]">
              <span className="font-medium capitalize">{providerName}</span>
              {model && (
                <>
                  <span>•</span>
                  <span>{model}</span>
                </>
              )}
            </div>
          )}

          {/* Message content */}
          <div
            className={`
              chat-message-bubble provider-ai-message
              px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl rounded-tl-sm
              bg-[var(--chat-ai-bubble)]
              text-[var(--chat-ai-bubble-text)]
              text-sm sm:text-[15px] leading-relaxed
              transition-all duration-200
              ${isError ? "border border-[var(--chat-error)] bg-opacity-50" : ""}
            `}
            style={{ borderRadius: '0.25rem var(--provider-message-radius, 1rem) var(--provider-message-radius, 1rem) var(--provider-message-radius, 1rem)' }}
          >
            {isLoading ? (
              <LoadingStatus generationStatus={generationStatus} />
            ) : clarify && clarify.questions.length > 0 ? (
              <div>
                {content ? (
                  <p className="text-sm text-[var(--chat-text-secondary)] mb-1">{content}</p>
                ) : null}
                <ClarifyStepper
                  intro={clarify.intro}
                  questions={clarify.questions}
                  submittedAnswers={
                    clarify.status === "submitted" ? clarify.answers : null
                  }
                  disabled={clarify.status !== "active"}
                  submitLabel={clarify.submitLabel}
                  onSubmit={(answers) => onClarifySubmit?.(answers)}
                  onSkip={() => onClarifySkip?.()}
                />
              </div>
            ) : (
              <div className="markdown-content max-w-full" style={{ overflowWrap: 'anywhere' }}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: (props) => <p className="mb-3 last:mb-0" {...props} />,
                    ul: (props) => <ul className="list-disc pl-4 mb-3" {...props} />,
                    ol: (props) => <ol className="list-decimal pl-4 mb-3" {...props} />,
                    li: (props) => <li className="mb-1" {...props} />,
                    code: (props) => {
                      const { children, className, ...rest } = props;
                      const match = /language-(\w+)/.exec(className || "");
                      const isInline = !match;
                      return isInline ? (
                        <code
                          className="px-1.5 py-0.5 rounded bg-[var(--chat-bg-tertiary)] text-[var(--chat-text-primary)] text-[13px]"
                          {...rest}
                        >
                          {children}
                        </code>
                      ) : (
                        <code
                          className="block whitespace-pre overflow-x-auto chat-scrollbar p-3 rounded-lg bg-[var(--chat-bg-secondary)] border border-[var(--chat-border)] text-[12px] my-3"
                          {...rest}
                        >
                          {children}
                        </code>
                      );
                    },
                    table: (props) => (
                      <div className="overflow-x-auto chat-scrollbar my-4 border rounded-lg">
                        <table className="w-full border-collapse text-xs" {...props} />
                      </div>
                    ),
                    th: (props) => (
                      <th
                        className="border-b border-[var(--chat-border)] bg-[var(--chat-bg-secondary)] px-3 py-2 text-left font-semibold"
                        {...props}
                      />
                    ),
                    td: (props) => (
                      <td className="border-b last:border-0 border-[var(--chat-border)] px-3 py-2" {...props} />
                    ),
                    a: (props) => (
                      <a className="text-[var(--chat-accent)] hover:underline break-all" style={{ wordBreak: 'break-all' }} target="_blank" rel="noreferrer" {...props} />
                    ),
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>
            )}
          </div>

          {/* Actions */}
          {!isLoading && (content || clarify) && (
            <div className="flex items-center gap-1">
              {/* Copy button */}
              <button
                onClick={handleCopy}
                className="
                  p-1.5 rounded-lg
                  text-[var(--chat-text-muted)] hover:text-[var(--chat-text-secondary)]
                  hover:bg-[var(--chat-bg-hover)]
                  transition-colors duration-200
                "
                aria-label="Copy message"
                title="Copy to clipboard"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-[var(--chat-success)]" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>

              {/* Feedback buttons */}
              {onFeedback && (
                <>
                  <button
                    onClick={() => handleFeedback("up")}
                    className={`
                      p-1.5 rounded-lg
                      transition-colors duration-200
                      ${feedbackGiven === "up"
                        ? "text-[var(--chat-success)] bg-[var(--chat-success)]/10"
                        : "text-[var(--chat-text-muted)] hover:text-[var(--chat-text-secondary)] hover:bg-[var(--chat-bg-hover)]"
                      }
                    `}
                    aria-label="Helpful"
                    title="This was helpful"
                    disabled={feedbackGiven !== null}
                  >
                    <ThumbsUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleFeedback("down")}
                    className={`
                      p-1.5 rounded-lg
                      transition-colors duration-200
                      ${feedbackGiven === "down"
                        ? "text-[var(--chat-error)] bg-[var(--chat-error)]/10"
                        : "text-[var(--chat-text-muted)] hover:text-[var(--chat-text-secondary)] hover:bg-[var(--chat-bg-hover)]"
                      }
                    `}
                    aria-label="Not helpful"
                    title="This wasn't helpful"
                    disabled={feedbackGiven !== null}
                  >
                    <ThumbsDown className="w-4 h-4" />
                  </button>
                </>
              )}

              {/* Retry button for errors */}
              {isError && onRetry && (
                <button
                  onClick={onRetry}
                  className="
                    p-1.5 rounded-lg
                    text-[var(--chat-error)] hover:text-[var(--chat-error)]
                    hover:bg-[var(--chat-error)]/10
                    transition-colors duration-200
                  "
                  aria-label="Retry"
                  title="Retry this message"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

