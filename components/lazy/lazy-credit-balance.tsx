"use client";

import { useEffect, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  Plus,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";

interface LazyCreditBalanceProps {
  creditBalance: {
    available_credits: number;
    total_purchased: number;
    total_used: number;
    is_low_balance: boolean;
    is_critical_balance: boolean;
  } | null;
  loading: boolean;
  error: string | null;
  onLoad: () => Promise<void>;
  onRefresh?: () => Promise<void>;
  onAddCredits: () => void;
  className?: string;
}

export function LazyCreditBalance({
  creditBalance,
  loading,
  error,
  onLoad,
  onRefresh,
  onAddCredits,
  className = "",
}: LazyCreditBalanceProps) {
  const { user, loading: authLoading } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Intersection Observer to detect when section comes into view
  useEffect(() => {
    // Don't load if user is not authenticated or still loading
    if (authLoading || !user) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsVisible(true);
          setHasLoaded(true);
          onLoad();
        }
      },
      {
        threshold: 0.1, // Trigger when 10% of the section is visible
        rootMargin: "50px", // Start loading 50px before the section comes into view
      }
    );

    const currentRef = sectionRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [onLoad, hasLoaded, authLoading, user]);

  // Reset loading state when user changes (e.g., after signup)
  useEffect(() => {
    if (user && !authLoading) {
      setHasLoaded(false);
      setIsVisible(false);
    }
  }, [user, authLoading]);

  const handleRefresh = async () => {
    if (onRefresh) {
      try {
        await onRefresh();
      } catch (error) {
        console.error("Failed to refresh credit balance:", error);
      }
    }
  };

  // Calculate derived values
  const currentBalance = creditBalance?.available_credits || 0;
  // const totalCredits = creditBalance?.total_purchased || 0

  return (
    <div ref={sectionRef} className={className}>
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/5 rounded-lg">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg sm:text-xl">Current Credit Balance</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Your available credits and usage overview
                </CardDescription>
              </div>
            </div>
            {onRefresh && hasLoaded && (
              <Button
                variant="outlineBlack"
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center gap-2 w-full sm:w-auto justify-center h-8"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
                />
                <span className="text-xs">Refresh Balance</span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {authLoading ? (
            // Authentication loading
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <div className="text-center">
                <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
                <p className="text-sm">Loading authentication...</p>
              </div>
            </div>
          ) : !user ? (
            // Not authenticated
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <div className="text-center">
                <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Refresh to view credit balance</p>
              </div>
            </div>
          ) : !isVisible ? (
            // Placeholder while waiting to load
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <div className="text-center">
                <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Scroll down to load credit balance</p>
              </div>
            </div>
          ) : loading ? (
            // Loading state
            <div className="space-y-6">
              <div className="text-center space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-12 w-32 mx-auto" />
                  <Skeleton className="h-4 w-24 mx-auto" />
                </div>
                <Skeleton className="h-10 w-32 mx-auto" />
              </div>
            </div>
          ) : error ? (
            // Error state
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
                <p className="text-destructive mb-2">
                  Failed to load credit balance
                </p>
                <p className="text-sm text-muted-foreground mb-4">{error}</p>
                <Button variant="outline" size="sm" onClick={onLoad}>
                  Try Again
                </Button>
              </div>
            </div>
          ) : (
            // Content
            <div className="text-center space-y-4 py-2">
              <div className="space-y-1">
                <div className="text-3xl sm:text-4xl font-bold text-secondary tracking-tight">
                  {currentBalance.toLocaleString("en-US")}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground font-medium uppercase tracking-wider">credits remaining</div>
              </div>

              {/* Thermometer bar */}
              {creditBalance && creditBalance.total_purchased > 0 && (
                <div className="mt-4 space-y-2 text-left">
                  {(() => {
                    const tiers = [10000, 25000, 50000, 100000];
                    const purchased = creditBalance.total_purchased;
                    const tierTotal = tiers.find(t => t >= purchased) ?? Math.ceil(purchased / 100000) * 100000;
                    const spent = tierTotal - currentBalance;
                    const usedPct = Math.min(100, (spent / tierTotal) * 100);
                    const availPct = Math.min(100, (currentBalance / tierTotal) * 100);
                    return (
                      <>
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Used: <span className="font-medium text-foreground">{spent > 0 ? spent.toLocaleString("en-US", {maximumFractionDigits: 2}) : "0"}</span></span>
                          <span>Available: <span className="font-medium text-indigo-400">{currentBalance.toLocaleString("en-US")}</span></span>
                          <span>Purchased: <span className="font-medium text-foreground">{tierTotal.toLocaleString("en-US")}</span></span>
                        </div>
                        <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                          <div className="h-full flex rounded-full overflow-hidden">
                            {usedPct > 0 && (
                              <div className="h-full bg-red-500/70 transition-all duration-500" style={{ width: `${usedPct}%` }} />
                            )}
                            <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${availPct}%` }} />
                          </div>
                        </div>
                        <div className="flex gap-4 justify-center text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-red-500/70" /> Spent</span>
                          <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-indigo-500" /> Available</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              <Button
                onClick={onAddCredits}
                variant={"outlineBlack"}
                className="w-full sm:w-auto mt-2"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Credits
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
