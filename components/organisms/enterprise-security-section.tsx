"use client";

import Link from "next/link";
import { Shield, Lock, Globe, FileCheck, ArrowRight } from "lucide-react";
import { COLORS } from "@/constants/colors";
import { LineComponent } from "./line-component";

const securityFeatures = [
    {
        icon: Shield,
        title: "AWS-Certified Infrastructure",
        description:
            "Hosted on AWS infrastructure certified for SOC 2, ISO 27001, HIPAA, GDPR, PCI DSS, and FedRAMP.",
    },
    {
        icon: Lock,
        title: "Encryption by Default",
        description: "All data is encrypted in transit and at rest.",
    },
    {
        icon: Globe,
        title: "Data Residency Controls",
        description:
            "Region-specific deployment options to support residency requirements.",
    },
    {
        icon: FileCheck,
        title: "Compliance Audit Trails",
        description:
            "Immutable audit trails with blockchain verification for accountability.",
    },
];

export function EnterpriseSecuritySection() {
    return (
        <section className="w-full pt-10 md:pt-18 pb-10 md:pb-20 bg-white relative">
            <div className="container max-w-7xl px-4 md:px-4 lg:px-6 mx-auto relative z-10">
                <div className="max-w-[807px] mx-auto mb-12 text-center">
                    <p className="text-[16px] font-semibold !text-[#0033AF] mb-4">
                        Security & Compliance
                    </p>
                    <h2
                        className={`text-[32px] md:text-[48px] font-bold mb-5 text-[${COLORS.typography.heading}]`}
                    >
                        Built for teams that can't compromise on security
                    </h2>
                    <p className={`text-[${COLORS.typography.neutralText}] mb-10`}>
                        AI2me runs on the same AWS infrastructure trusted by Anthropic,
                        Stripe, and Databricks - with compliance controls baked into every
                        layer.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    {securityFeatures.map((feature, index) => {
                        const IconComponent = feature.icon;
                        return (
                            <div
                                key={index}
                                className="bg-[#F7F8F9] rounded-xl border border-[#C3CAD180] p-6 hover:shadow-lg transition-shadow"
                            >
                                <div className="w-12 h-12 rounded-lg bg-[#0033AF]/10 flex items-center justify-center mb-4">
                                    <IconComponent className="w-6 h-6 text-[#0033AF]" />
                                </div>
                                <h3
                                    className={`text-lg font-semibold mb-3 text-[${COLORS.typography.heading}]`}
                                >
                                    {feature.title}
                                </h3>
                                <p
                                    className={`text-[${COLORS.typography.neutralText}] text-sm leading-[24px]`}
                                >
                                    {feature.description}
                                </p>
                            </div>
                        );
                    })}
                </div>

                <div className="text-center">
                    <Link
                        href="/trust"
                        className="inline-flex items-center gap-2 text-base font-medium text-[#0033AF] hover:text-[#002080] transition-colors"
                    >
                        Visit the Trust Center
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
            <LineComponent />
        </section>
    );
}

