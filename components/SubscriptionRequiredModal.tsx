"use client";

import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Shield, CreditCard, Sparkles, Rocket, Zap, Crown } from "lucide-react";

interface SubscriptionRequiredModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

export function SubscriptionRequiredModal({ isOpen, onClose }: SubscriptionRequiredModalProps) {
  const router = useRouter();

  const handleRedirect = () => {
    router.push("/dashboard/subscription");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && onClose) onClose(); }}>
      <DialogContent
        className="max-w-[420px] p-0 rounded-[2rem] border-none shadow-2xl bg-white overflow-hidden"
        showCloseButton={false}
        onPointerDownOutside={() => { if (onClose) onClose(); }}
        onEscapeKeyDown={() => { if (onClose) onClose(); }}
      >
        <DialogTitle className="sr-only">Choose a Plan to Continue</DialogTitle>

        {/* Decorative Header - More Compact */}
        <div className="relative h-32 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 flex items-center justify-center overflow-hidden">
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-20 w-7 h-7 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-colors"
              aria-label="Close"
            >
              <span className="text-white text-lg leading-none">&times;</span>
            </button>
          )}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-24 h-24 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl" />
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-white rounded-full translate-x-1/2 translate-y-1/2 blur-2xl" />
          </div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center rotate-12 shadow-inner border border-white/30">
              <Crown className="w-8 h-8 text-white drop-shadow-md" />
            </div>
          </div>
        </div>

        <div className="p-8 pt-6 flex flex-col items-center text-center space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-wider mb-1">
              <Zap className="w-2.5 h-2.5 fill-indigo-700" />
              Upgrade Required
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Choose Your Power Team
            </h2>
            <p className="text-slate-500 text-sm font-medium max-w-[280px] mx-auto leading-relaxed">
              Activate your AI C-Suite agents to start scaling your professional operations.
            </p>
          </div>

          <div className="w-full bg-slate-50 p-4 rounded-2xl space-y-3 border border-slate-100">
            <div className="flex items-center gap-3 text-left">
              <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 leading-none">Full C-Suite Access</p>
                <p className="text-[10px] text-slate-500 mt-1">CEO, CTO, CMO, and more 24/7.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-left">
              <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 leading-none">Advanced Integrations</p>
                <p className="text-[10px] text-slate-500 mt-1">Connect Telegram, WhatsApp, and more.</p>
              </div>
            </div>
          </div>

          <div className="w-full space-y-3 pt-1">
            <Button
              onClick={handleRedirect}
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white text-base font-bold rounded-xl shadow-lg shadow-indigo-100 transition-all hover:scale-[1.02] active:scale-[0.98] group"
            >
              Browse Plans & Purchase
              <Rocket className="ml-2 w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </Button>

            <div className="flex items-center justify-center gap-4 pt-1 opacity-60">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Shield className="w-3 h-3" />
                <span className="text-[9px] font-bold uppercase tracking-tight">Secure</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <CreditCard className="w-3 h-3" />
                <span className="text-[9px] font-bold uppercase tracking-tight">Stripe Verified</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
