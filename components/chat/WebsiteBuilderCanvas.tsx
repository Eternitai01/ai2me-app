"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Eye, Upload, Zap, Rocket,
  GripVertical, Plus, Trash2, ChevronUp, ChevronDown,
  Monitor, Smartphone, Tablet, Settings,
  AlignLeft, Grid3X3, MessageSquare, DollarSign, Minus,
  Image, Phone, Users, Star, BookOpen, Map,
  Layout, LayoutGrid, ExternalLink
} from "lucide-react";

// ─── Component Catalogue ──────────────────────────────────────────────────────

interface ComponentDef {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  preview: React.ReactNode;   // mini thumbnail shown in the panel
  defaultProps: Record<string, string | number | boolean>;
}

const COMPONENTS: ComponentDef[] = [
  // ── Layout ──
  {
    id: "navbar",
    label: "Navigation",
    description: "Top nav with logo and links",
    icon: <Layout size={15}/>,
    category: "Layout",
    preview: (
      <div className="w-full h-full bg-gray-900 flex items-center px-2 gap-2">
        <div className="w-4 h-1.5 bg-orange-400 rounded-sm"/>
        <div className="flex gap-1.5 ml-auto">
          {[0,1,2,3].map(i=><div key={i} className="w-4 h-1 bg-gray-600 rounded-sm"/>)}
          <div className="w-6 h-1 bg-orange-400 rounded-sm"/>
        </div>
      </div>
    ),
    defaultProps: { logo: "Brand", ctaText: "Get Started" }
  },
  {
    id: "hero",
    label: "Hero Section",
    description: "Full-width banner with headline, subhead, CTA",
    icon: <Star size={15}/>,
    category: "Layout",
    preview: (
      <div className="w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-center gap-1 px-2">
        <div className="w-16 h-1.5 bg-white/80 rounded-sm"/>
        <div className="w-24 h-1 bg-white/40 rounded-sm"/>
        <div className="w-10 h-2.5 bg-orange-400 rounded-sm mt-1"/>
      </div>
    ),
    defaultProps: { headline: "Welcome", subheadline: "Build something amazing", ctaText: "Get Started", ctaLink: "#" }
  },
  {
    id: "footer",
    label: "Footer",
    description: "Site footer with links, copyright, social",
    icon: <Minus size={15}/>,
    category: "Layout",
    preview: (
      <div className="w-full h-full bg-gray-900 flex flex-col items-center justify-end pb-1 gap-1">
        <div className="flex gap-2">
          {[0,1,2,3].map(i=><div key={i} className="w-4 h-1 bg-gray-600 rounded-sm"/>)}
        </div>
        <div className="w-16 h-0.5 bg-gray-700 rounded-sm"/>
        <div className="w-12 h-1 bg-gray-600 rounded-sm"/>
      </div>
    ),
    defaultProps: { brand: "Brand", copyright: `© ${new Date().getFullYear()}` }
  },
  // ── Sections ──
  {
    id: "features",
    label: "Features Grid",
    description: "3-column grid of features with icons",
    icon: <Grid3X3 size={15}/>,
    category: "Sections",
    preview: (
      <div className="w-full h-full bg-gray-800 flex flex-col items-center justify-center gap-1.5 px-2">
        <div className="w-12 h-1 bg-white/50 rounded-sm"/>
        <div className="flex gap-1.5 mt-1">
          {[0,1,2].map(i=>(
            <div key={i} className="flex flex-col items-center gap-0.5">
              <div className="w-3 h-3 bg-orange-400 rounded-sm"/>
              <div className="w-6 h-0.5 bg-gray-500 rounded-sm"/>
              <div className="w-6 h-0.5 bg-gray-600 rounded-sm"/>
            </div>
          ))}
        </div>
      </div>
    ),
    defaultProps: { columns: 3, title: "Features" }
  },
  {
    id: "about",
    label: "About / Story",
    description: "Two-column text + image layout",
    icon: <BookOpen size={15}/>,
    category: "Sections",
    preview: (
      <div className="w-full h-full bg-gray-800 flex items-center gap-2 px-2">
        <div className="flex flex-col gap-1 flex-1">
          <div className="w-12 h-1 bg-white/60 rounded-sm"/>
          <div className="w-16 h-0.5 bg-gray-500 rounded-sm"/>
          <div className="w-14 h-0.5 bg-gray-500 rounded-sm"/>
          <div className="w-10 h-0.5 bg-gray-500 rounded-sm"/>
        </div>
        <div className="w-10 h-8 bg-gray-600 rounded-sm"/>
      </div>
    ),
    defaultProps: { title: "Our Story", body: "We are passionate about what we do." }
  },
  {
    id: "gallery",
    label: "Gallery",
    description: "Photo grid showcase",
    icon: <Image size={15}/>,
    category: "Sections",
    preview: (
      <div className="w-full h-full bg-gray-800 p-1.5">
        <div className="grid grid-cols-3 gap-0.5 h-full">
          {[0,1,2,3,4,5].map(i=><div key={i} className="bg-gray-600 rounded-sm"/>)}
        </div>
      </div>
    ),
    defaultProps: { columns: 3, title: "Gallery" }
  },
  {
    id: "testimonials",
    label: "Testimonials",
    description: "Customer quotes with avatars",
    icon: <MessageSquare size={15}/>,
    category: "Sections",
    preview: (
      <div className="w-full h-full bg-gray-800 flex items-center gap-1.5 px-2">
        {[0,1,2].map(i=>(
          <div key={i} className="flex flex-col gap-0.5 items-center flex-1">
            <div className="w-4 h-4 bg-gray-600 rounded-full"/>
            <div className="w-8 h-0.5 bg-gray-500 rounded-sm"/>
            <div className="w-6 h-0.5 bg-gray-600 rounded-sm"/>
          </div>
        ))}
      </div>
    ),
    defaultProps: { count: 3, title: "What clients say" }
  },
  {
    id: "team",
    label: "Team",
    description: "Team member cards with photos",
    icon: <Users size={15}/>,
    category: "Sections",
    preview: (
      <div className="w-full h-full bg-gray-800 flex items-center justify-center gap-2 px-2">
        {[0,1,2].map(i=>(
          <div key={i} className="flex flex-col items-center gap-0.5">
            <div className="w-6 h-6 bg-gray-600 rounded-full"/>
            <div className="w-8 h-0.5 bg-gray-500 rounded-sm"/>
            <div className="w-6 h-0.5 bg-gray-600 rounded-sm"/>
          </div>
        ))}
      </div>
    ),
    defaultProps: { count: 3, title: "Meet the Team" }
  },
  {
    id: "stats",
    label: "Stats / Numbers",
    description: "Key metrics with large numbers",
    icon: <Zap size={15}/>,
    category: "Sections",
    preview: (
      <div className="w-full h-full bg-gray-900 flex items-center justify-center gap-3 px-2">
        {[0,1,2,3].map(i=>(
          <div key={i} className="flex flex-col items-center gap-0.5">
            <div className="w-6 h-2 bg-orange-400 rounded-sm"/>
            <div className="w-5 h-0.5 bg-gray-600 rounded-sm"/>
          </div>
        ))}
      </div>
    ),
    defaultProps: { count: 4 }
  },
  {
    id: "cta",
    label: "Call to Action",
    description: "Full-width CTA banner",
    icon: <Rocket size={15}/>,
    category: "Sections",
    preview: (
      <div className="w-full h-full bg-orange-500 flex flex-col items-center justify-center gap-1">
        <div className="w-20 h-1.5 bg-white/80 rounded-sm"/>
        <div className="w-12 h-0.5 bg-white/50 rounded-sm"/>
        <div className="w-10 h-2.5 bg-white rounded-sm mt-0.5"/>
      </div>
    ),
    defaultProps: { headline: "Ready to get started?", ctaText: "Start Free" }
  },
  // ── Commerce ──
  {
    id: "pricing",
    label: "Pricing Table",
    description: "Three-tier pricing with features",
    icon: <DollarSign size={15}/>,
    category: "Commerce",
    preview: (
      <div className="w-full h-full bg-gray-800 flex items-center gap-1 px-1.5">
        {[0,1,2].map(i=>(
          <div key={i} className={`flex-1 h-10 rounded-sm flex flex-col items-center justify-center gap-0.5 ${i===1 ? 'bg-orange-500' : 'bg-gray-700'}`}>
            <div className="w-5 h-0.5 bg-white/60 rounded-sm"/>
            <div className="w-4 h-1 bg-white/80 rounded-sm"/>
            <div className="w-3 h-0.5 bg-white/40 rounded-sm"/>
          </div>
        ))}
      </div>
    ),
    defaultProps: { tiers: 3, title: "Simple Pricing" }
  },
  {
    id: "menu",
    label: "Menu / Product Grid",
    description: "Product or menu item cards",
    icon: <LayoutGrid size={15}/>,
    category: "Commerce",
    preview: (
      <div className="w-full h-full bg-gray-800 p-1.5">
        <div className="grid grid-cols-2 gap-1 h-full">
          {[0,1,2,3].map(i=>(
            <div key={i} className="bg-gray-700 rounded-sm flex flex-col overflow-hidden">
              <div className="flex-1 bg-gray-600"/>
              <div className="p-0.5 flex flex-col gap-0.5">
                <div className="w-full h-0.5 bg-gray-400 rounded-sm"/>
                <div className="w-3 h-0.5 bg-orange-400 rounded-sm"/>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    defaultProps: { columns: 2, title: "Our Menu" }
  },
  // ── Contact ──
  {
    id: "contact",
    label: "Contact",
    description: "Contact form + info",
    icon: <Phone size={15}/>,
    category: "Contact",
    preview: (
      <div className="w-full h-full bg-gray-800 flex items-center gap-2 px-2">
        <div className="flex flex-col gap-1 flex-1">
          {[0,1,2].map(i=><div key={i} className="h-1.5 bg-gray-600 rounded-sm w-full"/>)}
          <div className="h-2.5 bg-gray-600 rounded-sm w-full"/>
          <div className="w-10 h-2 bg-orange-400 rounded-sm"/>
        </div>
        <div className="flex flex-col gap-1 w-12">
          <div className="w-10 h-0.5 bg-gray-500 rounded-sm"/>
          <div className="w-10 h-0.5 bg-gray-500 rounded-sm"/>
          <div className="w-8 h-0.5 bg-gray-500 rounded-sm"/>
        </div>
      </div>
    ),
    defaultProps: { title: "Get in Touch", email: "hello@brand.com" }
  },
  {
    id: "map",
    label: "Location / Map",
    description: "Address and map embed",
    icon: <Map size={15}/>,
    category: "Contact",
    preview: (
      <div className="w-full h-full bg-gray-700 flex items-center justify-center">
        <div className="w-12 h-8 bg-gray-500 rounded-sm flex items-center justify-center">
          <Map size={10} className="text-orange-400"/>
        </div>
      </div>
    ),
    defaultProps: { address: "123 Main St", city: "Miami, FL" }
  },
  // ── Blog ──
  {
    id: "blog",
    label: "Blog / Articles",
    description: "Article cards grid",
    icon: <AlignLeft size={15}/>,
    category: "Content",
    preview: (
      <div className="w-full h-full bg-gray-800 p-1.5">
        <div className="flex gap-1 h-full">
          {[0,1,2].map(i=>(
            <div key={i} className="flex-1 flex flex-col gap-0.5">
              <div className="flex-1 bg-gray-600 rounded-sm"/>
              <div className="w-full h-0.5 bg-gray-400 rounded-sm"/>
              <div className="w-3/4 h-0.5 bg-gray-600 rounded-sm"/>
            </div>
          ))}
        </div>
      </div>
    ),
    defaultProps: { columns: 3, title: "Latest News" }
  },
  {
    id: "faq",
    label: "FAQ",
    description: "Accordion of questions",
    icon: <MessageSquare size={15}/>,
    category: "Content",
    preview: (
      <div className="w-full h-full bg-gray-800 flex flex-col justify-center gap-1 px-2">
        {[0,1,2,3].map(i=>(
          <div key={i} className="flex items-center gap-1">
            <div className="w-14 h-0.5 bg-gray-500 rounded-sm flex-1"/>
            <div className="w-2 h-2 bg-gray-600 rounded-sm"/>
          </div>
        ))}
      </div>
    ),
    defaultProps: { count: 5, title: "Frequently Asked Questions" }
  },
];

const CATEGORIES = ["Layout", "Sections", "Commerce", "Contact", "Content"];

// ─── Added Section ────────────────────────────────────────────────────────────

interface AddedSection {
  uid: string;
  def: ComponentDef;
  props: Record<string, string | number | boolean>;
}

// ─── Section Preview ──────────────────────────────────────────────────────────

function SectionPreviewBlock({ section, index, total, onMoveUp, onMoveDown, onRemove, onSelect, selected }:
  { section: AddedSection; index: number; total: number; onMoveUp: ()=>void; onMoveDown: ()=>void; onRemove: ()=>void; onSelect: ()=>void; selected: boolean }) {

  const previewBg: Record<string, string> = {
    navbar: "bg-gray-900",
    hero: "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900",
    footer: "bg-gray-900",
    features: "bg-gray-800",
    about: "bg-gray-800",
    gallery: "bg-gray-800",
    testimonials: "bg-gray-800",
    team: "bg-gray-800",
    stats: "bg-gray-900",
    cta: "bg-orange-500",
    pricing: "bg-gray-800",
    menu: "bg-gray-800",
    contact: "bg-gray-800",
    map: "bg-gray-700",
    blog: "bg-gray-800",
    faq: "bg-gray-800",
  };

  const heightClass: Record<string, string> = {
    navbar: "h-10",
    hero: "h-32",
    footer: "h-14",
    stats: "h-14",
    cta: "h-20",
    map: "h-24",
    faq: "h-20",
  };

  return (
    <div
      onClick={onSelect}
      className={`group relative border rounded-sm cursor-pointer transition-all ${selected ? "border-orange-400 ring-1 ring-orange-400/40" : "border-gray-700 hover:border-gray-500"}`}
    >
      {/* Section label */}
      <div className="absolute top-1 left-2 z-10 flex items-center gap-1">
        <span className="text-[10px] font-medium text-white/60 bg-black/40 px-1 rounded">{section.def.label}</span>
      </div>

      {/* Controls */}
      <div className="absolute top-1 right-1 z-10 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={(e)=>{e.stopPropagation(); onMoveUp();}} disabled={index===0}
          className="p-0.5 rounded bg-black/60 text-white/70 hover:text-white disabled:opacity-30">
          <ChevronUp size={10}/>
        </button>
        <button onClick={(e)=>{e.stopPropagation(); onMoveDown();}} disabled={index===total-1}
          className="p-0.5 rounded bg-black/60 text-white/70 hover:text-white disabled:opacity-30">
          <ChevronDown size={10}/>
        </button>
        <button onClick={(e)=>{e.stopPropagation(); onRemove();}}
          className="p-0.5 rounded bg-black/60 text-red-400 hover:text-red-300">
          <Trash2 size={10}/>
        </button>
      </div>

      {/* Visual preview */}
      <div className={`w-full ${heightClass[section.def.id] || "h-24"} ${previewBg[section.def.id] || "bg-gray-800"} overflow-hidden`}>
        {section.def.preview}
      </div>
    </div>
  );
}

// ─── Property Editor ──────────────────────────────────────────────────────────

function PropertyEditor({ section, onChange }: { section: AddedSection | null; onChange: (uid: string, props: Record<string, string|number|boolean>) => void }) {
  if (!section) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 text-gray-500 p-6">
        <Settings size={28} className="opacity-40"/>
        <p className="text-xs text-center">Select a section to edit its properties</p>
      </div>
    );
  }

  const handleChange = (key: string, value: string) => {
    onChange(section.uid, { ...section.props, [key]: value });
  };

  const labelMap: Record<string, string> = {
    logo: "Logo / Brand Name", headline: "Headline", subheadline: "Subheadline",
    ctaText: "Button Text", ctaLink: "Button Link", title: "Section Title",
    body: "Body Text", columns: "Columns", count: "Items Count",
    email: "Email Address", address: "Address", city: "City",
    brand: "Brand Name", copyright: "Copyright Text", tiers: "Number of Tiers",
  };

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="flex items-center gap-2 mb-5">
        <div className="p-1.5 rounded bg-orange-500/20 text-orange-400">{section.def.icon}</div>
        <h3 className="font-semibold text-sm text-white">{section.def.label}</h3>
      </div>
      <div className="space-y-4">
        {Object.entries(section.props).map(([key, val]) => (
          <div key={key}>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 capitalize">
              {labelMap[key] || key}
            </label>
            {String(val).length > 40 ? (
              <textarea
                rows={3}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-xs text-white focus:outline-none focus:border-orange-400 transition-colors resize-none"
                value={String(val)}
                onChange={e => handleChange(key, e.target.value)}
              />
            ) : (
              <input
                type="text"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-xs text-white focus:outline-none focus:border-orange-400 transition-colors"
                value={String(val)}
                onChange={e => handleChange(key, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

// ─── Section Detector ───────────────────────────────────────────────────────
// Maps component catalog IDs → regex patterns to detect them in App.tsx source.
const SECTION_PATTERNS: Array<{ id: string; patterns: RegExp[] }> = [
  { id: "navbar",       patterns: [/\bnav(bar|igation)?\b/i, /\bheader\b.*\bnav/i] },
  { id: "hero",         patterns: [/\bhero\b/i, /\bhero[-_]section\b/i] },
  { id: "features",    patterns: [/\bfeatures?\b/i, /\bfeature[-_]grid\b/i] },
  { id: "testimonials",patterns: [/\btestimonials?\b/i, /\breviews?\b/i] },
  { id: "pricing",     patterns: [/\bpricing\b/i, /\bprice[-_]card\b/i] },
  { id: "cta",         patterns: [/\bcta\b/i, /\bcall[-_]to[-_]action\b/i] },
  { id: "gallery",     patterns: [/\bgallery\b/i, /\bphoto[-_]grid\b/i] },
  { id: "team",        patterns: [/\bteam\b/i, /\bteam[-_]section\b/i] },
  { id: "contact",     patterns: [/\bcontact\b/i, /\bcontact[-_]form\b/i] },
  { id: "faq",         patterns: [/\bfaq\b/i, /\bfrequently[-_]asked\b/i] },
  { id: "stats",       patterns: [/\bstats?\b/i, /\bstatistics\b/i, /\bcounters?\b/i] },
  { id: "blog",        patterns: [/\bblog\b/i, /\barticles?\b/i, /\bnews\b/i] },
  { id: "map",         patterns: [/\bmap\b/i, /\blocation\b/i, /\baddress\b/i] },
  { id: "footer",      patterns: [/\bfooter\b/i] },
];

function detectSectionsFromCode(code: string): ComponentDef[] {
  const lc = code.toLowerCase();
  const found: ComponentDef[] = [];
  const usedIds = new Set<string>();
  for (const { id, patterns } of SECTION_PATTERNS) {
    if (usedIds.has(id)) continue;
    if (patterns.some(p => p.test(lc))) {
      const def = COMPONENTS.find(c => c.id === id);
      if (def) { found.push(def); usedIds.add(id); }
    }
  }
  return found;
}

export default function WebsiteBuilderCanvas({ sessionId }: { sessionId?: string }) {
  const [sections, setSections] = useState<AddedSection[]>([]);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);

  // On mount: if we have a sessionId, fetch App.tsx and detect existing sections
  useEffect(() => {
    if (!sessionId || sections.length > 0) return;
    setIsLoadingExisting(true);
    fetch(`/api/chat/projects/${sessionId}/files/src%2FApp.tsx`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then((data: { content?: string }) => {
        const code = data.content || "";
        const defs = detectSectionsFromCode(code);
        if (defs.length > 0) {
          setSections(defs.map(def => ({
            uid: `${def.id}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            def,
            props: { ...def.defaultProps },
          })));
        }
      })
      .catch(() => { /* no file yet — stay empty */ })
      .finally(() => setIsLoadingExisting(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [viewportMode, setViewportMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generated, setGenerated] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportedUrl, setExportedUrl] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("Layout");
  const [showPreview, setShowPreview] = useState(false);
  // generatedFiles: array of { path, content } from the generate API
  const [generatedFiles, setGeneratedFiles] = useState<{ path: string; content: string }[]>([]);

  const selectedSection = sections.find(s => s.uid === selectedUid) || null;

  const addSection = useCallback((def: ComponentDef) => {
    const uid = `${def.id}_${Date.now()}`;
    setSections(prev => [...prev, { uid, def, props: { ...def.defaultProps } }]);
    setSelectedUid(uid);
  }, []);

  const removeSection = useCallback((uid: string) => {
    setSections(prev => prev.filter(s => s.uid !== uid));
    setSelectedUid(prev => prev === uid ? null : prev);
  }, []);

  const moveSection = useCallback((uid: string, dir: "up" | "down") => {
    setSections(prev => {
      const idx = prev.findIndex(s => s.uid === uid);
      if (idx < 0) return prev;
      const next = [...prev];
      const swap = dir === "up" ? idx - 1 : idx + 1;
      if (swap < 0 || swap >= next.length) return prev;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  }, []);

  const updateProps = useCallback((uid: string, props: Record<string, string|number|boolean>) => {
    setSections(prev => prev.map(s => s.uid === uid ? { ...s, props } : s));
  }, []);

  const handleGenerate = async () => {
    if (sections.length === 0) { setGenerateError("Add at least one section first"); return; }
    setIsGenerating(true);
    setGenerateError(null);
    try {
      const components = sections.map(s => ({
        type: s.def.id,
        label: s.def.label,
        props: s.props,
      }));
      const response = await fetch("/api/ai/website/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ components, style: {}, framework: "nextjs" }),
      });
      if (!response.ok) throw new Error(`Generation failed: ${response.status}`);
      const data = await response.json();
      // Support both multi-file { files: [{path, content}] } and single-file { html, code }
      if (data.files && Array.isArray(data.files) && data.files.length > 0) {
        setGeneratedFiles(data.files);
        setGeneratedHtml(null);
      } else {
        const html = data.html || data.code || null;
        setGeneratedHtml(html);
        if (html) {
          setGeneratedFiles([{ path: "/index.html", content: html }]);
        }
      }
      setGenerated(true);
      setShowPreview(true); // auto-switch to live preview
    } catch (e: any) {
      setGenerateError(e.message || "Unknown error");
    } finally {
      setIsGenerating(false);
    }
  };

  const viewportWidth: Record<string, string> = {
    desktop: "100%",
    tablet: "768px",
    mobile: "375px",
  };

  const filteredComponents = COMPONENTS.filter(c => c.category === activeCategory);

  return (
    <div className="h-full flex flex-col bg-[var(--chat-bg-primary)] text-white overflow-hidden">

      {/* ── Top Bar ── */}
      <div className="h-11 border-b border-gray-800 flex items-center px-3 gap-3 shrink-0">
        {/* Viewport toggles */}
        <div className="flex items-center gap-0.5 bg-gray-800 rounded-md p-0.5">
          {([["desktop", <Monitor size={13}/>], ["tablet", <Tablet size={13}/>], ["mobile", <Smartphone size={13}/>]] as [string, React.ReactNode][]).map(([mode, icon]) => (
            <button
              key={mode}
              onClick={() => setViewportMode(mode as any)}
              className={`px-2 py-1 rounded transition-all ${viewportMode === mode ? "bg-gray-600 text-white" : "text-gray-500 hover:text-gray-300"}`}
            >
              {icon}
            </button>
          ))}
        </div>

        <div className="h-5 w-px bg-gray-700"/>

        {/* Section count */}
        <span className="text-xs text-gray-500">
          {isLoadingExisting ? "Detecting sections…" : sections.length === 0 ? "No sections yet" : `${sections.length} section${sections.length > 1 ? "s" : ""}`}
        </span>

        <div className="ml-auto flex items-center gap-2">
          {generateError && <span className="text-xs text-red-400 bg-red-900/30 px-2 py-1 rounded">{generateError}</span>}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">

        {/* ── Left: Component Library ── */}
        <div className="w-52 border-r border-gray-800 flex flex-col shrink-0 overflow-hidden">
          <div className="px-3 pt-3 pb-2 shrink-0">
            <p className="text-xs font-semibold text-gray-300 mb-2">Components</p>
            {/* Category tabs */}
            <div className="flex flex-wrap gap-1">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`text-[10px] px-2 py-0.5 rounded-full transition-all ${activeCategory === cat ? "bg-orange-500 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
            {filteredComponents.map(comp => (
              <button
                key={comp.id}
                onClick={() => addSection(comp)}
                className="w-full text-left border border-gray-700 hover:border-orange-400/60 rounded-md overflow-hidden transition-all group"
              >
                {/* Mini thumbnail */}
                <div className="h-12 w-full overflow-hidden relative">
                  {comp.preview}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
                    <Plus size={16} className="text-orange-400"/>
                  </div>
                </div>
                {/* Label */}
                <div className="px-2 py-1.5 bg-gray-800 group-hover:bg-gray-750">
                  <p className="text-[11px] font-medium text-gray-200">{comp.label}</p>
                  <p className="text-[10px] text-gray-500 leading-tight">{comp.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Center: Canvas ── */}
        <div className="flex-1 overflow-auto bg-gray-950 flex flex-col items-center p-4 gap-0">
          <div
            className="transition-all duration-300"
            style={{ width: viewportWidth[viewportMode], maxWidth: "100%" }}
          >
            {sections.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-600">
                <LayoutGrid size={32} className="opacity-30"/>
                <p className="text-sm">Click a component to add it to your page</p>
                <p className="text-xs">Start with Navigation + Hero</p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {sections.map((section, idx) => (
                  <SectionPreviewBlock
                    key={section.uid}
                    section={section}
                    index={idx}
                    total={sections.length}
                    onMoveUp={() => moveSection(section.uid, "up")}
                    onMoveDown={() => moveSection(section.uid, "down")}
                    onRemove={() => removeSection(section.uid)}
                    onSelect={() => setSelectedUid(section.uid)}
                    selected={selectedUid === section.uid}
                  />
                ))}
                {/* Add more prompt */}
                <div className="flex items-center justify-center h-10 border border-dashed border-gray-800 rounded-sm text-gray-700 text-xs gap-1 hover:border-gray-600 hover:text-gray-500 cursor-default transition-all mt-1">
                  <Plus size={11}/> Add more components from the panel
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Property Editor ── */}
        <div className="w-60 border-l border-gray-800 flex flex-col shrink-0 overflow-hidden bg-[var(--chat-bg-secondary)]">
          <PropertyEditor section={selectedSection} onChange={updateProps} />
        </div>

      </div>

      {/* ── Bottom Toolbar ── */}
      <div className="h-12 border-t border-gray-800 flex items-center px-4 gap-3 shrink-0">
        <span className="text-xs text-gray-500">
          {sections.length === 0 ? "Add components to build your layout" : `${sections.length} section${sections.length !== 1 ? "s" : ""} — chat to generate code`}
        </span>
      </div>
    </div>
  );
}
