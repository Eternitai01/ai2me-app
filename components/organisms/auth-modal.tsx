"use client";

import React, { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
import { Eye, EyeOff, AlertCircle, Mail } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { hasNecessaryCookieConsent } from "@/lib/cookie-consent";
import { PrivacyPolicyModal } from "@/components/PrivacyPolicyModal";
import Google from "@/icons/google";
import { signInWithGoogle, signInWithGitHub, signInWithApple } from "@/lib/auth-helpers";
import { getSession } from "next-auth/react";
import { toast } from "sonner";

type AuthView = "login" | "signup" | "otp" | "magic_sent";

interface AuthModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialView?: AuthView;
    initialEmail?: string;
    onViewChange?: (view: AuthView) => void;
}

// ── Social button component ──────────────────────────────────────────────────
function SocialButton({
    onClick,
    disabled,
    icon,
    label,
}: {
    onClick: () => void;
    disabled: boolean;
    icon: React.ReactNode;
    label: string;
}) {
    return (
        <Button
            type="button"
            variant="outline"
            className="w-full h-12 border border-[#E5E7EB] bg-white text-[#121416] hover:bg-gray-50 hover:border-[#121416] hover:text-[#121416] font-medium gap-2"
            onClick={onClick}
            disabled={disabled}
        >
            {icon}
            {label}
        </Button>
    );
}

// ── Divider ──────────────────────────────────────────────────────────────────
function Divider() {
    return (
        <div className="relative flex items-center gap-3 my-1">
            <div className="flex-1 h-px bg-[#E5E7EB]" />
            <span className="text-xs text-[#9CA3AF]">or</span>
            <div className="flex-1 h-px bg-[#E5E7EB]" />
        </div>
    );
}

export function AuthModal({
    open,
    onOpenChange,
    initialView = "login",
    initialEmail = "",
    onViewChange,
}: AuthModalProps) {
    const router = useRouter();
    const { signIn, signUp, confirmSignUp, resendSignUpCode } = useAuth();

    const [view, setView] = useState<AuthView>(initialView);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);
    const hasRedirected = useRef(false);

    // Shared fields
    const [email, setEmail] = useState(initialEmail);
    const [password, setPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [privacyAccepted, setPrivacyAccepted] = useState(false);

    // OTP
    const [otp, setOtp] = useState("");
    const [verificationEmail, setVerificationEmail] = useState("");

    const getDestination = useCallback(() => "/landing?oauth_callback=true", []);

    const go = useCallback(
        (dest: string) => {
            if (hasRedirected.current) return;
            hasRedirected.current = true;
            onOpenChange(false);
            router.replace(dest);
        },
        [router, onOpenChange]
    );

    const prevOpenRef = useRef(open);
    React.useEffect(() => {
        const wasClosedNowOpen = !prevOpenRef.current && open;
        prevOpenRef.current = open;
        if (wasClosedNowOpen) {
            setView(initialView);
            setError("");
            setEmail("");
            setPassword("");
            setFirstName("");
            setLastName("");
            setTermsAccepted(false);
            setPrivacyAccepted(false);
            setOtp("");
            setVerificationEmail("");
            hasRedirected.current = false;
            setShowPrivacyModal(false);
        }
    }, [open, initialView]);

    React.useEffect(() => {
        if (open && onViewChange) onViewChange(view);
    }, [view, open, onViewChange]);

    // ── Social sign-in handler ───────────────────────────────────────────────
    const handleSocialLogin = async (
        providerFn: typeof signInWithGoogle,
        providerName: string
    ) => {
        if (!hasNecessaryCookieConsent()) { setShowPrivacyModal(true); return; }
        setIsLoading(true);
        setError("");
        let isRedirecting = false;
        try {
            const destination = getDestination();
            const result = await providerFn({ redirect: false, callbackUrl: destination });
            if (result.ok && result.url) {
                isRedirecting = true;
                window.location.href = result.url;
                return;
            }
            // NextAuth v5 OAuth sign-in navigates the whole page itself and resolves
            // with { ok: true, data: { redirect: true } } while the browser is still
            // unloading. There is no session to inspect yet — bail out and leave the
            // button in its loading state instead of flashing a bogus error alert.
            if (result.ok && (result.data as { redirect?: boolean } | undefined)?.redirect) {
                isRedirecting = true;
                return;
            }
            if (result.ok) {
                const session = await getSession();
                if ((session as any)?.backendToken) {
                    const t = (session as any).backendToken;
                    document.cookie = `auth-token=${t}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
                    toast.success("Signed in successfully");
                    go(destination);
                    return;
                }
            }
            setError(result.error || `${providerName} sign in failed. Please try again.`);
        } catch (err: unknown) {
            setError((err as Error)?.message || "An error occurred. Please try again.");
        } finally {
            if (!isRedirecting) setIsLoading(false);
        }
    };

    // ── Email login ──────────────────────────────────────────────────────────
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!hasNecessaryCookieConsent()) { setShowPrivacyModal(true); return; }
        setIsLoading(true);
        setError("");
        const result = await signIn({ email: email.trim(), password });
        if (result?.error) {
            const msg = result.error.toLowerCase();
            setError(
                msg.includes("verify") ? "Please verify your email first. Check your inbox." :
                msg.includes("not found") ? "No account found with this email." :
                msg.includes("invalid") || msg.includes("incorrect") ? "Invalid email or password." :
                result.error
            );
            setIsLoading(false);
            hasRedirected.current = false;
            return;
        }
        toast.success("Signed in successfully");
        go(getDestination());
        setIsLoading(false);
    };

    // ── Email signup (single screen) ─────────────────────────────────────────
    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!hasNecessaryCookieConsent()) { setShowPrivacyModal(true); return; }
        if (!termsAccepted || !privacyAccepted) {
            setError("Please accept the Terms of Service and Privacy Policy to continue.");
            return;
        }
        setIsLoading(true);
        setError("");
        const result = await signUp({
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            email: email.trim(),
            password,
            terms_accepted: termsAccepted,
            privacy_accepted: privacyAccepted,
        });
        if (result?.error) {
            setError(result.error);
            setIsLoading(false);
            return;
        }
        setVerificationEmail(email.trim());
        setView("otp");
        setOtp("");
        setIsLoading(false);
    };

    // ── OTP verify ───────────────────────────────────────────────────────────
    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        const result = await confirmSignUp({ email: verificationEmail, code: otp });
        if (result?.error) {
            setError(result.error);
            setIsLoading(false);
            return;
        }
        toast.success("Email verified! Please sign in.");
        setIsLoading(false);
        setView("login");
        setEmail(verificationEmail);
        setPassword("");
    };

    const handleResendCode = async () => {
        setIsLoading(true);
        setError("");
        const result = await resendSignUpCode(verificationEmail);
        if (result?.error) setError(result.error);
        setIsLoading(false);
    };

    const switchTo = (v: AuthView) => {
        setView(v);
        setError("");
    };

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-[95vw] sm:max-w-[460px] p-0 overflow-hidden light rounded-2xl sm:rounded-3xl no-auth-intercept [&_input]:!text-gray-900 [&_input]:!bg-white [&_input]:![color:#121416]">
                    <DialogTitle className="sr-only">
                        {view === "login" ? "Sign In" : view === "signup" ? "Create Account" : view === "otp" ? "Verify Email" : "Check your email"}
                    </DialogTitle>
                    <div className="max-h-[90vh] overflow-y-auto p-6 sm:p-8 scrollbar-hide">

                        {/* Logo */}
                        <div className="flex justify-center mb-6">
                            <Image src="/images/logo2.png" width={110} height={40} className="object-contain" alt="AI2me" />
                        </div>

                        {/* ── OTP verification ─────────────────────────── */}
                        {view === "otp" && (
                            <div className="space-y-5">
                                <div className="text-center space-y-2">
                                    <div className="flex justify-center mb-3">
                                        <div className="w-14 h-14 rounded-full bg-[#F3F4F6] flex items-center justify-center">
                                            <Mail strokeWidth={1.5} className="h-7 w-7 text-[#121416]" />
                                        </div>
                                    </div>
                                    <CardTitle className="text-2xl font-bold text-[#121416]">Check your email</CardTitle>
                                    <CardDescription>
                                        We sent a 6-digit code to <b className="text-[#121416]">{verificationEmail}</b>
                                    </CardDescription>
                                    <p className="text-xs text-[#9CA3AF]">Can&apos;t find it? Check your spam folder.</p>
                                </div>
                                {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
                                <form onSubmit={handleVerifyOtp} className="space-y-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-[#374151] text-sm font-medium">Verification code</Label>
                                        <Input
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            placeholder="000000"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                            required
                                            className="h-12 rounded-xl border-[#E5E7EB] !text-[#121416] !bg-white text-center text-2xl tracking-widest focus-visible:ring-1 focus-visible:ring-[#6366f1]"
                                        />
                                    </div>
                                    <Button type="submit" className="w-full h-12" variant="filledBlack" disabled={isLoading || otp.length < 4}>
                                        {isLoading ? "Verifying…" : "Verify & continue"}
                                    </Button>
                                </form>
                                <p className="text-center text-sm text-[#6B7280]">
                                    Didn&apos;t get it?{" "}
                                    <button onClick={handleResendCode} disabled={isLoading} className="text-[#5146DC] font-medium hover:underline">
                                        Resend code
                                    </button>
                                </p>
                            </div>
                        )}

                        {/* ── Login ────────────────────────────────────── */}
                        {view === "login" && (
                            <div className="space-y-4">
                                <div className="mb-2">
                                    <CardTitle className="text-[28px] font-bold text-[#121416] leading-tight">Welcome back</CardTitle>
                                    <CardDescription className="text-sm text-[#6B7280] mt-1">Sign in to your AI2me workspace</CardDescription>
                                </div>
                                {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

                                {/* Social */}
                                <div className="space-y-2.5">
                                    <SocialButton onClick={() => handleSocialLogin(signInWithGoogle, "Google")} disabled={isLoading} icon={<Google className="w-4 h-4" />} label="Continue with Google" />
                                    <div className="grid grid-cols-2 gap-2">
                                        <SocialButton onClick={() => handleSocialLogin(signInWithGitHub, "GitHub")} disabled={isLoading} icon={<GitHubIcon />} label="GitHub" />
                                        <SocialButton onClick={() => handleSocialLogin(signInWithApple, "Apple")} disabled={isLoading} icon={<AppleIcon />} label="Apple" />
                                    </div>
                                </div>

                                <Divider />

                                {/* Email / password */}
                                <form onSubmit={handleLogin} className="space-y-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-[#374151] text-sm font-medium">Email</Label>
                                        <Input
                                            type="email"
                                            placeholder="you@company.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="h-12 rounded-xl border-[#E5E7EB] !text-[#121416] !bg-white focus-visible:ring-1 focus-visible:ring-[#6366f1]"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center">
                                            <Label className="text-[#374151] text-sm font-medium">Password</Label>
                                            <button type="button" onClick={() => router.push("/forgot-password")} className="text-xs text-[#5146DC] hover:underline">
                                                Forgot password?
                                            </button>
                                        </div>
                                        <div className="relative">
                                            <Input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                className="h-12 rounded-xl border-[#E5E7EB] !text-[#121416] !bg-white pr-11 focus-visible:ring-1 focus-visible:ring-[#6366f1]"
                                            />
                                            <button
                                                type="button"
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#374151]"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                    </div>
                                    <Button type="submit" className="w-full h-12 mt-1" variant="filledBlack" disabled={isLoading}>
                                        {isLoading ? "Signing in…" : "Sign in"}
                                    </Button>
                                </form>

                                <p className="text-center text-sm text-[#6B7280]">
                                    No account?{" "}
                                    <button onClick={() => switchTo("signup")} className="text-[#5146DC] font-medium hover:underline">
                                        Create one free
                                    </button>
                                </p>
                            </div>
                        )}

                        {/* ── Signup ───────────────────────────────────── */}
                        {view === "signup" && (
                            <div className="space-y-4">
                                <div className="mb-2">
                                    <CardTitle className="text-[28px] font-bold text-[#121416] leading-tight">Create your account</CardTitle>
                                    <CardDescription className="text-sm text-[#6B7280] mt-1">Free to start — no credit card required</CardDescription>
                                </div>
                                {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

                                {/* Social */}
                                <div className="space-y-2.5">
                                    <SocialButton onClick={() => handleSocialLogin(signInWithGoogle, "Google")} disabled={isLoading} icon={<Google className="w-4 h-4" />} label="Continue with Google" />
                                    <div className="grid grid-cols-2 gap-2">
                                        <SocialButton onClick={() => handleSocialLogin(signInWithGitHub, "GitHub")} disabled={isLoading} icon={<GitHubIcon />} label="GitHub" />
                                        <SocialButton onClick={() => handleSocialLogin(signInWithApple, "Apple")} disabled={isLoading} icon={<AppleIcon />} label="Apple" />
                                    </div>
                                </div>

                                <Divider />

                                {/* Email form */}
                                <form onSubmit={handleSignup} className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label className="text-[#374151] text-sm font-medium">First name</Label>
                                            <Input
                                                placeholder="Carlos"
                                                value={firstName}
                                                onChange={(e) => setFirstName(e.target.value)}
                                                required
                                                className="h-12 rounded-xl border-[#E5E7EB] !text-[#121416] !bg-white focus-visible:ring-1 focus-visible:ring-[#6366f1]"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[#374151] text-sm font-medium">Last name</Label>
                                            <Input
                                                placeholder="Cuevas"
                                                value={lastName}
                                                onChange={(e) => setLastName(e.target.value)}
                                                required
                                                className="h-12 rounded-xl border-[#E5E7EB] !text-[#121416] !bg-white focus-visible:ring-1 focus-visible:ring-[#6366f1]"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[#374151] text-sm font-medium">Email</Label>
                                        <Input
                                            type="email"
                                            placeholder="you@company.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="h-12 rounded-xl border-[#E5E7EB] !text-[#121416] !bg-white focus-visible:ring-1 focus-visible:ring-[#6366f1]"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[#374151] text-sm font-medium">Password</Label>
                                        <div className="relative">
                                            <Input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Min 8 characters"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                minLength={8}
                                                className="h-12 rounded-xl border-[#E5E7EB] !text-[#121416] !bg-white pr-11 focus-visible:ring-1 focus-visible:ring-[#6366f1]"
                                            />
                                            <button
                                                type="button"
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#374151]"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Terms */}
                                    <div className="space-y-2 pt-1">
                                        <div className="flex items-start gap-2.5">
                                            <Checkbox
                                                id="terms"
                                                checked={termsAccepted}
                                                onCheckedChange={(v) => setTermsAccepted(Boolean(v))}
                                                className="mt-0.5 rounded"
                                            />
                                            <label htmlFor="terms" className="text-xs text-[#6B7280] leading-relaxed cursor-pointer">
                                                I agree to the{" "}
                                                <a href="/terms" target="_blank" className="text-[#5146DC] underline underline-offset-2">Terms of Service</a>
                                            </label>
                                        </div>
                                        <div className="flex items-start gap-2.5">
                                            <Checkbox
                                                id="privacy"
                                                checked={privacyAccepted}
                                                onCheckedChange={(v) => setPrivacyAccepted(Boolean(v))}
                                                className="mt-0.5 rounded"
                                            />
                                            <label htmlFor="privacy" className="text-xs text-[#6B7280] leading-relaxed cursor-pointer">
                                                I agree to the{" "}
                                                <a href="/privacy" target="_blank" className="text-[#5146DC] underline underline-offset-2">Privacy Policy</a>
                                            </label>
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full h-12 mt-1"
                                        variant="filledBlack"
                                        disabled={isLoading || !termsAccepted || !privacyAccepted}
                                    >
                                        {isLoading ? "Creating account…" : "Create account"}
                                    </Button>
                                </form>

                                <p className="text-center text-sm text-[#6B7280]">
                                    Already have an account?{" "}
                                    <button onClick={() => switchTo("login")} className="text-[#5146DC] font-medium hover:underline">
                                        Sign in
                                    </button>
                                </p>
                            </div>
                        )}

                    </div>
                </DialogContent>
            </Dialog>

            <PrivacyPolicyModal
                isOpen={showPrivacyModal}
                onClose={() => setShowPrivacyModal(false)}
                onAccept={() => setShowPrivacyModal(false)}
            />
        </>
    );
}

// ── Provider icons ───────────────────────────────────────────────────────────
function GitHubIcon() {
    return (
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
        </svg>
    );
}

function AppleIcon() {
    return (
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701z" />
        </svg>
    );
}
