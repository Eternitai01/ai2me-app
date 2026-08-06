"use client";

import { useState, useRef, useEffect, useCallback, KeyboardEvent, ReactNode } from "react";
import { Sparkles, X, FileText, Loader2, Plus, ImageIcon, Link2, Code2 } from "lucide-react";
import { toast } from "sonner";
import LiquidCircleButton from "./LiquidCircleButton";

// Animated placeholder phrases
const PLACEHOLDER_PHRASES = [
  "What do you want to build today?",
  "What challenge can AI2me solve?",
  "Describe your idea. AI2me builds it.",
  "What would you like to create?",
];

const MAX_ATTACHMENTS = 3;
const MAX_FILE_SIZE_MB = 15;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_TOTAL_SIZE_MB = 30;
const MAX_TOTAL_SIZE_BYTES = MAX_TOTAL_SIZE_MB * 1024 * 1024;
const ALLOWED_EXTENSIONS = ["pdf", "docx", "txt", "md", "json", "csv", "log", "html", "xml", "png", "jpg", "jpeg", "gif", "webp", "svg"];
const REJECTED_EXTENSIONS = [];
const ACCEPT_ALL = ALLOWED_EXTENSIONS.map(ext => `.${ext}`).join(",");

export interface AttachmentItem {
  file: File;
  name: string;
  extractedText?: string;
  error?: string;
  status: "pending" | "done" | "error";
  previewUrl?: string; // object URL for image preview
}

export interface SentAttachment {
  name: string;
  type: string;
  url?: string;
}

interface ChatInputProps {
  onSend: (message: string, additionalContent?: string | Record<string, unknown>, attachments?: SentAttachment[]) => void;
  disabled?: boolean;
  placeholder?: string;
  isLoading?: boolean;
  animatePlaceholder?: boolean;
  modelSelector?: ReactNode;
  /** When provided, called before opening the attach menu. Return false to prevent opening (e.g. to show sign-in). */
  onBeforeAttach?: () => boolean;
  /** When false, hides the attach button and attachment UI (e.g. for ai-slides). Default true. */
  showAttachButton?: boolean;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder,
  isLoading = false,
  animatePlaceholder = true,
  modelSelector,
  onBeforeAttach,
  showAttachButton = true,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [phase, setPhase] = useState<"typing" | "holding" | "deleting">("typing");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const [urlInputOpen, setUrlInputOpen] = useState(false);
  const [urlValue, setUrlValue] = useState("");
  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);
  const attachMenuRef = useRef<HTMLDivElement>(null);

  const processFile = useCallback(async (file: File): Promise<AttachmentItem> => {
    const name = file.name;
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    const isImage = ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext);
    const previewUrl = isImage ? URL.createObjectURL(file) : undefined;
    // Text is extracted server-side at upload time (Tier 1 + Bedrock vision fallback), so
    // there's no client-side extraction here — avoids the CDN-loaded pdf.js / mammoth workers.
    return { file, name, status: "done", previewUrl };
  }, []);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) {
      setDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  const addFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList?.length) return;
      const next: AttachmentItem[] = [];
      const totalSoFar = attachments.reduce((sum, a) => sum + (a.file?.size || 0), 0);
      let runningSize = 0;
      for (let i = 0; i < fileList.length && attachments.length + next.length < MAX_ATTACHMENTS; i++) {
        const file = fileList[i];
        const ext = (file.name.split(".").pop() || "").toLowerCase();
        
        if (REJECTED_EXTENSIONS.includes(ext)) {
          toast.error("This file type isn't supported yet.");
          continue;
        }

        if (!ALLOWED_EXTENSIONS.includes(ext)) {
          toast.error("Unsupported file type. Please upload a document or image.");
          continue;
        }

        if (file.size > MAX_FILE_SIZE_BYTES) {
          toast.error(`"${file.name}" exceeds the ${MAX_FILE_SIZE_MB}MB limit and can't be read.`);
          continue;
        }

        if (totalSoFar + runningSize + file.size > MAX_TOTAL_SIZE_BYTES) {
          toast.error(`Total upload size can't exceed ${MAX_TOTAL_SIZE_MB}MB.`);
          break;
        }

        next.push({ file, name: file.name, status: "pending" });
        runningSize += file.size;
      }
      if (next.length === 0) return;
      setAttachments((prev) => [...prev, ...next]);
      const results = await Promise.all(next.map((n) => processFile(n.file)));
      setAttachments((prev) => {
        const updated = [...prev];
        // locate by name to avoid issues with race conditions
        results.forEach((result) => {
          const idx = updated.findIndex((a) => a.name === result.name && a.status === "pending");
          if (idx !== -1) updated[idx] = result;
        });
        return updated;
      });
    },
    [attachments, processFile]
  );

  const removeAttachment = useCallback((name: string) => {
    setAttachments((prev) => prev.filter((a) => a.name !== name));
  }, []);

  const openFilePicker = () => {
    if (disabled || isLoading || attachments.length >= MAX_ATTACHMENTS) return;
    if (onBeforeAttach && onBeforeAttach() === false) return;
    fileInputRef.current?.click();
  };

  // Animated placeholder effect
  useEffect(() => {
    if (!animatePlaceholder || message.length > 0 || disabled) {
      return;
    }

    const currentPhrase = PLACEHOLDER_PHRASES[currentPhraseIndex];
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    if (phase === "typing") {
      const nextLen = Math.min(displayedText.length + 1, currentPhrase.length);
      timeoutId = setTimeout(() => {
        setDisplayedText(currentPhrase.slice(0, nextLen));
        if (nextLen >= currentPhrase.length) {
          setPhase("holding");
        }
      }, 45);
    } else if (phase === "holding") {
      timeoutId = setTimeout(() => {
        setPhase("deleting");
      }, 1400);
    } else {
      const nextLen = Math.max(displayedText.length - 1, 0);
      timeoutId = setTimeout(() => {
        setDisplayedText(currentPhrase.slice(0, nextLen));
        if (nextLen === 0) {
          setCurrentPhraseIndex((prev) => (prev + 1) % PLACEHOLDER_PHRASES.length);
          setPhase("typing");
        }
      }, 25);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [animatePlaceholder, message.length, disabled, currentPhraseIndex, phase, displayedText]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [message]);

  const buildAdditionalContent = useCallback((): string | Record<string, unknown> | undefined => {
    const withText = attachments.filter(
      (a) => a.status === "done" && a.extractedText != null && String(a.extractedText).trim().length > 0
    );
    if (withText.length === 0) return undefined;
    if (withText.length === 1) return `Attached file content (${withText[0].name}):\n${withText[0].extractedText!.trim()}`;
    const obj: Record<string, unknown> = {};
    withText.forEach((a, i) => {
      obj[`Attached file content (${a.name})`] = (a.extractedText as string).trim();
    });
    return obj;
  }, [attachments]);

  const buildSentAttachments = useCallback((): SentAttachment[] => {
    return attachments
      .filter((a) => a.status === "done")
      .map((a) => ({
        name: a.name,
        type: (a.name.split(".").pop() || "file").toLowerCase(),
      }));
  }, [attachments]);

  const handleSubmit = async () => {
    if (!message.trim() || disabled || isLoading) return;
    
    // Upload files to S3 first
    const uploadedAttachments: SentAttachment[] = [];
    
    // Determine which files to upload (those that were processed successfully)
    const filesToUpload = attachments.filter(a => a.status === 'done' && a.file);
    
    if (filesToUpload.length > 0) {
      // Use a simplistic approach: upload each one. In a real app, you'd show a "Uploading..." state.
      for (const att of filesToUpload) {
        try {
          const formData = new FormData();
          formData.append('file', att.file);
          
          const res = await fetch('/api/ai/upload', {
            method: 'POST',
            body: formData
          });
          
          if (res.ok) {
            const result = await res.json();
            if (result.success && result.data) {
              const url = result.data.url;
              uploadedAttachments.push({
                name: result.data.name,
                type: (result.data.name.split('.').pop() || 'file').toLowerCase(),
                url,
              });
              // Server-side extraction (docs) or Claude vision OCR (images / scanned PDFs).
              // Falls back to the client-extracted text already on `att` when the server
              // returned nothing (e.g. Bedrock unavailable for a scanned file).
              if (typeof result.data.extracted_text === 'string' && result.data.extracted_text.trim()) {
                att.extractedText = result.data.extracted_text;
              }
            }
          }
        } catch (e) {
          console.error("Failed to upload file:", att.name, e);
        }
      }
    }

    const additionalContent = buildAdditionalContent();
    // Do not send if user attached files but ALL are still unreadable (prevents "no document" AI response)
    if (attachments.length > 0 && additionalContent == null && !filesToUpload.length) return;
    
    onSend(message.trim(), additionalContent, uploadedAttachments.length > 0 ? uploadedAttachments : undefined);
    setMessage("");
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const canSend = message.trim() && !disabled && !isLoading;
  const hasAttachmentsProcessing = attachments.some((a) => a.status === "pending");
  const hasAttachmentsWithNoText =
    attachments.length > 0 && buildAdditionalContent() == null && !attachments.some(a => a.status === 'error') && !attachments.some(a => a.status === 'done');
  const submitDisabled =
    !canSend || hasAttachmentsProcessing || hasAttachmentsWithNoText;

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Ensure placeholder is never empty (some browsers won't show it if it's "")
  const animatedOrFallback = displayedText || "Ask anything...";
  const activePlaceholder =
    placeholder || (animatePlaceholder && message.length === 0 ? animatedOrFallback : "Ask anything...");

  // Use enhanced layout if modelSelector is provided, otherwise use simple layout
  const useEnhancedLayout = !!modelSelector;

  // Cleanup object URLs when attachments change or component unmounts
  useEffect(() => {
    const currentUrls = attachments.map(a => a.previewUrl).filter(Boolean) as string[];
    return () => {
      currentUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [attachments]);

  // Close attachment menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target as Node)) {
        setAttachMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="w-full max-w-3xl mx-auto">
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT_ALL}
        multiple
        className="hidden"
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <input ref={imageInputRef} type="file" accept=".png,.jpg,.jpeg,.gif,.webp,.svg" multiple className="hidden" onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
      <input ref={docInputRef} type="file" accept=".pdf,.docx,.txt,.md,.csv,.log,.html,.xml" multiple className="hidden" onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
      <input ref={codeInputRef} type="file" accept=".js,.ts,.jsx,.tsx,.py,.sql,.json,.yaml,.yml,.sh,.css,.html" multiple className="hidden" onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
      
      {useEnhancedLayout ? (
        // Enhanced layout with model selector and bottom bar (AI Chat)
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            chat-input-container
            relative flex flex-col gap-0 p-2 sm:p-3
            rounded-[24px]
            border ${dragOver ? "border-2 border-dashed border-[var(--chat-accent)]" : "border border-[var(--chat-border)]"}
            bg-[var(--chat-bg-primary)]
            transition-all duration-300
            ${!disabled ? "focus-within:border-[var(--chat-accent)]" : "opacity-60"}
          `}
        >
          {/* Attachments list (hidden when showAttachButton is false, e.g. ai-slides) */}
          {showAttachButton && (attachments.length > 0 || urlInputOpen) && (
            <div className="flex flex-col gap-2 px-2 pb-2 border-b border-[var(--chat-border)]">
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {attachments.map((a) => (
                    <div
                      key={`${a.name}`}
                      className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-[var(--chat-bg-secondary)] border border-[var(--chat-border)] text-sm"
                    >
                      {a.status === "pending" ? (
                        <Loader2 className="w-4 h-4 animate-spin text-[var(--chat-text-muted)] flex-shrink-0" />
                      ) : a.previewUrl ? (
                        <img src={a.previewUrl} alt={a.name} className="w-4 h-4 object-cover rounded flex-shrink-0" />
                      ) : (
                        <FileText className="w-4 h-4 text-[var(--chat-text-muted)] flex-shrink-0" />
                      )}
                      <span className="truncate max-w-[140px] text-[var(--chat-text-primary)]" title={a.name}>
                        {a.name}
                      </span>
                      {a.status === "error" && (
                        <span className="text-red-500 text-xs" title={a.error}>
                          Error
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeAttachment(a.name)}
                        className="p-0.5 rounded hover:bg-[var(--chat-bg-hover)] text-[var(--chat-text-secondary)]"
                        aria-label={`Remove ${a.name}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {hasAttachmentsWithNoText && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Could not extract text from the file(s). Remove them or try another file.
                </p>
              )}
              {urlInputOpen && (
                <div className="flex items-center gap-2 px-2 py-2 border-t border-[var(--chat-border)]">
                  <Link2 className="w-4 h-4 text-[var(--chat-text-muted)] shrink-0" />
                  <input
                    type="url"
                    placeholder="Paste a URL..."
                    value={urlValue}
                    onChange={e => setUrlValue(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && urlValue.trim()) {
                        setAttachments(prev => [...prev, {
                          file: new File([urlValue], urlValue, { type: 'text/uri-list' }),
                          name: urlValue,
                          extractedText: `[URL context: ${urlValue}]`,
                          status: 'done'
                        }]);
                        setUrlValue('');
                        setUrlInputOpen(false);
                      }
                      if (e.key === 'Escape') { setUrlInputOpen(false); setUrlValue(''); }
                    }}
                    autoFocus
                    className="flex-1 bg-transparent text-sm text-[var(--chat-text-primary)] placeholder:text-[var(--chat-text-muted)] outline-none"
                  />
                  <button type="button" onClick={() => { setUrlInputOpen(false); setUrlValue(''); }} style={{ background:'none', border:'none', cursor:'pointer' }}>
                    <X className="w-4 h-4 text-[var(--chat-text-muted)]" />
                  </button>
                </div>
              )}
            </div>
          )}
          {/* Text input area */}
          <div className="flex w-full px-2">
            <div className="flex-shrink-0 pt-1.5">
              <Sparkles className="w-5 h-5 opacity-60 chat-sparkle-icon" />
            </div>
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={activePlaceholder}
              autoFocus
              disabled={disabled || isLoading}
              rows={1}
              className="
                flex-1 resize-none
                bg-transparent
                focus:outline-none
                text-xs sm:text-base leading-6
                max-h-[200px]
                py-1.5 sm:py-2
                pl-2 pr-2
                disabled:cursor-not-allowed
                text-[var(--chat-text-primary)]
                placeholder:text-[var(--chat-text-muted)]
              "
              style={{ minHeight: "24px" }}
            />
          </div>

          {/* Bottom Bar items */}
          <div className="flex items-center justify-between w-full px-0.5 sm:px-1 pt-1.5 sm:pt-2">
            <div className="flex items-center gap-2">
              {showAttachButton && (
                <div className="relative" ref={attachMenuRef}>
                  <button
                    type="button"
                    onClick={() => {
                      if (disabled || isLoading || attachments.length >= MAX_ATTACHMENTS) return;
                      if (onBeforeAttach && onBeforeAttach() === false) return;
                      setAttachMenuOpen(prev => !prev);
                    }}
                    className="w-8 h-8 rounded-full bg-[var(--chat-bg-secondary)] hover:bg-[var(--chat-bg-hover)] flex items-center justify-center text-[var(--chat-text-secondary)] transition-colors disabled:opacity-50 disabled:pointer-events-none"
                    title="Add context"
                    disabled={attachments.length >= MAX_ATTACHMENTS}
                  >
                    <Plus className="w-4 h-4" />
                  </button>

                  {attachMenuOpen && (
                    <div className="absolute bottom-full left-0 mb-2 w-52 rounded-2xl border border-[var(--chat-border)] bg-[var(--chat-bg-primary)] shadow-xl shadow-black/20 overflow-hidden z-[200] py-1">
                      {/* Upload Image */}
                      <button type="button" onClick={() => { setAttachMenuOpen(false); imageInputRef.current?.click(); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--chat-bg-secondary)] transition-colors text-left"
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <div className="w-8 h-8 rounded-xl bg-pink-500/15 flex items-center justify-center shrink-0">
                          <ImageIcon className="w-4 h-4 text-pink-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[var(--chat-text-primary)]">Image</p>
                          <p className="text-[11px] text-[var(--chat-text-muted)]">PNG, JPG, GIF, WebP</p>
                        </div>
                      </button>

                      {/* Upload Document */}
                      <button type="button" onClick={() => { setAttachMenuOpen(false); docInputRef.current?.click(); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--chat-bg-secondary)] transition-colors text-left"
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <div className="w-8 h-8 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[var(--chat-text-primary)]">Document</p>
                          <p className="text-[11px] text-[var(--chat-text-muted)]">PDF, DOCX, TXT, MD, CSV</p>
                        </div>
                      </button>

                      {/* Add URL */}
                      <button type="button" onClick={() => { setAttachMenuOpen(false); setUrlInputOpen(true); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--chat-bg-secondary)] transition-colors text-left"
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <div className="w-8 h-8 rounded-xl bg-green-500/15 flex items-center justify-center shrink-0">
                          <Link2 className="w-4 h-4 text-green-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[var(--chat-text-primary)]">URL</p>
                          <p className="text-[11px] text-[var(--chat-text-muted)]">Paste a link for context</p>
                        </div>
                      </button>

                      {/* Code file */}
                      <button type="button" onClick={() => { setAttachMenuOpen(false); codeInputRef.current?.click(); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--chat-bg-secondary)] transition-colors text-left"
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <div className="w-8 h-8 rounded-xl bg-purple-500/15 flex items-center justify-center shrink-0">
                          <Code2 className="w-4 h-4 text-purple-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[var(--chat-text-primary)]">Code</p>
                          <p className="text-[11px] text-[var(--chat-text-muted)]">JS, TS, PY, SQL, JSON</p>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {modelSelector}
            </div>

            <div className="flex items-center gap-2">
              <LiquidCircleButton
                onClick={handleSubmit}
                disabled={submitDisabled}
                isLoading={isLoading}
                className="flex-shrink-0"
                ariaLabel="Send message"
                variant="circle"
                offsetX={-0.4}
                offsetY={-0.1}
              />
            </div>
          </div>
        </div>
      ) : (
        // Simple layout (Regular Chat)
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            chat-input-container
            relative flex flex-col gap-0 p-2.5 sm:p-3.5
            rounded-2xl
            shadow-lg shadow-black/5
            transition-all duration-300
            ${dragOver ? "border-2 border-dashed border-blue-400 bg-blue-50/50" : ""}
            ${!disabled ? "focus-within:shadow-xl" : "opacity-60"}
          `}
        >
          {showAttachButton && (attachments.length > 0 || urlInputOpen) && (
            <div className="flex flex-col gap-2 px-1 pb-2">
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {attachments.map((a) => (
                    <div
                      key={`${a.name}`}
                      className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-black/5 dark:bg-white/5 border text-sm"
                    >
                      {a.status === "pending" ? (
                        <Loader2 className="w-4 h-4 animate-spin text-gray-500 flex-shrink-0" />
                      ) : a.previewUrl ? (
                        <img src={a.previewUrl} alt={a.name} className="w-4 h-4 object-cover rounded flex-shrink-0" />
                      ) : (
                        <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      )}
                      <span className="truncate max-w-[140px]" title={a.name}>
                        {a.name}
                      </span>
                      {a.status === "error" && (
                        <span className="text-red-500 text-xs" title={a.error}>
                          Error
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeAttachment(a.name)}
                        className="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10"
                        aria-label={`Remove ${a.name}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {hasAttachmentsWithNoText && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Could not extract text from the file(s). Remove them or try another file.
                </p>
              )}
              {urlInputOpen && (
                <div className="flex items-center gap-2 px-2 py-2 border-t border-[var(--chat-border)]">
                  <Link2 className="w-4 h-4 text-[var(--chat-text-muted)] shrink-0" />
                  <input
                    type="url"
                    placeholder="Paste a URL..."
                    value={urlValue}
                    onChange={e => setUrlValue(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && urlValue.trim()) {
                        setAttachments(prev => [...prev, {
                          file: new File([urlValue], urlValue, { type: 'text/uri-list' }),
                          name: urlValue,
                          extractedText: `[URL context: ${urlValue}]`,
                          status: 'done'
                        }]);
                        setUrlValue('');
                        setUrlInputOpen(false);
                      }
                      if (e.key === 'Escape') { setUrlInputOpen(false); setUrlValue(''); }
                    }}
                    autoFocus
                    className="flex-1 bg-transparent text-sm text-[var(--chat-text-primary)] placeholder:text-[var(--chat-text-muted)] outline-none"
                  />
                  <button type="button" onClick={() => { setUrlInputOpen(false); setUrlValue(''); }} style={{ background:'none', border:'none', cursor:'pointer' }}>
                    <X className="w-4 h-4 text-[var(--chat-text-muted)]" />
                  </button>
                </div>
              )}
            </div>
          )}
          <div className="flex items-start gap-2 sm:gap-3">
            {showAttachButton && (
              <div className="relative flex-shrink-0" ref={attachMenuRef}>
                <button
                  type="button"
                  onClick={() => {
                    if (disabled || isLoading || attachments.length >= MAX_ATTACHMENTS) return;
                    if (onBeforeAttach && onBeforeAttach() === false) return;
                    setAttachMenuOpen(prev => !prev);
                  }}
                  className="w-8 h-8 rounded-full bg-[var(--chat-bg-secondary)] hover:bg-[var(--chat-bg-hover)] flex items-center justify-center text-[var(--chat-text-secondary)] transition-colors disabled:opacity-50 disabled:pointer-events-none"
                  title="Add context"
                  disabled={attachments.length >= MAX_ATTACHMENTS}
                >
                  <Plus className="w-4 h-4" />
                </button>

                {attachMenuOpen && (
                  <div className="absolute bottom-full left-0 mb-2 w-52 rounded-2xl border border-[var(--chat-border)] bg-[var(--chat-bg-primary)] shadow-xl shadow-black/20 overflow-hidden z-[200] py-1">
                    {/* Upload Image */}
                    <button type="button" onClick={() => { setAttachMenuOpen(false); imageInputRef.current?.click(); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--chat-bg-secondary)] transition-colors text-left"
                      style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                      <div className="w-8 h-8 rounded-xl bg-pink-500/15 flex items-center justify-center shrink-0">
                        <ImageIcon className="w-4 h-4 text-pink-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[var(--chat-text-primary)]">Image</p>
                        <p className="text-[11px] text-[var(--chat-text-muted)]">PNG, JPG, GIF, WebP</p>
                      </div>
                    </button>

                    {/* Upload Document */}
                    <button type="button" onClick={() => { setAttachMenuOpen(false); docInputRef.current?.click(); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--chat-bg-secondary)] transition-colors text-left"
                      style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                      <div className="w-8 h-8 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[var(--chat-text-primary)]">Document</p>
                        <p className="text-[11px] text-[var(--chat-text-muted)]">PDF, DOCX, TXT, MD, CSV</p>
                      </div>
                    </button>

                    {/* Add URL */}
                    <button type="button" onClick={() => { setAttachMenuOpen(false); setUrlInputOpen(true); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--chat-bg-secondary)] transition-colors text-left"
                      style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                      <div className="w-8 h-8 rounded-xl bg-green-500/15 flex items-center justify-center shrink-0">
                        <Link2 className="w-4 h-4 text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[var(--chat-text-primary)]">URL</p>
                        <p className="text-[11px] text-[var(--chat-text-muted)]">Paste a link for context</p>
                      </div>
                    </button>

                    {/* Code file */}
                    <button type="button" onClick={() => { setAttachMenuOpen(false); codeInputRef.current?.click(); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--chat-bg-secondary)] transition-colors text-left"
                      style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                      <div className="w-8 h-8 rounded-xl bg-purple-500/15 flex items-center justify-center shrink-0">
                        <Code2 className="w-4 h-4 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[var(--chat-text-primary)]">Code</p>
                        <p className="text-[11px] text-[var(--chat-text-muted)]">JS, TS, PY, SQL, JSON</p>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            )}
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={activePlaceholder}
              autoFocus
              disabled={disabled || isLoading}
              rows={1}
              className="
                flex-1 resize-none
                bg-transparent
                focus:outline-none
                text-xs sm:text-base leading-6
                max-h-[200px]
                py-1
                pr-2
                disabled:cursor-not-allowed
                chat-input-textarea
              "
              style={{ minHeight: "32px" }}
            />

            <LiquidCircleButton
              onClick={handleSubmit}
              disabled={submitDisabled}
              isLoading={isLoading}
              className="flex-shrink-0 mt-0.5"
              ariaLabel="Send message"
              variant="circle"
              offsetX={-0.4}
              offsetY={-0.1}
            />
          </div>
        </div>
      )}
    </div>
  );
}

