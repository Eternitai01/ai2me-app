"use client";

import React, { useState } from "react";
import { LogOut, CreditCard, LayoutDashboard, Settings, Building2 } from "lucide-react";
import { useCompanySettings } from "@/context/CompanySettingsContext";

interface UserMenuProps {
    user: any;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    handleSignOut: () => void;
    router: any;
    dropdownPosition?: string;
}

export function UserMenu({
    user,
    isOpen,
    setIsOpen,
    handleSignOut,
    router,
    dropdownPosition = "bottom-20 lg:bottom-0 left-1/2 lg:left-20"
}: UserMenuProps) {
    const { contactImageUrl } = useCompanySettings();
    const [imageError, setImageError] = useState(false);
    const profileImageUrl = imageError ? "" : contactImageUrl;

    return (
        <div className="relative w-auto lg:w-full flex justify-center">
            <div className="relative inline-flex">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-[var(--chat-bg-tertiary)] flex items-center justify-center hover:ring-2 ring-[var(--chat-border)] transition-all overflow-hidden cursor-pointer"
                >
                    {profileImageUrl ? (
                        <img
                            src={profileImageUrl}
                            alt={user?.full_name || "User"}
                            className="w-9 h-9 lg:w-10 lg:h-10 object-cover"
                            onError={() => setImageError(true)}
                        />
                    ) : (
                        <span className="text-xs font-semibold text-[var(--chat-text-secondary)]">
                            {(user?.full_name?.[0] || user?.email?.[0] || "U").toUpperCase()}
                        </span>
                    )}
                </button>

                {user && (
                    <span
                        className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-[var(--background)]"
                        aria-label="Online"
                    >
                        <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" />
                    </span>
                )}
            </div>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-[135]"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className={`absolute ${dropdownPosition} w-[92vw] lg:w-56 max-w-[280px] lg:max-w-none py-2 rounded-xl bg-[var(--chat-bg-secondary)] border border-[var(--chat-border)] shadow-2xl z-[140] chat-message-enter text-left`}>
                        <div className="px-4 py-3 border-b border-[var(--chat-border)] min-w-0">
                            <p className="text-sm font-medium text-[var(--chat-text-primary)] wrap-anywhere leading-snug">{user?.full_name || "User"}</p>
                            <p className="text-xs text-[var(--chat-text-muted)] wrap-anywhere leading-snug mt-0.5">{user?.email}</p>
                        </div>
                        <div className="py-1">
                            <button
                                onClick={() => {
                                    setIsOpen(false);
window.open("/company", "_blank")
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--chat-text-secondary)] hover:bg-[var(--chat-bg-hover)] hover:text-[var(--chat-text-primary)]"
                            >
                                <Building2 className="w-4 h-4" /> Company
                            </button>
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    router.push("/dashboard/credits");
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--chat-text-secondary)] hover:bg-[var(--chat-bg-hover)] hover:text-[var(--chat-text-primary)]"
                            >
                                <CreditCard className="w-4 h-4" /> Manage Credits
                            </button>
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    router.push("/dashboard");
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--chat-text-secondary)] hover:bg-[var(--chat-bg-hover)] hover:text-[var(--chat-text-primary)]"
                            >
                                <LayoutDashboard className="w-4 h-4" /> Dashboard
                            </button>
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    router.push("/dashboard/settings");
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--chat-text-secondary)] hover:bg-[var(--chat-bg-hover)] hover:text-[var(--chat-text-primary)]"
                            >
                                <Settings className="w-4 h-4" /> Settings
                            </button>
                            <button
                                onClick={handleSignOut}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--chat-error)] hover:bg-[var(--chat-error)]/10"
                            >
                                <LogOut className="w-4 h-4" /> Log Out
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
