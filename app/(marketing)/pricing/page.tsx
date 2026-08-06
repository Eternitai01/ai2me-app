"use client";

import { useState, useCallback } from "react";
import { Check, ArrowRight, Minus, Zap, Globe, AppWindow, Sheet, Presentation, FileText, Image, Bot, HelpCircle, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ─── Billing ────────────────────────────────────────────────────────────────

const BILLING_OPTIONS = [
  { id: "1m",  label: "Monthly",   badge: null,       sub: "Billed monthly."          },
  { id: "12m", label: "12 Months", badge: "Save 20%", sub: "Billed annually."         },
  { id: "24m", label: "24 Months", badge: "Save 30%", sub: "Billed every 24 months."  },
] as const;
type BillingId = "1m" | "12m" | "24m";

// ─── Pro credit selector ─────────────────────────────────────────────────────

const PRO_CREDIT_OPTIONS = [100, 200, 400, 800, 1200, 2000, 3000, 5000, 10000];
const PRO_BASE_PRICE = 25; // €/mo per 100 credits
function proPrice(credits: number): number {
  return Math.round((credits / 100) * PRO_BASE_PRICE);
}

// ─── Business credit selector ─────────────────────────────────────────────────

const BIZ_CREDIT_OPTIONS = [300, 600, 1200, 2000, 3000, 5000, 10000];
const BIZ_BASE_PRICE = 59; // €/mo per 300 credits
function bizPrice(credits: number): number {
  return Math.round((credits / 300) * BIZ_BASE_PRICE);
}

function applyDiscount(price: number, billing: BillingId): number {
  if (billing === "12m") return Math.round(price * 0.8);
  if (billing === "24m") return Math.round(price * 0.7);
  return price;
}

// ─── Static plan feature lists ───────────────────────────────────────────────

const FREE_FEATURES = [
  "Website Builder",
  "App Builder",
  "Spreadsheet Builder",
  "Presentation Builder",
  "Document Builder",
  "Image Generation",
  "AI Chat",
  "Publish to AI2me Domain",
  "Community Support",
  "Limited AI Runtime",
  "Limited Hosting",
  "Unlimited Projects",
];

const PRO_FEATURES = [
  "Everything in Free",
  "Daily Builder Credits",
  "Credit Rollover",
  "Credit Top-Ups",
  "Auto Top-Ups",
  "Custom Domains",
  "Remove AI2me Branding",
  "GitHub Integration",
  "Code Editor",
  "Version History",
  "Premium AI Models",
  "Premium Templates",
  "Priority Generation Queue",
  "Email Support",
];

const BIZ_FEATURES = [
  "Everything in Pro",
  "Shared Team Workspace",
  "Unlimited Team Members",
  "Shared Credit Pool",
  "Workspace Roles & Permissions",
  "Approval Workflows",
  "Audit Logs",
  "Security Center",
  "Single Sign-On (SSO)",
  "Team Billing",
  "Usage Analytics",
  "Private Team Projects",
  "Priority Support",
];

const ENT_FEATURES = [
  "Everything in Business",
  "Private AI Infrastructure",
  "Dedicated AWS Environment",
  "Regional Deployment",
  "Enterprise Security",
  "Compliance Controls",
  "Dedicated Customer Success Manager",
  "SLA",
  "Custom Integrations",
  "API Access",
  "Procurement Support",
  "Volume Discounts",
  "Custom Contracts",
  "Onboarding & Training",
];

// ─── Comparison table ────────────────────────────────────────────────────────

const COMPARISON_ROWS: { label: string; free: boolean | string; pro: boolean | string; business: boolean | string; enterprise: boolean | string }[] = [
  { label: "AI2me Credits",            free: "Daily",    pro: "Flexible", business: "Flexible", enterprise: "Custom"  },
  { label: "Websites",                 free: true,       pro: true,       business: true,       enterprise: true      },
  { label: "Apps",                     free: true,       pro: true,       business: true,       enterprise: true      },
  { label: "Spreadsheets",             free: true,       pro: true,       business: true,       enterprise: true      },
  { label: "Presentations",            free: true,       pro: true,       business: true,       enterprise: true      },
  { label: "Documents",                free: true,       pro: true,       business: true,       enterprise: true      },
  { label: "Images",                   free: true,       pro: true,       business: true,       enterprise: true      },
  { label: "AI Runtime",               free: "Limited",  pro: true,       business: true,       enterprise: true      },
  { label: "Hosting",                  free: "Limited",  pro: true,       business: true,       enterprise: true      },
  { label: "Custom Domains",           free: false,      pro: true,       business: true,       enterprise: true      },
  { label: "GitHub",                   free: false,      pro: true,       business: true,       enterprise: true      },
  { label: "Code Editor",              free: false,      pro: true,       business: true,       enterprise: true      },
  { label: "Premium AI Models",        free: false,      pro: true,       business: true,       enterprise: true      },
  { label: "Credit Rollover",          free: false,      pro: true,       business: true,       enterprise: true      },
  { label: "Team Workspace",           free: false,      pro: false,      business: true,       enterprise: true      },
  { label: "Unlimited Members",        free: false,      pro: false,      business: true,       enterprise: true      },
  { label: "Shared Credits",           free: false,      pro: false,      business: true,       enterprise: true      },
  { label: "SSO",                      free: false,      pro: false,      business: true,       enterprise: true      },
  { label: "Audit Logs",               free: false,      pro: false,      business: true,       enterprise: true      },
  { label: "Security Center",          free: false,      pro: false,      business: true,       enterprise: true      },
  { label: "Dedicated Infrastructure", free: false,      pro: false,      business: false,      enterprise: true      },
];

// ─── Credit usage examples ────────────────────────────────────────────────────

const CREDIT_EXAMPLES = [
  { icon: Globe,        label: "Landing Pages",      range: "40–70"   },
  { icon: AppWindow,    label: "Web Apps",            range: "15–25"   },
  { icon: Sheet,        label: "Spreadsheets",        range: "60–100"  },
  { icon: Presentation, label: "Presentations",       range: "30–50"   },
  { icon: FileText,     label: "Business Documents",  range: "50–80"   },
  { icon: Image,        label: "AI Images",           range: "100–400" },
  { icon: Bot,          label: "AI Agent Workflows",  range: "10–20"   },
  { icon: Globe,        label: "Business Websites",   range: "20–40"   },
];

// ─── FAQ ──────────────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: "What is an AI2me Credit?",
    a: "An AI2me Credit is the universal currency that powers every action on the platform — generating a website, running an AI agent, creating a spreadsheet, hosting your project, or generating an image. One credit system across every tool. No hidden per-tool fees.",
  },
  {
    q: "How many credits does a typical project use?",
    a: "Simple projects like landing pages or documents use fewer credits. Complex web apps, AI agents, or multi-page websites use more. The estimates shown are illustrative — actual usage varies with project complexity. You can always top up credits if you need more.",
  },
  {
    q: "Do unused credits roll over?",
    a: "Yes, on Pro and above. Credits unused at the end of the month roll over to the next month, so nothing is wasted.",
  },
  {
    q: "Can I buy more credits mid-month?",
    a: "Yes. Pro and above plans support one-time Credit Top-Ups and Auto Top-Ups, which automatically add credits when your balance runs low.",
  },
  {
    q: "Can I change my credit amount after subscribing?",
    a: "Yes. You can upgrade or downgrade your credit tier at any time from your account settings. Changes take effect at the next billing cycle.",
  },
  {
    q: "What happens to my projects if I downgrade?",
    a: "Your projects and data are always yours. If you downgrade, you keep everything already built. Some features — like custom domains and GitHub integration — will be paused until you re-upgrade.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Monthly plans can be cancelled at any time with no penalty. Annual and 24-month plans are billed upfront; cancellation stops future renewals but the current term is non-refundable.",
  },
  {
    q: "What is the difference between AI Runtime and Hosting?",
    a: "AI Runtime is the compute used when an AI agent is actively working — generating content, answering queries, running automations. Hosting is the infrastructure that keeps your published websites and apps live. Free plans have limits on both; paid plans get full unrestricted access.",
  },
  {
    q: "Is there a free trial for paid plans?",
    a: "We offer a Free plan you can use indefinitely with no credit card required. Paid plans can be upgraded at any time.",
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function Cell({ value }: { value: boolean | string }) {
  if (value === true)  return <Check className="w-4 h-4 text-indigo-500 mx-auto" />;
  if (value === false) return <Minus className="w-4 h-4 text-slate-300 mx-auto" />;
  return <span className="text-xs font-semibold text-slate-700">{value}</span>;
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-4 text-left gap-4">
        <span className="font-semibold text-slate-900 text-sm">{q}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <p className="text-sm text-slate-600 pb-4 leading-relaxed">{a}</p>}
    </div>
  );
}

function CreditSelector({ options, value, onChange, highlight }: {
  options: number[];
  value: number;
  onChange: (v: number) => void;
  highlight: boolean;
}) {
  return (
    <div className="relative mb-4">
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

function CheckoutButton({ planId, billing, label, highlight, credits }: { planId: string; billing: BillingId; label: string; highlight: boolean; credits?: number }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCheckout = useCallback(async () => {
    setLoading(true);
    try {
      const billingParam = billing === "1m" ? "monthly" : billing === "12m" ? "annual" : "2year";
      const creditsParam = credits ? `&credits=${credits}` : "";
      const res = await fetch(`/api/subscriptions/checkout?plan_name=${planId}&billing_cycle=${billingParam}${creditsParam}`, {
        method: "POST",
        credentials: "include",
      });
      if (res.status === 401) {
        router.push(`/sign-up?redirect=/pricing&plan=${planId}&billing=${billing}`);
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { alert(data.detail || "Checkout failed. Please try again."); return; }
      const url = data?.checkout_url || data?.url;
      if (url) { window.location.href = url; }
      else { alert("Checkout session created but no redirect URL returned."); }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [planId, billing, router]);

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-colors disabled:opacity-60 ${
        highlight
          ? "bg-white text-indigo-600 hover:bg-indigo-50"
          : "bg-indigo-600 text-white hover:bg-indigo-700"
      }`}
    >
      {loading ? "Redirecting…" : <>{label} <ArrowRight className="w-4 h-4" /></>}
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const [billing, setBilling] = useState<BillingId>("1m");
  const [proCredits, setProCredits] = useState(100);
  const [bizCredits, setBizCredits] = useState(300);

  const currentOption = BILLING_OPTIONS.find(b => b.id === billing)!;

  const proMonthly = proPrice(proCredits);
  const proFinal   = applyDiscount(proMonthly, billing);
  const bizMonthly = bizPrice(bizCredits);
  const bizFinal   = applyDiscount(bizMonthly, billing);

  return (
    <div className="min-h-screen bg-white">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="pt-28 pb-16 px-4 text-center bg-slate-50 border-b border-slate-100">
        <p className="text-sm font-semibold text-indigo-600 mb-4 tracking-wide uppercase">
          Subscription
        </p>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-5 tracking-tight leading-tight">
          From Idea to<br />
          <span className="text-indigo-600">Business Execution.</span>
        </h1>
        <p className="text-base text-slate-500 max-w-2xl mx-auto leading-relaxed mb-3">
          Create MVPs, launch products, automate operations and scale your business with one unified AI platform.
        </p>
        <div className="inline-block border border-slate-200 bg-white rounded-2xl px-8 py-4 shadow-sm mb-10">
          <p className="text-sm font-semibold text-slate-700">
            One AI2me Credit powers every tool across the AI2me platform.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm gap-1 mb-3">
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
                    : b.id === "24m"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-green-100 text-green-700"
                }`}>
                  {b.badge}
                </span>
              )}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-400">{currentOption.sub}</p>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-16">

        {/* ── Plan cards ───────────────────────────────────────────────────── */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">

          {/* FREE */}
          <div className="relative rounded-2xl p-7 border border-slate-200 bg-white hover:border-slate-300 hover:shadow-md transition-shadow flex flex-col">
            <div className="text-xs font-bold uppercase tracking-widest mb-3 text-indigo-500">Free</div>
            <div className="mb-3">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-slate-900">€0</span>
                <span className="text-sm text-slate-400">/mo</span>
              </div>
            </div>
            <div className="text-sm font-bold text-slate-800 mb-1">5 Daily AI2me Credits</div>
            <div className="text-xs text-slate-500 mb-1">Up to 30 Credits/month</div>
            <div className="text-xs text-slate-400 mb-5">Limited AI Runtime · Limited Hosting</div>
            <ul className="space-y-2 flex-1 mb-7">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-xs text-slate-600">
                  <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-indigo-500" />{f}
                </li>
              ))}
            </ul>
            <Link
              href="/sign-up"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Start Free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* PRO */}
          <div className="relative rounded-2xl p-7 border border-indigo-500 bg-indigo-600 text-white shadow-[0_20px_60px_-20px_rgba(99,102,241,0.4)] flex flex-col">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-white text-indigo-600 whitespace-nowrap shadow-sm">
                Most Popular
              </span>
            </div>
            <div className="text-xs font-bold uppercase tracking-widest mb-3 text-indigo-200">Pro</div>
            <div className="mb-2">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-4xl font-extrabold text-white">€{proFinal}</span>
                <span className="text-sm text-indigo-200">/mo</span>
                {billing !== "1m" && proFinal !== proMonthly && (
                  <span className="text-sm line-through text-indigo-300">€{proMonthly}</span>
                )}
              </div>
            </div>
            <CreditSelector options={PRO_CREDIT_OPTIONS} value={proCredits} onChange={setProCredits} highlight />
            <p className="text-xs italic text-indigo-200 mb-5">
              Perfect for entrepreneurs, founders and professionals.
            </p>
            <ul className="space-y-2 flex-1 mb-7">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-xs text-indigo-100">
                  <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-indigo-300" />{f}
                </li>
              ))}
            </ul>
            <CheckoutButton planId="pro" billing={billing} label="Upgrade to Pro" highlight credits={proCredits} />
          </div>

          {/* BUSINESS */}
          <div className="relative rounded-2xl p-7 border border-slate-200 bg-white hover:border-slate-300 hover:shadow-md transition-shadow flex flex-col">
            <div className="text-xs font-bold uppercase tracking-widest mb-3 text-indigo-500">Business</div>
            <div className="mb-2">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-4xl font-extrabold text-slate-900">€{bizFinal}</span>
                <span className="text-sm text-slate-400">/mo</span>
                {billing !== "1m" && bizFinal !== bizMonthly && (
                  <span className="text-sm line-through text-slate-400">€{bizMonthly}</span>
                )}
              </div>
            </div>
            <CreditSelector options={BIZ_CREDIT_OPTIONS} value={bizCredits} onChange={setBizCredits} highlight={false} />
            <p className="text-xs italic text-slate-400 mb-5">
              Perfect for startups, agencies and growing businesses.
            </p>
            <ul className="space-y-2 flex-1 mb-7">
              {BIZ_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-xs text-slate-600">
                  <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-indigo-500" />{f}
                </li>
              ))}
            </ul>
            <CheckoutButton planId="business" billing={billing} label="Upgrade to Business" highlight={false} credits={bizCredits} />
          </div>

          {/* ENTERPRISE */}
          <div className="relative rounded-2xl p-7 border border-slate-200 bg-white hover:border-slate-300 hover:shadow-md transition-shadow flex flex-col">
            <div className="text-xs font-bold uppercase tracking-widest mb-3 text-indigo-500">Enterprise</div>
            <div className="mb-2">
              <span className="text-2xl font-extrabold text-slate-900">Contact Sales</span>
            </div>
            <div className="text-sm font-bold text-slate-800 mb-1">Custom Credits</div>
            <p className="text-xs italic text-slate-400 mb-5">
              Perfect for enterprises and organizations deploying AI at scale.
            </p>
            <ul className="space-y-2 flex-1 mb-7">
              {ENT_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-xs text-slate-600">
                  <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-indigo-500" />{f}
                </li>
              ))}
            </ul>
            <a
              href="mailto:sales@ai2me.com"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold border border-slate-300 text-slate-800 bg-white hover:bg-slate-50 transition-colors"
            >
              Contact Sales <ArrowRight className="w-4 h-4" />
            </a>
          </div>

        </div>

        {/* ── One Credit System ─────────────────────────────────────────────── */}
        <div className="mt-20 bg-slate-50 border border-slate-100 rounded-2xl p-10">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-extrabold text-slate-900 mb-3">One Credit System</h2>
            <p className="text-sm text-slate-500 max-w-xl mx-auto">
              One AI2me Credit works across every AI2me product. No separate pricing per product. One shared credit balance.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 max-w-4xl mx-auto">
            {[
              { icon: Globe,        label: "Website Builder"       },
              { icon: AppWindow,    label: "App Builder"           },
              { icon: Sheet,        label: "Spreadsheet Builder"   },
              { icon: Presentation, label: "Presentation Builder"  },
              { icon: FileText,     label: "Document Builder"      },
              { icon: Image,        label: "Image Generation"      },
              { icon: Bot,          label: "AI Chat"               },
              { icon: Bot,          label: "AI Agents"             },
              { icon: Zap,          label: "Hosting"               },
              { icon: Zap,          label: "AI Runtime"            },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3">
                <Icon className="w-4 h-4 text-indigo-500 shrink-0" />
                <span className="text-sm font-medium text-slate-700">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Typical Credit Usage ──────────────────────────────────────────── */}
        <div className="mt-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Typical Credit Usage</h2>
            <p className="text-sm text-slate-400 max-w-lg mx-auto">
              Illustrative examples — actual usage varies with project complexity.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CREDIT_EXAMPLES.map(({ icon: Icon, label, range }) => (
              <div key={label} className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex items-start gap-4">
                <div className="bg-indigo-100 rounded-xl p-2.5 shrink-0">
                  <Icon className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-slate-900 leading-none mb-1">≈ {range}</div>
                  <div className="text-sm text-slate-500">{label}</div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-slate-400 mt-5">
            Mix and match — one credit balance powers every tool across the entire platform.
          </p>
        </div>

        {/* ── How Credits Work ─────────────────────────────────────────────── */}
        <div className="mt-20 grid lg:grid-cols-3 gap-6">
          <div className="bg-indigo-600 text-white rounded-2xl p-7">
            <Zap className="w-7 h-7 text-indigo-200 mb-4" />
            <h3 className="text-lg font-extrabold mb-2">How Credits Work</h3>
            <p className="text-sm text-indigo-200 leading-relaxed">
              One AI2me Credit powers every tool on the platform. Whether you're building a website,
              running an AI agent, generating an image, or hosting a project — it all comes from
              the same credit balance. No separate billing per tool.
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-7">
            <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center mb-4">
              <Check className="w-4 h-4 text-indigo-600" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 mb-2">What's Included</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              {["Website & App Builder","Spreadsheet Builder","Presentation Builder","Document Builder","Image Generation","AI Chat & AI Agents","Publishing & Hosting","Version History (Pro+)","Team Workspace (Business+)"].map(f => (
                <li key={f} className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-indigo-500 shrink-0" />{f}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-7">
            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center mb-4">
              <Sheet className="w-4 h-4 text-slate-600" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 mb-2">Per-Action Estimates</h3>
            <div className="space-y-2 text-sm text-slate-600">
              {[
                ["Landing page",     "1–3 credits"],
                ["Business website", "3–6 credits"],
                ["Web app",          "4–10 credits"],
                ["Spreadsheet",      "1–2 credits"],
                ["Presentation",     "2–4 credits"],
                ["AI image",         "0.25–1 credit"],
                ["AI agent run",     "5–10 credits"],
                ["Hosting / month",  "1–2 credits"],
              ].map(([task, cost]) => (
                <div key={task} className="flex justify-between">
                  <span>{task}</span>
                  <span className="font-semibold text-slate-800 tabular-nums">{cost}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-4">Estimates. Actual usage varies with complexity.</p>
          </div>
        </div>

        {/* ── Comparison table ──────────────────────────────────────────────── */}
        <div className="mt-20">
          <h2 className="text-2xl font-extrabold text-slate-900 text-center mb-8">Compare plans</h2>
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left px-5 py-4 font-semibold text-slate-500 w-1/3">Feature</th>
                  {(["Free","Pro","Business","Enterprise"] as const).map((name) => (
                    <th key={name} className={`px-4 py-4 text-center font-bold ${name === "Pro" ? "text-indigo-600" : "text-slate-900"}`}>
                      {name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row, i) => (
                  <tr key={row.label} className={`border-b border-slate-100 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
                    <td className="px-5 py-3 text-slate-700 font-medium">{row.label}</td>
                    <td className="px-4 py-3 text-center"><Cell value={row.free} /></td>
                    <td className="px-4 py-3 text-center"><Cell value={row.pro} /></td>
                    <td className="px-4 py-3 text-center"><Cell value={row.business} /></td>
                    <td className="px-4 py-3 text-center"><Cell value={row.enterprise} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── FAQ ──────────────────────────────────────────────────────────── */}
        <div className="mt-20 max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-8 justify-center">
            <HelpCircle className="w-6 h-6 text-indigo-500" />
            <h2 className="text-2xl font-extrabold text-slate-900">Frequently Asked Questions</h2>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl px-7 py-2">
            {FAQS.map((faq) => <FaqItem key={faq.q} q={faq.q} a={faq.a} />)}
          </div>
        </div>

        {/* ── Footer callout ────────────────────────────────────────────────── */}
        <div className="mt-16 rounded-2xl bg-slate-900 text-white p-10 text-center">
          <p className="text-indigo-400 font-semibold text-sm mb-3">One platform. One credit system.</p>
          <h3 className="text-2xl font-extrabold mb-4">AI2me Credits power everything.</h3>
          <p className="text-slate-400 max-w-2xl mx-auto text-sm leading-relaxed mb-8">
            From websites and apps to spreadsheets, presentations, AI agents, hosting and AI execution.
            No separate pricing for each tool. One simple credit balance across the entire AI2me platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-7 py-3 rounded-xl transition-colors text-sm"
            >
              Start for free <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="mailto:sales@ai2me.com"
              className="inline-flex items-center justify-center gap-2 border border-slate-600 hover:border-slate-400 text-slate-300 hover:text-white font-bold px-7 py-3 rounded-xl transition-colors text-sm"
            >
              Contact Sales
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
