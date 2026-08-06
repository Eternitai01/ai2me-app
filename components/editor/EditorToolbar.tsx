"use client";

import { Editor } from "@tiptap/react";
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    List,
    ListOrdered,
    Heading1,
    Heading2,
    Heading3,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    Image as ImageIcon,
    Link as LinkIcon,
    Undo,
    Redo,
    Table as TableIcon,
    Eraser,
    Download,
} from "lucide-react";

const EXPORT_LABELS: Record<"web_doc" | "word" | "markdown", string> = {
    web_doc: "HTML",
    word: "DOCX",
    markdown: "Markdown",
};

interface EditorToolbarProps {
    editor: Editor | null;
    exportFormat?: "web_doc" | "word" | "markdown";
    onExport?: () => void;
    onExportHTML?: () => void;
    onExportDocx?: () => void;
}

export function EditorToolbar({
    editor,
    exportFormat = "web_doc",
    onExport,
    onExportHTML,
    onExportDocx,
}: EditorToolbarProps) {
    if (!editor) return null;

    const addImage = () => {
        const url = window.prompt("Enter image URL");
        if (url) {
            editor.chain().focus().setImage({ src: url }).run();
        }
    };

    const setLink = () => {
        const previousUrl = editor.getAttributes("link").href;
        const url = window.prompt("Enter URL", previousUrl);

        if (url === null) return;
        if (url === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    };

    return (
        <div className="flex flex-wrap items-center gap-1 p-2 border-b border-[var(--chat-border)] bg-[var(--chat-bg-primary)] sticky top-0 z-10">
            <div className="flex items-center gap-0.5 border-r border-[var(--chat-border)] pr-1 mr-1">
                <button
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                    className="p-1.5 rounded hover:bg-[var(--chat-bg-secondary)] disabled:opacity-30 transition-colors"
                    title="Undo"
                >
                    <Undo className="w-4 h-4" />
                </button>
                <button
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                    className="p-1.5 rounded hover:bg-[var(--chat-bg-secondary)] disabled:opacity-30 transition-colors"
                    title="Redo"
                >
                    <Redo className="w-4 h-4" />
                </button>
            </div>

            <div className="flex items-center gap-0.5 border-r border-[var(--chat-border)] pr-1 mr-1">
                <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    className={`p-1.5 rounded transition-colors ${editor.isActive("heading", { level: 1 }) ? "bg-[var(--chat-accent)] text-white" : "hover:bg-[var(--chat-bg-secondary)]"
                        }`}
                    title="Heading 1"
                >
                    <Heading1 className="w-4 h-4" />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={`p-1.5 rounded transition-colors ${editor.isActive("heading", { level: 2 }) ? "bg-[var(--chat-accent)] text-white" : "hover:bg-[var(--chat-bg-secondary)]"
                        }`}
                    title="Heading 2"
                >
                    <Heading2 className="w-4 h-4" />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    className={`p-1.5 rounded transition-colors ${editor.isActive("heading", { level: 3 }) ? "bg-[var(--chat-accent)] text-white" : "hover:bg-[var(--chat-bg-secondary)]"
                        }`}
                    title="Heading 3"
                >
                    <Heading3 className="w-4 h-4" />
                </button>
            </div>

            <div className="flex items-center gap-0.5 border-r border-[var(--chat-border)] pr-1 mr-1">
                <button
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`p-1.5 rounded transition-colors ${editor.isActive("bold") ? "bg-[var(--chat-accent)] text-white" : "hover:bg-[var(--chat-bg-secondary)]"
                        }`}
                    title="Bold"
                >
                    <Bold className="w-4 h-4" />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`p-1.5 rounded transition-colors ${editor.isActive("italic") ? "bg-[var(--chat-accent)] text-white" : "hover:bg-[var(--chat-bg-secondary)]"
                        }`}
                    title="Italic"
                >
                    <Italic className="w-4 h-4" />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    className={`p-1.5 rounded transition-colors ${editor.isActive("underline") ? "bg-[var(--chat-accent)] text-white" : "hover:bg-[var(--chat-bg-secondary)]"
                        }`}
                    title="Underline"
                >
                    <UnderlineIcon className="w-4 h-4" />
                </button>
            </div>

            <div className="flex items-center gap-0.5 border-r border-[var(--chat-border)] pr-1 mr-1">
                <button
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={`p-1.5 rounded transition-colors ${editor.isActive("bulletList") ? "bg-[var(--chat-accent)] text-white" : "hover:bg-[var(--chat-bg-secondary)]"
                        }`}
                    title="Bullet List"
                >
                    <List className="w-4 h-4" />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={`p-1.5 rounded transition-colors ${editor.isActive("orderedList") ? "bg-[var(--chat-accent)] text-white" : "hover:bg-[var(--chat-bg-secondary)]"
                        }`}
                    title="Ordered List"
                >
                    <ListOrdered className="w-4 h-4" />
                </button>
            </div>

            <div className="flex items-center gap-0.5 border-r border-[var(--chat-border)] pr-1 mr-1">
                <button
                    onClick={() => editor.chain().focus().setTextAlign("left").run()}
                    className={`p-1.5 rounded transition-colors ${editor.isActive({ textAlign: "left" }) ? "bg-[var(--chat-accent)] text-white" : "hover:bg-[var(--chat-bg-secondary)]"
                        }`}
                    title="Align Left"
                >
                    <AlignLeft className="w-4 h-4" />
                </button>
                <button
                    onClick={() => editor.chain().focus().setTextAlign("center").run()}
                    className={`p-1.5 rounded transition-colors ${editor.isActive({ textAlign: "center" }) ? "bg-[var(--chat-accent)] text-white" : "hover:bg-[var(--chat-bg-secondary)]"
                        }`}
                    title="Align Center"
                >
                    <AlignCenter className="w-4 h-4" />
                </button>
                <button
                    onClick={() => editor.chain().focus().setTextAlign("right").run()}
                    className={`p-1.5 rounded transition-colors ${editor.isActive({ textAlign: "right" }) ? "bg-[var(--chat-accent)] text-white" : "hover:bg-[var(--chat-bg-secondary)]"
                        }`}
                    title="Align Right"
                >
                    <AlignRight className="w-4 h-4" />
                </button>
                <button
                    onClick={() => editor.chain().focus().setTextAlign("justify").run()}
                    className={`p-1.5 rounded transition-colors ${editor.isActive({ textAlign: "justify" }) ? "bg-[var(--chat-accent)] text-white" : "hover:bg-[var(--chat-bg-secondary)]"
                        }`}
                    title="Align Justify"
                >
                    <AlignJustify className="w-4 h-4" />
                </button>
            </div>

            <div className="flex items-center gap-0.5 border-r border-[var(--chat-border)] pr-1 mr-1">
                <button
                    onClick={setLink}
                    className={`p-1.5 rounded transition-colors ${editor.isActive("link") ? "bg-[var(--chat-accent)] text-white" : "hover:bg-[var(--chat-bg-secondary)]"
                        }`}
                    title="Add Link"
                >
                    <LinkIcon className="w-4 h-4" />
                </button>
                <button
                    onClick={addImage}
                    className="p-1.5 rounded hover:bg-[var(--chat-bg-secondary)] transition-colors"
                    title="Add Image"
                >
                    <ImageIcon className="w-4 h-4" />
                </button>
                <button
                    onClick={() =>
                        editor
                            .chain()
                            .focus()
                            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                            .run()
                    }
                    className="p-1.5 rounded hover:bg-[var(--chat-bg-secondary)] transition-colors"
                    title="Insert Table"
                >
                    <TableIcon className="w-4 h-4" />
                </button>
            </div>

            <div className="flex items-center gap-0.5 ml-auto">
                <button
                    onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
                    className="p-1.5 rounded hover:bg-[var(--chat-bg-secondary)] transition-colors"
                    title="Clear Format"
                >
                    <Eraser className="w-4 h-4" />
                </button>
                {(onExport || onExportHTML || onExportDocx) && (
                    <button
                        onClick={onExport ?? (exportFormat === "word" ? onExportDocx : onExportHTML)}
                        className="p-1.5 rounded hover:bg-[var(--chat-bg-secondary)] transition-colors text-xs font-medium flex items-center gap-1"
                        title={`Export ${EXPORT_LABELS[exportFormat]}`}
                    >
                        <Download className="w-4 h-4" />
                        {EXPORT_LABELS[exportFormat]}
                    </button>
                )}
            </div>
        </div>
    );
}
