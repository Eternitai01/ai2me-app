"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { LineComponent } from "./line-component";

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "What makes AI2me different from calling AI providers directly?",
      answer:
        "When you call AI providers directly, each team manages its own keys, settings, and logs, making it hard to enforce consistent policies or prove what happened later. AI2me gives you a single control plane across all models and vendors, with centralized policies, routing, and tamper‑evident logs for every request.",
    },
    {
      question: "How does blockchain verification work for audit logs?",
      answer: "Every AI2me request generates a detailed log entry that is written to an immutable ledger. These logs are anchored on technologies like Azure Confidential Ledger and Polygon, so auditors can independently verify that records have not been altered.",
    },
    {
      question: "What kind of cost savings can we expect?",
      answer: "Many enterprises see 30–40% reductions in AI unit costs once routing and optimization are centralized. AI2me automatically selects the right models and providers within your latency, quality, and compliance constraints, instead of each team tuning usage in isolation.",
    },
    {
      question: "How quickly can we get started with AI2me?",
      answer: "Most teams connect their first models and applications within 30 minutes using our API and dashboard. A full enterprise rollout with SSO, role‑based access, and policy templates typically takes 2–3 days working with our solution engineers.",
    },
    {
      question: "Is AI2me designed for regulated industries like healthcare and financial services?",
      answer: "AI2me is hosted on AWS infrastructure that is SOC 2, ISO 27001, HIPAA, GDPR, PCI DSS, and FedRAMP certified. All data is encrypted in transit and at rest, with region-specific data residency options.",
    },
    {
      question: "How does AI2me handle data security and privacy?",
      answer: "AI2me keeps sensitive data within your chosen regions and infrastructure, and applies redaction and policy checks before any data leaves your environment. All traffic is encrypted in transit and at rest, with detailed access controls and logs so your security team can see exactly who did what, when.",
    },
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className=" bg-[#F7F8F9] pb-10 md:pb-22 pt-10 md:pt-20 relative">
      <div className="max-w-[807px] mx-auto mb-12 text-center relative z-10">
        <h1 className="text-[32px] md:text-[48px] font-bold mb-5 leading-tight">
          Have a question?
          <br /> We are here to answer.
        </h1>
      </div>

      <div className="max-w-[807px] mx-auto bg-white rounded-lg border relative z-10">
        {faqs.map((item, index) => (
          <div key={index} className="border-b last:border-b-0">
            {/* Question */}
            <button
              className="w-full flex items-center cursor-pointer justify-between text-left px-4 py-5 text-[#121416] text-base font-bold"
              onClick={() => toggleFAQ(index)}
            >
              <span className={openIndex === index ? "text-[#0033AF]" : ""}>
                {item.question}
              </span>
              {openIndex === index ? (
                <Minus className="w-5 h-5 text-[#0033AF]" />
              ) : (
                <Plus className="w-5 h-5 text-gray-500" />
              )}
            </button>

            {/* Answer */}
            <div
              className={`px-4 ${openIndex === index ? "pb-5" : ""}  text-gray-600 transition-all duration-300 ${openIndex === index ? "max-h-[200px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"
                }`}
            >
              {item.answer}
            </div>
          </div>
        ))}
      </div>
      <LineComponent />
    </section>
  );
}
