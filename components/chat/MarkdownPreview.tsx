"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { ChevronDown } from "lucide-react";

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function toTiptapHtml(content: string): string {
  const text = (content || "").trim();
  if (!text) return "<p></p>";

  // If content already looks like HTML (PRD from backend), keep it.
  if (/<[a-z][\s\S]*>/i.test(text)) {
    return text.replace(/\n\s*---\s*\n/g, "<hr />");
  }

  // Fallback: format plain text/markdown-ish output into paragraphs.
  return text
    .replace(/\n\s*---\s*\n/g, "\n\n")
    .split(/\n{2,}/)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, "<br />")}</p>`)
    .join("");
}

export function MarkdownPreview({ markdown }: { markdown: string }) {
  const hasContent = Boolean(markdown?.trim());
  const htmlContent = useMemo(() => toTiptapHtml(markdown || ""), [markdown]);
  const editor = useEditor({
    extensions: [StarterKit],
    content: htmlContent,
    editable: false,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "min-h-full max-w-3xl outline-none text-[15px] leading-7 text-[var(--chat-text-secondary)] " +
          "[&>h1]:text-2xl [&>h1]:font-semibold [&>h1]:text-[var(--chat-text-primary)] [&>h1]:mt-0 [&>h1]:mb-4 " +
          "[&>h2]:text-xl [&>h2]:font-semibold [&>h2]:text-[var(--chat-text-primary)] [&>h2]:mt-6 [&>h2]:mb-3 " +
          "[&>h3]:text-lg [&>h3]:font-semibold [&>h3]:text-[var(--chat-text-primary)] [&>h3]:mt-5 [&>h3]:mb-2 " +
          "[&>p]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-3 " +
          "[&_li]:my-1 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:bg-[var(--chat-bg-tertiary)] " +
          "[&_pre]:overflow-x-auto [&_pre]:p-4 [&_pre]:rounded-xl [&_pre]:bg-[var(--chat-bg-secondary)] [&_pre]:border [&_pre]:border-[var(--chat-border)] " +
          "[&_blockquote]:border-l-2 [&_blockquote]:border-[var(--chat-border)] [&_blockquote]:pl-4 [&_blockquote]:my-4 " +
          "[&_hr]:my-6 [&_hr]:border-[var(--chat-border)] [&_a]:text-[var(--chat-accent)] [&_a]:underline",
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.commands.setContent(htmlContent, false);
  }, [editor, htmlContent]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  // Auto-scroll when near the bottom during streaming
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
    if (nearBottom) el.scrollTop = el.scrollHeight;
  }, [htmlContent]);

  // Show/hide the scroll-to-bottom button based on scroll position
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const onScroll = () => {
      const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      setShowScrollBtn(distFromBottom > 120);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    // Run once on mount to set initial state
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, [hasContent]);

  const scrollToBottom = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  };

  if (!hasContent) {
    return <div className="h-full" />;
  }

  if (!editor) {
    return <div className="h-full overflow-y-auto chat-scrollbar p-6" />;
  }

  return (
    <div className="relative h-full">
      <div ref={scrollContainerRef} className="h-full overflow-y-auto chat-scrollbar p-6">
        <EditorContent editor={editor} />
      </div>

      {/* Scroll-to-bottom button */}
      {showScrollBtn && (
        <button
          type="button"
          onClick={scrollToBottom}
          className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10
            flex items-center justify-center w-8 h-8 rounded-full
            bg-[var(--chat-bg-secondary)] border border-[var(--chat-border)]
            text-[var(--chat-text-muted)] shadow-lg
            hover:bg-[var(--chat-accent)] hover:text-white hover:border-[var(--chat-accent)]
            transition-all duration-150 animate-in fade-in slide-in-from-bottom-1"
          aria-label="Scroll to bottom"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
