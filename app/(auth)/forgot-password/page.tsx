"use client";

import type React from "react";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, CircleCheck } from "lucide-react";
import Image from "next/image";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to send reset email");
      }

      setIsSubmitted(true);
    } catch (err) {
      console.error("Error sending reset email:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to resend email");
      }

      // Show success message or update UI
      console.log("Email resent successfully");
    } catch (err) {
      console.error("Error resending email:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex">
        <div className="w-[50%] hidden md:block">
          <Image
            src={"/images/loginImg.jpg"}
            width={800}
            height={100}
            className="!w-full !h-[100vh] object-cover object-bottom"
            alt=""
          />
        </div>
        <div className="w-[100%] md:w-[50%] h-[100vh] overflow-auto pt-14 md:pt-0">
          <div className="max-w-[500px] mx-auto px-10 md:px-16 pt-6 md:pt-20">
            <div className="text-center space-y-4">
              <div className="mx-auto flex justify-center">
                <CircleCheck
                  strokeWidth={1}
                  className="w-15 h-15 text-[#007843]"
                />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-[#121416] mt-4">
                  Check Your Email
                </CardTitle>
                <CardDescription className="text-base font-normal text-[#626970] mt-[10px]">
                  We&apos;ve sent a password reset link to
                  <br />{" "}
                  <span className="text-[#121416] font-medium">{email}</span>
                </CardDescription>
              </div>
            </div>

            <div className="space-y-6 mt-8">
              <AlertDescription className="text-base text-center font-normal text-[#626970]">
                If you don&apos;t see the email in your inbox, please check your
                spam folder.
              </AlertDescription>

              <div className="text-center space-y-4">
                <p className="text-base text-[#626970] font-normal">
                  Didn&apos;t receive the email? Check your spam folder or try
                  again.
                </p>
                <Button
                  variant="filledBlack"
                  className="h-12 px-8 mt-2"
                  onClick={handleResendEmail}
                  disabled={isLoading}
                >
                  {isLoading ? "Sending..." : "Resend Email"}
                </Button>
              </div>

              <div className="text-center">
                <Link
                  href="/"
                  className="inline-flex items-center text-sm text-secondary hover:underline"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back to Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <div className="w-[50%] hidden lg:block">
        <Image
          src={"/images/loginImg.jpg"}
          width={800}
          height={100}
          className="!w-full !h-[100vh] object-cover object-bottom"
          alt=""
        />
      </div>
      <div className="w-[100%] lg:w-[50%] h-[100vh] overflow-auto pt-14 lg:pt-0">
        <div className="max-w-[500px] mx-auto px-4 pt-6 md:pt-20">
          <div className="text-center space-y-4">
            <div className="text-start">
              <CardTitle className="text-[32px] font-bold text-[#121416]">
                Reset Your Password
              </CardTitle>
              <CardDescription className="text-base text-[#626970] font-normal">
                Enter your email address and we&apos;ll send you a reset link
              </CardDescription>
            </div>
          </div>

          <div className="space-y-6 mt-12">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-[#121416] text-base font-normal"
                >
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-12 w-full rounded-xl border-1 border-[#121416] focus-visible:shadow-none focus-visible:outline-none"
                />
              </div>

              <Button
                type="submit"
                variant={"filledBlack"}
                className="w-full h-12 mt-4"
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>

            <div className="text-center">
              <Link
                href="/"
                className="inline-flex items-center text-sm text-[#5146DC] hover:underline"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

