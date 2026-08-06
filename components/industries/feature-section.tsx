import Image from "next/image";
import { ShieldCheck,  Rocket, Coins } from "lucide-react";
import { LineComponent } from "../organisms/line-component";

export function FeatureSection() {
  return (
    <section className=" py-8 md:py-16 relative">
      <div className="container max-w-7xl mx-auto px-4 md:px-4 lg:px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-40 items-center">
          <div>
            <p className="text-sm font-medium text-[#0033AF] mb-3">Business Value</p>
            <h2 className="text-[32px] md:text-[48px] font-bold mb-4">Business Value For Banking</h2>
            <p className="text-gray-600 mb-8">
              AI2me powers banking with secure, compliant, and cost-efficient AI enabling fraud prevention,
              customer support, risk analysis, and regulatory compliance.
            </p>
            <ul className="space-y-7">
              <li className="flex items-start">
                <span className="mt-1 mr-3 text-[#0033AF]"><ShieldCheck size={22}/></span>
                <div>
                  <span className="font-semibold text-lg">Risk Reduction</span>
                  <div className="text-base text-gray-600">
                    Stay compliant, cut fraud losses, and maintain audit-ready records to meet regulations.
                  </div>
                </div>
              </li>
              <li className="flex items-start">
                <span className="mt-1 mr-3 text-[#0033AF]"><Coins size={22}/></span>
                <div>
                  <span className="font-semibold text-lg">Cost Efficiency</span>
                  <div className="text-base text-gray-600">
                    Reduce AI spend with smart routing, unified billing, and faster deployment.
                  </div>
                </div>
              </li>
              <li className="flex items-start">
                <span className="mt-1 mr-3 text-[#0033AF]"><Rocket size={22}/></span>
                <div>
                  <span className="font-semibold text-lg">Competitive Advantage</span>
                  <div className="text-base text-gray-600">
                    Drive rapid AI innovation, improve customer experience, and scale with ease.
                  </div>
                </div>
              </li>
            </ul>
          </div>
          <div className="relative flex justify-end md:justify-center">
            <div className="relative w-[85%] md:w-full">
              <Image
              src="/images/useCaseImg.png"
              height={592}
              width={600}
              className="w-full h-full object-cover rounded-xl"
              alt=""
              priority
            />
            <Image
              src="/images/useCaseUpper.png"
              height={197}
              width={204}
              className="w-[120px] h-[110px] md:w-[204px] md:h-[197px] absolute left-[-60px] md:left-[-110px] bottom-[20px]"
              alt=""
            />
            </div>
          </div>
        </div>
      </div>
      <LineComponent />
    </section>
  );
}
