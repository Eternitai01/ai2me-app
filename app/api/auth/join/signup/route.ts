import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      "invite_hash",
      "first_name",
      "last_name",
      "password",
      "confirm_password",
      "terms_accepted",
      "privacy_accepted",
    ];

    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Call backend API to create account via invite
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const response = await axios.post(`${backendUrl}/auth/join/signup`, body);

    return NextResponse.json(response.data);
  } catch (error: unknown) {
    console.error("Error creating invite account:", error);

    if (error instanceof Error && "response" in error) {
      const axiosError = error as {
        response?: { status: number; data?: { detail?: string } };
      };
      return NextResponse.json(
        {
          error:
            axiosError.response?.data?.detail || "Failed to create account",
        },
        { status: axiosError.response?.status || 500 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
