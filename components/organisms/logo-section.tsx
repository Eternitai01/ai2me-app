"use client";
import Image from "next/image";
import { LineComponent } from "./line-component";

const logos = [
  { src: "/images/icon1.png", alt: "OpenAI" },
  { src: "/images/icon2.png", alt: "Anthropic" },
  { src: "/images/icon3.png", alt: "Hugging Face" },
  { src: "/images/icon4.png", alt: "Azure" },
  { src: "/images/icon5.png", alt: "Amazon Bedrock" },
  { src: "/images/awsbedrock.png", alt: "Amazon Bedrock" },
  { src: "/images/mistralAI.png", alt: "Mistral" },
];

export function LogoSection() {
  return (
    <section className="bg-white py-6 md:py-16 relative">
        <div className="container max-w-7xl mx-auto px-4 md:px-4 lg:px-6 relative z-10">
      <div className=" overflow-hidden relative ">
        <div className="flex animate-marquee whitespace-nowrap">
          {logos.concat(logos).map((logo, i) => (
            <div
              key={i}
              className="flex items-center justify-center min-w-[200px] px-6"
            >
              <Image
                src={logo.src}
                alt={logo.alt}
                width={120}
                height={60}
                className="object-contain h-7 w-auto"
              />
            </div>
          ))}
        </div>
      </div>
      </div>
      <LineComponent  />
    </section>
  );
}
