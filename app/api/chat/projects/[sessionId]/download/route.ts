import { NextRequest, NextResponse } from "next/server";

// For server-side API routes, use internal Docker network URL
const AI_SERVICE_URL = process.env.AI_SERVICE_INTERNAL_URL || process.env.AI_SERVICE_URL
  || process.env.NEXT_PUBLIC_AI_SERVICE_URL
  || "http://localhost:8001";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const authToken = request.cookies.get("auth-token")?.value;
    const apiKey = request.headers.get("x-api-key") || request.headers.get("X-API-Key");
    const envApiKey = process.env.AI_SERVICE_API_KEY;

    if (!authToken && !apiKey && !envApiKey) {
      return NextResponse.json(
        { detail: "Authentication required. Please log in." },
        { status: 401 }
      );
    }

    const headers: Record<string, string> = {};

    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    } else if (apiKey) {
      headers["X-API-Key"] = apiKey;
    } else if (envApiKey) {
      headers["X-API-Key"] = envApiKey;
    }

    const response = await fetch(
      `${AI_SERVICE_URL}/v1/chat/projects/${sessionId}/download`,
      {
        method: "GET",
        headers,
        cache: "no-cache",
      }
    );

    if (!response.ok) {
      const text = await response.text();
      let data: unknown;
      try {
        data = JSON.parse(text);
      } catch {
        return NextResponse.json(
          { detail: "Failed to download project" },
          { status: response.status }
        );
      }
      const detail =
        (data as { detail?: string } | undefined)?.detail ||
        "Failed to download project";
      return NextResponse.json({ detail }, { status: response.status });
    }

    // Get the ZIP file content
    const blob = await response.blob();
    const contentDisposition = response.headers.get("content-disposition");
    
    // Extract filename from content-disposition header or use default
    let filename = "project.zip";
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?(.+?)"?$/);
      if (match) {
        filename = match[1];
      }
    }

    // Return the ZIP file
    return new NextResponse(blob, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    const err = error as Error;
    console.error("Project download API error:", err);
    return NextResponse.json(
      { detail: "Internal server error: " + (err.message || "Unknown error") },
      { status: 500 }
    );
  }
}
