"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {

  WelcomeScreen,
  ChatInput,
  DEFAULT_IMAGE_MODEL_ID,
  type ImageRatio,
  NavSidebar,
  MinimalHeader,
  MENU_AGENTS,
} from "@/components/chat";
import {
  getVideoPlatformByValue,
  DEFAULT_VIDEO_PLATFORM_VALUE,
} from "@/constants/videoData";
import { useAuth } from "@/context/AuthContext";
import "@/styles/chat-theme.css";
import { toast } from "sonner";
import DotsLoadingAnimation from "@/components/ui/DotsLoadingAnimation";
import ImageSizeSelector, { getDefaultSize, getSizesForModel, type SizeOption } from "@/components/chat/ImageSizeSelector";

import "@/styles/chat-provider-themes.css";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

type MediaMode = "image" | "video";

type MediaImageItem = {
  id: string;
  url?: string;
  imageUrls?: string[] | string;
  name?: string;
  createdAt?: string;
};

type MediaVideoItem = {
  id: string;
  url?: string;
  videoUrls?: string[] | string;
  name?: string;
  thumbnailUrl?: string;
  createdAt?: string;
};

function getImageDisplayUrl(item: MediaImageItem): string | null {
  if (item.url) return item.url;
  const urls = item.imageUrls;
  if (Array.isArray(urls) && urls[0]) return urls[0];
  if (typeof urls === "string") return urls;
  return null;
}

function getVideoDisplayUrl(item: MediaVideoItem): string | null {
  if (item.url) return item.url;
  const urls = item.videoUrls;
  if (Array.isArray(urls) && urls[0]) return urls[0];
  if (typeof urls === "string") return urls;
  return null;
}

function FilmPerforations({ position }: { position: string }) {
  return (
    <div
      className={`absolute left-0 right-0 ${position} flex justify-around pointer-events-none z-10`}
    >
      {Array.from({ length: 24 }).map((_, i) => (
        <div
          key={i}
          className="w-2 h-2 rounded-sm border border-[var(--chat-border)] opacity-60"
          style={{
            background: "var(--chat-bg-primary)",
            boxShadow: "inset 0 0 2px rgba(0,0,0,0.5)",
          }}
        />
      ))}
    </div>
  );
}

export default function MediaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();


  
  const { user, signOut, loading: authLoading } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [sidebarOpen] = useState(true);

  // Login/signup redirect: allow media page without auth
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/landing");
      return;
    }
  }, [authLoading, user, router]);

  // Fetch which image models have API keys configured
  useEffect(() => {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    fetch(`${base}/api/generate-image/available-models`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d?.available)) setAvailableImageModels(d.available);
      })
      .catch(() => {/* silently ignore — generation will surface the error */});
  }, []);
  
  const [mode, setMode] = useState<MediaMode>("image");
  const [selectedImageModelId, setSelectedImageModelId] = useState(DEFAULT_IMAGE_MODEL_ID);
  const [selectedSize, setSelectedSize] = useState<SizeOption>(() => getDefaultSize(DEFAULT_IMAGE_MODEL_ID));
  const [availableImageModels, setAvailableImageModels] = useState<string[]>([]);
  const [referenceUrl, setReferenceUrl] = useState<string | null>(null);
  const [referenceUploading, setReferenceUploading] = useState(false);
  const referenceInputRef = useRef<HTMLInputElement>(null);
  // Video reference images (up to 3)
  const [videoRefImages, setVideoRefImages] = useState<string[]>([]);
  const [videoRefUploading, setVideoRefUploading] = useState(false);
  const videoRefInputRef = useRef<HTMLInputElement>(null);
  const [selectedVideoPlatform, setSelectedVideoPlatform] = useState(DEFAULT_VIDEO_PLATFORM_VALUE);
  const [imageRatio, setImageRatio] = useState<ImageRatio>({
    label: "1:1",
    width: 1024,
    height: 1024,
  });
  const [videoOptions, setVideoOptions] = useState(() =>
    getVideoPlatformByValue(DEFAULT_VIDEO_PLATFORM_VALUE) ?? null
  );

  const [imageResults, setImageResults] = useState<string[]>([]);
  const [videoResults, setVideoResults] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResultContainer, setShowResultContainer] = useState(false);
  const [listImages, setListImages] = useState<MediaImageItem[]>([]);
  const [listVideos, setListVideos] = useState<MediaVideoItem[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [errorImages, setErrorImages] = useState<string | null>(null);
  const [errorVideos, setErrorVideos] = useState<string | null>(null);
  const [imagesVisible, setImagesVisible] = useState(12);
  const [videosVisible, setVideosVisible] = useState(12);
  const [imageColumns, setImageColumns] = useState(9);
  const [videoColumns, setVideoColumns] = useState(6);
  const [imageModalUrl, setImageModalUrl] = useState<string | null>(null);

  const IMAGE_COL_MIN = 6;
  const IMAGE_COL_MAX = 12;
  const VIDEO_COL_MIN = 4;
  const VIDEO_COL_MAX = 8;
  const LOAD_MORE_STEP = 12;

  const [device, setDevice] = useState<"mobile" | "tablet" | "desktop">("desktop");
  useEffect(() => {
    const w = window.innerWidth;
    const next = w < 768 ? "mobile" : w < 1024 ? "tablet" : "desktop";
    setDevice(next);
    const onResize = () => {
      const ww = window.innerWidth;
      setDevice(ww < 768 ? "mobile" : ww < 1024 ? "tablet" : "desktop");
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const imageColMin = device === "mobile" ? 2 : device === "tablet" ? 5 : IMAGE_COL_MIN;
  const imageColMax = device === "mobile" ? 4 : device === "tablet" ? 7 : IMAGE_COL_MAX;
  const videoColMin = device === "mobile" ? 2 : device === "tablet" ? 5 : VIDEO_COL_MIN;
  const videoColMax = device === "mobile" ? 4 : device === "tablet" ? 7 : VIDEO_COL_MAX;

  useEffect(() => {
    if (!user) return;
    const base = typeof window !== "undefined" ? window.location.origin : "";
    setLoadingImages(true);
    setErrorImages(null);
    fetch(`${base}/api/media/images`, { credentials: "include" })
      .then((r) => r.json())
      .then((body: { success?: boolean; data?: MediaImageItem[] }) => {
        if (body.success && Array.isArray(body.data)) setListImages(body.data);
        else setErrorImages((body as { message?: string })?.message ?? "Failed to load images");
      })
      .catch((e) => {
        setErrorImages((e as Error)?.message ?? "Failed to load images");
      })
      .finally(() => setLoadingImages(false));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const base = typeof window !== "undefined" ? window.location.origin : "";
    setLoadingVideos(true);
    setErrorVideos(null);
    fetch(`${base}/api/media/videos`, { credentials: "include" })
      .then((r) => r.json())
      .then((body: { success?: boolean; data?: MediaVideoItem[] }) => {
        if (body.success && Array.isArray(body.data)) setListVideos(body.data);
        else setErrorVideos((body as { message?: string })?.message ?? "Failed to load videos");
      })
      .catch((e) => {
        setErrorVideos((e as Error)?.message ?? "Failed to load videos");
      })
      .finally(() => setLoadingVideos(false));
  }, [user]);

  useEffect(() => {
    const m = searchParams.get("mode");
    if (m === "video" || m === "image") setMode(m);
  }, [searchParams]);

  useEffect(() => {
    setImageColumns((c) => Math.min(imageColMax, Math.max(imageColMin, c)));
    setVideoColumns((c) => Math.min(videoColMax, Math.max(videoColMin, c)));
  }, [imageColMin, imageColMax, videoColMin, videoColMax]);

  const handleNewChat = () => router.replace("/chat/media");
  const handleAgentAction = (agentName: string) => {
    if (agentName === "Web Builder") {
      router.push("/project/new");
            return;
        }
        if (agentName === "App Builder") {
            router.push("/ai-builder");
      return;
    }
    if (agentName === "AI Chat") {
      router.push("/ai-chat");
      return;
    }
    if (agentName === "AI Sheets") {
      router.push("/ai-sheets?new=" + Date.now());
      return;
    }
    if (agentName === "AI Docs") {
      router.push("/ai-docs?new=" + Date.now());
      return;
    }
    if (agentName === "AI Slides") {
      router.push("/ai-slides?new=" + Date.now());
      return;
    }
    if (agentName === "AI Image") {
      router.push("/chat/media?mode=image");
      return;
    }
    if (agentName === "AI Video") {
      router.push("/chat/media?mode=video");
      return;
    }
    router.replace("/chat/media");
  };
  const handleSignOut = async () => {
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.add("light");
    localStorage.removeItem("chat-theme");
    await signOut();
    router.push("/");
  };

  const handleReferenceUpload = async (file: File) => {
    setReferenceUploading(true);
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch("/api/upload-reference", {
        method: "POST",
        body: form,
        credentials: "include",
      });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        toast.error(data.error ?? "Reference upload failed");
        return;
      }
      setReferenceUrl(data.url);
    } catch (err) {
      toast.error((err as Error)?.message ?? "Reference upload failed");
    } finally {
      setReferenceUploading(false);
    }
  };

  const handleSend = async (message: string) => {
    if (!message.trim()) return;
    setShowResultContainer(true);
    setIsGenerating(true);
    const base = typeof window !== "undefined" ? window.location.origin : "";
    try {
      if (mode === "image") {
        const modelToUse = referenceUrl ? "StructureControl" : selectedImageModelId;
        // Validate model is available before attempting generation
        if (availableImageModels.length > 0 && !availableImageModels.includes(modelToUse)) {
          toast.error(`${modelToUse} is not available — API key not configured. Switching to Flux Advanced.`);
          setSelectedImageModelId("Flux Advanced");
          setIsGenerating(false);
          return;
        }
        const res = await fetch(`${base}/api/generate-image`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: message.trim(),
            model_id: modelToUse,
            width: selectedSize.width,
            height: selectedSize.height,
            width: imageRatio.width,
            height: imageRatio.height,
            ...(referenceUrl ? { uploadedImageURL: referenceUrl } : {}),
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          const msg = (data?.detail ?? data?.message ?? data?.error ?? "Image generation failed") as string;
          toast.error(msg);
          return;
        }
        const urls = (data?.images_links ?? []) as string[];
        setImageResults(urls);
        fetch(`${base}/api/media/images`, { credentials: "include" })
          .then((r) => r.json())
          .then((body: { success?: boolean; data?: MediaImageItem[] }) => {
            if (body.success && Array.isArray(body.data)) setListImages(body.data);
          })
          .catch(() => {});
        return;
      }
      if (mode === "video") {
        const modelKey = (selectedVideoPlatform || "").toLowerCase().replace(/\s+/g, "");
        const payload: Record<string, unknown> = {
          prompt: message.trim(),
          model: modelKey,
          selectedModel: videoOptions?.selectedModel ?? undefined,
          selectedResolution: videoOptions?.selectedResolution ?? undefined,
          selectedDuration: videoOptions?.selectedDuration ?? undefined,
          selectedSize: videoOptions?.selectedSize ?? undefined,
          selectedSecond: videoOptions?.selectedSecond ?? undefined,
          negativePrompt: videoOptions?.negativePrompt ?? undefined,
          aspectRatio: videoOptions?.selectedAspectRatio ?? videoOptions?.aspectRatio ?? undefined,
          referenceImage: videoRefImages[0] ?? videoOptions?.referenceImage ?? undefined,
          referenceImages: videoRefImages.length > 0 ? videoRefImages : undefined,
          seed: videoOptions?.seed ?? undefined,
          selectedPersonGeneration: videoOptions?.selectedPersonGeneration ?? undefined,
        };
        const res = await fetch(`${base}/api/generate-video`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "include",
          cache: "no-cache",
        });
        const text = await res.text();
        let data: Record<string, unknown> = {};
        try {
          data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
        } catch {
          // Non-JSON response — likely a gateway timeout (504) during long video generation
          if (res.status === 504 || res.status === 502 || res.status === 503) {
            toast.error("Video generation is taking longer than expected. Please try again in a moment.");
          } else {
            toast.error(`Server error (${res.status}). Please try again.`);
          }
          return;
        }
        if (!res.ok) {
          const msg = (data?.error ?? data?.detail ?? data?.message ?? "Video generation failed") as string;
          toast.error(msg);
          return;
        }
        const urls = (data?.video_links ?? []) as string[];
        setVideoResults(Array.isArray(urls) ? urls : []);
        fetch(`${base}/api/media/videos`, { credentials: "include" })
          .then((r) => r.json())
          .then((body: { success?: boolean; data?: MediaVideoItem[] }) => {
            if (body.success && Array.isArray(body.data)) setListVideos(body.data);
          })
          .catch(() => {});
      }
    } catch (err) {
      console.error(mode === "image" ? "Generate image error:" : "Generate video error:", err);
      toast.error((err as Error)?.message ?? "Request failed");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-screen flex bg-[var(--chat-bg-primary)]">
      <NavSidebar
        user={user}
        userMenuOpen={userMenuOpen}
        setUserMenuOpen={setUserMenuOpen}
        handleSignOut={handleSignOut}
        router={router}
        handleNewChat={handleNewChat}
        handleAgentAction={handleAgentAction}
        menuAgents={MENU_AGENTS}
      />
      <div className="lg:pl-20 flex w-full min-w-0 overflow-x-hidden">
        <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
          <MinimalHeader
            sidebarOpen={sidebarOpen}
            onOpenSidebar={() => {}}
          />
          <div className="flex-1 flex flex-col min-h-0 overflow-x-hidden">
            <div className="flex-1 flex flex-col items-center justify-center px-3 sm:px-4 pb-28 sm:pb-32 md:pb-20">
              <div className="w-full max-w-3xl mx-auto mt-2 sm:mt-4">
                <WelcomeScreen
                  userName={user?.full_name}
                  provider={mode === "image" ? "image" : "video"}
                />

                {/* ── Images / Videos toggle — ABOVE prompt box ── */}
                <div className="flex justify-center mt-4 mb-3">
                  <div
                    className="inline-flex rounded-lg sm:rounded-xl overflow-hidden bg-[var(--chat-bg-secondary)] border border-[var(--chat-border)]"
                    role="group"
                    aria-label="Media type"
                  >
                    <button
                      type="button"
                      onClick={() => { setMode("image"); router.replace("/chat/media?mode=image"); }}
                      className={`min-w-0 py-2 px-4 sm:min-w-[80px] sm:py-2.5 sm:px-5 text-xs sm:text-sm font-medium transition-colors ${
                        mode === "image" ? "bg-[var(--chat-accent)] text-white" : "text-[var(--chat-text-primary)] hover:bg-[var(--chat-bg-hover)]"
                      }`}
                    >Images</button>
                    <button
                      type="button"
                      onClick={() => { setMode("video"); router.replace("/chat/media?mode=video"); }}
                      className={`min-w-0 py-2 px-4 sm:min-w-[80px] sm:py-2.5 sm:px-5 text-xs sm:text-sm font-medium transition-colors ${
                        mode === "video" ? "bg-[var(--chat-accent)] text-white" : "text-[var(--chat-text-primary)] hover:bg-[var(--chat-bg-hover)]"
                      }`}
                    >Videos</button>
                  </div>
                </div>

                <div className="mt-2 space-y-2">
                  <ChatInput
                    onSend={handleSend}
                    isLoading={isGenerating}
                    placeholder="Turn your imagination into visuals - describe your scene…"
                  />

                  {/* ── Reference image / PDF upload ─────────────────────── */}
                  {mode === "image" && (
                    <div className="mt-3">
                      <label className="text-xs text-gray-400 mb-1 block">
                        Reference Image <span className="text-gray-600">(optional)</span>
                      </label>
                      <div
                        onClick={() => referenceInputRef.current?.click()}
                        className="border border-dashed border-gray-600 rounded-lg p-3 cursor-pointer hover:border-purple-500 transition-colors text-center select-none"
                      >
                        {referenceUploading ? (
                          <span className="text-xs text-gray-400">Uploading…</span>
                        ) : referenceUrl ? (
                          <div className="flex items-center gap-2 justify-center">
                            <span className="text-xs text-green-400">✓ Reference loaded — StructureControl will be used</span>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setReferenceUrl(null); }}
                              className="text-xs text-red-400 hover:text-red-300"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">
                            Click to upload a reference image
                          </span>
                        )}
                      </div>
                      <input
                        ref={referenceInputRef}
                        type="file"
                        className="hidden"
                        accept="image/*,.pdf"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleReferenceUpload(f);
                          // reset so same file can be re-selected
                          e.target.value = "";
                        }}
                      />
                    </div>
                  )}

        
                </div>

                {showResultContainer && mode === "image" && (
                  <div className="mt-3 sm:mt-4 mx-auto w-full px-0 sm:px-2 md:px-4 max-w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl">
                    <div
                      className="relative rounded-xl sm:rounded-2xl md:rounded-3xl overflow-hidden min-h-[200px] min-[480px]:min-h-[260px] sm:min-h-[280px] md:min-h-[340px] lg:min-h-[400px] border border-[var(--chat-border)] transition-all duration-300"
                      style={{
                        background:
                          "linear-gradient(180deg, #0a0909 0%, #0a0909 50%, #0a0909 100%)",
                        boxShadow:
                          "0 10px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
                      }}
                    >
                      <FilmPerforations position="top-2" />
                      <div
                        className={
                          imageResults.length === 1
                            ? "relative py-3 sm:py-6 md:py-8 px-2 sm:px-4 md:px-6 flex items-center justify-center min-h-[200px] min-[480px]:min-h-[260px] sm:min-h-[340px] md:min-h-[380px] lg:min-h-[400px]"
                            : "relative py-3 sm:py-6 md:py-8 px-2 sm:px-4 md:px-6 min-h-[200px] min-[480px]:min-h-[260px] sm:min-h-[340px] md:min-h-[380px] lg:min-h-[400px] overflow-hidden grid grid-cols-1 min-[480px]:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 place-items-center"
                        }
                      >
                        {/* Dots loading animation — shown while generating, fades out when image arrives */}
                        {isGenerating && imageResults.length === 0 && (
                          <div
                            className="absolute inset-0 flex items-center justify-center transition-opacity duration-500"
                            style={{ opacity: isGenerating ? 1 : 0 }}
                          >
                            <DotsLoadingAnimation
                              loadingText="Your image will be ready soon…"
                              extraHeight
                              showBorder={false}
                            />
                          </div>
                        )}
                        {imageResults.length > 0 &&
                          imageResults.map((url) => (
                            <button
                              key={url}
                              type="button"
                              onClick={() => setImageModalUrl(url)}
                              className="w-full max-h-[180px] min-[480px]:max-h-[220px] sm:max-h-[280px] md:max-h-[320px] lg:max-h-[360px] flex items-center justify-center min-w-0 rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-[var(--chat-accent)] focus:ring-offset-2 focus:ring-offset-[var(--chat-bg-primary)]"
                            >
                              <img
                                src={url}
                                alt="Generated"
                                className="max-h-[180px] min-[480px]:max-h-[220px] sm:max-h-[280px] md:max-h-[320px] lg:max-h-[360px] max-w-full rounded-lg object-contain cursor-pointer"
                              />
                            </button>
                          ))}
                      </div>
                      <FilmPerforations position="bottom-2" />
                      <div
                        className="absolute inset-0 pointer-events-none opacity-[0.03] rounded-2xl sm:rounded-3xl"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='6.5' numOctaves='6' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {showResultContainer && mode === "video" && (
                  <div className="mt-3 sm:mt-4 mx-auto w-full px-0 sm:px-2 md:px-4 max-w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl">
                    <div
                      className="relative rounded-xl sm:rounded-2xl md:rounded-3xl overflow-hidden min-h-[200px] min-[480px]:min-h-[260px] sm:min-h-[340px] md:min-h-[380px] lg:min-h-[400px] border border-[var(--chat-border)] transition-all duration-300"
                      style={{
                        background:
                          "linear-gradient(180deg, #0a0909 0%, #0a0909 50%, #0a0909 100%)",
                        boxShadow:
                          "0 10px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
                      }}
                    >
                      <FilmPerforations position="top-2" />
                      <div className="relative py-3 sm:py-6 md:py-8 px-2 sm:px-4 md:px-6 min-h-[200px] min-[480px]:min-h-[260px] sm:min-h-[340px] md:min-h-[380px] lg:min-h-[400px] flex flex-wrap gap-2 sm:gap-3 md:gap-4 justify-center items-center">
                        {isGenerating && videoResults.length === 0 && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <DotsLoadingAnimation
                              loadingText="Your video will be ready soon…"
                              extraHeight
                              showBorder={false}
                            />
                          </div>
                        )}
                        {videoResults.length > 0 &&
                          videoResults.map((url) => (
                            <video
                              key={url}
                              src={url}
                              controls
                              className="w-full max-w-full max-h-[180px] min-[480px]:max-h-[220px] sm:max-h-[280px] md:max-h-[320px] lg:max-h-[360px] rounded-lg object-contain"
                            />
                          ))}
                      </div>
                      <FilmPerforations position="bottom-2" />
                      <div
                        className="absolute inset-0 pointer-events-none opacity-[0.03] rounded-2xl sm:rounded-3xl"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='6.5' numOctaves='6' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                        }}
                      />
                    </div>
                  </div>
                )}
                <div className="flex flex-col items-center mt-6 sm:mt-8 lg:mt-10 px-2">
                    {/* ── Image model selector (only shown in image mode) ── */}
                    {mode === "image" && (
                      <div className="flex justify-center mb-3 w-full">
                        <div className="inline-flex items-center gap-2">
                          <span className="text-xs text-[var(--chat-text-secondary)]">Model</span>
                          <select
                            value={selectedImageModelId}
                            onChange={(e) => {
                              setSelectedImageModelId(e.target.value);
                              setSelectedSize(getDefaultSize(e.target.value));
                            }}
                            className="text-xs rounded-lg px-2.5 py-1.5 bg-[var(--chat-bg-secondary)] border border-[var(--chat-border)] text-[var(--chat-text-primary)] cursor-pointer focus:outline-none focus:border-[var(--chat-accent)]"
                          >
                            {["Flux Advanced", "Flux", "Dalle-3", "EternitAI Pro", "Ideogram", "Stable diffusion", "Google"].map((m) => {
                              const isAvailable = availableImageModels.length === 0 || availableImageModels.includes(m);
                              return (
                                <option key={m} value={m} disabled={!isAvailable}>
                                  {m}{!isAvailable ? " (unavailable)" : ""}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      </div>
                    )}
                    {/* ── Size / aspect ratio selector (image mode only) ── */}
                    {mode === "image" && (
                      <div className="flex justify-center mb-4 w-full">
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-xs text-[var(--chat-text-secondary)]">Size</span>
                          <ImageSizeSelector
                            modelId={selectedImageModelId}
                            selected={selectedSize}
                            onChange={setSelectedSize}
                          />
                        </div>
                      </div>
                    )}

                    {/* ── Video controls: model / duration / resolution — single horizontal row ── */}
                    {mode === "video" && (
                      <div className="flex flex-wrap items-center justify-center gap-4 mb-4 w-full">

                        {/* Model */}
                        {(videoOptions?.models?.length ?? 0) > 1 && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-[var(--chat-text-secondary)] whitespace-nowrap">Model</span>
                            <select
                              value={videoOptions?.selectedModel ?? ""}
                              onChange={(e) => setVideoOptions((prev) => prev ? { ...prev, selectedModel: e.target.value } : prev)}
                              className="text-xs rounded-lg px-2.5 py-1.5 bg-[var(--chat-bg-secondary)] border border-[var(--chat-border)] text-[var(--chat-text-primary)] cursor-pointer focus:outline-none focus:border-[var(--chat-accent)]"
                            >
                              {videoOptions?.models?.map((m) => (
                                <option key={m.id} value={m.id}>{m.label}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Duration buttons */}
                        {(videoOptions?.durations?.length ?? 0) > 0 && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-[var(--chat-text-secondary)] whitespace-nowrap">Duration</span>
                            <div className="flex gap-1.5">
                              {videoOptions?.durations?.map((d) => (
                                <button key={d} type="button"
                                  onClick={() => setVideoOptions((prev) => prev ? { ...prev, selectedDuration: d } : prev)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                    videoOptions?.selectedDuration === d
                                      ? "border-[var(--chat-accent)] text-[var(--chat-accent)] bg-[var(--chat-accent)]/10"
                                      : "border-[var(--chat-border)] text-[var(--chat-text-secondary)] hover:border-[var(--chat-accent)]/50"
                                  }`}>{d}s</button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Resolution buttons */}
                        {(videoOptions?.resolutions?.length ?? 0) > 0 && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-[var(--chat-text-secondary)] whitespace-nowrap">Resolution</span>
                            <div className="flex gap-1.5">
                              {videoOptions?.resolutions?.map((r) => (
                                <button key={r} type="button"
                                  onClick={() => setVideoOptions((prev) => prev ? { ...prev, selectedResolution: r } : prev)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                    videoOptions?.selectedResolution === r
                                      ? "border-[var(--chat-accent)] text-[var(--chat-accent)] bg-[var(--chat-accent)]/10"
                                      : "border-[var(--chat-border)] text-[var(--chat-text-secondary)] hover:border-[var(--chat-accent)]/50"
                                  }`}>{r}</button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Reference images upload — up to 3 */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-[var(--chat-text-secondary)] whitespace-nowrap">Reference</span>
                          <div className="flex gap-1.5 flex-wrap">
                            {/* Uploaded thumbnails */}
                            {videoRefImages.map((url, idx) => (
                              <div key={idx} className="relative w-10 h-10">
                                <img src={url} alt={`ref ${idx + 1}`} className="w-10 h-10 rounded-md object-cover border border-[var(--chat-border)]" />
                                <button
                                  type="button"
                                  onClick={() => setVideoRefImages((prev) => prev.filter((_, i) => i !== idx))}
                                  className="absolute -top-1 -right-1 bg-black/80 hover:bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] leading-none"
                                >×</button>
                              </div>
                            ))}
                            {/* Add button — show while < 3 images */}
                            {videoRefImages.length < 3 && (
                              <button
                                type="button"
                                disabled={videoRefUploading}
                                onClick={() => videoRefInputRef.current?.click()}
                                className="w-10 h-10 rounded-md border border-dashed border-[var(--chat-border)] text-[var(--chat-text-secondary)] hover:border-[var(--chat-accent)] hover:text-[var(--chat-accent)] flex items-center justify-center text-lg transition-all"
                                title="Add reference image"
                              >
                                {videoRefUploading ? (
                                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                                ) : "+"}
                              </button>
                            )}
                            <input
                              ref={videoRefInputRef}
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              className="hidden"
                              onChange={async (e) => {
                                const f = e.target.files?.[0];
                                e.target.value = "";
                                if (!f) return;
                                setVideoRefUploading(true);
                                try {
                                  const fd = new FormData();
                                  fd.append("file", f);
                                  const res = await fetch(`${base}/api/generate/upload-reference`, { method: "POST", body: fd, credentials: "include" });
                                  const data = await res.json() as { url?: string; error?: string };
                                  if (!res.ok || !data.url) { toast.error(data.error ?? "Upload failed"); return; }
                                  setVideoRefImages((prev) => [...prev, data.url!].slice(0, 3));
                                } catch (err) {
                                  toast.error((err as Error)?.message ?? "Upload failed");
                                } finally {
                                  setVideoRefUploading(false);
                                }
                              }}
                            />
                          </div>
                        </div>

                      </div>
                    )}

                  </div>

                {mode === "image" && (
                  <>
                    <div className="mt-4 sm:mt-6 lg:mt-8 relative left-1/2 -translate-x-1/2 w-screen max-w-[100vw] px-0 lg:ml-[46px]">
                      {loadingImages && (
                        <div className="py-8 sm:py-12 text-center text-[var(--chat-text-secondary)] text-sm sm:text-base">Loading images…</div>
                      )}
                      {!loadingImages && errorImages && (
                        <div className="py-8 sm:py-12 text-center text-red-500 text-sm sm:text-base px-2">{errorImages}</div>
                      )}
                      {!loadingImages && !errorImages && listImages.length > 0 && (
                        <>
                          <div className="py-3 sm:py-4 flex flex-col items-center gap-1.5 sm:gap-2 border-b border-[var(--chat-border)]">
                            <span className="text-xs sm:text-sm font-medium text-[var(--chat-text-primary)]">Columns {imageColumns}</span>
                            <input
                              type="range"
                              min={imageColMin}
                              max={imageColMax}
                              value={imageColumns}
                              onChange={(e) => setImageColumns(Number(e.target.value))}
                              className="w-32 sm:w-40 md:w-48 h-1.5 sm:h-2 rounded-full appearance-none bg-[var(--chat-border)] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 sm:[&::-webkit-slider-thumb]:w-5 sm:[&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow"
                              style={{
                                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((imageColumns - imageColMin) / (imageColMax - imageColMin)) * 100}%, var(--chat-border) ${((imageColumns - imageColMin) / (imageColMax - imageColMin)) * 100}%, var(--chat-border) 100%)`,
                              }}
                            />
                          </div>
                          <div
                            className="gap-px"
                            style={{ columnCount: imageColumns, columnFill: "balance", columnGap: "1px" }}
                          >
                            {listImages.slice(0, imagesVisible).map((item) => {
                              const src = getImageDisplayUrl(item);
                              if (!src) return null;
                              return (
                                <div key={item.id} className="relative group break-inside-avoid mb-px">
                                  <button
                                    type="button"
                                    onClick={() => setImageModalUrl(src)}
                                    className="rounded-lg overflow-hidden border border-[var(--chat-border)] bg-[var(--chat-bg-secondary)] w-full text-left focus:outline-none focus:ring-2 focus:ring-[var(--chat-accent)] focus:ring-inset block"
                                  >
                                    <img
                                      src={src}
                                      alt={item.name ?? "Generated"}
                                      className="w-full h-auto object-cover block cursor-pointer"
                                      loading="lazy"
                                    />
                                  </button>
                                  {/* Delete button — appears on hover */}
                                  <button
                                    type="button"
                                    title="Delete image"
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      if (!confirm("Delete this image?")) return;
                                      try {
                                        const res = await fetch(`/api/media/images/${item.id}`, { method: "DELETE", credentials: "include" });
                                        if (!res.ok) { const d = await res.json().catch(()=>({})); toast.error(`Delete failed (${res.status}): ${(d as {message?:string;detail?:string}).message || (d as {detail?:string}).detail || res.statusText}`); return; }
                                        setListImages((prev) => prev.filter((i) => i.id !== item.id));
                                      } catch (err) { toast.error(`Delete error: ${(err as Error)?.message || String(err)}`); }
                                    }}
                                    className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 hover:bg-red-600 text-white rounded-md p-1.5"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                      {!loadingImages && !errorImages && listImages.length === 0 && (
                        <div className="py-8 sm:py-12 text-center text-[var(--chat-text-secondary)] text-sm sm:text-base px-2">No images yet. Generate some above.</div>
                      )}
                    </div>
                    {!loadingImages && !errorImages && imagesVisible < listImages.length && (
                      <div className="flex justify-center mt-4 sm:mt-6 px-3">
                        <button
                          type="button"
                          onClick={() => setImagesVisible((n) => Math.min(n + LOAD_MORE_STEP, listImages.length))}
                          className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg text-sm sm:text-base text-white font-medium bg-[var(--chat-accent)] transition-colors"
                        >
                          Load More
                        </button>
                      </div>
                    )}
                  </>
                )}

                {mode === "video" && (
                  <>
                    <div className="mt-4 sm:mt-6 lg:mt-8 relative left-1/2 -translate-x-1/2 w-screen max-w-[100vw] px-0 lg:ml-[46px]">
                      {loadingVideos && (
                        <div className="py-8 sm:py-12 text-center text-[var(--chat-text-secondary)] text-sm sm:text-base">Loading videos…</div>
                      )}
                      {!loadingVideos && errorVideos && (
                        <div className="py-8 sm:py-12 text-center text-red-500 text-sm sm:text-base px-2">{errorVideos}</div>
                      )}
                      {!loadingVideos && !errorVideos && listVideos.length > 0 && (
                        <>
                          <div className="py-3 sm:py-4 flex flex-col items-center gap-1.5 sm:gap-2 border-b border-[var(--chat-border)]">
                            <span className="text-xs sm:text-sm font-medium text-[var(--chat-text-primary)]">Columns {videoColumns}</span>
                            <input
                              type="range"
                              min={videoColMin}
                              max={videoColMax}
                              value={videoColumns}
                              onChange={(e) => setVideoColumns(Number(e.target.value))}
                              className="w-32 sm:w-40 md:w-48 h-1.5 sm:h-2 rounded-full appearance-none bg-[var(--chat-border)] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 sm:[&::-webkit-slider-thumb]:w-5 sm:[&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow"
                              style={{
                                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((videoColumns - videoColMin) / (videoColMax - videoColMin)) * 100}%, var(--chat-border) ${((videoColumns - videoColMin) / (videoColMax - videoColMin)) * 100}%, var(--chat-border) 100%)`,
                              }}
                            />
                          </div>
                          <div
                            className="gap-px"
                            style={{ columnCount: videoColumns, columnFill: "balance", columnGap: "1px" }}
                          >
                            {listVideos.slice(0, videosVisible).map((item) => {
                              const src = getVideoDisplayUrl(item);
                              if (!src) return null;
                              return (
                                <div
                                  key={item.id}
                                  className="relative group break-inside-avoid mb-px rounded-lg overflow-hidden border border-[var(--chat-border)] bg-[var(--chat-bg-secondary)]"
                                >
                                  <video
                                    src={src}
                                    poster={item.thumbnailUrl ?? undefined}
                                    preload="metadata"
                                    controls
                                    className="w-full h-auto object-cover block"
                                  />
                                  {/* Delete button — appears on hover */}
                                  <button
                                    type="button"
                                    title="Delete video"
                                    onClick={async () => {
                                      if (!confirm("Delete this video?")) return;
                                      try {
                                        const res = await fetch(`/api/media/videos/${item.id}`, { method: "DELETE", credentials: "include" });
                                        if (!res.ok) { const d = await res.json().catch(()=>({})); toast.error(`Delete failed (${res.status}): ${(d as {message?:string;detail?:string}).message || (d as {detail?:string}).detail || res.statusText}`); return; }
                                        setListVideos((prev) => prev.filter((i) => i.id !== item.id));
                                      } catch (err) { toast.error(`Delete error: ${(err as Error)?.message || String(err)}`); }
                                    }}
                                    className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 hover:bg-red-600 text-white rounded-md p-1.5"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                      {!loadingVideos && !errorVideos && listVideos.length === 0 && (
                        <div className="py-8 sm:py-12 text-center text-[var(--chat-text-secondary)] text-sm sm:text-base px-2">No videos yet. Generate some above.</div>
                      )}
                    </div>
                    {!loadingVideos && !errorVideos && videosVisible < listVideos.length && (
                      <div className="flex justify-center mt-4 sm:mt-6 px-3">
                        <button
                          type="button"
                          onClick={() => setVideosVisible((n) => Math.min(n + LOAD_MORE_STEP, listVideos.length))}
                          className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg text-sm sm:text-base text-white font-medium bg-[var(--chat-accent)] transition-colors"
                        >
                          Load More
                        </button>
                      </div>
                    )}
                  </>
                )}
                
              </div>
            </div>
          </div>
        </div>
      </div>
      <Dialog open={!!imageModalUrl} onOpenChange={(open) => !open && setImageModalUrl(null)}>
        <DialogContent
          showCloseButton={true}
          className="max-w-2xl w-[95vw] sm:w-[90vw] max-h-[90vh] sm:max-h-[85vh] p-2 sm:p-0 overflow-hidden flex items-center justify-center bg-[var(--chat-bg-secondary)] border border-[var(--chat-border)] [&_[data-slot=dialog-close]]:text-[var(--chat-text-primary)]"
          onPointerDownOutside={() => setImageModalUrl(null)}
          onEscapeKeyDown={() => setImageModalUrl(null)}
        >
          {imageModalUrl && (
            <img
              src={imageModalUrl}
              alt="Full size"
              className="max-w-full max-h-[75vh] sm:max-h-[80vh] w-auto h-auto object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
              draggable={false}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
