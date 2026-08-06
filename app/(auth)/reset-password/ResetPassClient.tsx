"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, CircleCheck, Eye, EyeOff } from "lucide-react";
import Image from "next/image";

export default function ResetPassClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        // Get email from URL params
        const emailParam = searchParams.get("email");
        if (emailParam) {
            const decodedEmail = decodeURIComponent(emailParam);
            console.log("Original email param:", emailParam);
            console.log("Decoded email:", decodedEmail);
            setEmail(decodedEmail);
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Validation
        if (!email) {
            setError("Email is required");
            return;
        }

        if (!newPassword) {
            setError("New password is required");
            return;
        }

        if (newPassword.length < 8) {
            setError("Password must be at least 8 characters long");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setIsLoading(true);

        try {
            const token = searchParams.get("token");
            if (!token) {
                throw new Error("Invalid reset link");
            }

            // Use test endpoint for development, production endpoint for production
            const endpoint =
                process.env.NODE_ENV === "development"
                    ? "/api/auth/reset-password-test"
                    : "/api/auth/reset-password-token";

            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    new_password: newPassword,
                    token,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || "Failed to reset password");
            }

            setIsSuccess(true);
        } catch (err) {
            console.error("Error resetting password:", err);
            setError(err instanceof Error ? err.message : "Failed to reset password");
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
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
                                    Password Reset Successful
                                </CardTitle>
                                <CardDescription className="text-base font-normal text-[#626970] mt-[10px]">
                                    Your password has been successfully reset. You can now sign in
                                    with your new password.
                                </CardDescription>
                            </div>
                        </div>

                        <div className="space-y-6 mt-8">
                            <div className="text-center">
                                <Button
                                    variant="filledBlack"
                                    className="h-12 px-8 mt-2"
                                    onClick={() => router.push("/")}
                                >
                                    Go to Sign In
                                </Button>
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
                                Set New Password
                            </CardTitle>
                            <CardDescription className="text-base text-[#626970] font-normal">
                                Enter your new password below
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
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled
                                    className="h-12 w-full rounded-xl border-1 border-[#121416] focus-visible:shadow-none focus-visible:outline-none bg-gray-50"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label
                                    htmlFor="newPassword"
                                    className="text-[#121416] text-base font-normal"
                                >
                                    New Password
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="newPassword"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter new password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        disabled={isLoading}
                                        className="h-12 w-full rounded-xl border-1 border-[#121416] focus-visible:shadow-none focus-visible:outline-none pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="w-4 h-4" />
                                        ) : (
                                            <Eye className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label
                                    htmlFor="confirmPassword"
                                    className="text-[#121416] text-base font-normal"
                                >
                                    Confirm New Password
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="Confirm new password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        disabled={isLoading}
                                        className="h-12 w-full rounded-xl border-1 border-[#121416] focus-visible:shadow-none focus-visible:outline-none pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="w-4 h-4" />
                                        ) : (
                                            <Eye className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <AlertDescription className="text-red-600 text-sm">
                                    {error}
                                </AlertDescription>
                            )}

                            <Button
                                type="submit"
                                variant={"filledBlack"}
                                className="w-full h-12 mt-4"
                                disabled={isLoading}
                            >
                                {isLoading ? "Resetting Password..." : "Reset Password"}
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

