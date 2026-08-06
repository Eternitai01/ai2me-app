"use client";

import { useRef, useEffect } from "react";
import { ChatMessage } from "./ChatMessage";
import type { ClarifyAnswer, ClarifyQuestion } from "@/lib/clarify";

export interface MessageAttachment {
  name: string;
  type?: string;
  url?: string;
}

/** GenSpark-style clarify stepper attached to an assistant message. */
export interface MessageClarify {
  intro?: string | null;
  questions: ClarifyQuestion[];
  answers?: ClarifyAnswer[] | null;
  status: "active" | "submitted" | "skipped";
  submitLabel?: string;
}

export interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  /** AI Docs: raw document HTML for the editor, when `content` holds a prose summary instead */
  rawHtml?: string;
  timestamp?: string;
  isLoading?: boolean;
  generationStatus?: string;
  providerName?: string;
  model?: string;
  isError?: boolean;
  attachments?: MessageAttachment[];
  clarify?: MessageClarify;
}

interface ChatMessagesProps {
  messages: Message[];
  onFeedback?: (messageId: string, rating: "up" | "down") => void;
  onRetry?: (messageId: string) => void;
  onClarifySubmit?: (messageId: string, answers: ClarifyAnswer[]) => void;
  onClarifySkip?: (messageId: string) => void;
}

/** Nearest ancestor that actually scrolls. */
function findScrollParent(node: HTMLElement | null): HTMLElement | null {
  let el = node?.parentElement ?? null;
  while (el) {
    const { overflowY } = getComputedStyle(el);
    if ((overflowY === "auto" || overflowY === "scroll") && el.scrollHeight > el.clientHeight) {
      return el;
    }
    el = el.parentElement;
  }
  return null;
}

const NEAR_BOTTOM_PX = 120;

export function ChatMessages({
  messages,
  onFeedback,
  onRetry,
  onClarifySubmit,
  onClarifySkip,
}: ChatMessagesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the newest message — but ONLY when the user is already parked at
  // the bottom. Previously this ran unconditionally on every `messages` change.
  //
  // Two things made that hostile during code generation:
  //  1. scrollIntoView() scrolls EVERY scrollable ancestor. This component sits inside
  //     the page's scroller, with the streamed code output rendered BELOW it, so
  //     pulling our bottom into view yanked the page scroller back up and away from
  //     the code the user was reading.
  //  2. The session poll re-renders every ~3s, so the yank repeated continuously.
  useEffect(() => {
    const scroller = findScrollParent(containerRef.current);

    if (scroller) {
      const distanceFromBottom =
        scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight;
      if (distanceFromBottom > NEAR_BOTTOM_PX) return; // user scrolled away — leave them alone
      scroller.scrollTo({ top: scroller.scrollHeight, behavior: "smooth" });
      return;
    }

    // No scrolling ancestor (e.g. short conversation): nothing to fight over.
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto chat-scrollbar px-4 py-6 space-y-6"
    >
      {messages.map((message) => (
        <ChatMessage
          key={message.id}
          id={message.id}
          type={message.type}
          content={message.content}
          timestamp={message.timestamp}
          isLoading={message.isLoading}
          generationStatus={message.generationStatus}
          providerName={message.providerName}
          model={message.model}
          isError={message.isError}
          attachments={message.attachments}
          clarify={message.clarify}
          onClarifySubmit={
            message.clarify?.status === "active" && onClarifySubmit
              ? (answers) => onClarifySubmit(message.id, answers)
              : undefined
          }
          onClarifySkip={
            message.clarify?.status === "active" && onClarifySkip
              ? () => onClarifySkip(message.id)
              : undefined
          }
          onFeedback={
            message.type === "assistant" && onFeedback
              ? (rating) => onFeedback(message.id, rating)
              : undefined
          }
          onRetry={
            message.isError && onRetry ? () => onRetry(message.id) : undefined
          }
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

