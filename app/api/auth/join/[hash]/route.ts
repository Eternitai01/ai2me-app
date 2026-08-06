import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ hash: string }> }
) {
  try {
    const { hash } = await params;

    if (!hash) {
      return NextResponse.json(
        { success: false, error: "Invite hash is required" },
        { status: 400 }
      );
    }

    // Call backend API to validate invite
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const response = await axios.get(`${backendUrl}/auth/join/${hash}`);

    return NextResponse.json(response.data);
  } catch (error: unknown) {
    console.error("Error validating invite:", error);

    if (error instanceof Error && "response" in error) {
      const axiosError = error as {
        response?: { status: number; data?: { detail?: string } };
      };
      return NextResponse.json(
        {
          success: false,
          error:
            axiosError.response?.data?.detail || "Failed to validate invite",
        },
        { status: axiosError.response?.status || 500 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
