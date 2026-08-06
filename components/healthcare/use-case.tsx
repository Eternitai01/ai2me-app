
import Image from "next/image";
import {  Database, FileCheck, MessageCircleHeart,  ScanLine, } from "lucide-react";
import { LineComponent } from "../organisms/line-component";

export function UseCases() {
 const features = [
    {
      id: 1,
      icon: ScanLine, // This icon seems generic, will keep it for now
      title: "Medical Imaging & Diagnostics",
      image:"/images/healthUsecase1.png", // Assuming this is the correct image path
      description:
        "Enhance diagnostic accuracy with multi-model image analysis, anomaly detection, and real-time support for radiologists.",
      points: [
        "Multi-model image analysis for higher accuracy",
        "AI-powered anomaly detection in scans",
        "Real-time diagnostic support for doctors",
      ],
    },
    {
      id: 2,
      icon: MessageCircleHeart, // This icon seems generic, will keep it for now
      title: "Patient Engagement & Support",
      image:"/images/healthUsecase2.png", // Assuming this is the correct image path
      description:
        "Deliver HIPAA-compliant chatbots, sentiment analysis, and automated documentation to improve patient communication.",
      points: [
        "HIPAA-compliant AI chatbots for patient queries",
        "Sentiment & tone analysis in telemedicine",
        "Automated appointment & discharge documentation",
      ],
    },
      {
      id: 3,
      icon: Database, // This icon seems generic, will keep it for now
      title: "Clinical Data Management",
      image:"/images/healthUsecase3.png", // Assuming this is the correct image path
      description:
        "Streamline EHR ingestion, process clinical notes with NLP, and predict treatment outcomes with AI analytics.",
      points: [
        "AI-powered EHR data ingestion from multiple sources",
        "NLP for clinical notes",
        "Predictive analytics for treatment outcomes",
      ],
    },
    {
      id: 4,
      icon: FileCheck, // This icon seems generic, will keep it for now
      title: "Compliance & Reporting",
      image:"/images/healthUsecase4.png", // Assuming this is the correct image path
      description:
        "Maintain HIPAA-ready audit trails, blockchain-anchored logs, and automated regulatory reporting for trust and transparency.",
      points: [
        "HIPAA-ready audit trails",
        "Blockchain-anchored logs for clinical AI usage",
        "Automated compliance reporting for regulators",
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
            Transforming Healthcare with AI2me
          </h1>
          <p className="text-center text-[#626970]">
            AI2me delivers secure, compliant, and scalable AI solutions that enhance diagnostics, improve patient engagement, streamline data management, and simplify regulatory reporting.
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
