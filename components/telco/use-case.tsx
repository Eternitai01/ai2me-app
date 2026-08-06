
import Image from "next/image";
import {CreditCard,MessageCircle, Network, ShieldCheck, } from "lucide-react";
import { LineComponent } from "../organisms/line-component";

export function UseCases() {
const features = [
  {
    id: 1,
    icon: ShieldCheck, // Security/fraud detection icon
    title: "Fraud Detection & Prevention",
    image: "/images/telcoUsecase1.png",
    description:
      "AI detects SIM swaps, call spoofing, and payment fraud in real time to keep networks secure.",
    points: [
      "Real-time detection of SIM fraud and identity theft",
      "Prevents fake KYC and account takeovers",
      "Reduces fraud losses and chargebacks",
    ],
  },
  {
    id: 2,
    icon: MessageCircle, // Customer support/chat icon
    title: "Customer Support Automation",
    image: "/images/telcoUsecase2.png",
    description:
      "Virtual agents and chatbots provide instant 24/7 support, reducing wait times and boosting satisfaction.",
    points: [
      "AI chatbots for 24/7 query handling",
      "Sentiment analysis for better customer care",
      "Automated complaint resolution & ticketing",
    ],
  },
  {
    id: 3,
    icon: Network, // Network/connectivity icon
    title: "Network Optimization",
    image: "/images/telcoUsecase3.png",
    description:
      "AI-driven traffic routing and monitoring improve speed, reliability, and overall user experience.",
    points: [
      "Predictive maintenance for towers & infra",
      "Smart traffic routing to reduce downtime",
      "AI-powered latency & bandwidth monitoring",
    ],
  },
  {
    id: 4,
    icon: CreditCard, // Billing/payment icon
    title: "Billing & Personalization",
    image: "/images/telcoUsecase4.png",
    description:
      "Smart billing systems deliver accurate invoices while AI recommends tailored plans for customers.",
    points: [
      "AI-driven personalized plan recommendations",
      "Churn prediction & retention strategies",
      "Unified and fraud-proof billing system",
    ],
  }
];

  return (
    <section className="py-8 md:py-20 bg-[#F9FAFB] relative">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative z-10">
        {/* Top Heading */}
        <div className="max-w-[1000px] mx-auto mb-10 md:mb-16">
          <p className="text-center text-[16px] font-semibold text-[#0033AF] mb-4">
            Use Case
          </p>
          <h1 className="text-center text-[32px] md:text-[48px] font-bold mb-5 text-[#121416] text-pretty">
            AI That Transforms Telecom Operations
          </h1>
          <p className="text-center text-[#626970]">
            From fraud detection to network efficiency, AI2me enables telcos to deliver better customer service and smarter infrastructure.
          </p>
        </div>

        {/* Layout */}
        <div className="space-y-8">
            {features.map((feature,index) => (
        <div key={index} className="grid md:grid-cols-2 gap-6 md:gap-30 items-center">
            <div className="bg-gray-100 rounded-xl p-6 pb-0">
                <Image src={feature.image} height={255} width={500} className="mr-2 w-full" alt="" />
            </div>
              <div key={feature.id} className="flex items-start space-x-4">
                <div>
                    <div className="bg-white p-3 rounded-lg shadow-[0px_2px_4px_0px_#3232470F] mb-5 w-fit">
                  <feature.icon className="w-6 h-6 text-[#0033AF]" />
                </div>
                  <h3 className={`text-2xl font-semibold text-[#121416]`}>
                    {feature.title}
                  </h3>
                  <p className="text-base font-normal text-[#626970] mt-3">
                    {feature.description}
                  </p>
                  <ul className="mt-4 space-y-2">
                    {feature.points.map((point, i) => (
                      <li key={i} className="flex items-center text-sm font-normal text-[#626970]">
                        <Image src={"/images/checkCircle.png"} height={18} width={18} className="mr-2" alt="" /> {point}
                      </li>
                    ))}
                  </ul>
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
