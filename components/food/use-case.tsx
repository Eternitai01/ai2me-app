
import Image from "next/image";
import { ChartBarBig,  MessageCircle, ShieldCheck, Truck,  } from "lucide-react";
import { LineComponent } from "../organisms/line-component";

export function UseCases() {
const features = [
  {
    id: 1,
    icon: ChartBarBig, // Demand forecasting icon
    title: "Demand Forecasting & Inventory",
    image: "/images/transportUsecase1.png",
    description:
      "AI predicts sales spikes and seasonal demand, helping optimize stock levels and reduce food waste with real-time supplier adjustments.",
    points: [
      "AI models predict sales spikes & seasonal demand",
      "Optimize stock levels to reduce food waste",
      "Real-time supplier & vendor adjustments",
    ],
  },
  {
    id: 2,
    icon: ShieldCheck, // Food safety icon
    title: "Food Safety & Compliance",
    image: "/images/transportUsecase2.png",
    description:
      "AI continuously monitors hygiene standards, automates HACCP/FDA-ready logs, and ensures full traceability with blockchain-backed records.",
    points: [
      "AI-powered monitoring for hygiene & safety standards",
      "Automated HACCP & FDA-ready compliance logs",
      "Traceability with blockchain for recalls",
    ],
  },
  {
    id: 3,
    icon: MessageCircle, // Customer engagement icon
    title: "Customer Engagement & Personalization",
    image: "/images/transportUsecase3.png",
    description:
      "AI delivers personalized menu recommendations, powers order chatbots, and analyzes customer feedback for loyalty and satisfaction.",
    points: [
      "AI-driven menu recommendations & upselling",
      "Chatbots for orders, delivery tracking, & loyalty programs",
      "Sentiment analysis from reviews & feedback",
    ],
  },
  {
    id: 4,
    icon: Truck, // Supply chain icon
    title: "Supply Chain Optimization",
    image: "/images/transportUsecase4.png",
    description:
      "AI enables predictive logistics, optimizes delivery routes for perishables, and provides unified visibility across vendors and distributors.",
    points: [
      "Predictive logistics for farm-to-table operations",
      "Route optimization for perishable food delivery",
      "Unified visibility across vendors & distributors",
    ],
  }
];

  return (
    <section className="py-8 md:py-20 bg-[#F9FAFB] relative">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative z-10">
        {/* Top Heading */}
        <div className="max-w-[850px] mx-auto mb-10 md:mb-16">
          <p className="text-center text-[16px] font-semibold text-[#0033AF] mb-4">
            Use Case
          </p>
          <h1 className="text-center text-[32px] md:text-[48px] font-bold mb-5 text-[#121416] text-pretty">
            AI That Transforms Food & Beverage
          </h1>
          <p className="text-center text-[#626970]">
           AI2me helps restaurants, suppliers, and food retailers improve efficiency, safety, and customer satisfaction with intelligent AI solutions.
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
