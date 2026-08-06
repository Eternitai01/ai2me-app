"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { Check, ArrowRight, ExternalLink, ChevronDown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

// ─── Billing ─────────────────────────────────────────────────────────────────

const BILLING_OPTIONS = [
  { id: "1m",  label: "Monthly",   badge: null,        sub: "Billed monthly."         },
  { id: "12m", label: "12 Months", badge: "Save 20%",  sub: "Billed annually."        },
  { id: "24m", label: "24 Months", badge: "Save 30%",  sub: "Billed every 24 months." },
] as const;
type BillingId = "1m" | "12m" | "24m";

// ─── Credit tiers ─────────────────────────────────────────────────────────────

const PRO_CREDIT_OPTIONS  = [100, 200, 400, 800, 1200, 2000, 3000, 5000, 10000];
const BIZ_CREDIT_OPTIONS  = [300, 600, 1200, 2000, 3000, 5000, 10000];

function proPrice(credits: number): number  { return Math.round((credits / 100) * 25); }
function bizPrice(credits: number): number  { return Math.round((credits / 300) * 59); }
function applyDiscount(price: number, billing: BillingId): number {
  if (billing === "12m") return Math.round(price * 0.8);
  if (billing === "24m") return Math.round(price * 0.7);
  return price;
}

// ─── Features ─────────────────────────────────────────────────────────────────

const FREE_FEATURES = [
  "Website Builder", "App Builder", "Spreadsheet Builder",
  "Presentation Builder", "Document Builder", "Image Generation",
  "AI Chat", "Publish to AI2me Domain", "Community Support",
  "Limited AI Runtime", "Limited Hosting", "Unlimited Projects",
];

const PRO_FEATURES = [
  "Everything in Free", "Daily Builder Credits", "Credit Rollover",
  "Credit Top-Ups", "Auto Top-Ups", "Custom Domains",
  "Remove AI2me Branding", "GitHub Integration", "Code Editor",
  "Version History", "Premium AI Models", "Premium Templates",
  "Priority Generation Queue", "Email Support",
];

const BIZ_FEATURES = [
  "Everything in Pro", "Shared Team Workspace", "Unlimited Team Members",
  "Shared Credit Pool", "Workspace Roles & Permissions", "Approval Workflows",
  "Audit Logs", "Security Center", "Single Sign-On (SSO)",
  "Team Billing", "Usage Analytics", "Private Team Projects", "Priority Support",
];

const ENT_FEATURES = [
  "Everything in Business", "Private AI Infrastructure", "Dedicated AWS Environment",
  "Regional Deployment", "Enterprise Security", "Compliance Controls",
  "Dedicated Customer Success Manager", "SLA", "Custom Integrations",
  "API Access", "Procurement Support", "Volume Discounts",
  "Custom Contracts", "Onboarding & Training",
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function CreditSelector({ options, value, onChange, highlight }: {
  options: number[]; value: number; onChange: (v: number) => void; highlight: boolean;
}) {
  return (
    <div className="relative mb-3">
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full appearance-none rounded-xl px-4 py-2.5 text-sm font-semibold pr-8 border cursor-pointer focus:outline-none ${
          highlight
            ? "bg-white/10 border-white/20 text-white"
            : "bg-slate-50 border-slate-200 text-slate-800 hover:border-slate-300"
        }`}
      >
        {options.map((c) => (
          <option key={c} value={c} className="text-slate-800 bg-white">
            {c.toLocaleString()} AI2me Credits / month
          </option>
        ))}
      </select>
      <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${highlight ? "text-white/60" : "text-slate-400"}`} />
    </div>
  );
}

function InAppCheckoutButton({ planId, billing, credits, label, highlight }: {
  planId: string; billing: BillingId; credits: number; label: string; highlight: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const handleCheckout = useCallback(async () => {
    setLoading(true);
    try {
      const billingParam = billing === "1m" ? "monthly" : billing === "12m" ? "annual" : "2year";
      const res = await fetch(
        `/api/subscriptions/checkout?plan_name=${planId}&billing_cycle=${billingParam}&credits=${credits}`,
        { method: "POST", credentials: "include" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { alert(data.detail || "Checkout failed. Please try again."); return; }
      const url = data?.checkout_url || data?.url;
      if (url) { window.location.href = url; }
      else { alert("Checkout session created but no redirect URL returned."); }
    } catch { alert("Network error. Please try again."); }
    finally { setLoading(false); }
  }, [planId, billing, credits]);

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-colors disabled:opacity-60 ${
        highlight ? "bg-white text-indigo-600 hover:bg-indigo-50" : "bg-indigo-600 text-white hover:bg-indigo-700"
      }`}
    >
      {loading ? "Redirecting…" : <>{label} <ArrowRight className="w-4 h-4" /></>}
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SubscriptionClient() {
  return (
    <Suspense fallback={<div className="animate-pulse h-64 bg-gray-100 rounded-xl" />}>
      <SubscriptionPageContent />
    </Suspense>
  );
}

function SubscriptionPageContent() {
  const { user } = useAuth();
  const [billing, setBilling]       = useState<BillingId>("1m");
  const [proCredits, setProCredits] = useState(100);
  const [bizCredits, setBizCredits] = useState(300);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);

  const currentOption = BILLING_OPTIONS.find(b => b.id === billing)!;

  const proMonthly = proPrice(proCredits);
  const proFinal   = applyDiscount(proMonthly, billing);
  const bizMonthly = bizPrice(bizCredits);
  const bizFinal   = applyDiscount(bizMonthly, billing);

  useEffect(() => {
    const fetchSub = async () => {
      try {
        const res = await fetch("/api/subscriptions/current", { credentials: "include", cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data?.plan?.name) setCurrentPlan(data.plan.name.replace(/_(monthly|yearly|annual|2year|\d+)$/g, "").replace(/_\d+$/, ""));
        }
      } catch {}
    };
    if (user) fetchSub();
  }, [user]);

  return (
    <div className="space-y-8 md:pl-[10px] max-w-6xl">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Subscription</h1>
        <p className="text-muted-foreground mt-1">
          From Idea to Business Execution — one AI2me Credit powers every tool across the platform.
        </p>
      </div>

      {/* Billing toggle */}
      <div>
        <div className="inline-flex rounded-xl border border-border bg-white p-1 shadow-sm gap-1 mb-2">
          {BILLING_OPTIONS.map((b) => (
            <button
              key={b.id}
              onClick={() => setBilling(b.id)}
              className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
                billing === b.id ? "bg-slate-900 text-white shadow" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {b.label}
              {b.badge && (
                <span className={`text-[0.65rem] font-bold px-1.5 py-0.5 rounded-md ${
                  billing === b.id
                    ? "bg-white/20 text-white"
                    : b.id === "24m" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                }`}>
                  {b.badge}
                </span>
              )}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-400">{currentOption.sub}</p>
      </div>

      {/* Plan cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">

        {/* FREE */}
        <div className={`relative rounded-2xl p-6 border flex flex-col border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm transition-all ${currentPlan === "free" ? "ring-2 ring-emerald-500" : ""}`}>
          {currentPlan === "free" && (
            <div className="absolute -top-3 right-4">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500 text-white">Active</span>
            </div>
          )}
          <div className="text-xs font-bold uppercase tracking-widest mb-3 text-indigo-500">Free</div>
          <div className="mb-1">
            <span className="text-4xl font-extrabold text-slate-900">€0</span>
            <span className="text-sm ml-1 text-slate-400">/mo</span>
          </div>
          <div className="text-sm font-semibold text-slate-700 mb-0.5">5 Daily AI2me Credits</div>
          <div className="text-xs text-slate-400 mb-4">Up to 30 credits/month</div>
          <ul className="space-y-2 flex-1 mb-6">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-xs text-slate-600">
                <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-indigo-500" />{f}
              </li>
            ))}
          </ul>
          <div className="inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-bold border border-slate-200 text-slate-400 cursor-default">
            {currentPlan === "free" ? "Current Plan" : "Free"}
          </div>
        </div>

        {/* PRO */}
        <div className={`relative rounded-2xl p-6 border flex flex-col border-indigo-500 bg-indigo-600 text-white shadow-[0_20px_60px_-20px_rgba(99,102,241,0.4)] transition-all ${currentPlan === "pro" ? "ring-2 ring-emerald-400" : ""}`}>
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-white text-indigo-600 whitespace-nowrap shadow-sm">Most Popular</span>
          </div>
          {currentPlan === "pro" && (
            <div className="absolute -top-3 right-4">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500 text-white">Active</span>
            </div>
          )}
          <div className="text-xs font-bold uppercase tracking-widest mb-3 text-indigo-200">Pro</div>
          <div className="mb-1">
            <span className="text-4xl font-extrabold text-white">€{proFinal}</span>
            <span className="text-sm ml-1 text-indigo-200">/mo</span>
            {billing !== "1m" && proFinal !== proMonthly && (
              <span className="text-xs ml-2 line-through text-indigo-300">€{proMonthly}</span>
            )}
          </div>
          <CreditSelector options={PRO_CREDIT_OPTIONS} value={proCredits} onChange={setProCredits} highlight />
          <p className="text-xs italic text-indigo-200 mb-4">Perfect for entrepreneurs, founders and professionals.</p>
          <ul className="space-y-2 flex-1 mb-6">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-xs text-indigo-100">
                <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-indigo-300" />{f}
              </li>
            ))}
          </ul>
          {currentPlan === "pro" ? (
            <div className="inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-bold bg-white/20 text-white cursor-default">
              Current Plan
            </div>
          ) : (
            <InAppCheckoutButton planId="pro" billing={billing} credits={proCredits} label="Upgrade to Pro" highlight />
          )}
        </div>

        {/* BUSINESS */}
        <div className={`relative rounded-2xl p-6 border flex flex-col border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm transition-all ${currentPlan === "business" ? "ring-2 ring-emerald-500" : ""}`}>
          {currentPlan === "business" && (
            <div className="absolute -top-3 right-4">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500 text-white">Active</span>
            </div>
          )}
          <div className="text-xs font-bold uppercase tracking-widest mb-3 text-indigo-500">Business</div>
          <div className="mb-1">
            <span className="text-4xl font-extrabold text-slate-900">€{bizFinal}</span>
            <span className="text-sm ml-1 text-slate-400">/mo</span>
            {billing !== "1m" && bizFinal !== bizMonthly && (
              <span className="text-xs ml-2 line-through text-slate-400">€{bizMonthly}</span>
            )}
          </div>
          <CreditSelector options={BIZ_CREDIT_OPTIONS} value={bizCredits} onChange={setBizCredits} highlight={false} />
          <p className="text-xs italic text-slate-400 mb-4">Perfect for startups, agencies and growing businesses.</p>
          <ul className="space-y-2 flex-1 mb-6">
            {BIZ_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-xs text-slate-600">
                <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-indigo-500" />{f}
              </li>
            ))}
          </ul>
          {currentPlan === "business" ? (
            <div className="inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-bold bg-emerald-100 text-emerald-700 cursor-default">
              Current Plan
            </div>
          ) : (
            <InAppCheckoutButton planId="business" billing={billing} credits={bizCredits} label="Upgrade to Business" highlight={false} />
          )}
        </div>

        {/* ENTERPRISE */}
        <div className={`relative rounded-2xl p-6 border flex flex-col border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm transition-all ${currentPlan === "enterprise" ? "ring-2 ring-emerald-500" : ""}`}>
          {currentPlan === "enterprise" && (
            <div className="absolute -top-3 right-4">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500 text-white">Active</span>
            </div>
          )}
          <div className="text-xs font-bold uppercase tracking-widest mb-3 text-indigo-500">Enterprise</div>
          <div className="mb-1">
            <span className="text-2xl font-extrabold text-slate-900">Contact Sales</span>
          </div>
          <div className="text-sm font-semibold text-slate-700 mb-0.5">Custom Credits</div>
          <p className="text-xs italic text-slate-400 mb-4">Perfect for enterprises deploying AI at scale.</p>
          <ul className="space-y-2 flex-1 mb-6">
            {ENT_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-xs text-slate-600">
                <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-indigo-500" />{f}
              </li>
            ))}
          </ul>
          <a
            href="mailto:sales@ai2me.com"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold border border-slate-300 text-slate-800 hover:bg-slate-50 transition-colors"
          >
            Contact Sales <ArrowRight className="w-4 h-4" />
          </a>
        </div>

      </div>

      {/* Credit system callout */}
      <div className="rounded-2xl bg-slate-900 text-white p-7 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="text-indigo-400 font-semibold text-xs uppercase tracking-wide mb-1">One platform. One credit system.</p>
          <p className="text-sm text-slate-300 max-w-xl">
            AI2me Credits power everything — websites, apps, spreadsheets, presentations, AI agents,
            hosting and AI execution. No separate pricing per tool. One balance across the entire platform.
          </p>
        </div>
        <a
          href="https://ai2me.com/pricing"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl transition-colors text-sm"
        >
          View full pricing <ExternalLink className="w-4 h-4" />
        </a>
      </div>

    </div>
  );
}
