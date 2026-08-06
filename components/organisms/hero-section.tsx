"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  const router = useRouter();

  return (
    <section
      className="relative overflow-hidden homebanner"
      style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 40%, #f093fb 100%)" }}
    >
      {/* Desktop: two-column grid — equal padding, tops aligned */}
      <div className="hidden md:grid md:grid-cols-2 md:items-start max-w-7xl mx-auto px-8 lg:px-16 pt-40 lg:pt-52 pb-20 gap-8 lg:gap-12">
        {/* Left: Text */}
        <div className="flex flex-col justify-start">
          <h1 className="space-y-3">
            <span className="block text-[52px] lg:text-[72px] xl:text-[84px] leading-[1.0] font-black tracking-tight text-black">
              AI Meets Real Productivity
            </span>
            <span className="block text-[16px] lg:text-[20px] leading-[1.4] font-medium tracking-widest text-black/55 uppercase">
              A Complete AI Business Operating System
            </span>
          </h1>

          <p className="text-[16px] leading-[26px] font-normal text-black/65 mt-8 max-w-[480px]">
            Your own AI C-Level Executive Team 24/7/365. No Breaks, No Dramas, just pure execution.
          </p>

          <div className="flex flex-row gap-4 items-center mt-10">
            <Button
              size="lg"
              variant="outline"
              className="px-8 bg-white text-black hover:bg-black hover:text-white border-black transition-all"
              onClick={() => router.push("/")}
            >
              Get Started
            </Button>
            <Link href="/docs">
              <Button
                variant="outline"
                size="lg"
                className="px-8 bg-transparent text-white border-white/30 hover:bg-white/10"
              >
                View Docs
              </Button>
            </Link>
          </div>

          <div className="mt-10 max-w-md opacity-75">
            <hr className="border-t border-white/30" />
            <p className="text-[13px] leading-relaxed mt-4 text-white">
              We auto-route your queries to the best model every time, and make it effortless to bring your own data into AI — safely and compliant.
            </p>
          </div>
        </div>

        {/* Right: Video — same top alignment as text */}
        <div className="flex flex-col justify-start">
          <div
            className="w-full overflow-hidden rounded-[2rem]"
            style={{ boxShadow: "0 25px 60px rgba(0,0,0,0.3)" }}
          >
            <video
              src="/videos/hero-video.mp4"
              className="w-full h-auto block"
              autoPlay
              muted
              loop
              playsInline
            />
          </div>
        </div>
      </div>

      {/* Mobile: stacked layout */}
      <div className="flex flex-col md:hidden px-4 pt-24 pb-16">
        <div className="text-center mb-8">
          <h1 className="space-y-2">
            <span className="block text-[36px] leading-[1.05] font-black tracking-tight text-black">
              AI Meets Real Productivity
            </span>
            <span className="block text-[14px] leading-[1.4] font-medium tracking-widest text-black/55 uppercase mt-2">
              A Complete AI Business Operating System
            </span>
          </h1>
        </div>

        <div className="relative w-full max-w-[450px] mx-auto mb-8 rounded-3xl overflow-hidden shadow-2xl">
          <Image
            src={"/images/mobile-hero.png"}
            height={457}
            width={608}
            className="!w-full h-auto"
            alt="AI Dashboard Mobile View"
            priority
          />
        </div>

        <div className="text-center">
          <p className="text-[15px] leading-[24px] text-black/65 mb-8 max-w-[340px] mx-auto">
            Your own AI C-Level Executive Team 24/7/365. No Breaks, No Dramas, just pure execution.
          </p>
          <div className="flex flex-row gap-4 items-center justify-center">
            <Button
              size="lg"
              variant="outline"
              className="px-8 bg-white text-black hover:bg-black hover:text-white border-black transition-all"
              onClick={() => router.push("/")}
            >
              Get Started
            </Button>
            <Link href="/docs">
              <Button variant="outline" size="lg" className="px-8 bg-transparent text-white border-white/30">
                View Docs
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
