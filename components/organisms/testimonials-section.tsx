"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LineComponent } from "./line-component";

export function TestimonialsSection() {
 const testimonials = [
  {
    name: "Devon Lane",
    role: "Chief Risk Officer, Tier‑1 European Bank",
    content:
      "AI2me gave us a single control plane for every model and vendor, so we finally felt comfortable scaling AI across the bank.",
    avatar: "/images/testi1.png",
  },
  {
    name: "Ralph Edwards",
    role: "Head of Compliance, Global Insurer",
    content:
      "Before AI2me, every new AI tool was a one‑off exception. Now every workflow inherits the same policies and audit trails by default.",
    avatar: "/images/testi2.png",
  },
  {
    name: "Floyd Miles",
    role: "VP Product, Fortune 500 Healthcare Provider",
    content:
      "What used to take three steering committees and months of review now takes one workshop and a policy update in AI2me.",
    avatar: "/images/testi3.png",
  },
  {
    name: "Arlene Moreno",
    role: "Director of Engineering, Digital Bank",
    content:
      "Our engineers focus on business logic again instead of rebuilding logging, redaction, and access controls for each AI project.",
    avatar: "/images/testi4.png",
  },
  {
    name: "Brooklyn Simmons",
    role: "Chief Compliance Officer, Regional Bank",
    content:
      "For the first time, we can answer regulators' questions about AI usage with concrete, tamper‑proof evidence instead of slide decks.",
    avatar: "/images/testi5.png",
  },
  {
    name: "Annette Black",
    role: "Head of Vendor Management, Global Telco",
    content:
      "AI2me lets us experiment with new models without adding new vendors, new keys, and new exceptions to our risk register.",
    avatar: "/images/testi6.png",
  },
  {
    name: "Marvin McKinney",
    role: "CISO, National Healthcare Network",
    content:
      "Security did not have to say 'no' to AI. We just set our policies in AI2me and let the platform enforce them everywhere.",
    avatar: "/images/testi7.png",
  },
  {
    name: "Courtney Henry",
    role: "Head of Technology Strategy, Multinational Financial Group",
    content:
      "We cut AI unit costs while increasing oversight, because routing and optimization are now centralized instead of scattered across teams.",
    avatar: "/images/testi8.png",
  },
];


  return (
    <section className="pt-15 md:pt-25 pb-8 md:pb-20 bg-white relative">
      <div className="container max-w-7xl mx-auto px-4 md:px-4 lg:px-6 relative z-10">
        {/* Section Heading */}
        <div className="max-w-[807px] mx-auto mb-12 text-center">
          <p className="text-[16px] font-semibold text-[#0033AF] mb-4">
            Testimonials
          </p>
          <h1 className="text-[32px] md:text-[48px] font-bold mb-5">
            What Our Users Say
          </h1>
          <p className="text-gray-600">
            Trusted by teams across industries from startups to enterprises.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border border-[#C3CAD180]">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className={`p-6 py-8 bg-white hover:bg-[#F7F8F9] ${index < 4 ? "border-b border-[#C3CAD180]" : ""}`}
            >
              <p className="text-base text-[#121416] font-normal mb-5">
                &ldquo;{testimonial.content}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>
                    {testimonial.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-base text-[#121416] font-semibold">{testimonial.name}</div>
                  <div className="text-sm text-[#626970]">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <LineComponent />
    </section>
  );
}
