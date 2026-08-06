
import Image from "next/image";
import { Database,  GraduationCap,  Microscope,  Users } from "lucide-react";
import { LineComponent } from "../organisms/line-component";

export function UseCases() {
 const features = [
    {
      id: 1,
      icon: Microscope, // This icon seems generic, will keep it for now
      title: "Research Acceleration",
      image:"/images/academicusecase1.png", // Assuming this is the correct image path
      description:
        "Accelerate hypothesis testing, analysis, and academic studies with multi-model AI.",
      points: [
        "Multi-model NLP for summarizing research papers",
        "AI-powered hypothesis testing & analysis",
        "Ensemble models for higher accuracy in studies",
      ],
    },
    {
      id: 2,
      icon: GraduationCap, // This icon seems generic, will keep it for now
      title: "Education & Student Support",
      image:"/images/academicusecase2.png", // Assuming this is the correct image path
      description:
        "Boost student learning through AI tutoring, chatbots, and automated feedback.",
      points: [
        "AI tutoring & chatbot assistants for students",
        "Sentiment analysis of student feedback",
        "Automated grading & assessments",
      ],
    },
      {
      id: 3,
      icon: Database, // This icon seems generic, will keep it for now
      title: "Data Management",
      image:"/images/academicusecase3.png", // Assuming this is the correct image path
      description:
        "Securely handle structured and unstructured research data with compliance built-in.",
      points: [
        "Ingestion of structured & unstructured datasets",
        "GDPR-ready pipelines for sensitive research data",
        "Blockchain verification for academic integrity",
      ],
    },
    {
      id: 4,
      icon: Users, // This icon seems generic, will keep it for now
      title: "Collaboration & Compliance",
      image:"/images/academicusecase4.png", // Assuming this is the correct image path
      description:
        "Enable role-based access, transparent audits, and global research collaboration.",
      points: [
        "Role-based dashboards for researchers & admins",
        "GDPR-compliant student/faculty data handling",
        "Transparent logs for audit & integrity checks",
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
            AI That Accelerates
Research & Learning
          </h1>
          <p className="text-center text-[#626970]">
            AI2me provides academic institutions with tools for research, teaching, data integrity, and compliance.
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
