"use client";

import Image from "next/image";
import { LineComponent } from "./line-component";

export function Blogs() {
  const blogs = [
    {
      title: "Cost Optimization Router",
      desc: "Compare AI providers and auto-route queries to the most cost-effective model while maintaining SLAs.",
      img: "/images/cost-optimisation-ai.png", 
      link: "/blog-details/cost-optimization-router",
    },
    {
      title: "Which AI Provider is Right for You?",
      desc: "Compare OpenAI, Claude, Cohere, and Gemini on performance.",
      img: "/images/choose-ai-provider.png", 
      link: "/blog-details/which-ai-provider",
    },
    {
      title: "Enterprise Security in the Age of AI",
      desc: "Why audit trails and compliance are critical in AI infrastructure.",
      img: "/images/security_ai.png", 
      link: "/blog-details/enterprise-security",
    },
  ];

  return (
    <section className="pt-10 md:pt-20  relative">
      <div className="container max-w-7xl mx-auto px-4 md:px-4 lg:px-6 relative z-10">
        {/* Section Heading */}
        <div className="max-w-[807px] mx-auto mb-12 text-center">
          <p className="text-[16px] font-semibold text-[#0033AF] mb-4">
            Blog
          </p>
          <h2 className="text-[32px] md:text-[48px] font-bold mb-5">
            Latest from Our Blog
          </h2>
          <p className="text-gray-600">
            Stay ahead with the latest on AI infrastructure, cost optimization, and security.
          </p>
        </div>

        {/* Blog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {blogs.map((item, index) => (
            <div key={index} className="overflow-hidden">
              <div className="relative w-full h-[226px]">
                <Image
                  src={item.img}
                  alt={item.title}
                  fill
                  className="object-cover rounded-xl"
                />
              </div>
              <div className="mt-6">
                <h3 className="font-semibold text-xl text-[#121416] mb-2">{item.title}</h3>
                <p className="text-[#626970] text-base font-normal mb-5">{item.desc}</p>
                <a
                  href={item.link}
                  className="text-[#121416] font-normal inline-flex items-center"
                >
                  Read More <span className="ml-1">→</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
      <LineComponent />
    </section>
  );
}
