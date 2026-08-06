"use client";

import { useState, useEffect } from "react";
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, Loader2, Download } from "lucide-react";

interface FileNode {
  path: string;
  name: string;
  type: "file" | "directory";
  size?: number;
  content?: string | null;
  children?: FileNode[];
}

interface FileExplorerProps {
  sessionId: string;
  onFileSelect?: (file: FileNode) => void;
}

function getFileIcon(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase();
  const iconClass = "h-4 w-4";
  
  switch (ext) {
    case "tsx":
    case "ts":
    case "jsx":
    case "js":
      return <File className={`${iconClass} text-blue-400`} />;
    case "json":
      return <File className={`${iconClass} text-yellow-400`} />;
    case "css":
    case "scss":
      return <File className={`${iconClass} text-pink-400`} />;
    case "html":
      return <File className={`${iconClass} text-orange-400`} />;
    case "md":
      return <File className={`${iconClass} text-gray-400`} />;
    default:
      return <File className={`${iconClass} text-[var(--chat-text-muted)]`} />;
  }
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileTreeNode({
  node,
  level = 0,
  onFileSelect,
  sessionId,
}: {
  node: FileNode;
  level?: number;
  onFileSelect?: (file: FileNode) => void;
  sessionId: string;
}) {
  const [isExpanded, setIsExpanded] = useState(level === 0);
  const [isDownloadingFile, setIsDownloadingFile] = useState(false);

  const handleClick = () => {
    if (node.type === "directory") {
      setIsExpanded(!isExpanded);
    } else {
      onFileSelect?.(node);
    }
  };

  const handleDownloadFile = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.type !== "file") return;

    setIsDownloadingFile(true);
    try {
      const response = await fetch(`/api/chat/projects/${sessionId}/files/${encodeURIComponent(node.path)}`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch file");
      }

      const data = await response.json();
      const content = data.content || node.content || "";
      
      const blob = new Blob([content], { type: "text/plain" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = node.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Failed to download file:", err);
      alert("Failed to download file. Please try again.");
    } finally {
      setIsDownloadingFile(false);
    }
  };

  return (
    <div>
      <div
        className={`group flex items-center gap-2 px-2 py-1.5 hover:bg-[var(--chat-bg-tertiary)] cursor-pointer rounded-md transition-colors ${
          node.type === "file" ? "hover:bg-[var(--chat-bg-secondary)]" : ""
        }`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={handleClick}
      >
        {node.type === "directory" ? (
          <>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-[var(--chat-text-muted)] shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 text-[var(--chat-text-muted)] shrink-0" />
            )}
            {isExpanded ? (
              <FolderOpen className="h-4 w-4 text-[var(--chat-accent)] shrink-0" />
            ) : (
              <Folder className="h-4 w-4 text-[var(--chat-accent)] shrink-0" />
            )}
          </>
        ) : (
          <>
            <span className="w-4" />
            {getFileIcon(node.name)}
          </>
        )}
        <span className="text-sm text-[var(--chat-text-primary)] truncate flex-1">
          {node.name}
        </span>
        {node.type === "file" && (
          <>
            {node.size !== undefined && (
              <span className="text-xs text-[var(--chat-text-muted)] shrink-0">
                {formatFileSize(node.size)}
              </span>
            )}
            <button
              onClick={handleDownloadFile}
              disabled={isDownloadingFile}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[var(--chat-bg-primary)] rounded transition-opacity disabled:opacity-50"
              title="Download file"
            >
              {isDownloadingFile ? (
                <Loader2 className="h-3.5 w-3.5 text-[var(--chat-accent)] animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5 text-[var(--chat-accent)]" />
              )}
            </button>
          </>
        )}
      </div>
      {node.type === "directory" && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeNode
              key={child.path}
              node={child}
              level={level + 1}
              onFileSelect={onFileSelect}
              sessionId={sessionId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FileExplorer({ sessionId, onFileSelect }: FileExplorerProps) {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    
    const fetchFiles = async () => {
      if (isCancelled) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/chat/projects/${sessionId}/files?format=tree`, {
          method: "GET",
          credentials: "include",
        });

        if (isCancelled) return;

        if (!response.ok) {
          throw new Error("Failed to fetch project files");
        }

        const data = await response.json();
        
        if (!isCancelled) {
          setFiles(data.files || []);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error("Error fetching project files:", err);
          setError("Failed to load project files");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    if (sessionId) {
      fetchFiles();
    }
    
    return () => {
      isCancelled = true;
    };
  }, [sessionId]);

  const handleDownloadProject = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(`/api/chat/projects/${sessionId}/download`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to download project");
      }

      // Get the blob and create a download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `project-${sessionId}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Error downloading project:", err);
      alert("Failed to download project. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 text-[var(--chat-accent)] animate-spin" />
          <p className="text-sm text-[var(--chat-text-secondary)]">Loading files...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="text-center">
          <p className="text-sm text-red-500">{error}</p>
          <p className="text-xs text-[var(--chat-text-muted)] mt-2">
            Project files may not be available yet
          </p>
        </div>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="text-center">
          <Folder className="h-12 w-12 text-[var(--chat-text-muted)] mx-auto mb-3" />
          <p className="text-sm text-[var(--chat-text-secondary)]">No files found</p>
          <p className="text-xs text-[var(--chat-text-muted)] mt-1">
            Files will appear here once the project is generated
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-2 chat-scrollbar">
        {files.map((node) => (
          <FileTreeNode key={node.path} node={node} onFileSelect={onFileSelect} sessionId={sessionId} />
        ))}
      </div>
      
      {/* Download Project Button */}
      <div className="p-3 border-t border-[var(--chat-border)] bg-[var(--chat-bg-secondary)]">
        <button
          onClick={handleDownloadProject}
          disabled={isDownloading || files.length === 0}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--chat-accent)] hover:bg-[var(--chat-accent)]/90 text-white rounded-lg font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[var(--chat-accent)]"
        >
          {isDownloading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Downloading...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Download Project as ZIP
            </>
          )}
        </button>
      </div>
    </div>
  );
}
