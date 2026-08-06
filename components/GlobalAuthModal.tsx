"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { AuthModal } from "@/components/organisms/auth-modal";
import { useAuthModal } from "@/context/AuthModalContext";

export function GlobalAuthModal() {
    const { isOpen, view, prefillEmail, closeModal, openModal, setView } = useAuthModal();
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const authParam = searchParams.get("auth");
        const signupParam = searchParams.get("signup");
        const emailParam = searchParams.get("email");

        if (authParam === "signup" || authParam === "login") {
            openModal({ view: authParam, email: emailParam ?? "" });
        } else if (signupParam === "true") {
            openModal({ view: "signup", email: emailParam ?? "" });
        }

        if (authParam || signupParam) {
            const params = new URLSearchParams(searchParams.toString());
            params.delete("auth");
            params.delete("signup");
            params.delete("email");
            const newSearch = params.toString();
            router.replace(`${pathname}${newSearch ? `?${newSearch}` : ""}`, { scroll: false });
        }
    }, [searchParams, openModal, router, pathname]);

    return (
        <AuthModal
            open={isOpen}
            onOpenChange={closeModal}
            initialView={view}
            initialEmail={prefillEmail}
            onViewChange={setView}
        />
    );
}

