
import Image from "next/image";
import { Boxes, MessageCircle, ShieldCheck, ShoppingCart } from "lucide-react";
import { LineComponent } from "../organisms/line-component";

export function UseCases() {
 const features = [
    {
      id: 1,
      icon: ShoppingCart, // This icon seems generic, will keep it for now
      title: "Personalized Shopping Experiences",
      image:"/images/retailUsecase1.png", // Assuming this is the correct image path
      description:
        "Deliver AI-powered recommendations, real-time personalization at checkout, and optimized cross-sell and upsell offers that boost sales.",
      points: [
        "AI-driven recommendations across channels",
        "Real-time personalization at checkout",
        "Cross-sell & upsell optimization",
      ],
    },
    {
      id: 2,
      icon: ShieldCheck, // This icon seems generic, will keep it for now
      title: "Fraud Prevention & Payments",
      image:"/images/retailUsecase2.png", // Assuming this is the correct image path
      description:
        "Protect transactions with AI-driven fraud detection, adaptive risk scoring, and secure payment monitoring in real time.",
      points: [
        "Real-time fraud detection for online payments",
        "AI risk scoring for transactions",
        "Adaptive security against new fraud tactics",
      ],
    },
      {
      id: 3,
      icon: Boxes, // This icon seems generic, will keep it for now
      title: "Inventory & Supply Chain Optimization",
      image:"/images/retailUsecase3.png", // Assuming this is the correct image path
      description:
        "Forecast demand with predictive AI, manage stock efficiently, and optimize logistics to reduce costs and delays.",
      points: [
        "Predictive demand forecasting",
        "AI-driven inventory management",
        "Route & logistics optimization",
      ],
    },
    {
      id: 4,
      icon: MessageCircle, // This icon seems generic, will keep it for now
      title: "Customer Engagement & Support",
      image:"/images/retailUsecase4.png", // Assuming this is the correct image path
      description:
        "Enhance service with AI chatbots, sentiment analysis, and automated order tracking that improves customer satisfaction.",
      points: [
        "AI-powered chatbots for online retail support",
        "Sentiment analysis of customer reviews",
        "Automated order tracking & notifications",
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
            AI That Transforms Retail
          </h1>
          <p className="text-center text-[#626970]">
            AI2me empowers retailers with smarter personalization, fraud prevention, optimized supply chains, and enhanced customer engagement.
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
