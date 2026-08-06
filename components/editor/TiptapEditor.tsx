"use client";

import { useEffect, useCallback, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Heading } from "@tiptap/extension-heading";
import { Underline } from "@tiptap/extension-underline";
import { BulletList } from "@tiptap/extension-bullet-list";
import { OrderedList } from "@tiptap/extension-ordered-list";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Image } from "@tiptap/extension-image";
import { Link } from "@tiptap/extension-link";
import { TextAlign } from "@tiptap/extension-text-align";
import { Placeholder } from "@tiptap/extension-placeholder";
import DOMPurify from "dompurify";
import { saveAs } from "file-saver";
import * as htmlDocx from "html-docx-js/dist/html-docx";
import TurndownService from "turndown";

import { EditorToolbar } from "./EditorToolbar";
import type { DocsExportFormat } from "@/lib/ai-docs-format";

// Tiptap's editor.getHTML() is plain semantic markup with no visual styling —
// borders/backgrounds/padding in the live editor come from Tailwind classes
// scoped to the app's DOM, which don't travel into a standalone export. Embed
// fixed CSS (not the app's theme vars) so HTML/DOCX exports keep their formatting
// when opened outside the app.
const EXPORT_STYLES = `
body { font-family: Arial, Helvetica, sans-serif; color: #1a1a1a; line-height: 1.6; margin: 40px; }
h1 { font-size: 28px; font-weight: bold; margin: 0 0 16px; }
h2 { font-size: 22px; font-weight: bold; margin: 24px 0 12px; }
h3 { font-size: 18px; font-weight: bold; margin: 18px 0 8px; }
p { margin: 0 0 12px; }
ul, ol { margin: 0 0 12px; padding-left: 24px; }
table { border-collapse: collapse; width: 100%; margin: 0 0 16px; }
th, td { border: 1px solid #999999; padding: 8px; text-align: left; vertical-align: top; }
th { background-color: #e8e8e8; font-weight: bold; }
`;

function buildExportHtml(bodyHtml: string): string {
    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>${EXPORT_STYLES}</style>
  </head>
  <body>
    ${bodyHtml}
  </body>
</html>`;
}

interface TiptapEditorProps {
    content: string;
    onChange?: (json: any) => void;
    onAutoSave?: (json: any, html: string) => void;
    placeholder?: string;
    exportFormat?: DocsExportFormat;
}

export function TiptapEditor({
    content,
    onChange,
    onAutoSave,
    placeholder = "Start typing or generate content with AI...",
    exportFormat = "web_doc",
}: TiptapEditorProps) {
    const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: false, // Use dedicated Heading extension
                bulletList: false,
                orderedList: false,
            }),
            Heading.configure({
                levels: [1, 2, 3],
            }),
            Underline,
            BulletList,
            OrderedList,
            Table.configure({
                resizable: true,
            }),
            TableRow,
            TableHeader,
            TableCell,
            Image.configure({
                allowBase64: true,
            }),
            Link.configure({
                openOnClick: false,
            }),
            TextAlign.configure({
                types: ["heading", "paragraph"],
            }),
            Placeholder.configure({
                placeholder,
            }),
        ],
        content: "",
        editorProps: {
            attributes: {
                class:
                    "prose prose-sm max-w-none focus:outline-none min-h-[500px] p-8 text-[var(--chat-text-secondary)] " +
                    "[&>h1]:text-3xl [&>h1]:font-bold [&>h1]:text-[var(--chat-text-primary)] [&>h1]:mb-6 " +
                    "[&>h2]:text-2xl [&>h2]:font-bold [&>h2]:text-[var(--chat-text-primary)] [&>h2]:mt-8 [&>h2]:mb-4 " +
                    "[&>h3]:text-xl [&>h3]:font-bold [&>h3]:text-[var(--chat-text-primary)] [&>h3]:mt-6 [&>h3]:mb-3 " +
                    "[&>p]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 " +
                    "[&_table]:border-collapse [&_table]:w-full [&_td]:border [&_td]:border-[var(--chat-border)] [&_td]:p-2 " +
                    "[&_th]:border [&_th]:border-[var(--chat-border)] [&_th]:p-2 [&_th]:bg-[var(--chat-bg-secondary)] " +
                    "[&_img]:max-w-full [&_img]:rounded-lg [&_a]:text-[var(--chat-accent)] [&_a]:underline",
            },
        },
        onUpdate: ({ editor }) => {
            const json = editor.getJSON();
            const html = editor.getHTML();

            if (onChange) onChange(json);

            // Debounced autosave
            if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
            autoSaveTimerRef.current = setTimeout(() => {
                if (onAutoSave) onAutoSave(json, html);
            }, 2000);
        },
    });

    // Handle incoming content (e.g. from AI); also clear editor when content is empty (e.g. New chat)
    useEffect(() => {
        if (!editor) return;

        if (!content || (typeof content === "string" && content.trim() === "")) {
            editor.commands.setContent("", false);
            return;
        }

        // Check if content is already what's in editor to avoid loops if controlled
        if (content === editor.getHTML()) return;

        // Sanitize and set content
        const cleanHtml = DOMPurify.sanitize(content);
        editor.commands.setContent(cleanHtml, false);
    }, [editor, content]);

    const handleExportHTML = useCallback(() => {
        if (!editor) return;
        const html = editor.getHTML();
        const fullHtml = buildExportHtml(html);
        const blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
        saveAs(blob, "document.html");
    }, [editor]);

    const handleExportDocx = useCallback(() => {
        if (!editor) return;

        try {
            const html = editor.getHTML();
            const fullHtml = buildExportHtml(html);

            const blob = htmlDocx.asBlob(fullHtml);
            saveAs(blob, "document.docx");
        } catch (error) {
            console.error("DOCX export failed", error);
        }
    }, [editor]);

    const handleExportMarkdown = useCallback(() => {
        if (!editor) return;
        const html = editor.getHTML();
        const turndown = new TurndownService();
        const markdown = turndown.turndown(html);
        const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
        saveAs(blob, "document.md");
    }, [editor]);

    const handleExport = useCallback(() => {
        switch (exportFormat) {
            case "word":
                handleExportDocx();
                break;
            case "markdown":
                handleExportMarkdown();
                break;
            default:
                handleExportHTML();
        }
    }, [exportFormat, handleExportHTML, handleExportDocx, handleExportMarkdown]);

    return (
        <div className="flex flex-col h-full bg-[var(--chat-bg-primary)] overflow-hidden">
            <EditorToolbar
                editor={editor}
                exportFormat={exportFormat}
                onExport={handleExport}
            />
            <div className="flex-1 overflow-y-auto chat-scrollbar">
                <div className="max-w-4xl mx-auto min-h-full">
                    <EditorContent editor={editor} />
                </div>
            </div>
        </div>
    );
}
