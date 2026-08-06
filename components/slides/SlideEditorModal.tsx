"use client";

import { useState } from "react";
import { X, Save, Eye, Type, Code2 } from "lucide-react";
import { toast } from "sonner";

import {
    extractTextFields,
    applyTextFields,
    countChanged,
    type TextField,
} from "./slide-text";

interface Slide {
    id: string;
    slide_number: number;
    title: string;
    html_content: string;
}

interface SlideEditorModalProps {
    slide: Slide;
    onClose: () => void;
    onSave: (updatedHtml: string) => void;
}

type Mode = "text" | "html" | "preview";

export function SlideEditorModal({ slide, onClose, onSave }: SlideEditorModalProps) {
    // `html` is the source of truth. `fields` is a text-only view over it that has to be
    // committed back whenever we leave text mode or save.
    const [html, setHtml] = useState(slide.html_content);
    const [fields, setFields] = useState<TextField[]>(() =>
        extractTextFields(slide.html_content)
    );
    // Default to text: editing a headline shouldn't mean reading 8KB of minified markup.
    const [mode, setMode] = useState<Mode>("text");
    const [isSaving, setIsSaving] = useState(false);

    const changedCount = countChanged(fields);

    /** The document as it would be saved right now, with any pending text edits applied. */
    const currentHtml = (): string =>
        mode === "text" ? applyTextFields(html, fields) : html;

    const switchMode = (next: Mode) => {
        if (next === mode) return;
        if (mode === "text") {
            // Commit text edits into the document, then re-baseline the fields against it so
            // `original` matches what's now saved and the change count resets honestly.
            const merged = applyTextFields(html, fields);
            setHtml(merged);
            setFields(extractTextFields(merged));
        } else if (next === "text") {
            // Coming back from raw HTML: re-read the fields, the document may have changed.
            setFields(extractTextFields(html));
        }
        setMode(next);
    };

    const updateField = (index: number, value: string) => {
        setFields((prev) =>
            prev.map((f) => (f.index === index ? { ...f, value } : f))
        );
    };

    const handleSave = async () => {
        const finalHtml = currentHtml();
        setIsSaving(true);
        try {
            const response = await fetch(`/api/ai/slides/${slide.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ html_content: finalHtml }),
            });

            if (response.ok) {
                onSave(finalHtml);
                toast.success("Slide updated successfully");
                onClose();
            } else {
                toast.error("Failed to save slide");
            }
        } catch {
            toast.error("Error saving slide");
        } finally {
            setIsSaving(false);
        }
    };

    const tabs: { id: Mode; label: string; icon: typeof Type }[] = [
        { id: "text", label: "Text", icon: Type },
        { id: "html", label: "HTML", icon: Code2 },
        { id: "preview", label: "Preview", icon: Eye },
    ];

    return (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                <header className="px-6 py-4 border-b border-gray-200 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 bg-orange-100 rounded-lg shrink-0">
                            <Save className="w-5 h-5 text-orange-600" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-lg font-bold text-gray-900 border-none truncate">
                                Edit Slide {slide.slide_number}
                            </h2>
                            <p className="text-sm text-gray-500 truncate">{slide.title}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
                            {tabs.map(({ id, label, icon: Icon }) => (
                                <button
                                    key={id}
                                    onClick={() => switchMode(id)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${mode === id
                                        ? "bg-white text-gray-900 shadow-sm"
                                        : "text-gray-500 hover:text-gray-700"
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {label}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-all shadow-md active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            <Save className="w-4 h-4" />
                            {isSaving ? "Saving…" : "Save Changes"}
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors ml-1"
                        >
                            <X className="w-6 h-6 text-gray-400" />
                        </button>
                    </div>
                </header>

                <main className="flex-1 flex overflow-hidden bg-gray-50">
                    {mode === "text" && (
                        <div className="flex-1 overflow-y-auto p-6">
                            {fields.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center gap-2">
                                    <p className="text-gray-700 font-semibold">
                                        No editable text found
                                    </p>
                                    <p className="text-sm text-gray-500 max-w-sm">
                                        This slide&apos;s content may be drawn with images or CSS.
                                        Switch to HTML to edit it directly.
                                    </p>
                                </div>
                            ) : (
                                <div className="max-w-3xl mx-auto flex flex-col gap-4">
                                    <p className="text-xs text-gray-500">
                                        Editing text only — colours, layout and styling are preserved.
                                    </p>
                                    {fields.map((field) => {
                                        const isChanged = field.value !== field.original;
                                        const isLong = field.original.length > 60;
                                        return (
                                            <label
                                                key={field.index}
                                                className="flex flex-col gap-1.5"
                                            >
                                                <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                                                    {field.label}
                                                    {isChanged && (
                                                        <span className="normal-case tracking-normal font-medium text-orange-600">
                                                            edited
                                                        </span>
                                                    )}
                                                </span>
                                                {isLong ? (
                                                    <textarea
                                                        value={field.value}
                                                        onChange={(e) =>
                                                            updateField(field.index, e.target.value)
                                                        }
                                                        rows={3}
                                                        className={`w-full px-3 py-2 rounded-lg border bg-white text-sm text-gray-900 resize-y focus:outline-none focus:ring-2 focus:ring-orange-400 ${isChanged ? "border-orange-400" : "border-gray-200"
                                                            }`}
                                                    />
                                                ) : (
                                                    <input
                                                        type="text"
                                                        value={field.value}
                                                        onChange={(e) =>
                                                            updateField(field.index, e.target.value)
                                                        }
                                                        className={`w-full px-3 py-2 rounded-lg border bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400 ${isChanged ? "border-orange-400" : "border-gray-200"
                                                            }`}
                                                    />
                                                )}
                                            </label>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {mode === "html" && (
                        <div className="flex-1 flex flex-col min-w-0">
                            <textarea
                                value={html}
                                onChange={(e) => setHtml(e.target.value)}
                                className="flex-1 p-6 font-mono text-sm bg-gray-900 text-gray-300 focus:outline-none resize-none"
                                spellCheck={false}
                            />
                        </div>
                    )}

                    {mode === "preview" && (
                        <div className="flex-1 bg-gray-100 p-8 flex items-center justify-center overflow-auto">
                            <div
                                className="bg-white shadow-xl shrink-0"
                                style={{
                                    width: "1280px",
                                    height: "720px",
                                    transform: "scale(0.6)",
                                    transformOrigin: "center",
                                }}
                            >
                                <iframe
                                    srcDoc={html}
                                    title={`Preview of slide ${slide.slide_number}`}
                                    // srcDoc inherits the parent origin, so unsandboxed preview of
                                    // arbitrary edited HTML runs with full access to this app. See
                                    // SlideViewer for the full rationale. Never add allow-same-origin.
                                    sandbox="allow-scripts"
                                    className="w-full h-full border-none"
                                />
                            </div>
                        </div>
                    )}
                </main>

                <footer className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center shrink-0">
                    <p className="text-xs text-gray-400">
                        {mode === "text"
                            ? "Tip: edit the text below — styling stays exactly as it is."
                            : "Tip: You can use Tailwind classes directly in the HTML."}
                    </p>
                    <p className="text-xs font-mono text-gray-400">
                        {mode === "text"
                            ? `${fields.length} text field${fields.length === 1 ? "" : "s"}${changedCount ? ` · ${changedCount} edited` : ""}`
                            : `${html.length} characters`}
                    </p>
                </footer>
            </div>
        </div>
    );
}
