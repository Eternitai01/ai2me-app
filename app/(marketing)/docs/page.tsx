"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Download,
  Copy,
  CheckCircle,
  Shield,
  Zap,
  FileText,
  Globe,
  LockOpen,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Image from "next/image";
import { Newsletter } from "@/components/organisms/newsletter";
import { LineComponent } from "@/components/organisms/line-component";
import Link from "next/link";

const sessionEndpoints = [
  {
    method: "POST",
    endpoint: "/v1/ai/start",
    description: "Start Session",
    details: (
      <div className="space-y-2 text-sm text-[#444]">
        <h4 className="font-semibold text-lg text-[#121416]">Overview</h4>
        <p>
          Creates a new AI session where you can ask questions and get
          AI-powered answers. The system intelligently routes your request to
          the best AI provider.
        </p>

        <h4 className="font-semibold text-lg text-[#121416] mt-5">
          Authentication
        </h4>
        <p>
          Requires API key authentication via <code>X-API-Key</code> header.
        </p>

        <h4 className="font-semibold text-lg text-[#121416] mt-5">
          Response Behavior
        </h4>
        <p>The response depends on question complexity and connector usage:</p>

        <h4 className="font-semibold text-lg text-[#121416] mt-5">
          Immediate Response (Simple Questions){" "}
        </h4>
        <ul className="list-disc list-inside">
          <li>Without connectors: Returns AI response + session info</li>
          <li>With connectors: Returns AI response + session info</li>
        </ul>

        <h4 className="font-semibold text-lg text-[#121416] mt-5">
          Session-Only Response (Medium/Complex Questions)
        </h4>
        <ul className="list-disc list-inside">
          <li>
            Without connectors: Returns session info only (use /continue for
            response)
          </li>
          <li>
            With connectors: Returns session info only (use /continue for
            response)
          </li>
        </ul>

        <h4 className="font-semibold text-lg text-[#121416] mt-5">
          AI Provider Selection
        </h4>
        <ul className="list-disc list-inside">
          <li>Question complexity and type</li>
          <li>Cost sensitivity preferences</li>
          <li>Quality requirements</li>
          <li>Cost sensitivity preferences</li>
          <li>Cost sensitivity preferences</li>
        </ul>

        <h4 className="font-semibold text-lg text-[#121416] mt-5">
          Example Request
        </h4>
        <pre className="bg-[#0078431F] p-4 rounded-lg overflow-x-auto text-[#2F23A5]">
          <code>{`{
  "question": "What is machine learning?",
  "preferences": {
    "cost_sensitivity": "medium",
    "quality_priority": "high",
    "response_time": "standard"
  }
}`}</code>
        </pre>

        <div>
          <h4 className="font-semibold text-lg text-[#121416] mt-5">
            Response Fields
          </h4>
          <ul className="space-y-1 mt-3">
            <li>
              <span className="font-mono text-[#2F23A5]">session_id</span>:
              Unique session identifier for follow-up questions
            </li>
            <li>
              <span className="font-mono text-[#2F23A5]">ai_response</span>:
              Immediate AI response (for simple questions only)
            </li>
            <li>
              <span className="font-mono text-[#2F23A5]">ai_provider</span>:
              Selected AI provider and model information
            </li>
            <li>
              <span className="font-mono text-[#2F23A5]">complexity_level</span>
              : Detected question complexity (simple/medium/complex)
            </li>
            <li>
              <span className="font-mono text-[#2F23A5]">response_type</span>:
              Whether response is immediate or requires /continue
            </li>
            <li>
              <span className="font-mono text-[#2F23A5]">
                processing_time_ms
              </span>
              : Time taken to process the request
            </li>
            <li>
              <span className="font-mono text-[#2F23A5]">query_id</span>: ID of
              the query (if immediate response provided)
            </li>
            <li>
              <span className="font-mono text-[#2F23A5]">connectors</span>:
              Status of connected data sources
            </li>
            <li>
              <span className="font-mono text-[#2F23A5]">
                estimated_processing_time
              </span>
              : Estimated time for complex queries
            </li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    method: "POST",
    endpoint: "/v1/ai/continue",
    description: "Continue Session",
    details: (
      <p className="text-sm text-[#444]">
        Use this endpoint to continue an existing session.
      </p>
    ),
  },
  {
    method: "POST",
    endpoint: "/v1/ai/status",
    description: "Get Session Status",
    details: (
      <p className="text-sm text-[#444]">
        Fetch the current status of a running session.
      </p>
    ),
  },
];

export default function DocsPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const quickStartSteps = [
    {
      step: 1,
      title: "Sign up and get API key",
      description: "Create your AI2me account and generate your first API key",
      code: "# Get your API key from the dashboard\nAPI_KEY=your_api_key_here",
    },
    {
      step: 2,
      title: "Make your first API call",
      description: "Send your first request to the AI2me platform",
      code: `curl --location '<API URL>/v1/ai/start' \
--header 'Content-Type: application/json' \
--header 'X-API-Key: <YOUR API KEY>' \
--data '{
    "question": "your question",
    "connector_ids": [],
    "preferences": {
      "cost_sensitivity": "medium",
      "quality_priority": "high",
      "preferred_provider": ""
    }
  }'`,
    },
    {
      step: 3,
      title: "View logs in dashboard",
      description: "Monitor your usage and compliance in the AI2me dashboard",
      code: "# Check your dashboard at https://ai2me.com/dashboard\n# View usage analytics, costs, and compliance logs",
    },
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="">
      {/* Header */}
      <section className="pt-10 bg-[#F7F8F9]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            {/* <Badge variant="outline">
              <BookOpen className="w-3 h-3 mr-1" />
              Developer Documentation
            </Badge> */}
            <h1 className="text-[32px] lg:text-[64px] font-bold text-[#121416]">
              Developer Documentation
            </h1>
            <p className="text-base font-normal text-[#626970]">
              Everything you need to integrate AI2me into your applications
            </p>

            {/* Search */}
            {/* <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search documentation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div> */}
          </div>
        </div>
      </section>

      {/* Quick Start Guide */}
      <section className="py-8 md:py-20 bg-muted/30 relative">
        <div className="container max-w-7xl mx-auto px-4 sm:px-4 lg:px-6 relative z-10">
          <div className="">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-[20px] md:text-[48px] font-bold text-[#121416]">
                Get Started in 5 Minutes
              </h2>
              <p className="text-[#626970] text-base font-normal">
                Follow these steps to integrate AI2me into your application
              </p>
            </div>

            <div className="space-y-4">
              {quickStartSteps.map((step, index) => (
                <Card
                  key={index}
                  className="relative overflow-hidden shadow-lg rounded-xl bg-white "
                  style={{
                    border: "1px solid #E5E7EB",
                    borderLeftWidth: "4px",
                    backgroundColor:'#adadad33',
                    borderLeftColor:
                      step.step === 1
                        ? "#4A90E2"
                        : step.step === 2
                          ? "#8B5CF6"
                          : "#10B981",  
                    marginBottom: "30px",         
                  }}
                >
                  <div className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-10 h-10 min-w-10 text-white rounded-full flex items-center justify-center font-semibold text-lg shadow-lg"
                        style={{
                          background:
                            step.step === 1
                              ? "linear-gradient(135deg, #4A90E2 0%, #7B68EE 100%)"
                              : step.step === 2
                                ? "linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%)"
                                : "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                        }}
                      >
                        {step.step}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-[#121416] mb-1">
                          {step.title}
                        </h3>
                        <p className="text-[#626970] text-sm">
                          {step.description}
                        </p>
                      </div>
                    </div>
                    <div className="relative">
                      <pre
                        style={{ backgroundColor: "#1E2130", color: "#ECECEC" }}
                        className="p-3 rounded-lg overflow-x-auto text-sm border border-gray-300 shadow-lg"
                      >
                        <code>{step.code}</code>
                      </pre>
                      <div
                        className="absolute top-3 right-3"
                        onClick={() =>
                          copyToClipboard(step.code, `step-${step.step}`)
                        }
                      >
                        {copiedCode === `step-${step.step}` ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4 text-white cursor-pointer" />
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
        <LineComponent />
      </section>

      {/* API Reference */}
      <section className="py-8 md:py-16 relative" id="apiReference">
        <div className="container max-w-7xl mx-auto px-4 sm:px-4 lg:px-6 relative z-10">
          <div className="">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-[32px] md:text-[48px] text-[#121416] font-bold">
                Complete API Reference
              </h2>
              <p className="text-[#626970] text-base font-normal">
                Interactive API documentation with examples
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left side - Endpoints */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Open AI</h3>
                {sessionEndpoints.map((endpoint, index) => (
                  <div
                    key={index}
                    className="border rounded-md border-[#007843]"
                  >
                    <button
                      onClick={() => toggleAccordion(index)}
                      className="w-full text-left"
                    >
                      <div className="flex-wrap gap-4 flex items-center justify-between border border-[#007843] bg-[#F5FBF7] hover:bg-[#E9F7EE] transition px-4 py-3 rounded-md">
                        <div className="flex items-center gap-3">
                          <span className="bg-[#007843] text-white text-xs px-3 py-1 rounded font-mono">
                            {endpoint.method}
                          </span>
                          <code className="text-xl font-semibold text-[#121416]">
                            {endpoint.endpoint}
                          </code>
                          <span className="text-sm text-[#121416] font-normal">
                            {endpoint.description}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <LockOpen className="h-4 w-4 text-[#626970]" />
                          {openIndex === index ? (
                            <ChevronUp
                              strokeWidth={1.5}
                              className="h-6 w-6 text-[#626970] cursor-pointer"
                            />
                          ) : (
                            <ChevronDown
                              strokeWidth={1.5}
                              className="h-6 w-6 text-[#626970] cursor-pointer"
                            />
                          )}
                        </div>
                      </div>
                    </button>

                    {openIndex === index && (
                      <div className="p-4 bg-[#0078430F] border-t">
                        {endpoint.details}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Right side - Authentication */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Authentication</h3>

                <Card
                  className="relative overflow-hidden shadow-lg rounded-xl bg-white"
                  style={{ border: "1px solid #E5E7EB", backgroundColor:'#adadad33'}}
                >
                  {/* Gradient top border */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{
                      background:
                        "linear-gradient(90deg, #8B5CF6 0%, #A855F7 100%)",
                    }}
                  />
                  <CardHeader>
                    <CardTitle className="text-lg">
                      API Key Authentication
                    </CardTitle>
                    <CardDescription>
                      Include your API key in the Authorization header
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      <pre 
                      style={{ backgroundColor: "#1E2130", color: "#ECECEC" }}
                        className="p-3 rounded-lg overflow-x-auto text-sm border border-gray-300 shadow-lg">
                      
                        <code className="flex flex-wrap">
                          Authorization:{" "}
                          <span> Bearer your_api_key_here</span>{" "}
                        </code>
                      </pre>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-2 right-2"
                        onClick={() =>
                          copyToClipboard(
                            "Authorization: Bearer your_api_key_here",
                            "auth"
                          )
                        }
                      >
                        {copiedCode === "auth" ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4 text-white" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
        <LineComponent />
      </section>

      <section className="pb-8 md:pb-20 pt-7 md:pt-18 relative">
  <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative z-10 flex justify-center">
    <div className="md:col-span-3 space-y-6 text-center">
      <h2 className="text-3xl md:text-4xl font-bold leading-tight">
        API Docs
      </h2>
      <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
        Complete reference for integrating AI2me unified API gateway
        into your applications
      </p>
      <Link
        href={"https://api.AI2me.benthonlabs.com/docs#/"}
        target="_blank"
      >
        <Button variant={"filledBlack"} className="px-6">
          Tryout
        </Button>
      </Link>
    </div>
  </div>
  <LineComponent />
</section>


      {/* Integration Guides */}
      <section className="py-10 md:py-20 relative">
        <div className="container max-w-7xl mx-auto px-4 sm:px-4 lg:px-6 relative z-10">
          <div className="">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-[32px] md:text-[48px] font-bold text-[#121416]">
                Integration Examples
              </h2>
              <p className="text-base font-normal">
                Common integration patterns and best practices
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  icon: Globe,
                  title: "Web Applications",
                  description: "Integrate AI2me into your web applications",
                  topics: [
                    "React integration",
                    "Vue.js setup",
                    "Authentication",
                    "Error handling",
                  ],
                  gradient: "linear-gradient(135deg, #4A90E2 0%, #8B5CF6 100%)",
                },
                {
                  icon: Download,
                  title: "Mobile Apps",
                  description: "Add AI capabilities to mobile applications",
                  topics: [
                    "React Native",
                    "Flutter",
                    "iOS Swift",
                    "Android Kotlin",
                  ],
                  gradient: "linear-gradient(135deg, #F472B6 0%, #EC4899 100%)",
                },
                {
                  icon: Zap,
                  title: "Backend Services",
                  description: "Server-side integration patterns",
                  topics: ["Node.js", "Python Flask", "Django", "Express.js"],
                  gradient: "linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)",
                },
                {
                  icon: FileText,
                  title: "Data Pipelines",
                  description: "Batch processing and data workflows",
                  topics: [
                    "Apache Airflow",
                    "Kubernetes",
                    "Docker",
                    "Serverless",
                  ],
                  gradient: "linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)",
                },
              ].map((guide, index) => (
                <Card
                  key={index}
                  className="relative bg-white overflow-hidden shadow-lg rounded-2xl"
                  style={{
                    border: "1px solid #E5E7EB",
                  }}
                >
                  {/* Gradient top border */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{
                      background: guide.gradient,
                    }}
                  />
                  <div className="relative">
                    <CardHeader>
                      <div className="flex items-start gap-4 py-6">
                        <div
                          className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                          style={{
                            background: guide.gradient,
                          }}
                        >
                          <guide.icon className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-xl font-semibold text-[#121416] mb-2">
                            {guide.title}
                          </CardTitle>
                          <CardDescription className="text-sm font-normal text-[#626970]">
                            {guide.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-6">
                        {guide.topics.map((topic, topicIndex) => (
                          <li
                            key={topicIndex}
                            className="flex items-center gap-3 text-base font-normal text-[#626970]"
                          >
                            <svg
                              width="6"
                              height="6"
                              viewBox="0 0 6 6"
                              fill="none"
                            >
                              <circle cx="3" cy="3" r="3" fill="currentColor" />
                            </svg>
                            {topic}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
        <LineComponent />
      </section>

      {/* Compliance & Security */}
      <section className="py-10 md:py-20 relative" id="compliance">
        <div className="container max-w-7xl mx-auto px-4 sm:px-4 lg:px-6 relative z-10">
          <div className="">
            <div className="text-center space-y-4 mb-8 md:mb-12">
              <h2 className="text-[32px] md:text-[48px] font-bold text-[#121416]">
                Compliance & Security{" "}
                <span className="text-3xl">(* Pending)</span>
              </h2>
              <p className="text-base font-normal">
                Security features and compliance documentation
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl font-semibold text-[#121416]">
                    <Shield className="w-5 h-5 text-[#0033AF]" />
                    Security Features
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#626970] font-normal">
                      API Key Management
                    </span>
                    <span className="text-sm font-normal text-[#121416]">
                      Active
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#626970] font-normal">
                      Data Encryption
                    </span>
                    <span className="text-sm font-normal text-[#121416]">
                      AES-256
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#626970] font-normal">
                      Access Controls
                    </span>
                    <span className="text-sm font-normal text-[#121416]">
                      RBAC
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#626970] font-normal">
                      Audit Logging
                    </span>
                    <span className="text-sm font-normal text-[#121416]">
                      Blockchain
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl font-semibold text-[#121416]">
                    <FileText className="w-5 h-5 text-[#0033AF]" />
                    Compliance Standards
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#626970] font-normal">
                      ISO 27001
                    </span>
                    <span className="text-sm font-normal text-[#121416]">
                      {" "}
                      Certified
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#626970] font-normal">
                      SOC 2 Type II
                    </span>
                    <span className="text-sm font-normal text-[#121416]">
                      Certified
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#626970] font-normal">
                      HIPAA
                    </span>
                    <span className="text-sm font-normal text-[#121416]">
                      Compliant
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#626970] font-normal">
                      GDPR
                    </span>
                    <span className="text-sm font-normal text-[#121416]">
                      Compliant
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        <LineComponent />
      </section>
      {/* <Newsletter /> */}
    </div>
  );
}
