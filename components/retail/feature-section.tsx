import Image from "next/image";
import {Coins, ShieldAlert, Trophy, Globe } from "lucide-react";
import { LineComponent } from "../organisms/line-component";

export function FeatureSection() {
  return (
    <section className=" py-8 md:py-16 relative">
      <div className="container max-w-7xl mx-auto px-4 md:px-4 lg:px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-40 items-center">
          <div>
            <p className="text-sm font-medium text-[#0033AF] mb-3">Driving Innovation</p>
            <h2 className="text-[32px] md:text-[48px] font-bold mb-4">Smarter Retail, Better Outcomes</h2>
            <p className="text-gray-600 mb-8">
              AI2me helps retailers cut fraud, optimize supply chains, personalize shopping, and deliver seamless customer experiences—driving growth and efficiency at scale.
            </p>
            <ul className="space-y-7">
              <li className="flex items-start">
                <span className="mt-1 mr-3 text-[#0033AF]"><ShieldAlert size={22}/></span>
                <div>
                  <span className="font-semibold text-lg">Risk Reduction</span>
                  <div className="text-base text-gray-600">
                    Prevents payment fraud & reduces chargebacks
                  </div>
                </div>
              </li>
              <li className="flex items-start">
                <span className="mt-1 mr-3 text-[#0033AF]"><Coins size={22}/></span>
                <div>
                  <span className="font-semibold text-lg">Cost Efficiency</span>
                  <div className="text-base text-gray-600">
                   Smarter AI usage saves on infra & vendor costs
                  </div>
                </div>
              </li>
              <li className="flex items-start">
                <span className="mt-1 mr-3 text-[#0033AF]"><Trophy size={22}/></span>
                <div>
                  <span className="font-semibold text-lg">Competitive Advantage</span>
                  <div className="text-base text-gray-600">
                   Personalized shopping = higher sales
                  </div>
                </div>
              </li>
               <li className="flex items-start">
                <span className="mt-1 mr-3 text-[#0033AF]"><Globe size={22}/></span>
                <div>
                  <span className="font-semibold text-lg">Scalability</span>
                  <div className="text-base text-gray-600">
                    Supports global retail operations
                  </div>
                </div>
              </li>
            </ul>
          </div>
          <div className="relative flex justify-end md:justify-center">
            <div className="relative w-[85%] md:w-full">
            <Image
              src="/images/retailInnovation.png"
              height={592}
              width={600}
              className="w-full h-full object-cover rounded-xl"
              alt=""
              priority
            />
            <Image
              src="/images/retailInnovationTop.png"
              height={197}
              width={204}
              className="w-[180px] h-auto md:w-[382px] md:h-auto absolute left-[-60px] md:left-[-110px] bottom-[20px]"
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
