"use client";

import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

const PLANS = [
  { id: "basic",  name: "Basic",  channel: "Telegram",               monthly: 180, discounted: 90,  monthly12: 65,  monthly24: 49  },
  { id: "plus",   name: "Plus",   channel: "Telegram + WhatsApp",    monthly: 219, discounted: 110, monthly12: 79,  monthly24: 59, highlight: true },
  { id: "elite",  name: "Elite",  channel: "Telegram + WhatsApp + Voice", monthly: 552, discounted: 276, monthly12: 199, monthly24: 149 },
] as const;

export const BILLING = [
  { id: "monthly", label: "Monthly",  save: "Save 50%", priceKey: "discounted" as const, months: 1  },
  { id: "annual",  label: "Annual",   save: "Save 64%", priceKey: "monthly12"  as const, months: 12 },
  { id: "2y",      label: "2 Years",  save: "Save 73%", priceKey: "monthly24"  as const, months: 24 },
] as const;

export type BillingId = typeof BILLING[number]["id"];
export type PlanId    = "basic" | "plus" | "elite";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPlan?: PlanId;
  initialBilling?: BillingId;
};

export function AgentCheckoutDialog({ open, onOpenChange, initialPlan = "plus", initialBilling = "monthly" }: Props) {
  const [billing, setBilling] = useState<BillingId>(initialBilling);
  const [plan,    setPlan]    = useState<PlanId>(initialPlan);

  useEffect(() => {
    if (open) { setBilling(initialBilling); setPlan(initialPlan); }
  }, [open, initialBilling, initialPlan]);

  const [email,       setEmail]       = useState("");
  const [telegramId,  setTelegramId]  = useState("");
  const [agentName,   setAgentName]   = useState("");
  const [agentGender, setAgentGender] = useState<"female" | "male">("female");
  const [agreed,      setAgreed]      = useState(false);
  const [loading,     setLoading]     = useState(false);

  const billingInfo  = BILLING.find((b) => b.id === billing);
  const priceKey     = billingInfo?.priceKey ?? "discounted";
  const months       = billingInfo?.months ?? 1;
  const selectedPlan = PLANS.find((p) => p.id === plan);
  const monthlyPrice = selectedPlan?.[priceKey] ?? 0;
  const totalDue     = monthlyPrice * months;

  const handleCheckout = useCallback(async () => {
    if (loading || !agreed || !email || !telegramId || !agentName.trim()) return;
    setLoading(true);
    try {
      const channel = plan === "basic" ? "telegram" : plan === "plus" ? "telegram+whatsapp" : "all";
      const res = await fetch("/api/agentos247/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), plan, type: "instant", duration: months, channel, agent_name: agentName.trim(), agent_gender: agentGender, telegram_user_id: telegramId.trim() || undefined }),
      });
      const data = await res.json();
      if (data.url || data.checkoutUrl) {
        window.location.href = data.url || data.checkoutUrl;
      } else {
        throw new Error(data.error || "No checkout URL returned");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Checkout failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [loading, agreed, email, telegramId, plan, months, agentName, agentGender]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-4 !bg-white text-slate-900" style={{backgroundColor:'#ffffff', color:'#0f172a'}}>
        <DialogHeader className="space-y-0.5 text-left">
          <DialogTitle className="text-base font-extrabold text-slate-900">Launch your AI agent</DialogTitle>
          <p className="text-xs text-slate-500">Powered by AgentOS247 — live in seconds after payment.</p>
        </DialogHeader>

        {/* Billing toggle */}
        <div className="mt-2 grid grid-cols-3 rounded-lg border border-slate-200 bg-slate-100 p-1">
          {BILLING.map((b) => (
            <button key={b.id} onClick={() => setBilling(b.id)}
              className={`rounded-md px-2 py-1 text-xs font-semibold transition-colors leading-tight ${billing === b.id ? "bg-indigo-600 text-white" : "text-slate-600 hover:text-slate-900 bg-transparent"}`}>
              <div>{b.label}</div>
              <div className="text-[0.6rem] opacity-80">{b.save}</div>
            </button>
          ))}
        </div>

        {/* Plan selector */}
        <div className="mt-2 space-y-1">
          {PLANS.map((p) => {
            const price = p[priceKey];
            const selected = plan === p.id;
            return (
              <button key={p.id} onClick={() => setPlan(p.id)}
                className={`w-full flex items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors bg-white ${selected ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:border-slate-400"}`}>
                <div>
                  <div className="font-bold text-sm text-slate-900">{p.name}</div>
                  <div className="text-[11px] text-slate-500">{p.channel}</div>
                </div>
                <div className="text-right">
                  <div className="text-base font-extrabold text-slate-900">€{price}</div>
                  <div className="text-[11px] text-slate-400 line-through">€{p.monthly}</div>
                  
                </div>
              </button>
            );
          })}
        </div>

        {/* Form fields */}
        <div className="mt-2 space-y-2">
          <div>
            <label className="text-xs font-semibold text-slate-700">Email <span className="text-red-500">*</span></label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
              className="mt-0.5 w-full rounded-md border border-slate-300 bg-white text-slate-900 placeholder-slate-400 px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700">Telegram ID <span className="text-red-500">*</span></label>
            <input required value={telegramId} onChange={(e) => setTelegramId(e.target.value.replace(/\D/g, ""))} placeholder="Numbers only"
              className="mt-0.5 w-full rounded-md border border-slate-300 bg-white text-slate-900 placeholder-slate-400 px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500" />
            <p className="mt-0.5 text-[11px] text-slate-400">
              Open{" "}<a className="text-indigo-500" href="https://t.me/chatid_echo_bot" target="_blank" rel="noreferrer">@chatid_echo_bot</a>{" "}in Telegram to get your ID
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-slate-700">Agent name <span className="text-red-500">*</span></label>
              <input required value={agentName} onChange={(e) => setAgentName(e.target.value)} placeholder="Alex, Sofia..."
                className="mt-0.5 w-full rounded-md border border-slate-300 bg-white text-slate-900 placeholder-slate-400 px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Voice</label>
              <div className="mt-0.5 grid grid-cols-2 gap-1">
                {(["female", "male"] as const).map((g) => (
                  <button key={g} type="button" onClick={() => setAgentGender(g)}
                    className={`flex items-center justify-center gap-1 rounded-md border px-2 py-1.5 text-xs font-semibold transition-colors bg-white ${agentGender === g ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-600 hover:border-slate-400"}`}>
                    <span>{g === "female" ? "♀" : "♂"}</span>
                    <span className="capitalize">{g}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <label className="flex items-start gap-2 text-xs cursor-pointer">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5" />
            <span className="text-slate-600">
              I agree to the{" "}
              <a href="https://agentos247.com/terms" target="_blank" rel="noreferrer" className="text-indigo-500">Terms of Service</a>{" "}and{" "}
              <a href="https://agentos247.com/privacy" target="_blank" rel="noreferrer" className="text-indigo-500">Privacy Policy</a>
            </span>
          </label>
        </div>

        {/* Total */}
        {months > 1 && (
          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-semibold text-slate-600">Total due today:</span>
              <span className="text-lg font-extrabold text-slate-900">€{totalDue}</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-400">€{monthlyPrice} × {months} months</div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-3 flex gap-2">
          <button onClick={() => onOpenChange(false)}
            className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Cancel
          </button>
          <button disabled={!agreed || !email || !telegramId || !agentName.trim() || loading} onClick={handleCheckout}
            className="flex-[2] rounded-lg bg-indigo-600 text-white px-3 py-2 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</> : "Continue to payment →"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
