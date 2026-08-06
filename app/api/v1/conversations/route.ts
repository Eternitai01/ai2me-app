import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/v1/conversations
 *
 * Next.js proxy for the backend conversations endpoint.
 * Converts frontend params (page/page_size/search) to backend params (limit/offset)
 * and normalises the response schema (agent_message → agent_reply).
 */
export async function GET(request: NextRequest) {
  try {
    const token =
      request.cookies.get("auth-token")?.value ||
      request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { detail: "Authentication required" },
        { status: 401 }
      );
    }

    // ── Convert frontend query params to backend params ──────────────────
    const { searchParams } = new URL(request.url);
    const page     = parseInt(searchParams.get("page")      ?? "1",  10);
    const pageSize = parseInt(searchParams.get("page_size") ?? "50", 10);
    const channel    = searchParams.get("channel");
    const agentName  = searchParams.get("agent_name");
    const search     = searchParams.get("search");
    const dateFrom   = searchParams.get("date_from");
    const dateTo     = searchParams.get("date_to");

    const limit  = pageSize;
    const offset = (page - 1) * pageSize;

    const backendParams = new URLSearchParams();
    backendParams.set("limit",  String(limit));
    backendParams.set("offset", String(offset));
    if (channel && channel !== "all")   backendParams.set("channel",    channel);
    if (agentName && agentName !== "all") backendParams.set("agent_name", agentName);
    if (search && search.trim())        backendParams.set("search",     search.trim());
    if (dateFrom)                       backendParams.set("date_from",  dateFrom);
    if (dateTo)                         backendParams.set("date_to",    dateTo);

    const backendUrl = process.env.BACKEND_URL || "http://ai2me-backend:8000";
    const response = await fetch(
      `${backendUrl}/v1/conversations/?${backendParams.toString()}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { detail: `Backend error ${response.status}: ${text}` },
        { status: response.status }
      );
    }

    const raw = await response.json();

    // ── Normalise schema ─────────────────────────────────────────────────
    // Backend returns `agent_message`; frontend hook expects `agent_reply`
    const conversations = (raw.conversations ?? []).map((c: Record<string, unknown>) => ({
      id:           c.id,
      channel:      c.channel,
      agent_name:   c.agent_name   ?? null,
      user_message: c.user_message ?? "",
      agent_reply:  c.agent_message ?? "",   // normalise field name
      created_at:   c.created_at,
      user_id:      c.channel_user_id ?? null,
      session_id:   null,
    }));

    return NextResponse.json(
      {
        conversations,
        total:     raw.total     ?? 0,
        page,
        page_size: pageSize,
      },
      { headers: { "Cache-Control": "no-cache, no-store, must-revalidate" } }
    );
  } catch (error) {
    console.error("Conversations proxy error:", error);
    return NextResponse.json(
      { detail: "Internal server error" },
      { status: 500 }
    );
  }
}
