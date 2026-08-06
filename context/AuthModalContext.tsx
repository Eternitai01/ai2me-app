"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

type AuthView = "login" | "signup" | "otp";

interface OpenModalOptions {
  view?: AuthView;
  email?: string;
}

interface AuthModalContextType {
    isOpen: boolean;
    view: AuthView;
    prefillEmail: string;
    openModal: (viewOrOptions?: AuthView | OpenModalOptions, email?: string) => void;
    closeModal: () => void;
    setView: (view: AuthView) => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(
    undefined
);

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [view, setViewState] = useState<AuthView>("login");
    const [prefillEmail, setPrefillEmail] = useState<string>("");

    const openModal = useCallback((viewOrOptions?: AuthView | OpenModalOptions, emailArg?: string) => {
        let initialView: AuthView = "login";
        let initialEmail = "";
        if (typeof viewOrOptions === "string") {
            initialView = viewOrOptions;
            initialEmail = emailArg ?? "";
        } else if (viewOrOptions && typeof viewOrOptions === "object") {
            initialView = viewOrOptions.view ?? "login";
            initialEmail = viewOrOptions.email ?? "";
        }
        setPrefillEmail(initialEmail);
        setViewState(initialView);
        setIsOpen(true);
    }, []);

    const closeModal = useCallback(() => {
        setIsOpen(false);
    }, []);

    const setView = useCallback((newView: AuthView) => {
        setViewState(newView);
    }, []);

    const value = React.useMemo(
        () => ({
            isOpen,
            view,
            openModal,
            closeModal,
            setView,
        }),
        [isOpen, view, prefillEmail, openModal, closeModal, setView]
    );

    return (
        <AuthModalContext.Provider value={{...value, prefillEmail}}>
            {children}
        </AuthModalContext.Provider>
    );
}

export const useAuthModal = () => {
    const context = useContext(AuthModalContext);
    if (!context) {
        throw new Error("useAuthModal must be used within AuthModalProvider");
    }
    return context;
};

