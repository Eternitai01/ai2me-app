
import Image from "next/image";
import {  FileCheck, MessagesSquare, ShieldAlert,  TrendingDown } from "lucide-react";
import { LineComponent } from "../organisms/line-component";

export function UseCases() {
  const features = [
    {
      id: 1,
      icon: ShieldAlert,
      title: "Fraud Detection & Prevention",
      image:"/images/usecase1.png",
      description:
        "AI2me monitors transactions in real time, detecting anomalies and adapting to new fraud tactics to keep banks secure.",
      points: [
        "Real-time monitoring across multiple AI models",
        "Pattern recognition for suspicious behavior",
        "Adaptive learning against new fraud tactics",
      ],
    },
    {
      id: 2,
      icon: MessagesSquare,
      title: "Customer Service & Support",
      image:"/images/usecase2.png",
      description:
        "Smarter AI chatbots and sentiment-aware assistants provide faster, more personalized customer interactions.",
      points: [
        "AI-powered chatbots with model switching",
        "Sentiment analysis for customer interactions",
        "Automated loan/KYC document processing",
      ],
    },
     {
      id: 3,
      icon: TrendingDown,
      title: "Credit Risk Assessment",
      image:"/images/usecase3.png",
      description:
        "AI-driven credit scoring and predictive analytics deliver accurate risk insights across diverse market conditions.",
      points: [
        "Multi-model credit scoring & prediction",
        "Loan default detection with ensemble AI",
        "Portfolio risk analysis under market shifts",
      ],
    },
    {
      id: 4,
      icon: FileCheck,
      title: "Regulatory Compliance",
      image:"/images/usecase4.png",
      description:
        "From AML and KYC automation to blockchain-verified audit trails, AI2me ensures compliance is built into every process.",
      points: [
        "AML & KYC automation",
        "Audit-ready logs with blockchain verification",
        "Automated regulatory reports",
      ],
    }
  ];

  return (
    <section className="py-8 md:py-20 bg-[#F9FAFB] relative">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative z-10">
        {/* Top Heading */}
        <div className="max-w-[807px] mx-auto mb-8 md:mb-16">
          <p className="text-center text-[16px] font-semibold text-[#0033AF] mb-4">
            Use Case
          </p>
          <h1 className="text-center text-[32px] md:text-[48px] font-bold mb-5 text-[#121416]">
            Core Banking Use Cases
          </h1>
          <p className="text-center text-[#626970]">
            AI2me enhances banking with fraud prevention, customer support, risk analysis, and compliance—secure, compliant, and cost-efficient.
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
