"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink, Globe } from "lucide-react";

const BE_URL = process.env.NEXT_PUBLIC_BE_SERVICE_URL || "https://eu.be.ai2me.com";

export default function WebPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const serveUrl = `${BE_URL}/v1/agent/tools/website/${id}`;

  return (
    <div className="flex flex-col h-screen bg-black">
      {/* Minimal top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/80 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>
          <div className="h-4 w-px bg-white/20" />
          <div className="flex items-center gap-1.5 text-white/80">
            <Globe size={14} className="text-blue-400" />
            <span className="text-sm font-medium">Website Preview</span>
          </div>
        </div>
        <a
          href={serveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          <ExternalLink size={14} />
          <span>Open full screen</span>
        </a>
      </div>

      {/* Full-height iframe */}
      <div className="flex-1 relative">
        <iframe
          src={serveUrl}
          className="w-full h-full border-0"
          title="Website Preview"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        />
      </div>
    </div>
  );
}
