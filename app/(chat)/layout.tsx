"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

import { SubscriptionSafeGuard } from "@/components/SubscriptionSafeGuard";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  // const isPublicMedia = pathname === "/chat/media";
  // useEffect(() => {
  //   if (!loading && !user && !isPublicMedia) {
  //     router.push("/");
  //   }
  // }, [user, loading, router, isPublicMedia]);

  if (loading || !mounted) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // if (!user && !isPublicMedia) {
  //   return null;
  // }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--chat-bg-primary)] text-[var(--chat-text-primary)] transition-colors duration-200">
      <SubscriptionSafeGuard>
        {children}
      </SubscriptionSafeGuard>
    </div>
  );
}

