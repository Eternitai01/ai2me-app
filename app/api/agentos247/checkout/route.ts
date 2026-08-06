import { NextRequest, NextResponse } from "next/server";

// Proxy to agentos247.com Cloudflare Pages Function which holds the Stripe key
const AGENTOS_CHECKOUT_URL = "https://agentos247.com/api/agentos247/checkout";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetch(AGENTOS_CHECKOUT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[AgentOS Checkout Proxy Error]", err);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
