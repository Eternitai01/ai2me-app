"use client";

import { useState, useEffect } from "react";
import { File, Copy, Check, Loader2, Download } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface FileNode {
  path: string;
  name: string;
  type: "file" | "directory";
  size?: number;
  content?: string | null;
}

interface FileViewerProps {
  sessionId: string;
  file: FileNode | null;
}

function getLanguageFromFileName(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase();
  
  const languageMap: Record<string, string> = {
    tsx: "tsx",
    ts: "typescript",
    jsx: "jsx",
    js: "javascript",
    json: "json",
    css: "css",
    scss: "scss",
    html: "html",
    md: "markdown",
    py: "python",
    java: "java",
    cpp: "cpp",
    c: "c",
    go: "go",
    rs: "rust",
    php: "php",
    rb: "ruby",
    sh: "bash",
    yml: "yaml",
    yaml: "yaml",
    xml: "xml",
    sql: "sql",
  };
  
  return languageMap[ext || ""] || "text";
}

export default function FileViewer({ sessionId, file }: FileViewerProps) {
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchFileContent = async () => {
      if (!file || file.type === "directory") {
        setContent(null);
        return;
      }

      // If content is already available, use it
      if (file.content !== undefined) {
        setContent(file.content);
        return;
      }

      // Otherwise, fetch it from the API
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/chat/projects/${sessionId}/files/${encodeURIComponent(file.path)}`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch file content");
        }

        const data = await response.json();
        setContent(data.content || null);
      } catch (err) {
        console.error("Error fetching file content:", err);
        setError("Failed to load file content");
        setContent(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFileContent();
  }, [file, sessionId]);

  const handleCopy = async () => {
    if (content) {
      try {
        await navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    }
  };

  const handleDownload = () => {
    if (!file || !content) return;
    
    try {
      const blob = new Blob([content], { type: "text/plain" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Failed to download file:", err);
      alert("Failed to download file. Please try again.");
    }
  };

  if (!file) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <File className="h-12 w-12 text-[var(--chat-text-muted)] mx-auto mb-3" />
          <p className="text-sm text-[var(--chat-text-secondary)]">Select a file to view</p>
          <p className="text-xs text-[var(--chat-text-muted)] mt-1">
            Click on any file in the explorer to see its contents
          </p>
        </div>
      </div>
    );
  }

  if (file.type === "directory") {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-sm text-[var(--chat-text-secondary)]">
            Cannot display directory contents
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 text-[var(--chat-accent)] animate-spin" />
          <p className="text-sm text-[var(--chat-text-secondary)]">Loading file...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="text-center">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-sm text-[var(--chat-text-secondary)]">
            File content not available
          </p>
          <p className="text-xs text-[var(--chat-text-muted)] mt-1">
            This file may be binary or too large to display
          </p>
        </div>
      </div>
    );
  }

  const language = getLanguageFromFileName(file.name);

  return (
    <div className="h-full flex flex-col">
      {/* File Header */}
      <div className="px-4 py-3 border-b border-[var(--chat-border)] flex items-center justify-between bg-[var(--chat-bg-secondary)]">
        <div className="flex items-center gap-2 min-w-0">
          <File className="h-4 w-4 text-[var(--chat-accent)] shrink-0" />
          <span className="text-sm font-medium text-[var(--chat-text-primary)] truncate">
            {file.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-[var(--chat-text-secondary)] hover:text-[var(--chat-text-primary)] hover:bg-[var(--chat-bg-tertiary)] rounded-md transition-colors"
            title="Download file"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-[var(--chat-text-secondary)] hover:text-[var(--chat-text-primary)] hover:bg-[var(--chat-bg-tertiary)] rounded-md transition-colors"
            title="Copy to clipboard"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy
              </>
            )}
          </button>
        </div>
      </div>

      {/* File Content */}
      <div className="flex-1 overflow-auto chat-scrollbar">
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: "1rem",
            background: "var(--chat-bg-primary)",
            fontSize: "0.875rem",
            lineHeight: "1.5",
          }}
          showLineNumbers
          wrapLines
        >
          {content}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
