"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

const complianceBadges = [
  "SOC 2",
  "ISO 27001",
  "HIPAA",
  "GDPR",
  "PCI DSS",
  "FedRAMP",
  "AWS",
];

export function TrustBar() {
  return (
    <section className="bg-white py-8 md:py-12 relative">
      <div className="container max-w-7xl mx-auto px-4 sm:px-4 lg:px-6 relative z-10">
        <div className="text-center">
          <p className="text-base md:text-lg leading-relaxed font-normal text-[#626970] max-w-3xl mx-auto mb-4">
            <span className="font-semibold text-[#121416]">AI2me</span> provides secure,
            scalable, and compliant AI infrastructure that routes requests
            across multiple model providers, enabling regulated industries to
            deploy and manage enterprise AI safely and efficiently.
          </p>
          <hr className="border-t border-[#C3CAD180] max-w-3xl mx-auto my-6" />
          <p className="text-sm md:text-base text-[#626970] max-w-3xl mx-auto mb-8 leading-relaxed">
            We auto-route your queries to the best model every time, and make it effortless to bring your own data into AI — safely and compliant.
          </p>

          <p className="text-xs md:text-sm font-semibold text-[#0033AF] uppercase tracking-wider mb-2 font-mono">
            Enterprise-Grade Security
          </p>
          <p className="text-sm md:text-base text-[#626970] mb-6 max-w-3xl mx-auto leading-relaxed">
            Built on AWS infrastructure certified for SOC 2, ISO 27001, HIPAA, GDPR, PCI DSS, and FedRAMP.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 mb-6">
            {complianceBadges.map((badge, index) => (
              <div
                key={index}
                className="px-4 py-2 bg-[#F7F8F9] border border-[#C3CAD180] rounded-lg text-sm font-semibold text-[#121416] hover:bg-[#E8ECF4] hover:border-[#0033AF] transition-colors"
              >
                {badge}
              </div>
            ))}
          </div>

          <Link
            href="/trust"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#0033AF] hover:text-[#002080] transition-colors"
          >
            View our Trust Center
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

