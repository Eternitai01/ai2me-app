"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { COLORS } from "@/constants/colors";
import Image from "next/image";
// import { useAuthModal } from "@/context/AuthModalContext";

export  function TransportationHeroSection() {
  const router = useRouter();
  // const { openModal } = useAuthModal();

  return (
    <section className="relative py-12 lg:py-32 !pt-105 md:!pt-35 lg:!pt-50 overflow-hidden bg-[#F7F8F9] herobanner">
           <div className="relative container max-w-7xl mx-auto px-4 sm:px-4 lg:px-6">
        <div className="flex justify-start items-center gap-12">
          <div className="text-start max-w-[100%] md:max-w-[50%]">
            <h1
              className={`text-[32px] lg:text-[64px] leading-[42px] lg:leading-[72px] font-bold text-pretty text-[${COLORS.typography.heading}]`}
            >
              AI Infrastructure for Smart Transportation
            </h1>

            <p
              className={`text-[16px] leading-[24px] font-normal text-[#626970] mt-4 md:mt-6`}
            >
             AI2me enables logistics, airlines, and mobility providers to optimize routing, reduce costs, and ensure safety with secure and compliant AI.
            </p>

            <div className="flex sm:flex-row gap-4 items-center mt-8">
              <Button 
                size="lg" 
                variant={"filledBlack"} 
                className="w-full sm:w-auto"
                onClick={() => {
                // OLD: opened signup modal — kept for reference.
                // openModal("signup");
                // OLD: router.push("/signup"); — redirect to contact per requirement.
                router.push("/contacts");
              }}
              >
                See How AI2me Powers Transportation
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute right-[3%] top-0 h-auto md:h-full w-[85%] md:w-[45%] flex items-center pt-25 md:pt-24">
       <div className="relative w-full">
         <Image
          src={"/images/transportHero.png"}
          height={457}
          width={608}
          className="!w-[100%] max-w-[100%] h-auto "
          alt="AI Dashboard showing revenue and client data"
        />
       </div>

      </div>
    </section>
  );
}
