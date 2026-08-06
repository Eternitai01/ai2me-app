"use client";

import { useRouter } from "next/navigation";
import { LineComponent } from "./line-component";
// import { useAuthModal } from "@/context/AuthModalContext";

export function GetStarted() {
  const router = useRouter();
  // const { openModal } = useAuthModal();

  return (
    <section className="w-full flex justify-center  pb-12 md:pb-20 pt-10 md:pt-20 relative">
      <div className="w-full max-w-7xl px-4 md:px-4 lg:px-6 relative z-10">
        <div className="w-full rounded-2xl py-20 text-center"
          style={{
            backgroundImage: `url(/images/borderTesture.png), radial-gradient(ellipse at center, #004EFD 20%, #0033AF 80%)`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >

          <h2 className="text-[32px] md:text-[48px] font-bold text-white mb-5 leading-[42px] md:leading-[62px]">
            Govern AI Across Your Enterprise
          </h2>

          <p className="text-white/80 max-w-2xl mx-auto mb-8 text-base font-normal md:text-lg">
            AI2me helps you connect, route, and optimize AI models with security
            and cost efficiency. Join teams scaling smarter with AI2me.
          </p>

          <button
            onClick={() => {
              // OLD: opened signup modal — kept for reference. TODO: re-enable modal by using openModal("signup").
              // openModal("signup");
              // OLD: router.push("/signup"); — redirect to contact per requirement.
              router.push("/contacts");
            }}
            className="bg-white text-black cursor-pointer font-medium py-3 px-6 rounded-full shadow-md hover:shadow-lg hover:bg-black hover:text-white border border-transparent hover:border-black transition-all duration-200"
          >
            Get Started
          </button>
        </div>
      </div>
      <LineComponent />
    </section>
  );
}

