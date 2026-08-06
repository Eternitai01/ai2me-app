"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  BarChart3,
  DollarSign,
  CreditCard,
  Shield,
  Database,
  // Key, // Hidden - API Keys moved to subscription model
  Settings,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  MessageSquare,
  MessagesSquare,
  FolderOpen,
  BookOpen,
  Sparkles,
  X,
  Users,
  Lock,
  Code2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { useAuth } from "@/context/AuthContext";
import { usePlaygroundAccess } from "@/hooks/use-playground-access";
import { toast } from "sonner";
import Image from "next/image";

const navigation = [
  {
    name: "Overview",
    i18nKey: "nav.overview",
    href: "/dashboard",
    icon: LayoutDashboard,
    permission: "view_dashboard",
  },
  {
    name: "Conversations",
    i18nKey: "nav.conversations",
    href: "/dashboard/conversations",
    icon: MessagesSquare,
    permission: "view_dashboard",
  },
  {
    name: "Workspace",
    i18nKey: "nav.workspace",
    href: "/dashboard/workspace",
    icon: FolderOpen,
    permission: "view_dashboard",
  },
  {
    name: "Usage Analytics",
    i18nKey: "nav.usage_analytics",
    href: "/dashboard/usage",
    icon: BarChart3,
    permission: "view_usage_analysis",
  },
  {
    name: "Cost Management",
    i18nKey: "nav.cost_management",
    href: "/dashboard/cost-management",
    icon: DollarSign,
    permission: "view_cost_management",
  },
  {
    name: "Credits",
    i18nKey: "nav.credits",
    href: "/dashboard/credits",
    icon: CreditCard,
    permission: "view_dashboard",
  },
  {
    name: "Subscription",
    i18nKey: "nav.subscription",
    href: "/dashboard/subscription",
    icon: Sparkles,
    permission: "view_dashboard",
  },
  {
    name: "Compliance",
    i18nKey: "nav.compliance",
    href: "/dashboard/compliance",
    icon: Shield,
    permission: "view_compliance",
  },
  {
    name: "Waitlist",
    i18nKey: "nav.waitlist",
    href: "/dashboard/waitlist",
    icon: Users,
    permission: "view_waitlist",
  },
  {
    name: "Connectors",
    i18nKey: "nav.connectors",
    href: "/connectors",
    icon: Database,
    permission: "view_connectors",
  },
  // Playground hidden - using AI2me App instead
  // {
  //   name: "Playground",
  //   href: "/dashboard/playground",
  //   icon: MessageCircle,
  //   permission: "view_playground",
  // },
  {
    name: "AI2me App",
    i18nKey: "nav.ai2me_app",
    href: "/landing",
    icon: MessageSquare,
    permission: "view_playground",
    highlight: true,
  },
  {
    name: "API Docs",
    i18nKey: "nav.api_docs",
    href: "api-docs",
    icon: BookOpen,
    permission: "view_dashboard",
    isExternal: true,
  },
  // API Keys hidden - moving to subscription model
  // {
  //   name: "API Keys",
  //   href: "/dashboard/api-keys",
  //   icon: Key,
  //   permission: "view_api_keys",
  // },
  {
    name: "Settings",
    i18nKey: "nav.settings",
    href: "/dashboard/settings",
    icon: Settings,
    permission: "view_organization",
  },
];

interface DashboardSidebarProps {
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

export function DashboardSidebar({ mobileOpen, setMobileOpen }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const { t } = useLanguage();

  // Close mobile sidebar when route changes
  useEffect(() => {
    if (setMobileOpen) setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  useEffect(() => {
    const body = document.body;

    if (collapsed) {
      body.classList.add("collapsedBody");
    } else {
      body.classList.remove("collapsedBody");
    }

    // Cleanup on unmount
    return () => {
      body.classList.remove("collapsedBody");
    };
  }, [collapsed]); // Runs whenever collapsed changes

  // Reflect collapsed state as a CSS variable for layout padding
  useEffect(() => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      const padding = collapsed ? "0px" : "18rem"; // 0 when collapsed, 72 when expanded
      root.style.setProperty("--sidebar-content-padding", padding);
    }
  }, [collapsed]);
  const { loading, user } = useAuth();
  const { refreshAccess } = usePlaygroundAccess();
  const [hasPlan, setHasPlan] = useState<boolean | null>(null);

  // Check subscription status
  useEffect(() => {
    const checkSub = async () => {
      try {
        const res = await fetch("/api/subscriptions/current");
        if (res.ok) {
          const data = await res.json();
          setHasPlan(data.has_subscription);
        }
      } catch (err) {
        console.error("Error checking subscription in sidebar:", err);
      }
    };
    if (user) checkSub();
  }, [user]);

  // Function to get API docs URL based on user's region
  const getApiDocsUrl = () => {
    // In dev environment, default to EU region
    // In prod environment, use organization_country or default to EU
    const isDev = process.env.NODE_ENV === "development";

    if (isDev || !user?.organization_country) {
      // Default to EU region for dev environment or when no country is set
      return "https://eu.be.ai2me.com/docs";
    }

    // Map countries to regions (for production environment)
    const euCountries = [
      "AT",
      "BE",
      "BG",
      "HR",
      "CY",
      "CZ",
      "DK",
      "EE",
      "FI",
      "FR",
      "DE",
      "GR",
      "HU",
      "IE",
      "IT",
      "LV",
      "LT",
      "LU",
      "MT",
      "NL",
      "PL",
      "PT",
      "RO",
      "SK",
      "SI",
      "ES",
      "SE",
      "GB",
      "CH",
      "NO",
      "IS",
      "LI",
    ];

    return euCountries.includes(user.organization_country.toUpperCase())
      ? "https://eu.be.ai2me.com/docs"
      : "https://us.be.ai2me.com/docs";
  };

  // Show loading state while auth is being determined
  if (loading) {
    return (
      <div className="fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar border-r border-sidebar-border w-72 -translate-x-full lg:translate-x-0 transition-transform duration-300">
        <div className="flex h-16 items-center gap-3 px-6 border-b border-sidebar-border">
          <div className="flex-1 min-w-0">
            <div className="font-bold text-lg text-sidebar-foreground">
              <Image src="/images/ai2me_logo_new.png" alt="AI2ME" width={60} height={60} />
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-10 bg-sidebar-accent/20 rounded animate-pulse"
              />
            ))}
          </div>
        </nav>
      </div>
    );
  }

  return (
    <>
      {/* Overlay for mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen?.(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300",
          collapsed ? "w-16" : "w-72",
          // Mobile responsive classes
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo and company */}
        <div className="flex h-16 items-center gap-3 px-6 border-b border-sidebar-border">
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <Link href="/landing" className="font-bold text-lg text-sidebar-foreground">
                <Image src="/images/ai2me_logo_new.png" alt="AI2ME" width={60} height={60} />
              </Link>
            </div>
          )}
          <div className="flex items-center gap-2">
            {/* Mobile close button */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 lg:hidden text-sidebar-foreground/60 hover:text-sidebar-foreground"
              onClick={() => setMobileOpen?.(false)}
            >
              <X className="h-4 w-4" />
            </Button>

            {/* Desktop collapse button */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hidden lg:flex text-sidebar-foreground/60 hover:text-sidebar-foreground"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const isPlayground = item.name === "Playground";
            const isApiDocs = item.name === "API Docs";
            const isAI2meApp = item.name === "AI2me App";

            // Determine if the item should be locked (no plan and not the subscription page or AI2me App)
            const isSubscriptionPage = item.href === "/dashboard/subscription";
            const isLocked = hasPlan === false && !isSubscriptionPage && !isAI2meApp;

            const handleItemClick = (e: React.MouseEvent) => {
              if (isLocked) {
                e.preventDefault();
                toast.error("Plan Required", {
                  description: "Please subscribe to a plan to access this feature.",
                });
                router.push("/dashboard/subscription");
              }
            };

            const handlePlaygroundClick = async (e: React.MouseEvent) => {
              if (isLocked) return handleItemClick(e);
              if (isPlayground) {
                e.preventDefault();
                const hasAccess = await refreshAccess();
                if (hasAccess) {
                  // If user has credits, allow normal navigation
                  router.push(item.href);
                } else {
                  // Show toast and redirect to credits page
                  toast.error("🚫 Insufficient Credits", {
                    description:
                      "You need credits to access the AI Playground. Add credits to start chatting with AI models.",
                    duration: 5000,
                  });
                  router.push("/dashboard/credits");
                }
              }
            };

            const handleApiDocsClick = (e: React.MouseEvent) => {
              if (isLocked) return handleItemClick(e);
              if (isApiDocs) {
                e.preventDefault();
                const apiDocsUrl = getApiDocsUrl();
                window.open(apiDocsUrl, "_blank");
              }
            };

            return (
              <PermissionGuard key={item.name} permission={item.permission}>
                {isPlayground ? (
                  <Button
                    onClick={handlePlaygroundClick}
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3 text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent relative group",
                      isActive &&
                      "bg-sidebar-accent text-sidebar-accent-foreground",
                      collapsed && "px-2",
                      isLocked && "opacity-60 grayscale-[0.5]"
                    )}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {!collapsed && (
                      <span className="truncate">{t(item.i18nKey ?? "", item.name)}</span>
                    )}
                    {isLocked && !collapsed && (
                      <Lock className="ml-auto w-3 h-3 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                    )}
                  </Button>
                ) : isApiDocs ? (
                  <Button
                    onClick={handleApiDocsClick}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-3 text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent relative group",
                      collapsed && "px-2",
                      isLocked && "opacity-60 grayscale-[0.5]"
                    )}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {!collapsed && (
                      <span className="truncate">{t(item.i18nKey ?? "", item.name)}</span>
                    )}
                    {isLocked && !collapsed && (
                      <Lock className="ml-auto w-3 h-3 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                    )}
                  </Button>
                ) : isAI2meApp ? (
                  <Link href={isLocked ? "#" : item.href} onClick={handleItemClick}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start gap-3 hover:bg-gradient-to-r hover:from-indigo-500/10 hover:to-purple-500/10 relative group",
                        "bg-gradient-to-r from-indigo-500/5 to-purple-500/5 border border-indigo-500/20",
                        "text-indigo-600 hover:text-indigo-700",
                        collapsed && "px-2",
                        isLocked && "opacity-60 grayscale-[0.5] grayscale"
                      )}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && (
                        <span className="truncate font-medium">{t(item.i18nKey ?? "", item.name)}</span>
                      )}
                      {isLocked && !collapsed && (
                        <Lock className="ml-auto w-4 h-4 text-indigo-400" />
                      )}
                    </Button>
                  </Link>
                ) : (
                  <Link href={isLocked ? "#" : item.href} onClick={handleItemClick}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-3 text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent relative group",
                        isActive &&
                        "bg-sidebar-accent text-sidebar-accent-foreground",
                        collapsed && "px-2",
                        isLocked && "opacity-60 grayscale-[0.5]"
                      )}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && (
                        <span className="truncate">{t(item.i18nKey ?? "", item.name)}</span>
                      )}
                      {isLocked && !collapsed && (
                        <Lock className="ml-auto w-3 h-3 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                      )}
                    </Button>
                  </Link>
                )}
              </PermissionGuard>
            );
          })}
        </nav>

        {/* Status indicator */}
        {!collapsed && (
          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center gap-2 text-sm">
              <div className="h-2 w-2 bg-green-500 rounded-full" />
              <span className="text-sidebar-foreground/80">
                All Systems Operational
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                99.97% Uptime
              </Badge>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
