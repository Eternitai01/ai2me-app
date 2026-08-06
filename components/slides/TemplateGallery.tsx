"use client";

import { memo, useEffect, useMemo, useState, type ReactNode } from "react";
import { Check, X } from "lucide-react";

export interface SlideTemplate {
  id: string;
  name: string;
  description: string;
  previewColors: string[];
  accentColor: string;
  promptHint: string;
  category: string;
  intentTitle: string;
}

const CONSULTING_TEMPLATES: SlideTemplate[] = [
  {
    id: "mckinsey",
    name: "McKinsey & Company",
    description: "Dark navy, data-heavy exhibits, Exhibit captions",
    previewColors: ["#0a0e1a", "#111827"],
    accentColor: "#1E40AF",
    category: "Consulting",
    promptHint: "Replicate McKinsey & Company visual identity precisely: dark navy backgrounds (#0a0e1a, #111827), white headlines in large bold sans-serif (Inter or similar), blue (#1E40AF) data bars and callouts, thin horizontal rules between sections, numbered slide structure (Slide 1 of N), minimal decoration, dense data tables with alternating row shading, 'Exhibit X' captions below every chart or table, key insight boxes with left blue border, footer with page number and confidentiality notice. Typography is strictly sans-serif. Layout is grid-based with consistent margins. Color palette: navy, white, blue, light gray only.",
    intentTitle: "Write a Consulting Deck like a McKinsey Partner",
  },
  {
    id: "bcg",
    name: "Boston Consulting Group",
    description: "Light theme, green highlights, T-model layout",
    previewColors: ["#f8fafc", "#ffffff"],
    accentColor: "#16A34A",
    category: "Consulting",
    promptHint: "Replicate BCG (Boston Consulting Group) visual identity: white and very light gray (#f8fafc, #ffffff) backgrounds, dark charcoal (#111827) headings and body text, green (#16A34A) for key callout highlights, section titles, and data emphasis, structured T-model two-column layout (context left, implication right), data boxes with green left borders, clean professional sans-serif typography, minimal whitespace, structured logic flow visible in slide layout.",
    intentTitle: "Write a Strategy Deck like a BCG Associate",
  },
  {
    id: "bain",
    name: "Bain & Company",
    description: "Near-black bg, red emphasis, executive summary boxes",
    previewColors: ["#0f0f0f", "#1a0a0a"],
    accentColor: "#DC2626",
    category: "Consulting",
    promptHint: "Replicate Bain & Company visual identity: near-black backgrounds (#0f0f0f, #1a0a0a), white body text in clean sans-serif, red (#DC2626) for emphasis boxes, key callouts, data highlights, and section dividers, executive summary box at top of each slide with key takeaway, clean minimal layout, bold white headlines, red accent lines and borders for structure.",
    intentTitle: "Write a Consulting Deck like a Bain Caseworker",
  },
  {
    id: "deloitte",
    name: "Deloitte",
    description: "Dark teal/green, bright green accents, enterprise feel",
    previewColors: ["#003333", "#004d40"],
    accentColor: "#86EFAC",
    category: "Consulting",
    promptHint: "Replicate Deloitte visual identity: dark forest green backgrounds (#003333, #004d40), white text for headings and body, bright light green (#86EFAC) for accent highlights, data callouts, and section markers, professional enterprise layout with structured sections, clean sans-serif typography, minimal decoration, data-focused slide structure with clear hierarchy.",
    intentTitle: "Write an Enterprise Deck like a Deloitte Director",
  },
  {
    id: "ey",
    name: "Ernst & Young",
    description: "Warm dark bg, amber/yellow highlights, bold stats",
    previewColors: ["#1a1000", "#2d1f00"],
    accentColor: "#F59E0B",
    category: "Consulting",
    promptHint: "Replicate EY (Ernst & Young) visual identity: dark warm backgrounds (#1a1000, #2d1f00), white text, amber/yellow (#F59E0B) for highlights, key metrics, callout boxes, and section emphasis, large bold numbers for statistics and KPIs, clean sans-serif typography, professional structured layout, yellow accent lines and borders.",
    intentTitle: "Write a Business Deck like an EY Senior Manager",
  },
  {
    id: "pwc",
    name: "PricewaterhouseCoopers",
    description: "Dark maroon, orange-red accents, professional",
    previewColors: ["#1a0500", "#2d0c00"],
    accentColor: "#FF6B35",
    category: "Consulting",
    promptHint: "Replicate PwC (PricewaterhouseCoopers) visual identity: dark maroon backgrounds (#1a0500, #2d0c00), white text, orange-red (#FF6B35) for accent highlights, callout boxes, data emphasis, and section markers, professional clean layout, structured sans-serif typography, minimal decoration, enterprise-grade presentation style.",
    intentTitle: "Write a Consulting Deck like a PwC Principal",
  },
  {
    id: "accenture",
    name: "Accenture",
    description: "Dark purple, bright purple accents, tech-forward",
    previewColors: ["#0a000f", "#15002a"],
    accentColor: "#A855F7",
    category: "Consulting",
    promptHint: "Replicate Accenture visual identity: dark purple backgrounds (#0a000f, #15002a), white text, bright purple (#A855F7) for accent highlights, tech icons, data callouts, and section markers, technology-forward layout with modern asymmetric elements, clean bold sans-serif typography, purple gradient accents, digital transformation focused slide structure.",
    intentTitle: "Write a Tech Strategy Deck like an Accenture Managing Director",
  },
  {
    id: "oliver-wyman",
    name: "Oliver Wyman",
    description: "Deep navy, orange accents, strategic consulting",
    previewColors: ["#001133", "#001a4d"],
    accentColor: "#F97316",
    category: "Consulting",
    promptHint: "Replicate Oliver Wyman visual identity: deep navy backgrounds (#001133, #001a4d), white text, orange (#F97316) for accent highlights, key callouts, data emphasis, and section markers, strategic consulting layout with structured logic flow, clean professional sans-serif typography, orange accent lines and borders, executive-level presentation style.",
    intentTitle: "Write a Strategic Deck like an Oliver Wyman Partner",
  },
];

export const SLIDE_TEMPLATES: SlideTemplate[] = [
  ...CONSULTING_TEMPLATES,
  {
    id: "executive-dark",
    name: "Executive Dark",
    description: "Bold dark theme, white & blue type",
    previewColors: ["#0a0a0c", "#0f0f12"],
    accentColor: "#3B82F6",
    category: "Corporate",
    intentTitle: "Write an Executive Presentation like a Fortune-500 CEO",
    promptHint:
      "Use a dark executive design: black/near-black backgrounds (#0a0a0c, #111115), white headings, blue (#3B82F6) accent for highlights and data callouts. Clean sans-serif typography, minimal borders.",
  },
  {
    id: "modern-blue",
    name: "Modern Blue",
    description: "Deep navy with cyan accents",
    previewColors: ["#0d1b2a", "#1b2a3b"],
    accentColor: "#06B6D4",
    category: "Corporate",
    intentTitle: "Write a Corporate Deck like a Global VP of Strategy",
    promptHint:
      "Use a deep navy blue design: backgrounds #0d1b2a to #1b263b gradient, white body text, cyan (#06B6D4) and sky-blue (#38BDF8) accents. Clean geometric layouts with subtle grid lines.",
  },
  {
    id: "clean-white",
    name: "Clean White",
    description: "Minimal light theme, professional",
    previewColors: ["#ffffff", "#f4f4f5"],
    accentColor: "#6366F1",
    category: "Business",
    intentTitle: "Write a Clean Pitch like a Top-Tier Business Analyst",
    promptHint:
      "Use a clean minimal white design: white (#FFFFFF) and light gray (#F4F4F5) backgrounds, dark charcoal (#111827) headings, indigo (#6366F1) accent for highlights. Lots of whitespace, thin dividers.",
  },
  {
    id: "venture-pitch",
    name: "Venture Pitch",
    description: "High-contrast pitch deck style",
    previewColors: ["#09090b", "#18181b"],
    accentColor: "#F59E0B",
    category: "Startup",
    intentTitle: "Write a VC Pitch Deck like a Series A Founder",
    promptHint:
      "Use a high-contrast VC pitch deck style: near-black backgrounds (#09090b), pure white headings in large bold fonts, amber/yellow (#F59E0B) for key metrics and callouts. Oversized numbers, minimal text.",
  },
  {
    id: "tech-gradient",
    name: "Tech Gradient",
    description: "Purple-to-blue gradient, modern SaaS",
    previewColors: ["#1e1b4b", "#312e81"],
    accentColor: "#A855F7",
    category: "Startup",
    intentTitle: "Write a SaaS Pitch like a Top Product Lead",
    promptHint:
      "Use a modern SaaS design with dark purple backgrounds (#1e1b4b to #312e81 gradient), white text, purple (#A855F7) and violet (#8B5CF6) accents. Glassmorphism cards, soft glow effects.",
  },
  {
    id: "corporate-green",
    name: "Corporate Green",
    description: "Sustainability & enterprise green",
    previewColors: ["#052e16", "#14532d"],
    accentColor: "#22C55E",
    category: "Corporate",
    intentTitle: "Write a Sustainability Deck like a Chief Sustainability Officer",
    promptHint:
      "Use a corporate sustainability design: deep forest green backgrounds (#052e16, #14532d), white headings, bright green (#22C55E) and emerald (#10B981) accents. Clean, trustworthy, enterprise look.",
  },
  {
    id: "bold-red",
    name: "Bold Red",
    description: "High energy, sales & marketing",
    previewColors: ["#1a0000", "#2d0a0a"],
    accentColor: "#EF4444",
    category: "Marketing",
    intentTitle: "Write a Sales Pitch like a Top Enterprise AE",
    promptHint:
      "Use a bold high-energy design: very dark red backgrounds (#1a0000, #2d0a0a), white bold headings, red (#EF4444) and rose (#FB7185) accents. Large impactful typography, strong visual hierarchy.",
  },
  {
    id: "sunset-orange",
    name: "Sunset Orange",
    description: "Warm, creative & energetic",
    previewColors: ["#1c0d00", "#2d1500"],
    accentColor: "#F97316",
    category: "Creative",
    intentTitle: "Write a Creative Deck like a Top Brand Director",
    promptHint:
      "Use a warm creative design: deep warm dark backgrounds (#1c0d00, #2d1500), white headings, vibrant orange (#F97316) and amber (#FBBF24) accents. Creative layouts with asymmetric elements.",
  },
  {
    id: "academic",
    name: "Academic",
    description: "Research papers & education",
    previewColors: ["#1e1e2e", "#2a2a3e"],
    accentColor: "#60A5FA",
    category: "Education",
    intentTitle: "Write a Research Deck like a Top Academic Author",
    promptHint:
      "Use a clean academic design: dark navy backgrounds (#1e1e2e), white body text in readable sizes, light blue (#60A5FA) accents. Structured layouts with clear sections, data tables, citations style.",
  },
  {
    id: "marketing-pink",
    name: "Marketing Pink",
    description: "Bold brand & product marketing",
    previewColors: ["#1a0015", "#2d0025"],
    accentColor: "#EC4899",
    category: "Marketing",
    intentTitle: "Write a Brand Deck like a World-Class CMO",
    promptHint:
      "Use a bold brand marketing design: very dark magenta backgrounds (#1a0015), white bold headings, hot pink (#EC4899) and fuchsia (#D946EF) accents. Product-focused layouts with large imagery placeholders.",
  },
  {
    id: "minimal-gray",
    name: "Minimal Gray",
    description: "Ultra-clean monochrome style",
    previewColors: ["#f9fafb", "#f3f4f6"],
    accentColor: "#374151",
    category: "Business",
    intentTitle: "Write a Minimalist Deck like a Design-Forward Director",
    promptHint:
      "Use an ultra-minimal monochrome design: white and very light gray (#F9FAFB) backgrounds, dark gray (#111827) headings, medium gray (#374151) accents. Maximum whitespace, thin typography, editorial feel.",
  },
  {
    id: "investor-deck",
    name: "Investor Deck",
    description: "Series A/B fundraising standard",
    previewColors: ["#020617", "#0f172a"],
    accentColor: "#38BDF8",
    category: "Startup",
    intentTitle: "Write an Investor Deck like a Series B Growth Lead",
    promptHint:
      "Use a premium investor deck design: deep space dark (#020617, #0f172a) backgrounds, white crisp headings, sky blue (#38BDF8) accents for metrics. Clean data visualization style, executive typography.",
  },
];

export const TEMPLATE_CATEGORIES = ["All", "Consulting", "Business", "Startup", "Corporate", "Marketing", "Creative", "Education"];

/** Curated Featured strip shown above the All Templates grid. */
export const FEATURED_TEMPLATE_IDS = [
  "mckinsey",
  "venture-pitch",
  "executive-dark",
  "academic",
  "marketing-pink",
  "investor-deck",
] as const;

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Premium thumbnail layouts (Phase 2) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

type ThumbLayout =
  | "titleHero"
  | "kpiTrio"
  | "processSteps"
  | "splitColumns"
  | "barChart"
  | "productCanvas"
  | "pricingCards"
  | "agenda"
  | "matrix"
  | "boldMetric"
  | "asymmetric"
  | "editorial";

const THUMB_LAYOUT_BY_ID: Record<string, ThumbLayout> = {
  mckinsey: "barChart",
  bcg: "splitColumns",
  bain: "boldMetric",
  deloitte: "processSteps",
  ey: "kpiTrio",
  pwc: "agenda",
  accenture: "asymmetric",
  "oliver-wyman": "matrix",
  "executive-dark": "titleHero",
  "modern-blue": "productCanvas",
  "clean-white": "editorial",
  "venture-pitch": "boldMetric",
  "tech-gradient": "productCanvas",
  "corporate-green": "kpiTrio",
  "bold-red": "titleHero",
  "sunset-orange": "asymmetric",
  academic: "agenda",
  "marketing-pink": "pricingCards",
  "minimal-gray": "editorial",
  "investor-deck": "kpiTrio",
};

interface ThumbColors {
  bg1: string;
  bg2: string;
  accent: string;
  text: string;
  muted: string;
  card: string;
  uid: string;
  isLight: boolean;
}

function thumbPalette(template: SlideTemplate): ThumbColors {
  const [bg1, bg2] = template.previewColors;
  const isLight =
    bg1 === "#ffffff" ||
    bg1 === "#f4f4f5" ||
    bg1 === "#f9fafb" ||
    bg1 === "#f3f4f6" ||
    bg1 === "#f8fafc";
  return {
    bg1,
    bg2,
    accent: template.accentColor,
    text: isLight ? "#111827" : "#ffffff",
    muted: isLight ? "#6b7280" : "#94a3b8",
    card: isLight ? "rgba(15,23,42,0.06)" : "rgba(255,255,255,0.08)",
    uid: `thumb-${template.id}`,
    isLight,
  };
}

function ThumbShell({
  c,
  children,
}: {
  c: ThumbColors;
  children: ReactNode;
}) {
  return (
    <svg
      viewBox="0 0 320 200"
      className="w-full h-full object-cover"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id={`bg-${c.uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={c.bg1} />
          <stop offset="100%" stopColor={c.bg2} />
        </linearGradient>
        <linearGradient id={`acc-${c.uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={c.accent} stopOpacity="0.9" />
          <stop offset="100%" stopColor={c.accent} stopOpacity="0.35" />
        </linearGradient>
      </defs>
      <rect width="320" height="200" fill={`url(#bg-${c.uid})`} />
      {children}
    </svg>
  );
}

function LayoutTitleHero({ c }: { c: ThumbColors }) {
  return (
    <ThumbShell c={c}>
      <rect x="0" y="0" width="320" height="4" fill={c.accent} />
      <rect x="24" y="28" width="48" height="6" rx="3" fill={c.accent} opacity="0.85" />
      <rect x="24" y="52" width="200" height="16" rx="3" fill={c.text} opacity="0.95" />
      <rect x="24" y="74" width="150" height="14" rx="3" fill={c.text} opacity="0.7" />
      <rect x="24" y="108" width="180" height="5" rx="2" fill={c.muted} opacity="0.55" />
      <rect x="24" y="120" width="140" height="5" rx="2" fill={c.muted} opacity="0.4" />
      <rect x="24" y="168" width="72" height="8" rx="4" fill={`url(#acc-${c.uid})`} />
      <circle cx="276" cy="100" r="48" fill={c.accent} opacity="0.12" />
      <circle cx="292" cy="48" r="22" fill={c.accent} opacity="0.18" />
    </ThumbShell>
  );
}

function LayoutKpiTrio({ c }: { c: ThumbColors }) {
  return (
    <ThumbShell c={c}>
      <rect x="20" y="16" width="90" height="8" rx="2" fill={c.text} opacity="0.9" />
      <rect x="20" y="30" width="50" height="4" rx="2" fill={c.accent} opacity="0.7" />
      {[0, 1, 2].map((i) => {
        const x = 20 + i * 96;
        return (
          <g key={i}>
            <rect x={x} y="56" width="88" height="110" rx="10" fill={c.card} />
            <rect x={x + 12} y="72" width="36" height="18" rx="3" fill={c.accent} opacity={0.85 - i * 0.1} />
            <rect x={x + 12} y="100" width="58" height="6" rx="2" fill={c.text} opacity="0.75" />
            <rect x={x + 12} y="114" width="48" height="5" rx="2" fill={c.muted} opacity="0.45" />
            <rect x={x + 12} y="140" width="64" height="4" rx="2" fill={c.muted} opacity="0.3" />
          </g>
        );
      })}
    </ThumbShell>
  );
}

function LayoutProcessSteps({ c }: { c: ThumbColors }) {
  return (
    <ThumbShell c={c}>
      <rect x="20" y="18" width="110" height="8" rx="2" fill={c.text} opacity="0.9" />
      <rect x="20" y="32" width="160" height="5" rx="2" fill={c.muted} opacity="0.45" />
      {[0, 1, 2].map((i) => {
        const x = 24 + i * 96;
        return (
          <g key={i}>
            <circle cx={x + 16} cy={78} r="16" fill={c.accent} opacity={0.9 - i * 0.15} />
            <rect x={x + 10} y={74} width="12" height="8" rx="2" fill={c.isLight ? "#fff" : c.bg1} opacity="0.9" />
            {i < 2 && (
              <rect x={x + 36} y={76} width="44" height="3" rx="1.5" fill={c.muted} opacity="0.35" />
            )}
            <rect x={x} y="108" width="72" height="6" rx="2" fill={c.text} opacity="0.8" />
            <rect x={x} y="122" width="64" height="4" rx="2" fill={c.muted} opacity="0.4" />
            <rect x={x} y="132" width="56" height="4" rx="2" fill={c.muted} opacity="0.3" />
          </g>
        );
      })}
    </ThumbShell>
  );
}

function LayoutSplitColumns({ c }: { c: ThumbColors }) {
  return (
    <ThumbShell c={c}>
      <rect x="16" y="16" width="80" height="7" rx="2" fill={c.text} opacity="0.9" />
      <rect x="16" y="30" width="40" height="4" rx="2" fill={c.accent} opacity="0.75" />
      <rect x="16" y="52" width="138" height="132" rx="10" fill={c.card} />
      <rect x="28" y="68" width="70" height="6" rx="2" fill={c.text} opacity="0.8" />
      <rect x="28" y="86" width="100" height="4" rx="2" fill={c.muted} opacity="0.45" />
      <rect x="28" y="96" width="90" height="4" rx="2" fill={c.muted} opacity="0.35" />
      <rect x="28" y="116" width="100" height="48" rx="6" fill={c.accent} opacity="0.12" />
      <rect x="166" y="52" width="138" height="132" rx="10" fill={c.card} />
      <rect x="166" y="52" width="4" height="132" fill={c.accent} opacity="0.85" />
      <rect x="182" y="68" width="70" height="6" rx="2" fill={c.text} opacity="0.8" />
      <rect x="182" y="86" width="96" height="4" rx="2" fill={c.muted} opacity="0.45" />
      <rect x="182" y="96" width="84" height="4" rx="2" fill={c.muted} opacity="0.35" />
      <rect x="182" y="120" width="50" height="10" rx="5" fill={c.accent} opacity="0.8" />
    </ThumbShell>
  );
}

function LayoutBarChart({ c }: { c: ThumbColors }) {
  const bars = [48, 72, 56, 96, 68, 84];
  return (
    <ThumbShell c={c}>
      <rect x="20" y="14" width="100" height="8" rx="2" fill={c.text} opacity="0.9" />
      <rect x="20" y="28" width="36" height="4" rx="2" fill={c.accent} opacity="0.7" />
      <rect x="20" y="48" width="200" height="118" rx="8" fill={c.card} />
      {bars.map((h, i) => {
        const x = 36 + i * 28;
        const y = 150 - h;
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width="18"
            height={h}
            rx="3"
            fill={c.accent}
            opacity={0.45 + i * 0.08}
          />
        );
      })}
      <rect x="236" y="48" width="68" height="118" rx="8" fill={c.accent} opacity="0.15" />
      <rect x="248" y="68" width="44" height="14" rx="3" fill={c.accent} opacity="0.9" />
      <rect x="248" y="92" width="40" height="5" rx="2" fill={c.text} opacity="0.7" />
      <rect x="248" y="104" width="32" height="4" rx="2" fill={c.muted} opacity="0.4" />
      <rect x="20" y="176" width="48" height="5" rx="2" fill={c.muted} opacity="0.4" />
    </ThumbShell>
  );
}

function LayoutProductCanvas({ c }: { c: ThumbColors }) {
  return (
    <ThumbShell c={c}>
      <rect x="16" y="16" width="288" height="168" rx="12" fill={c.card} />
      <rect x="16" y="16" width="288" height="22" rx="12" fill={c.isLight ? "rgba(0,0,0,0.06)" : "rgba(0,0,0,0.25)"} />
      <rect x="16" y="30" width="288" height="8" fill={c.isLight ? "rgba(0,0,0,0.06)" : "rgba(0,0,0,0.25)"} />
      <circle cx="32" cy="27" r="3.5" fill="#ef4444" opacity="0.85" />
      <circle cx="44" cy="27" r="3.5" fill="#f59e0b" opacity="0.85" />
      <circle cx="56" cy="27" r="3.5" fill="#22c55e" opacity="0.85" />
      <rect x="28" y="52" width="64" height="116" rx="6" fill={c.isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.05)"} />
      {[0, 1, 2, 3].map((i) => (
        <rect
          key={i}
          x="38"
          y={64 + i * 22}
          width={40 - i * 4}
          height="6"
          rx="2"
          fill={i === 1 ? c.accent : c.muted}
          opacity={i === 1 ? 0.9 : 0.35}
        />
      ))}
      <rect x="106" y="52" width="182" height="70" rx="8" fill={c.accent} opacity="0.12" />
      <rect x="118" y="66" width="80" height="8" rx="2" fill={c.text} opacity="0.85" />
      <rect x="118" y="82" width="120" height="5" rx="2" fill={c.muted} opacity="0.45" />
      <rect x="118" y="94" width="100" height="5" rx="2" fill={c.muted} opacity="0.3" />
      <rect x="106" y="132" width="86" height="36" rx="6" fill={c.card} />
      <rect x="202" y="132" width="86" height="36" rx="6" fill={c.accent} opacity="0.2" />
    </ThumbShell>
  );
}

function LayoutPricingCards({ c }: { c: ThumbColors }) {
  return (
    <ThumbShell c={c}>
      <rect x="20" y="14" width="100" height="7" rx="2" fill={c.text} opacity="0.9" />
      {[0, 1, 2].map((i) => {
        const x = 18 + i * 98;
        const featured = i === 1;
        return (
          <g key={i}>
            <rect
              x={x}
              y={featured ? 36 : 48}
              width="90"
              height={featured ? 140 : 120}
              rx="10"
              fill={featured ? c.accent : c.card}
              opacity={featured ? 0.92 : 1}
            />
            <rect
              x={x + 14}
              y={featured ? 56 : 66}
              width="48"
              height="6"
              rx="2"
              fill={featured ? (c.isLight ? "#fff" : c.bg1) : c.text}
              opacity="0.85"
            />
            <rect
              x={x + 14}
              y={featured ? 78 : 88}
              width="36"
              height="14"
              rx="3"
              fill={featured ? (c.isLight ? "#fff" : c.bg1) : c.accent}
              opacity={featured ? 0.9 : 0.85}
            />
            {[0, 1, 2].map((j) => (
              <rect
                key={j}
                x={x + 14}
                y={(featured ? 110 : 118) + j * 14}
                width={50 - j * 8}
                height="4"
                rx="2"
                fill={featured ? (c.isLight ? "#fff" : c.bg1) : c.muted}
                opacity={featured ? 0.55 : 0.4}
              />
            ))}
          </g>
        );
      })}
    </ThumbShell>
  );
}

function LayoutAgenda({ c }: { c: ThumbColors }) {
  return (
    <ThumbShell c={c}>
      <rect x="20" y="16" width="70" height="7" rx="2" fill={c.text} opacity="0.9" />
      <rect x="20" y="30" width="120" height="5" rx="2" fill={c.muted} opacity="0.4" />
      {[0, 1, 2, 3].map((i) => {
        const y = 52 + i * 34;
        return (
          <g key={i}>
            <rect x="20" y={y} width="24" height="24" rx="6" fill={c.accent} opacity={0.85 - i * 0.12} />
            <rect x="56" y={y + 2} width={140 - i * 12} height="7" rx="2" fill={c.text} opacity="0.85" />
            <rect x="56" y={y + 14} width={100 - i * 8} height="5" rx="2" fill={c.muted} opacity="0.4" />
            <rect x="260" y={y + 6} width="36" height="5" rx="2" fill={c.muted} opacity="0.3" />
          </g>
        );
      })}
    </ThumbShell>
  );
}

function LayoutMatrix({ c }: { c: ThumbColors }) {
  return (
    <ThumbShell c={c}>
      <rect x="20" y="14" width="90" height="7" rx="2" fill={c.text} opacity="0.9" />
      <line x1="160" y1="44" x2="160" y2="180" stroke={c.muted} strokeOpacity="0.35" strokeWidth="1.5" />
      <line x1="36" y1="112" x2="284" y2="112" stroke={c.muted} strokeOpacity="0.35" strokeWidth="1.5" />
      <rect x="52" y="56" width="72" height="40" rx="8" fill={c.card} />
      <rect x="196" y="56" width="72" height="40" rx="8" fill={c.card} />
      <rect x="52" y="128" width="72" height="40" rx="8" fill={c.card} />
      <rect x="196" y="128" width="72" height="40" rx="8" fill={c.accent} opacity="0.85" />
      <circle cx="232" cy="148" r="8" fill={c.isLight ? "#fff" : c.bg1} opacity="0.95" />
      <rect x="60" y="70" width="40" height="5" rx="2" fill={c.muted} opacity="0.5" />
      <rect x="204" y="70" width="40" height="5" rx="2" fill={c.muted} opacity="0.5" />
      <rect x="60" y="142" width="40" height="5" rx="2" fill={c.muted} opacity="0.5" />
    </ThumbShell>
  );
}

function LayoutBoldMetric({ c }: { c: ThumbColors }) {
  return (
    <ThumbShell c={c}>
      <rect x="24" y="20" width="56" height="6" rx="3" fill={c.accent} opacity="0.85" />
      <rect x="24" y="44" width="72" height="36" rx="4" fill={c.accent} opacity="0.9" />
      <rect x="24" y="92" width="180" height="14" rx="3" fill={c.text} opacity="0.95" />
      <rect x="24" y="114" width="140" height="10" rx="3" fill={c.text} opacity="0.65" />
      <rect x="24" y="148" width="100" height="5" rx="2" fill={c.muted} opacity="0.45" />
      <rect x="24" y="160" width="80" height="5" rx="2" fill={c.muted} opacity="0.3" />
      <rect x="220" y="40" width="76" height="120" rx="12" fill={c.card} />
      <rect x="236" y="60" width="44" height="28" rx="4" fill={c.accent} opacity="0.75" />
      <rect x="236" y="100" width="48" height="5" rx="2" fill={c.text} opacity="0.7" />
      <rect x="236" y="112" width="36" height="4" rx="2" fill={c.muted} opacity="0.4" />
    </ThumbShell>
  );
}

function LayoutAsymmetric({ c }: { c: ThumbColors }) {
  return (
    <ThumbShell c={c}>
      <rect x="0" y="0" width="120" height="200" fill={c.accent} opacity="0.18" />
      <rect x="20" y="36" width="80" height="8" rx="2" fill={c.text} opacity="0.9" />
      <rect x="20" y="56" width="70" height="6" rx="2" fill={c.muted} opacity="0.5" />
      <rect x="20" y="140" width="64" height="24" rx="8" fill={c.accent} opacity="0.9" />
      <rect x="148" y="28" width="148" height="144" rx="14" fill={c.card} />
      <rect x="164" y="48" width="90" height="10" rx="2" fill={c.text} opacity="0.85" />
      <rect x="164" y="68" width="110" height="5" rx="2" fill={c.muted} opacity="0.45" />
      <rect x="164" y="80" width="96" height="5" rx="2" fill={c.muted} opacity="0.35" />
      <rect x="164" y="108" width="48" height="36" rx="8" fill={c.accent} opacity="0.25" />
      <rect x="224" y="108" width="48" height="36" rx="8" fill={c.accent} opacity="0.45" />
    </ThumbShell>
  );
}

function LayoutEditorial({ c }: { c: ThumbColors }) {
  return (
    <ThumbShell c={c}>
      <rect x="28" y="28" width="40" height="4" rx="2" fill={c.accent} opacity="0.8" />
      <rect x="28" y="48" width="200" height="12" rx="2" fill={c.text} opacity="0.92" />
      <rect x="28" y="68" width="160" height="10" rx="2" fill={c.text} opacity="0.7" />
      <line x1="28" y1="100" x2="292" y2="100" stroke={c.muted} strokeOpacity="0.35" strokeWidth="1" />
      <rect x="28" y="116" width="120" height="4" rx="2" fill={c.muted} opacity="0.5" />
      <rect x="28" y="128" width="160" height="4" rx="2" fill={c.muted} opacity="0.4" />
      <rect x="28" y="140" width="140" height="4" rx="2" fill={c.muted} opacity="0.3" />
      <rect x="28" y="164" width="56" height="6" rx="3" fill={c.accent} opacity="0.75" />
    </ThumbShell>
  );
}

function TemplateThumbnail({ template }: { template: SlideTemplate }) {
  const c = thumbPalette(template);
  const layout = THUMB_LAYOUT_BY_ID[template.id] ?? "titleHero";

  switch (layout) {
    case "kpiTrio":
      return <LayoutKpiTrio c={c} />;
    case "processSteps":
      return <LayoutProcessSteps c={c} />;
    case "splitColumns":
      return <LayoutSplitColumns c={c} />;
    case "barChart":
      return <LayoutBarChart c={c} />;
    case "productCanvas":
      return <LayoutProductCanvas c={c} />;
    case "pricingCards":
      return <LayoutPricingCards c={c} />;
    case "agenda":
      return <LayoutAgenda c={c} />;
    case "matrix":
      return <LayoutMatrix c={c} />;
    case "boldMetric":
      return <LayoutBoldMetric c={c} />;
    case "asymmetric":
      return <LayoutAsymmetric c={c} />;
    case "editorial":
      return <LayoutEditorial c={c} />;
    case "titleHero":
    default:
      return <LayoutTitleHero c={c} />;
  }
}

const MemoTemplateThumbnail = memo(TemplateThumbnail);

function AiRecommendedThumbnail() {
  return (
    <svg
      viewBox="0 0 320 200"
      className="w-full h-full object-cover"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <linearGradient id="ai-rec-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="55%" stopColor="#1e1b4b" />
          <stop offset="100%" stopColor="#0c4a6e" />
        </linearGradient>
        <linearGradient id="ai-rec-spark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#f472b6" />
        </linearGradient>
      </defs>
      <rect width="320" height="200" fill="url(#ai-rec-bg)" />
      <circle cx="250" cy="50" r="60" fill="#a855f7" opacity="0.15" />
      <circle cx="60" cy="160" r="50" fill="#38bdf8" opacity="0.12" />
      <rect x="36" y="44" width="120" height="10" rx="3" fill="#fff" opacity="0.9" />
      <rect x="36" y="64" width="90" height="7" rx="2" fill="#94a3b8" opacity="0.6" />
      <rect x="36" y="100" width="72" height="56" rx="10" fill="url(#ai-rec-spark)" opacity="0.85" />
      <rect x="120" y="112" width="72" height="44" rx="10" fill="#fff" opacity="0.1" />
      <rect x="204" y="112" width="72" height="44" rx="10" fill="#fff" opacity="0.08" />
    </svg>
  );
}

const MemoAiRecommendedThumbnail = memo(AiRecommendedThumbnail);

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Preview SVGs for TemplatePreviewModal Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

interface PreviewSlideColors {
  bg1: string;
  bg2: string;
  accent: string;
  textColor: string;
  mutedColor: string;
  uid: string;
}

/** Slide 1 Ã¢â‚¬â€œ Title slide */
function PreviewSlide1({ c }: { c: PreviewSlideColors }) {
  return (
    <svg viewBox="0 0 320 180" className="w-full rounded-lg" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`s1-${c.uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={c.bg1} />
          <stop offset="100%" stopColor={c.bg2} />
        </linearGradient>
      </defs>
      <rect width="320" height="180" fill={`url(#s1-${c.uid})`} />
      {/* Accent bar top */}
      <rect x="0" y="0" width="320" height="4" fill={c.accent} opacity="0.9" />
      {/* Company logo area */}
      <rect x="24" y="20" width="48" height="8" rx="2" fill={c.accent} opacity="0.8" />
      {/* Big headline */}
      <rect x="24" y="52" width="200" height="18" rx="3" fill={c.textColor} opacity="0.95" />
      <rect x="24" y="76" width="160" height="14" rx="3" fill={c.textColor} opacity="0.75" />
      <rect x="24" y="96" width="120" height="14" rx="3" fill={c.textColor} opacity="0.6" />
      {/* Subtitle / date */}
      <rect x="24" y="126" width="80" height="6" rx="2" fill={c.mutedColor} opacity="0.5" />
      <rect x="24" y="136" width="60" height="6" rx="2" fill={c.mutedColor} opacity="0.35" />
      {/* Right accent block */}
      <rect x="240" y="40" width="60" height="100" rx="4" fill={c.accent} opacity="0.15" />
      <rect x="248" y="60" width="44" height="44" rx="22" fill={c.accent} opacity="0.25" />
      {/* Accent bar bottom */}
      <rect x="0" y="168" width="320" height="12" fill={c.accent} opacity="0.7" />
    </svg>
  );
}

/** Slide 2 Ã¢â‚¬â€œ Executive Summary */
function PreviewSlide2({ c }: { c: PreviewSlideColors }) {
  return (
    <svg viewBox="0 0 320 180" className="w-full rounded-lg" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`s2-${c.uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={c.bg1} />
          <stop offset="100%" stopColor={c.bg2} />
        </linearGradient>
      </defs>
      <rect width="320" height="180" fill={`url(#s2-${c.uid})`} />
      {/* Accent sidebar */}
      <rect x="0" y="0" width="6" height="180" fill={c.accent} opacity="0.9" />
      {/* Slide title */}
      <rect x="18" y="14" width="120" height="10" rx="2" fill={c.textColor} opacity="0.9" />
      <rect x="18" y="28" width="60" height="4" rx="1.5" fill={c.accent} opacity="0.6" />
      {/* Bullet points */}
      {[48, 66, 84, 102].map((y, i) => (
        <g key={i}>
          <circle cx="24" cy={y + 4} r="3" fill={c.accent} opacity="0.8" />
          <rect x="32" y={y} width={110 - i * 8} height="6" rx="1.5" fill={c.textColor} opacity={0.7 - i * 0.07} />
          <rect x="32" y={y + 10} width={90 - i * 6} height="4" rx="1.5" fill={c.mutedColor} opacity="0.4" />
        </g>
      ))}
      {/* Data callout box right */}
      <rect x="170" y="40" width="132" height="90" rx="4" fill={c.accent} opacity="0.1" stroke={c.accent} strokeWidth="1" strokeOpacity="0.3" />
      <rect x="178" y="50" width="70" height="8" rx="2" fill={c.textColor} opacity="0.7" />
      <rect x="178" y="64" width="40" height="16" rx="2" fill={c.accent} opacity="0.8" />
      <rect x="178" y="86" width="80" height="5" rx="1.5" fill={c.mutedColor} opacity="0.45" />
      <rect x="178" y="95" width="65" height="5" rx="1.5" fill={c.mutedColor} opacity="0.35" />
      <rect x="178" y="104" width="70" height="5" rx="1.5" fill={c.mutedColor} opacity="0.3" />
      {/* Footer */}
      <rect x="18" y="162" width="40" height="4" rx="1.5" fill={c.mutedColor} opacity="0.3" />
      <rect x="290" y="162" width="14" height="4" rx="1.5" fill={c.accent} opacity="0.5" />
    </svg>
  );
}

/** Slide 3 Ã¢â‚¬â€œ Data / Chart slide */
function PreviewSlide3({ c }: { c: PreviewSlideColors }) {
  const bars = [80, 110, 65, 130, 95];
  const maxH = 130;
  return (
    <svg viewBox="0 0 320 180" className="w-full rounded-lg" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`s3-${c.uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={c.bg1} />
          <stop offset="100%" stopColor={c.bg2} />
        </linearGradient>
      </defs>
      <rect width="320" height="180" fill={`url(#s3-${c.uid})`} />
      {/* Accent top bar */}
      <rect x="0" y="0" width="320" height="3" fill={c.accent} opacity="0.7" />
      {/* Slide title */}
      <rect x="20" y="12" width="130" height="9" rx="2" fill={c.textColor} opacity="0.9" />
      <rect x="20" y="25" width="80" height="5" rx="1.5" fill={c.mutedColor} opacity="0.4" />
      {/* Chart area */}
      {/* X axis */}
      <line x1="30" y1="148" x2="290" y2="148" stroke={c.mutedColor} strokeWidth="1" opacity="0.4" />
      {/* Y axis */}
      <line x1="30" y1="40" x2="30" y2="148" stroke={c.mutedColor} strokeWidth="1" opacity="0.3" />
      {/* Bars */}
      {bars.map((h, i) => {
        const barH = (h / maxH) * 90;
        const x = 44 + i * 48;
        const y = 148 - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width="28" height={barH} rx="2" fill={c.accent} opacity={0.6 + i * 0.06} />
            {/* Data label */}
            <rect x={x + 2} y={y - 10} width="22" height="7" rx="1" fill={c.textColor} opacity="0.5" />
          </g>
        );
      })}
      {/* Exhibit caption */}
      <rect x="20" y="158" width="55" height="6" rx="1.5" fill={c.mutedColor} opacity="0.4" />
      <rect x="260" y="158" width="30" height="6" rx="1.5" fill={c.accent} opacity="0.5" />
    </svg>
  );
}

/** Slide 4 Ã¢â‚¬â€œ Recommendation slide */
function PreviewSlide4({ c }: { c: PreviewSlideColors }) {
  return (
    <svg viewBox="0 0 320 180" className="w-full rounded-lg" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`s4-${c.uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={c.bg1} />
          <stop offset="100%" stopColor={c.bg2} />
        </linearGradient>
      </defs>
      <rect width="320" height="180" fill={`url(#s4-${c.uid})`} />
      {/* Title */}
      <rect x="20" y="12" width="140" height="9" rx="2" fill={c.textColor} opacity="0.9" />
      <rect x="20" y="25" width="50" height="3" rx="1.5" fill={c.accent} opacity="0.7" />
      {/* Numbered items */}
      {[1, 2, 3].map((n, i) => {
        const y = 44 + i * 34;
        return (
          <g key={n}>
            <rect x="20" y={y} width="22" height="22" rx="4" fill={c.accent} opacity="0.85" />
            <rect x="50" y={y + 3} width={120 - i * 10} height="7" rx="1.5" fill={c.textColor} opacity={0.8 - i * 0.08} />
            <rect x="50" y={y + 14} width={100 - i * 8} height="5" rx="1.5" fill={c.mutedColor} opacity="0.4" />
          </g>
        );
      })}
      {/* Conclusion box */}
      <rect x="20" y="148" width="280" height="22" rx="4" fill={c.accent} opacity="0.2" />
      <rect x="28" y="154" width="180" height="6" rx="1.5" fill={c.textColor} opacity="0.7" />
      <rect x="28" y="163" width="120" height="4" rx="1.5" fill={c.mutedColor} opacity="0.45" />
    </svg>
  );
}

// ─── TemplatePreviewModal ────────────────────────────────────────────────────

interface TemplatePreviewModalProps {
  template: SlideTemplate;
  onConfirm: (t: SlideTemplate) => void;
  onClose: () => void;
}

export function TemplatePreviewModal({ template, onConfirm, onClose }: TemplatePreviewModalProps) {
  const [bg1, bg2] = template.previewColors;
  const accent = template.accentColor;
  const isLight =
    bg1 === "#ffffff" ||
    bg1 === "#f4f4f5" ||
    bg1 === "#f9fafb" ||
    bg1 === "#f3f4f6" ||
    bg1 === "#f8fafc";
  const textColor = isLight ? "#111827" : "#ffffff";
  const mutedColor = isLight ? "#6b7280" : "#9ca3af";
  const uid = `modal-${template.id}`;
  const colors: PreviewSlideColors = { bg1, bg2, accent, textColor, mutedColor, uid };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="template-preview-title"
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative z-10 bg-[#18181b] border border-[#2a2a2e] rounded-2xl shadow-[0_40px_120px_rgba(0,0,0,0.9)] w-full max-w-3xl mx-auto max-h-[92vh] overflow-y-auto flex flex-col">
        <div className="flex items-center justify-end px-3 pt-3 sm:px-4 sm:pt-4 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#2a2a2e] text-gray-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Close preview"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 sm:px-6 pb-4 sm:pb-5 space-y-5">
          <div className="w-full aspect-[16/10] rounded-xl overflow-hidden border border-[#2a2a2e] bg-[#0c0c0e]">
            <MemoTemplateThumbnail template={template} />
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id="template-preview-title"
                className="text-xl sm:text-2xl font-bold text-white tracking-tight"
              >
                {template.name}
              </h2>
              <span className="inline-flex text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full bg-white/5 text-gray-300 border border-white/10">
                {template.category}
              </span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed max-w-2xl">{template.description}</p>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wider">
              Slide Layout Previews
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Title Slide", node: <PreviewSlide1 c={colors} /> },
                { label: "Executive Summary", node: <PreviewSlide2 c={colors} /> },
                { label: "Data / Chart", node: <PreviewSlide3 c={colors} /> },
                { label: "Recommendation", node: <PreviewSlide4 c={colors} /> },
              ].map(({ label, node }) => (
                <div key={label} className="flex flex-col gap-2">
                  <div className="w-full aspect-video rounded-lg overflow-hidden border border-[#2a2a2e]">
                    {node}
                  </div>
                  <p className="text-[10px] text-gray-500 text-center font-medium">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 mt-auto px-4 sm:px-6 py-4 flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3 justify-end border-t border-[#2a2a2e] bg-[#18181b]/95 backdrop-blur-sm">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-300 bg-[#2a2a2e] hover:bg-[#3a3a3e] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(template)}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            <Check className="w-4 h-4" />
            Add &amp; Use
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── TemplateCard ─────────────────────────────────────────────────────────────

interface TemplateCardProps {
  selected: boolean;
  onSelect: () => void;
  thumbnail: ReactNode;
  name: string;
  description: string;
  categoryLabel: string;
  /** When true, card opens preview (aria/hover copy). */
  opensPreview?: boolean;
}

export const TemplateCard = memo(function TemplateCard({
  selected,
  onSelect,
  thumbnail,
  name,
  description,
  categoryLabel,
  opensPreview = false,
}: TemplateCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      aria-label={
        opensPreview
          ? `Preview ${name}. ${description}`
          : `${name}. ${description}${selected ? " Selected." : ""}`
      }
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`group relative flex flex-col rounded-2xl overflow-hidden border cursor-pointer outline-none transition-all duration-300 ease-out ${
        selected
          ? "border-[var(--chat-accent)] ring-2 ring-[var(--chat-accent)]/40 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.45)] scale-[1.01]"
          : "border-[var(--chat-border)] shadow-sm hover:border-[var(--chat-accent)]/50 hover:shadow-[0_16px_40px_-16px_rgba(0,0,0,0.5)] hover:-translate-y-0.5 sm:hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-[var(--chat-accent)]/50"
      }`}
    >
      <div className="w-full aspect-[16/10] relative overflow-hidden bg-[var(--chat-bg-secondary)]">
        <div
          className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          aria-hidden
        >
          {thumbnail}
        </div>
        <div
          className={`pointer-events-none absolute inset-0 transition-opacity duration-300 ${
            selected
              ? "opacity-0"
              : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 bg-black/25"
          }`}
          aria-hidden
        />
        {selected && (
          <div
            className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 pl-1.5 pr-2.5 py-1 rounded-full bg-[var(--chat-accent)] shadow-lg text-white"
            aria-hidden
          >
            <Check className="w-3 h-3" strokeWidth={3} />
            <span className="text-[9px] font-bold uppercase tracking-wider">Selected</span>
          </div>
        )}
        {opensPreview && !selected && (
          <div
            className="absolute inset-x-0 bottom-0 z-10 p-2.5 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0 transition-all duration-300 bg-gradient-to-t from-black/75 via-black/40 to-transparent flex justify-center pt-8 pointer-events-none"
            aria-hidden
          >
            <span className="px-3.5 py-1.5 bg-white text-gray-900 text-[10px] font-bold rounded-lg shadow-lg">
              Preview
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-col flex-1 gap-1.5 p-3 sm:p-3.5 bg-[var(--chat-bg-primary)] border-t border-[var(--chat-border)]">
        <p className="text-[12px] sm:text-[13px] font-semibold tracking-tight text-[var(--chat-text-primary)] leading-snug line-clamp-1">
          {name}
        </p>
        <p className="text-[10px] sm:text-[11px] text-[var(--chat-text-muted)] leading-relaxed line-clamp-2 min-h-[2.5em]">
          {description}
        </p>
        <span className="mt-auto inline-flex self-start text-[9px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-[var(--chat-bg-secondary)] text-[var(--chat-text-muted)] border border-[var(--chat-border)]">
          {categoryLabel}
        </span>
      </div>
    </div>
  );
});

// ─── TemplateGallery ──────────────────────────────────────────────────────────

interface TemplateGalleryProps {
  selectedId: string | null;
  /** Immediate select — AI Recommended (null) only from the gallery. */
  onSelect: (template: SlideTemplate | null) => void;
  /** Opens preview modal — catalog templates. */
  onPreview: (template: SlideTemplate) => void;
}

export function TemplateGallery({ selectedId, onSelect, onPreview }: TemplateGalleryProps) {
  const [activeCategory, setActiveCategory] = useState("All");

  const featuredIdSet = useMemo(() => new Set<string>(FEATURED_TEMPLATE_IDS), []);

  const featured = useMemo(
    () =>
      FEATURED_TEMPLATE_IDS.map((id) => SLIDE_TEMPLATES.find((t) => t.id === id)).filter(
        (t): t is SlideTemplate => Boolean(t)
      ),
    []
  );

  const filtered = useMemo(
    () =>
      activeCategory === "All"
        ? SLIDE_TEMPLATES.filter((t) => !featuredIdSet.has(t.id))
        : SLIDE_TEMPLATES.filter((t) => t.category === activeCategory),
    [activeCategory, featuredIdSet]
  );

  return (
    <div className="flex flex-col" aria-label="Presentation style gallery">
      <div
        className="sticky top-0 z-10 bg-[var(--chat-bg-primary)]/95 backdrop-blur-md border-b border-[var(--chat-border)] px-4 sm:px-6 py-3.5 flex items-center gap-2 overflow-x-auto scrollbar-none"
        role="tablist"
        aria-label="Template categories"
      >
        {TEMPLATE_CATEGORIES.map((cat) => {
          const active = activeCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--chat-accent)] ${
                active
                  ? "bg-[var(--chat-text-primary)] text-[var(--chat-bg-primary)] shadow-sm"
                  : "bg-[var(--chat-bg-secondary)] text-[var(--chat-text-muted)] hover:text-[var(--chat-text-primary)] border border-[var(--chat-border)] hover:border-[var(--chat-text-muted)]/40"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      <div className="px-4 sm:px-6 py-6 sm:py-8 space-y-10">
        {activeCategory === "All" && featured.length > 0 && (
          <section aria-labelledby="featured-templates-heading">
            <div className="mb-4">
              <h3
                id="featured-templates-heading"
                className="text-sm sm:text-base font-bold tracking-tight text-[var(--chat-text-primary)]"
              >
                Featured Templates
              </h3>
              <p className="text-[11px] text-[var(--chat-text-muted)] mt-0.5">
                Curated styles for common presentation goals
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {featured.map((tpl) => (
                <TemplateCard
                  key={`featured-${tpl.id}`}
                  selected={selectedId === tpl.id}
                  onSelect={() => onPreview(tpl)}
                  opensPreview
                  thumbnail={<MemoTemplateThumbnail template={tpl} />}
                  name={tpl.name}
                  description={tpl.description}
                  categoryLabel={tpl.category}
                />
              ))}
            </div>
          </section>
        )}

        <section aria-labelledby={activeCategory === "All" ? "all-templates-heading" : undefined}>
          {activeCategory === "All" && (
            <div className="mb-4">
              <h3
                id="all-templates-heading"
                className="text-sm sm:text-base font-bold tracking-tight text-[var(--chat-text-primary)]"
              >
                All Templates
              </h3>
              <p className="text-[11px] text-[var(--chat-text-muted)] mt-0.5">
                Browse the full catalog by style
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {activeCategory === "All" && (
              <TemplateCard
                selected={selectedId === null}
                onSelect={() => onSelect(null)}
                thumbnail={<MemoAiRecommendedThumbnail />}
                name="AI Recommended"
                description="Let AI pick the best design for your topic"
                categoryLabel="Recommended"
              />
            )}

            {filtered.map((tpl) => (
              <TemplateCard
                key={tpl.id}
                selected={selectedId === tpl.id}
                onSelect={() => onPreview(tpl)}
                opensPreview
                thumbnail={<MemoTemplateThumbnail template={tpl} />}
                name={tpl.name}
                description={tpl.description}
                categoryLabel={tpl.category}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
