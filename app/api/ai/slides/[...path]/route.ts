import { NextRequest, NextResponse } from "next/server";

// Force Node.js runtime (not Edge) — needed for large JSON bodies (slide image uploads)
export const runtime = "nodejs";
// Allow up to 120s for export-pptx-images (20 slides × render + upload time)
export const maxDuration = 120;

// Prefer the internal ALB origin, same as every other /api/ai/* route. AI_SERVICE_URL is the
// public host, which only routes /v1/* to the backend — the backend has no slides router, so
// resolving to it returns FastAPI's {"detail":"Not Found"} for every slide fetch. The internal
// origin ends in /ai, matching the second `/ai/v1` mount the AI service registers for the ALB.
const AI_SERVICE_URL =
    process.env.AI_SERVICE_INTERNAL_URL || process.env.AI_SERVICE_URL || "http://localhost:8001";

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const { path } = await params;
    const joinedPath = path.join("/");
    const searchParams = req.nextUrl.searchParams.toString();
    const targetUrl = `${AI_SERVICE_URL}/v1/slides/${joinedPath}${searchParams ? "?" + searchParams : ""}`;

    const headers = new Headers();
    const authToken = req.cookies.get("auth-token")?.value;
    if (authToken) {
        headers.set("Authorization", `Bearer ${authToken}`);
    }

    try {
        const response = await fetch(targetUrl, { headers });
        const contentType = response.headers.get("content-type");

        if (contentType?.includes("text/html")) {
            let html = await response.text();
            // In production, backend may embed absolute URLs (e.g. for images). Rewrite them so the
            // browser loads assets through this app (same origin), avoiding CORS or wrong-host issues.
            // Rewrite against every origin the service might have embedded, not just the one we
            // fetched with — the internal and public origins differ, and which one ends up in the
            // HTML depends on the service's own config, not on how we reached it.
            const slidesBases = [process.env.AI_SERVICE_INTERNAL_URL, process.env.AI_SERVICE_URL, "http://localhost:8001"]
                .filter((u): u is string => Boolean(u))
                .map((u) => `${u.replace(/\/$/, "")}/v1/slides`);
            try {
                const origin = req.nextUrl?.origin ?? (typeof req.url === "string" ? new URL(req.url).origin : null);
                if (origin) {
                    const proxyPrefix = `${origin}/api/ai/slides`;
                    for (const slidesBase of slidesBases) {
                        if (html.includes(slidesBase)) html = html.split(slidesBase).join(proxyPrefix);
                    }
                }
            } catch (_) {
                // ignore URL rewrite errors
            }
            // Propagate the backend status. This returned a bare 200 before, so a 401/404
            // error page rendered in the slide iframe as if it were a successful slide.
            return new NextResponse(html, {
                status: response.status,
                headers: { "Content-Type": "text/html" }
            });
        }

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const { path } = await params;
    const joinedPath = path.join("/");
    const targetUrl = `${AI_SERVICE_URL}/v1/slides/${joinedPath}`;

    const isExportPdf   = joinedPath.endsWith("export-pdf");
    const isExportPptxRaw    = joinedPath.endsWith("export-pptx");   // no body
    const isExportPptxInit   = joinedPath.endsWith("export-pptx-init"); // no body
    const isExportPptxImages = joinedPath.endsWith("export-pptx-images"); // JSON body (legacy)
    const isExportPptxStream = (
        isExportPptxInit ||
        joinedPath.endsWith("export-pptx-add-slide") ||
        joinedPath.endsWith("export-pptx-finalize")
    );
    const isExportPptx = isExportPptxRaw || isExportPptxImages || isExportPptxStream;
    // Endpoints that have no request body at all
    const hasNoBody = isExportPdf || isExportPptxRaw || isExportPptxInit;

    const headers = new Headers();
    // export-pptx-images sends JSON; export-pptx and export-pdf send no body
    if (!hasNoBody) {
        headers.set("Content-Type", "application/json");
    }
    const authToken = req.cookies.get("auth-token")?.value;
    if (authToken) {
        headers.set("Authorization", `Bearer ${authToken}`);
    }

    try {
        let body: any = undefined;

        if (!hasNoBody) {
            // Only parse JSON body when the endpoint actually sends one
            body = await req.json();
        }

        const response = await fetch(targetUrl, {
            method: "POST",
            headers,
            body: body ? JSON.stringify(body) : undefined
        });

        const contentType = response.headers.get("content-type") || "";

        // Pass through PDFs (used by export-pdf endpoint)
        if (contentType.includes("application/pdf")) {
            const resHeaders = new Headers();
            resHeaders.set("Content-Type", "application/pdf");
            const disposition = response.headers.get("Content-Disposition");
            if (disposition) {
                resHeaders.set("Content-Disposition", disposition);
            }
            return new NextResponse(response.body, {
                status: response.status,
                headers: resHeaders,
            });
        }

        // Pass through PPTX (used by export-pptx endpoint)
        if (contentType.includes("application/vnd.openxmlformats-officedocument.presentationml.presentation")) {
            const resHeaders = new Headers();
            resHeaders.set("Content-Type", "application/vnd.openxmlformats-officedocument.presentationml.presentation");
            const disposition = response.headers.get("Content-Disposition");
            if (disposition) {
                resHeaders.set("Content-Disposition", disposition);
            }
            return new NextResponse(response.body, {
                status: response.status,
                headers: resHeaders,
            });
        }

        // For non-binary responses (e.g. errors), read as text then try JSON so we always return a useful body
        const text = await response.text();
        let data: object;
        try {
            data = text ? JSON.parse(text) : {};
        } catch {
            data = { detail: text || `Backend returned ${response.status}`, error: "Backend response was not JSON" };
        }
        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        const message = error?.message ?? String(error);
        console.error("[api/ai/slides] POST proxy error:", message);
        return NextResponse.json(
            { error: message, detail: "Proxy request to slides backend failed. Check API logs and that the backend is running." },
            { status: 500 }
        );
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const { path } = await params;
    const joinedPath = path.join("/");
    const targetUrl = `${AI_SERVICE_URL}/v1/slides/${joinedPath}`;

    const headers = new Headers({ "Content-Type": "application/json" });
    const authToken = req.cookies.get("auth-token")?.value;
    if (authToken) {
        headers.set("Authorization", `Bearer ${authToken}`);
    }

    try {
        const body = await req.json();
        const response = await fetch(targetUrl, {
            method: "PUT",
            headers,
            body: JSON.stringify(body)
        });
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
