"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { COLORS } from "@/constants/colors";
import Image from "next/image";
// import { useAuthModal } from "@/context/AuthModalContext";

export function BannerSection() {
  const router = useRouter();
  // const { openModal } = useAuthModal();

  return (
    <section className="relative py-12 lg:py-25 !pt-105 md:!pt-35 lg:!pt-50 overflow-hidden bg-[#F7F8F9]">
      
      <div className="relative container max-w-7xl mx-auto px-4 sm:px-4 lg:px-6">
     
        <div className="flex justify-start items-center gap-12">
          <div className="text-start max-w-[100%] md:max-w-[50%]">
            <h1
              className={`text-[32px] lg:text-[72px] leading-[42px] lg:leading-[80px] font-bold text-pretty text-[${COLORS.typography.heading}]`}
            >
              One AI Gateway Smarter Faster Cheaper
            </h1>

            <p
              className={`text-[16px] leading-[24px] font-normal text-[#626970] mt-4 md:mt-6`}
            >
              Connect , optimize costs automatically, and track
everything in real-time all from one dashboard.
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
                Get Started
              </Button>
              <Link href="/docs">
                <Button
                  variant="outlineBlack"
                  size="lg"
                  className="w-full sm:w-auto bg-transparent"
                >
                  View Docs
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute right-0 top-0 h-auto md:h-full w-[85%] md:w-[40%] flex items-center pt-25 md:pt-30">
       <div className="relative w-full py-4 pl-4 rounded-l-2xl" style={{backgroundImage: 'url("/images/productbannerbg.png")', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat'}}>
         <Image
          src={"/images/productBanner.png"}
          height={457}
          width={608}
          className="!w-[100%] max-w-[100%] h-auto"
          alt="AI Dashboard showing revenue and client data"
        />
       </div>

      </div>
    </section>
  );
}
