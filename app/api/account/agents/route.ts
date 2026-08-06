import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ agents: [] });
    }

    const apiBase = process.env.NEXT_PUBLIC_API_URL || "https://api.ai2me.com";
    const res = await fetch(`${apiBase}/api/v1/internal/agents-for-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Provision-Secret": process.env.AGENTOS_PROVISION_SECRET || "",
      },
      body: JSON.stringify({ email: session.user.email }),
    });

    if (!res.ok) return NextResponse.json({ agents: [] });
    const data = await res.json();
    return NextResponse.json({ agents: data.agents || [] });
  } catch {
    return NextResponse.json({ agents: [] });
  }
}
