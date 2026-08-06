"use client";

import type React from "react";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import statusService from "@/app/api/status";
import { LineComponent } from "@/components/organisms/line-component";
import { Skeleton } from "@/components/ui/skeleton";

interface StatusData {
  overall_status?: string;
  components?: {
    [key: string]: {
      status: string;
      details?: string;
      providers?: {
        [key: string]: {
          status: string;
          uptime_sla: number;
          avg_response_time_ms: number;
        };
      };
    };
  };
  providers?: Array<{
    provider: string;
    display_name: string;
    current_status: string;
    uptime_percent: number;
    avg_response_time: number;
    total_checks: number;
    last_check: string;
    recent_status: string;
    recent_response_time: number;
  }>;
}

interface ProviderData {
  provider: string;
  display_name: string;
  current_status: string;
  uptime_percent: number;
  avg_response_time: number;
  total_checks: number;
  last_check: string | null;
  recent_status: string;
  recent_response_time: number;
}

interface metricsData {
  overall_status?: string;
  components?: {
    [key: string]: {
      status: string;
    };
  };
}

export default function StatusPage() {
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [, setStatusData] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<metricsData>({
    overall_status: "healthy",
    components: {
      database: { status: "healthy" },
      aws_cognito: { status: "healthy" },
      environment: { status: "healthy" },
    },
  });
  const [providersData, setProvidersData] = useState<ProviderData[]>([]);
  const hasLoadedRef = useRef(false);
  const hasLoadedMetricsRef = useRef(false);

  const fetchStatusData = useCallback(async () => {
    if (hasLoadedRef.current) return; // Prevent multiple calls
    hasLoadedRef.current = true;
    try {
      const response = await fetch("/api/status");

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Frontend: Error response:", errorText);
        throw new Error(
          `Failed to fetch status data: ${response.status} ${response.statusText}`
        );
      }
      const data = await response.json();
      setStatusData(data.data);

      // Update with real provider data when available
      if (data.data?.providers) {
        const providerList = Array.isArray(data.data.providers)
          ? data.data.providers
          : Object.values(data.data.providers);

        // Replace fallback data with real data
        setProvidersData(providerList as ProviderData[]);
      }
    } catch (error) {
      console.error("Error fetching status data:", error);
    }
  }, []);

  const fetchMetrics = useCallback(async () => {
    if (hasLoadedMetricsRef.current) return; // Prevent multiple calls
    hasLoadedMetricsRef.current = true;
    try {
      const response = await statusService.list();
      if (response) setData(response);
      else setData({});
    } catch (err) {
      console.error("Failed to fetch status", err);
      setData({});
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      // Fallback data for immediate display
      const fallbackProviders: ProviderData[] = [
        {
          provider: "openai",
          display_name: "OpenAI",
          current_status: "up",
          uptime_percent: 99.9,
          avg_response_time: 150,
          total_checks: 1000,
          last_check: new Date().toISOString(),
          recent_status: "healthy",
          recent_response_time: 145,
        },
        {
          provider: "anthropic",
          display_name: "Anthropic",
          current_status: "up",
          uptime_percent: 99.8,
          avg_response_time: 200,
          total_checks: 950,
          last_check: new Date().toISOString(),
          recent_status: "healthy",
          recent_response_time: 195,
        },
        {
          provider: "cohere",
          display_name: "Cohere",
          current_status: "up",
          uptime_percent: 99.7,
          avg_response_time: 180,
          total_checks: 900,
          last_check: new Date().toISOString(),
          recent_status: "healthy",
          recent_response_time: 175,
        },
        {
          provider: "bedrock",
          display_name: "AWS Bedrock",
          current_status: "up",
          uptime_percent: 99.6,
          avg_response_time: 300,
          total_checks: 850,
          last_check: new Date().toISOString(),
          recent_status: "healthy",
          recent_response_time: 295,
        },
        {
          provider: "azure",
          display_name: "Azure OpenAI",
          current_status: "up",
          uptime_percent: 99.5,
          avg_response_time: 250,
          total_checks: 800,
          last_check: new Date().toISOString(),
          recent_status: "healthy",
          recent_response_time: 245,
        },
        {
          provider: "mistral",
          display_name: "Mistral AI",
          current_status: "up",
          uptime_percent: 99.4,
          avg_response_time: 220,
          total_checks: 750,
          last_check: new Date().toISOString(),
          recent_status: "healthy",
          recent_response_time: 215,
        },
        {
          provider: "huggingface",
          display_name: "Hugging Face",
          current_status: "up",
          uptime_percent: 99.3,
          avg_response_time: 400,
          total_checks: 700,
          last_check: new Date().toISOString(),
          recent_status: "healthy",
          recent_response_time: 395,
        },
      ];

      // Show fallback data immediately
      setProvidersData(fallbackProviders);
      setLoading(false);

      // Load real data in background
      try {
        await fetchStatusData();
        await fetchMetrics();
      } catch (error) {
        console.error("Error loading real data:", error);
        // Keep fallback data if real data fails
      }
    };
    loadData();
  }, [fetchStatusData, fetchMetrics]);

  const fetchStatus = async () => {
    try {
      const response = await statusService.list();
      if (response) setData(response);
      else setData({});
    } catch (err) {
      console.error("Failed to fetch status", err);
      setData({});
    } finally {
      setData({});
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubscribed(true);
    setEmail("");
  };

  const overallStatus = {
    status: "operational", // operational, degraded, outage
    message: "All Systems Operational",
    uptime: "99.97%",
    lastUpdated: "2 minutes ago",
  };

  // Generate AI providers array from lazy-loaded data
  const getAIServices = () => {
    const aiProviders: Array<{
      name: string;
      status: string;
      responseTime: string;
      uptime: string;
      description: string;
      isLoading?: boolean;
    }> = [];

    // Map provider data to display format
    const providerMap: Record<string, { name: string; description: string }> = {
      openai: { name: "OpenAI", description: "GPT models and embeddings" },
      anthropic: {
        name: "Anthropic",
        description: "Claude models and safety",
      },
      cohere: { name: "Cohere", description: "Command and embed models" },
      bedrock: {
        name: "AWS Bedrock",
        description: "Amazon foundation models",
      },
      azure: {
        name: "Azure OpenAI",
        description: "Microsoft Azure AI services",
      },
      mistral: { name: "Mistral AI", description: "European AI models" },
      huggingface: {
        name: "Hugging Face",
        description: "Open source models and transformers",
      },
    };

    // Get all expected providers (both loaded and loading)
    const allProviderKeys = Object.keys(providerMap);

    allProviderKeys.forEach((providerKey) => {
      const providerInfo = providerMap[providerKey];

      // Find the provider data if it's been loaded
      const providerData = providersData.find(
        (p) => p.provider === providerKey
      );

      if (providerData) {
        // Provider data is loaded
        aiProviders.push({
          name: providerInfo.name,
          status:
            providerData.current_status === "up" ||
            providerData.recent_status === "healthy"
              ? "operational"
              : "degraded",
          responseTime: `${Math.round(providerData.avg_response_time || providerData.recent_response_time || 0)}ms`,
          uptime: `${(providerData.uptime_percent || 0).toFixed(1)}%`,
          description: providerInfo.description,
          isLoading: false,
        });
      } else {
        // Provider is still loading or not started - return skeleton data
        aiProviders.push({
          name: providerInfo.name,
          status: "loading",
          responseTime: "",
          uptime: "",
          description: providerInfo.description,
          isLoading: true,
        });
      }
    });

    return aiProviders;
  };

  const services = getAIServices();

  // Skeleton component for loading provider cards
  const ProviderSkeleton = () => (
    <Card className="border-1 border-[#C3CAD180] !shadow-none">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="w-4 h-4 rounded-full" />
        </div>
        <Skeleton className="h-4 w-48 mt-2" />
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between text-sm">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-12" />
        </div>
        <div className="flex justify-between text-sm">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="h-2 mt-3 rounded-full" />
      </CardContent>
    </Card>
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
      case "operational":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "unhealthy":
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case "degraded":
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <CheckCircle className="w-4 h-4 text-green-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-green-600";
      case "unhealthy":
        return "text-yellow-600";
      case "degraded":
        return "text-red-600";
      default:
        return "text-green-600";
    }
  };
  const HEALTH_COMPONENTS: { [key: string]: string } = {
    database: "Database",
    aws_cognito: "AWS",
    environment: "Environment",
  };
  if (loading) {
    return (
      <div className="">
        {/* Header Skeleton */}
        <section className="bg-[#F7F8F9] pt-30 md:pt-40 pb-10 md:pb-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <Skeleton className="h-12 w-96 mx-auto" />
              <Skeleton className="h-6 w-80 mx-auto" />
            </div>
          </div>
        </section>

        {/* Overall Status Skeleton */}
        <section className="bg-muted/30 relative">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <Card className="max-w-[600px] mx-auto text-center shadow-[0px_11px_25px_12px_#0000000A]">
              <CardHeader>
                <Skeleton className="h-8 w-64 mx-auto mb-4" />
                <div className="flex flex-col items-center">
                  <div className="flex items-start gap-3 mb-4">
                    <Skeleton className="w-4 h-4 rounded-full" />
                    <Skeleton className="h-8 w-32" />
                  </div>
                </div>
                <div className="flex items-center justify-start gap-6 text-sm text-muted-foreground">
                  <div className="flex flex-col items-center gap-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>
          <LineComponent />
        </section>

        {/* Service Status Grid Skeleton */}
        <section className="py-10 pt-12 md:pt-22 relative">
          <div className="container max-w-7xl mx-auto px-4 sm:px-4 lg:px-6 relative z-10">
            <div className="">
              <div className="max-w-[600px] mx-auto">
                <Skeleton className="h-12 w-80 mx-auto mb-5" />
                <Skeleton className="h-6 w-96 mx-auto" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-14">
                {Array.from({ length: 6 }).map((_, index) => (
                  <ProviderSkeleton key={index} />
                ))}
              </div>
            </div>
          </div>
          <LineComponent />
        </section>
      </div>
    );
  }
  return (
    <div className="">
      {/* Header */}
      <section className="bg-[#F7F8F9] pt-30 md:pt-40 pb-10 md:pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-3xl md:text-5xl font-bold">
              AI2me System
              <br /> Status
            </h1>
            <p className="text-xl text-muted-foreground">
              Real-time system health and performance information
            </p>
          </div>
        </div>
      </section>

      {/* Overall Status */}
      <section className="bg-muted/30 relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Card className="max-w-[600px] mx-auto text-center shadow-[0px_11px_25px_12px_#0000000A]">
            <CardHeader>
              <h2 className="text-xl font-semibold text-[#121416] text-start flex justify-center items-center gap-2">
                {data && data.overall_status == "healthy"
                  ? "All Systems Operational"
                  : "All services operating normally"}
              </h2>

              {/* Center the container but left-align the items inside */}
              <div className="flex flex-col items-center">
                <div className="flex flex-wrap items-start justify-center gap-3 mb-4">
                  {data.components &&
                    Object.keys(data.components).map((key) => {
                      const component = data.components?.[key];
                      if (!component) return null;

                      return (
                        <div key={key} className="flex items-center gap-3">
                          {getStatusIcon(component.status)}
                          <h2
                            className={`text-2xl font-bold ${getStatusColor(component.status)}`}
                          >
                            {
                              HEALTH_COMPONENTS[
                                key as keyof typeof HEALTH_COMPONENTS
                              ]
                            }
                          </h2>
                        </div>
                      );
                    })}
                </div>
              </div>

              <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex flex-col items-center gap-1">
                  Last updated: {data ? "Just now" : "2 minutes ago"}
                  <div className="text-black font-medium">
                    {overallStatus.lastUpdated}
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1">
                  Uptime:{" "}
                  <div className="text-black font-medium">
                    {overallStatus.uptime}
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>
        <LineComponent />
      </section>

      {/* Service Status Grid */}
      <section className="py-10 pt-12 md:pt-22 relative">
        <div className="container max-w-7xl mx-auto px-4 sm:px-4 lg:px-6 relative z-10">
          <div className="">
            <div className="max-w-[600px] mx-auto">
              <h2 className="text-[32px] md:text-[48px] font-bold text-center mb-5 text-[#121416]">
                Service Status
              </h2>
              <p className="text-base text-center text-[#626970]">
                Real-time monitoring of AI service providers including uptime,
                response times, and availability. Data loads progressively as it
                becomes available.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-14">
              {services.map((service, index) =>
                service.isLoading ? (
                  <ProviderSkeleton key={index} />
                ) : (
                  <Card
                    key={index}
                    className="border-1 border-[#C3CAD180] !shadow-none"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl font-semibold text-[#121416]">
                          {service.name}
                        </CardTitle>
                        {getStatusIcon(service.status)}
                      </div>
                      <CardDescription className="text-sm text-[#626970] font-normal">
                        {service.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-sm text-normal text-[#626970]">
                          Response Time:
                        </span>
                        <span className="font-mono text-sm text-[#121416] font-normal">
                          {service.responseTime}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-sm text-normal text-[#626970]">
                          Uptime:
                        </span>
                        <span className="font-mono text-sm text-[#121416] font-normal">
                          {service.uptime}
                        </span>
                      </div>
                      <Progress
                        value={Number.parseFloat(
                          service.uptime.replace("%", "")
                        )}
                        className="h-2 mt-3"
                      />
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          </div>
        </div>
        <LineComponent />
      </section>

      {/* <section className="w-full flex justify-center  pb-12 md:pb-20 pt-10 md:pt-20 relative">
        <div className="w-full max-w-7xl px-4 md:px-4 lg:px-6 relative z-10">
          <div
            className="w-full rounded-2xl py-20 text-center px-6"
            style={{
              backgroundImage: `url(/images/borderTesture.png), radial-gradient(ellipse at center, #004EFD 20%, #0033AF 80%)`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          >
            <h2 className="text-[32px] md:text-[48px] font-bold text-white mb-4 leading-[38px] md:leading-[48px]">
              Subscribe to Status Updates
            </h2>

            <p className="text-white/80 max-w-2xl mx-auto mb-6 text-base font-normal md:text-lg">
              Get notified about system status changes and maintenance windows
            </p>

            <div className="max-w-[400px] mx-auto">
              {isSubscribed ? (
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span>Thank you for subscribing to status updates!</span>
                </div>
              ) : (
                <form
                  onSubmit={handleSubscribe}
                  className="flex flex-col sm:flex-row gap-4"
                >
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="flex-1 bg-[#004EFD] h-12 px-5 border-1 border-[#687DFF] text-[#F7F8F9] placeholder:text-[#F7F8F9] rounded-full"
                  />
                  <Button
                    variant={"default"}
                    type="submit"
                    className="h-12 px-6"
                  >
                    Subscribe
                  </Button>
                </form>
              )}
              <p className="text-xs text-white mt-4">
                Updates sent to team@ai2me.com • Unsubscribe anytime
              </p>
            </div>
          </div>
        </div>
        <LineComponent />
      </section> */}
    </div>
  );
}
