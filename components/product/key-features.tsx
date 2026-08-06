"use client";

import { COLORS } from "@/constants/colors";
import Image from "next/image";
import { LineComponent } from "../organisms/line-component";

const features = [
  {
    id: 1,
    title: "Multi-Model Gateway",
    description:
      "Seamlessly switch between OpenAI, Claude, Gemini, and more with one unified API.",
    image: "/images/keyFeature1.png",
  },
  {
    id: 2,
    title: "Real-Time Insights",
    description:
      "Track latency, error rates, and usage trends instantly from a live dashboard.",
    image: "/images/keyFeature2.png",
  },
  {
    id: 3,
    title: "Cost Optimization Router",
    description:
      "Auto-route queries to the cheapest capable provider cutting AI costs by up to 40%.",
    image: "/images/keyFeature3.png",
  },
  {
    id: 4,
    title: "Usage Dashboard",
    description:
      "Centralized view of all API calls, costs, and performance metrics in real time.",
    image: "/images/keyFeature4.png",
  },
  {
    id: 5,
    title: "Compliance Audit Trail",
    description:
      "Searchable logs with filters and blockchain-based verification for full transparency.",
    image: "/images/keyFeature5.png",
  },
  {
    id: 6,
    title: "Cost Optimization Router",
    description:
      "End-to-end encryption, compliance audit trails, and blockchain verification built in.",
    image: "/images/keyFeature6.png",
  },
];

export function KeyFeatures() {
  return (
    <section className="w-full pt-10 md:pt-18 pb-10 md:pb-20 bg-[#F7F8F9] relative">
      <div className="container max-w-7xl px-4 md:px-4 lg:px-6 mx-auto relative z-10">
        <div className="max-w-[807px] mx-auto">
          <p
            className={`text-center text-[16px] font-semibold 
                !text-[#0033AF] mb-4`}
          >
            Key Features
          </p>
          <h1
            className={`text-center text-[32px] md:text-[48px] font-bold mb-5 text-[${COLORS.typography.heading}]`}
          >
            Powerful Features Built for Scale
          </h1>
          <p
            className={`text-center text-[${COLORS.typography.neutralText}] mb-10`}
          >
            From seamless integrations to enterprise-grade compliance, our
            platform gives you the tools to manage AI usage efficiently while
            maintaining transparency and control.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            {features.map((item, index)=> (
                <div key={index} className="bg-white rounded-xl shadow-[0px_24px_32px_0px_#3232470F] p-[6px] flex flex-col justify-between w-full">
            <div className="p-6">
                <h3 className={`text-xl font-semibold mb-3 text-[${COLORS.typography.heading}]`}>
              {item.title}
            </h3>
            <p className={`text-[${COLORS.typography.neutralText}] text-base leading-[24px] mb-4`}>
              {item.description}
            </p>
            </div>
           <div className="p-4 bg-[#C3CAD180] rounded-lg">
             <Image
              src={item.image}
              width={1600}
              height={168}
              className="w-full h-[168px] rounded-lg object-contain"
              alt="Dashboard"
            />
           </div>
          </div>
            ))}
        </div>
      </div>
      <LineComponent />
    </section>
  );
}
