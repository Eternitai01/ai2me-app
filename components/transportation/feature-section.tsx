import Image from "next/image";
import {  ShieldAlert,  Coins,  UserCheck, ChartBarBig } from "lucide-react";
import { LineComponent } from "../organisms/line-component";

export function FeatureSection() {
  return (
     <section className=" py-8 md:py-16 relative">
      <div className="container max-w-7xl mx-auto px-4 md:px-4 lg:px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-40 items-center">
          <div>
            <p className="text-sm font-medium text-[#0033AF] mb-3">Driving Innovation</p>
            <h2 className="text-[32px] md:text-[48px] font-bold mb-4">Smarter, Safer, and Scalable Transport</h2>
            <p className="text-gray-600 mb-8">
              AI2me ensures safer operations, cost savings, and customer-first experiences for transport providers.
            </p>
            <ul className="space-y-7">
              <li className="flex items-start">
                <span className="mt-1 mr-3 text-[#0033AF]"><ShieldAlert size={22}/></span>
                <div>
                  <span className="font-semibold text-lg">Risk Reduction</span>
                  <div className="text-base text-gray-600">
                    AI minimizes breakdown risks, ensures safer journeys, and improves compliance reliability.
                  </div>
                </div>
              </li>
              <li className="flex items-start">
                <span className="mt-1 mr-3 text-[#0033AF]"><Coins size={22}/></span>
                <div>
                  <span className="font-semibold text-lg">Cost Efficiency</span>
                  <div className="text-base text-gray-600">
                    Optimized routes and predictive analytics cut fuel, repair, and operational expenses.
                  </div>
                </div>
              </li>
              <li className="flex items-start">
                <span className="mt-1 mr-3 text-[#0033AF]"><UserCheck size={22}/></span>
                <div>
                  <span className="font-semibold text-lg">Customer Experience</span>
                  <div className="text-base text-gray-600">
                    AI enhances ticketing, service personalization, and real-time travel updates.
                  </div>
                </div>
              </li>
               <li className="flex items-start">
                <span className="mt-1 mr-3 text-[#0033AF]"><ChartBarBig size={22}/></span>
                <div>
                  <span className="font-semibold text-lg">Scalability</span>
                  <div className="text-base text-gray-600">
                    Infrastructure adapts seamlessly for growing fleets and global logistics needs.
                  </div>
                </div>
              </li>
            </ul>
          </div>
          <div className="relative flex justify-end md:justify-center">
            <div className="relative w-[85%] md:w-full">
            <Image
              src="/images/transportationInnovation.png"
              height={592}
              width={600}
              className="w-full h-full object-cover rounded-xl"
              alt=""
              priority
            />
            <Image
              src="/images/transportationInnovationTop.png"
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
