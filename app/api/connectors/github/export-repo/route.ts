import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const authToken = cookieStore.get("auth-token")?.value;

  if (!authToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Retrieve stored GitHub token from FastAPI
  const backendUrl = process.env.BACKEND_URL || "http://ai2me-backend:8000";
  const tokenRes = await fetch(`${backendUrl}/v1/oauth/github/token`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });

  if (!tokenRes.ok) {
    return NextResponse.json(
      { error: "GitHub not connected. Please connect GitHub first via /connectors." },
      { status: 400 }
    );
  }

  const { access_token } = await tokenRes.json();
  const { repoName, description, files, isPrivate = false } = await req.json();

  // ── 1. Create repo ──────────────────────────────────────────────────────────
  const createRes = await fetch("https://api.github.com/user/repos", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${access_token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: repoName,
      description,
      private: isPrivate,
      auto_init: false,
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    // If repo already exists, fetch it instead of failing
    if (createRes.status === 422) {
      const userRes = await fetch("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${access_token}`, Accept: "application/vnd.github+json" },
      });
      const user = await userRes.json();
      const existingRes = await fetch(`https://api.github.com/repos/${user.login}/${repoName}`, {
        headers: { Authorization: `Bearer ${access_token}`, Accept: "application/vnd.github+json" },
      });
      if (!existingRes.ok) {
        return NextResponse.json({ error: "Repo already exists and could not be fetched" }, { status: 400 });
      }
      const existing = await existingRes.json();
      // Push files to existing repo — fall through with existing repo data
      await pushFiles(access_token, existing.full_name, files);
      return NextResponse.json({ repoUrl: existing.html_url, repoName: existing.full_name });
    }
    return NextResponse.json(
      { error: (err as { message?: string }).message || "Failed to create repo" },
      { status: 400 }
    );
  }

  const repo = await createRes.json();

  // ── 2. Push files via Contents API ─────────────────────────────────────────
  await pushFiles(access_token, repo.full_name, files);

  return NextResponse.json({ repoUrl: repo.html_url, repoName: repo.full_name });
}

async function pushFiles(
  token: string,
  fullName: string,
  files: { path: string; content: string }[]
) {
  // Push sequentially to respect GitHub rate limits
  for (const file of files) {
    const filePath = file.path.startsWith("/") ? file.path.slice(1) : file.path;
    // Check if file exists (for update vs create)
    const checkRes = await fetch(
      `https://api.github.com/repos/${fullName}/contents/${filePath}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
        },
      }
    );
    const sha = checkRes.ok ? (await checkRes.json()).sha : undefined;

    await fetch(
      `https://api.github.com/repos/${fullName}/contents/${filePath}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `Add ${filePath}`,
          content: Buffer.from(file.content).toString("base64"),
          ...(sha ? { sha } : {}),
        }),
      }
    );
  }
}
