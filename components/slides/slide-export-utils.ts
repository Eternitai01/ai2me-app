/**
 * slide-export-utils.ts
 *
 * RENDERING STRATEGY (why iframe, not div.innerHTML):
 * Each slide is a *complete* HTML document — it has <head> with <style> tags,
 * Tailwind CDN, custom fonts, JS animations, etc.  If we inject it via
 * div.innerHTML the browser silently strips everything inside <html>/<head>
 * and the slide renders unstyled and collapsed into a tiny centred blob.
 *
 * The correct approach mirrors what SlideViewer already does: load the full
 * document in an <iframe> so it gets its own viewport, parser, and CSS engine.
 * We use srcdoc= so no network round-trip is needed.
 *
 * For html2canvas to be able to traverse the iframe DOM we need
 * sandbox="allow-scripts allow-same-origin".  This is safe for off-screen
 * export-only iframes that are removed immediately after capture.
 */

export interface Slide {
  id: string;
  slide_number: number;
  title: string;
  html_content: string;
}

const SLIDE_W = 1280;
const SLIDE_H = 720;

/**
 * Render a single slide to a canvas by loading its full HTML document
 * inside an off-screen iframe, waiting for fonts + images, then capturing
 * with html2canvas.
 *
 * @param scale  Pixel density multiplier.
 *               • 2  → 2560×1440 output — best for PPTX (crisp at any zoom)
 *               • 1  → 1280×720  output — exact match for jsPDF pages
 */
async function renderSlideToCanvas(
  slide: Slide,
  scale = 2,
): Promise<HTMLCanvasElement> {
  const html2canvas = (await import("html2canvas")).default;

  return new Promise<HTMLCanvasElement>((resolve, reject) => {
    const iframe = document.createElement("iframe");

    // Off-screen, no pointer interaction, hidden from layout
    Object.assign(iframe.style, {
      position:       "fixed",
      left:           "-9999px",
      top:            "0",
      width:          `${SLIDE_W}px`,
      height:         `${SLIDE_H}px`,
      border:         "none",
      pointerEvents:  "none",
      visibility:     "hidden",
      zIndex:         "-1",
    });

    // allow-same-origin is required so html2canvas can traverse the iframe DOM.
    // allow-scripts is required so CDN libraries (Tailwind etc.) run and paint.
    iframe.setAttribute("sandbox", "allow-scripts allow-same-origin");

    document.body.appendChild(iframe);

    iframe.onload = async () => {
      try {
        const doc = iframe.contentDocument;
        if (!doc) throw new Error("Cannot access iframe document");

        // Give CDN fonts, Tailwind classes, and JS-driven animations time to settle.
        // 1 200 ms is enough for Tailwind CDN + Google Fonts; adjust if needed.
        await new Promise<void>((r) => setTimeout(r, 1200));

        const canvas = await html2canvas(doc.body, {
          // Capture exactly the slide viewport — no extra page area
          x:             0,
          y:             0,
          width:         SLIDE_W,
          height:        SLIDE_H,
          scale,
          // Tell html2canvas the window size so viewport-unit CSS (vw/vh) resolves
          windowWidth:   SLIDE_W,
          windowHeight:  SLIDE_H,
          scrollX:       0,
          scrollY:       0,
          useCORS:       true,
          allowTaint:    true,
          backgroundColor: "#0a0a0c",
          logging:       false,
        });

        resolve(canvas);
      } catch (err) {
        reject(err);
      } finally {
        // Always remove the iframe — even on error
        if (iframe.parentNode) {
          document.body.removeChild(iframe);
        }
      }
    };

    iframe.onerror = (e) => {
      if (iframe.parentNode) document.body.removeChild(iframe);
      reject(new Error(`iframe load error: ${e}`));
    };

    // srcdoc loads the full HTML document string directly — no network request,
    // no cross-origin issues, exactly what the SlideViewer does via /html endpoint.
    iframe.srcdoc = slide.html_content;
  });
}

function canvasToDataUrl(canvas: HTMLCanvasElement, quality = 0.92): string {
  return canvas.toDataURL("image/jpeg", quality);
}

// ─── Save to Workspace (AI Drive) ──────────────────────────────────────────────
// Renders server-side with Playwright, uploads to S3, creates a workspace item.
// Returns workspace item metadata — the caller shows the success modal.

export interface WorkspaceSaveResult {
  workspace_item_id: string;
  title: string;
  filename: string;
  size_bytes: number;
  item_type: "file_pdf" | "file_ppt";
}

export async function saveToWorkspace(
  sessionId: string,
  format: "pdf" | "pptx",
): Promise<WorkspaceSaveResult> {
  const endpoint = format === "pdf"
    ? `/api/ai/slides/sessions/${sessionId}/export-pdf-playwright?save=true`
    : `/api/ai/slides/sessions/${sessionId}/export-pptx-playwright?save=true`;

  const res = await fetch(endpoint, { method: "POST" });
  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`Save to workspace failed: ${res.status} — ${err.slice(0, 200)}`);
  }
  return res.json() as Promise<WorkspaceSaveResult>;
}

// ─── Get presigned download URL for a workspace item ────────────────────────────

export async function getWorkspaceDownloadUrl(itemId: string): Promise<string> {
  const res = await fetch(`/api/workspace/${itemId}/download-url`);
  if (!res.ok) throw new Error(`Download URL fetch failed: ${res.status}`);
  const { download_url } = await res.json();
  return download_url;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Server-side download helper ─────────────────────────────────────────────
// Fetches a binary from the backend and triggers a browser download.

async function downloadFromBackend(url: string, filename: string): Promise<void> {
  const res = await fetch(url, { method: "POST" });
  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`Export failed: ${res.status} — ${err.slice(0, 200)}`);
  }
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(objectUrl);
}

// ─── PDF export (server-side Playwright) ─────────────────────────────────────
// The backend export service renders each slide with real Chromium.
// No html2canvas — fonts, animations, SVG all captured correctly.
//
// Falls back to client-side jsPDF if the export service returns 503
// (not configured / not deployed yet).

export async function exportToPdf(
  slides: Slide[],
  filename = "presentation.pdf",
  pageRange?: [number, number],
  onProgress?: (done: number, total: number) => void,
  sessionId?: string,
): Promise<void> {
  const subset = pageRange
    ? slides.filter(
        (s) => s.slide_number >= pageRange[0] && s.slide_number <= pageRange[1],
      )
    : slides;

  // Try server-side Playwright export first (requires sessionId)
  if (sessionId) {
    try {
      onProgress?.(0, subset.length);
      await downloadFromBackend(
        `/api/ai/slides/sessions/${sessionId}/export-pdf-playwright`,
        filename,
      );
      onProgress?.(subset.length, subset.length);
      return;
    } catch (err: any) {
      // 503 = export service not deployed yet → fall through to client-side
      if (!err?.message?.includes("503")) throw err;
      console.warn("[export] Playwright service unavailable, falling back to client-side PDF");
    }
  }

  // ── Client-side jsPDF fallback ────────────────────────────────────────────
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [SLIDE_W, SLIDE_H] });

  for (let i = 0; i < subset.length; i++) {
    onProgress?.(i, subset.length);
    if (i > 0) pdf.addPage([SLIDE_W, SLIDE_H], "landscape");
    try {
      const canvas = await renderSlideToCanvas(subset[i], 1);
      pdf.addImage(canvasToDataUrl(canvas, 0.92), "JPEG", 0, 0, SLIDE_W, SLIDE_H, undefined, "FAST");
    } catch {
      pdf.setFillColor(10, 10, 12);
      pdf.rect(0, 0, SLIDE_W, SLIDE_H, "F");
      pdf.setTextColor(200, 200, 200);
      pdf.setFontSize(28);
      pdf.text(subset[i].title || `Slide ${subset[i].slide_number}`, 80, SLIDE_H / 2);
    }
  }

  onProgress?.(subset.length, subset.length);
  pdf.save(filename);
}

// ─── PPTX export (server-side Playwright) ────────────────────────────────────
// Single POST call — backend renders all slides with real Chromium and returns
// the PPTX binary. No browser-side rendering, no upload loop, no black slides.
//
// Falls back to the legacy html2canvas streamed approach if the export service
// returns 503 (not configured / not deployed yet).

export async function exportToPptx(
  slides: Slide[],
  sessionId: string,
  filename = "presentation.pptx",
  pageRange?: [number, number],
  onProgress?: (rendered: number, total: number) => void,
): Promise<void> {
  const subset = pageRange
    ? slides.filter(
        (s) => s.slide_number >= pageRange[0] && s.slide_number <= pageRange[1],
      )
    : slides;

  const base = `/api/ai/slides/sessions/${sessionId}`;

  // ── Try server-side Playwright export first ───────────────────────────────
  try {
    onProgress?.(0, subset.length);
    await downloadFromBackend(`${base}/export-pptx-playwright`, filename);
    onProgress?.(subset.length, subset.length);
    return;
  } catch (err: any) {
    // 503 = export service not deployed yet → fall through to legacy approach
    if (!err?.message?.includes("503")) throw err;
    console.warn("[export] Playwright service unavailable, falling back to html2canvas upload");
  }

  // ── Legacy html2canvas streamed fallback ──────────────────────────────────
  // Step 1: init
  const initRes = await fetch(`${base}/export-pptx-init`, { method: "POST" });
  if (!initRes.ok) throw new Error(`Init failed: ${initRes.status}`);
  const { export_id } = await initRes.json();

  // Step 2: render each slide at 2× and upload
  for (let i = 0; i < subset.length; i++) {
    onProgress?.(i, subset.length);
    try {
      const canvas = await renderSlideToCanvas(subset[i], 2);
      const image_data = canvasToDataUrl(canvas, 0.92);
      const addRes = await fetch(`${base}/export-pptx-add-slide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ export_id, slide_number: subset[i].slide_number, image_data }),
      });
      if (!addRes.ok) {
        const err = await addRes.text().catch(() => "");
        throw new Error(`Slide ${subset[i].slide_number} upload failed: ${addRes.status} ${err}`);
      }
    } catch (e) {
      await fetch(`${base}/export-pptx-finalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ export_id }),
      }).catch(() => {});
      throw e;
    }
  }

  onProgress?.(subset.length, subset.length);

  // Step 3: finalize
  const finalRes = await fetch(`${base}/export-pptx-finalize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ export_id }),
  });
  if (!finalRes.ok) {
    const err = await finalRes.text().catch(() => "");
    throw new Error(`Finalize failed: ${finalRes.status} ${err}`);
  }

  const blob = await finalRes.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Google Slides ─────────────────────────────────────────────────────────────
// We generate the best-quality PPTX and download it.
// The user then imports it at slides.google.com → File → Import slides.
// Full Google Drive API integration (OAuth upload + auto-convert) is a future feature.

export async function exportToGoogleSlides(
  slides: Slide[],
  sessionId: string,
  sessionTitle = "presentation",
  onProgress?: (rendered: number, total: number) => void,
): Promise<void> {
  // Download as PPTX — Google Slides imports .pptx natively
  await exportToPptx(
    slides,
    sessionId,
    `${sessionTitle}.pptx`,
    undefined,
    onProgress,
  );

  // Open Google Slides import page after a short delay so the download starts first
  setTimeout(
    () => window.open("https://docs.google.com/presentation/u/0/", "_blank"),
    1500,
  );
}
