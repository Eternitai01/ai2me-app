import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const AI_SERVICE_URL =
  process.env.AI_SERVICE_INTERNAL_URL ||
  process.env.AI_SERVICE_URL ||
  "http://localhost:8001";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const agentId = request.nextUrl.searchParams.get("agentId") || "";

    const cookieToken = request.cookies.get("auth-token")?.value;
    const bearerToken = request.headers.get("Authorization")?.slice(7);
    let nextAuthToken: string | null = null;
    if (!cookieToken && !bearerToken) {
      const session = await auth();
      nextAuthToken = (session as any)?.backendToken ?? null;
    }
    const effectiveToken = cookieToken || bearerToken || nextAuthToken;
    if (!effectiveToken) return NextResponse.json({ type: "none" }, { status: 401 });

    const headers = { Authorization: `Bearer ${effectiveToken}` };

    // ── Web Builder / App Builder ──────────────────────────────────────────
    if (agentId === "ai-builder" || agentId === "web-builder") {
      // Step 1: find preview_url from the projects list
      let previewUrl = "";
      try {
        const projectsRes = await fetch(`${AI_SERVICE_URL}/v1/chat/projects`, {
          headers,
          cache: "no-store",
          signal: AbortSignal.timeout(5000),
        });
        if (projectsRes.ok) {
          const data = await projectsRes.json();
          const match = (data?.projects || []).find((p: any) => p.session_id === sessionId);
          previewUrl = match?.preview_url || "";
        }
      } catch {}

      if (!previewUrl) return NextResponse.json({ type: "none" });

      // Step 2: fetch the actual Vercel HTML and inject <base href> so relative assets load
      try {
        const htmlRes = await fetch(previewUrl, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; AI2me-Preview/1.0)" },
          signal: AbortSignal.timeout(8000),
        });
        if (htmlRes.ok) {
          let html = await htmlRes.text();
          // Inject <base href> right after <head> so all relative paths resolve
          const origin = new URL(previewUrl).origin;
          html = html.replace(
            /<head([^>]*)>/i,
            `<head$1><base href="${origin}/">`
          );
          return NextResponse.json({ type: "html", content: html });
        }
      } catch {}

      // Fallback: return the URL so the client can try thum.io
      return NextResponse.json({ type: "screenshot", url: previewUrl });
    }

    // ── Slides ─────────────────────────────────────────────────────────────
    if (agentId === "ai-slides") {
      const slidesRes = await fetch(
        `${AI_SERVICE_URL}/v1/slides/sessions/${sessionId}/slides`,
        { headers, cache: "no-store" }
      );
      if (slidesRes.ok) {
        const slides: any[] = await slidesRes.json();
        const first = slides?.[0];
        if (first?.id) {
          const htmlRes = await fetch(
            `${AI_SERVICE_URL}/v1/slides/${first.id}/html`,
            { headers, cache: "no-store" }
          );
          if (htmlRes.ok) {
            const html = await htmlRes.text();
            return NextResponse.json({ type: "html", content: html });
          }
        }
      }
      return NextResponse.json({ type: "none" });
    }

    // ── Docs ───────────────────────────────────────────────────────────────
    if (agentId === "ai-docs") {
      const sessionRes = await fetch(
        `${AI_SERVICE_URL}/v1/chat/sessions/${sessionId}`,
        { headers, cache: "no-store" }
      );
      if (sessionRes.ok) {
        const data = await sessionRes.json();
        const html = data?.document_html;
        if (html) return NextResponse.json({ type: "html", content: html });
        const msgs: any[] = data?.messages || [];
        const lastAI = msgs.filter((m) => m.type === "incoming").slice(-1)[0];
        if (lastAI?.text) return NextResponse.json({ type: "text", content: lastAI.text });
      }
      return NextResponse.json({ type: "none" });
    }

    // ── Sheets ─────────────────────────────────────────────────────────────
    if (agentId === "ai-sheets") {
      const sessionRes = await fetch(
        `${AI_SERVICE_URL}/v1/chat/sessions/${sessionId}`,
        { headers, cache: "no-store" }
      );
      if (sessionRes.ok) {
        const data = await sessionRes.json();
        const msgs: any[] = data?.messages || [];
        for (const msg of [...msgs].reverse()) {
          if (msg.type !== "incoming" || !msg.text) continue;
          const jsonMatch =
            msg.text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1] ||
            (msg.text.trim().startsWith("{") ? msg.text.trim() : null);
          if (!jsonMatch) continue;
          try {
            const parsed = JSON.parse(jsonMatch);
            if (parsed.columns && parsed.rows) {
              return NextResponse.json({
                type: "sheet",
                content: JSON.stringify({ columns: parsed.columns.slice(0, 6), rows: parsed.rows.slice(0, 8) }),
              });
            }
          } catch { continue; }
        }
      }
      return NextResponse.json({ type: "none" });
    }

    return NextResponse.json({ type: "none" });
  } catch (e) {
    return NextResponse.json({ type: "none" });
  }
}
