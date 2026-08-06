
import Image from "next/image";
import {Activity, Map, ShieldCheck, User, } from "lucide-react";
import { LineComponent } from "../organisms/line-component";

export function UseCases() {
const features = [
  {
    id: 1,
    icon: Map, // Fleet/Route optimization icon
    title: "Fleet & Route Optimization",
    image: "/images/transportUsecase1.png",
    description:
      "AI-powered routing improves delivery speed, reduces fuel consumption, and ensures on-time arrivals.",
    points: [
      "AI-powered routing saves fuel and time",
      "Real-time traffic & weather-based adjustments",
      "Optimized delivery schedules for logistics fleets",
    ],
  },
  {
    id: 2,
    icon: Activity, // Predictive maintenance icon
    title: "Predictive Maintenance",
    image: "/images/transportUsecase2.png",
    description:
      "Real-time analytics detect equipment wear and tear early, preventing costly breakdowns.",
    points: [
      "Detects vehicle/engine issues before failure",
      "Reduces repair costs with proactive servicing",
      "Extends fleet and aircraft life cycles",
    ],
  },
  {
    id: 3,
    icon: User, // Passenger/Customer experience icon
    title: "Passenger & Customer Experience",
    image: "/images/transportUsecase3.png",
    description:
      "Personalized updates, smoother ticketing, and faster service improve overall travel satisfaction.",
    points: [
      "AI chatbots for travel updates & bookings",
      "Personalized ticketing and recommendations",
      "Sentiment analysis for customer satisfaction",
    ],
  },
  {
    id: 4,
    icon: ShieldCheck, // Compliance/Safety icon
    title: "Compliance & Safety Monitoring",
    image: "/images/transportUsecase4.png",
    description:
      "AI systems track safety standards, regulatory compliance, and accident prevention protocols.",
    points: [
      "Automated safety checks with digital logs",
      "GDPR/SOC 2-compliant passenger data handling",
      "Audit-ready reports for regulators",
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
            AI That Drives Transportation Forward
          </h1>
          <p className="text-center text-[#626970]">
           From predictive maintenance to customer experience, AI2me brings efficiency and reliability to transportation.
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
