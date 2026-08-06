"use client";
import { Shuffle } from "lucide-react";
import { useEffect, useState } from "react";
import Image from "next/image";
import { LineComponent } from "./line-component";
import Link from "next/link";

const tabs = [
  {
    id: 1,
    title: "Multi-Model Gateway",
    description:
      "Easily switch between leading AI providers like OpenAI, Claude, and Gemini with a single unified API. No need to rewrite your code — our gateway abstracts provider differences and keeps your workflow uninterrupted.",
    button: "See Supported Models",
    image: "/images/tabImg1.png", // replace with your image
  },
  {
    id: 2,
    title: "AI Security",
    description:
      "Protect your workflows with built-in malware detection and AI safety layers. Ensure compliance and trust while scaling AI in production.",
    button: "Learn More",
    image: "/images/tabImg1.png",
  },
  {
    id: 3,
    title: "Analytics Dashboard",
    description:
      "Track AI usage, costs, and performance in real time. Gain insights to optimize workflows and maximize ROI.",
    button: "View Dashboard",
    image: "/images/tabImg1.png",
  },
];

export function ChooseUs() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setActiveIndex((prevIndex) => (prevIndex + 1) % tabs.length);
          return 0;
        }
        return prev + 2; // adjust speed (2 → 5s total since 100/2*100ms = 5s)
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const activeTab = tabs[activeIndex];

  return (
    <section className="py-6 md:py-16 bg-gray-50 relative">
      <div className="container max-w-7xl mx-auto px-4 lg:px-6 relative z-10">
        <div className="max-w-[1000px] mx-auto text-center mb-10">
          <p className="text-[16px] font-semibold text-[#0033AF] mb-4">
            Why choose Our AI Gateway
          </p>
          <h1 className="text-[32px] md:text-[48px] font-bold text-[#121416] text-pretty">
            Route to the best LLM model in real time -optimize cost, latency, and compliance.
          </h1>
        </div>

        {/* Tabs Section */}
        <div className="grid md:grid-cols-2 gap-10 md:gap-40 items-center mt-15">
          {/* Left Content */}
          <div>
            <div className="bg-white flex justify-center items-center rounded-xl shadow-[0px_2px_4px_0px_#3232470F] h-12 w-12"><Shuffle className="h-6 w-6 relative z-40 text-[#0033AF]" /></div>
            <h3 className="text-2xl font-bold text-[#121416] mb-3 mt-4">
              {activeTab.title}
            </h3>
            <p className="text-[#626970] text-base font-normal mb-6">{activeTab.description}</p>
            <Link href={"/"}><button className="px-5 h-10 cursor-pointer border border-black text-base foont-normal rounded-full hover:bg-black hover:text-white transition">
              {activeTab.button}
            </button></Link>
          </div>

          {/* Right Content */}
          <div className="relative w-full z-10 h-[300px] md:h-[448px] bg-[#dee2e6]  rounded-xl flex items-center justify-center p-6">
            <Image src={activeTab.image} alt={activeTab.title} width={1000} height={1000} className="object-contain max-h-full" />
            {/* Progress Bar */}
            <div className="absolute bottom-5 left-0 w-[90%] right-0 mx-auto h-[4px] bg-[#D2D1F8] rounded-[8px] overflow-hidden">
              <div
                className="h-full bg-[#121416] transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
      <LineComponent />
    </section>
  );
}

