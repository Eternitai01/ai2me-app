"use client";

import {
  Landmark,
  SignalHigh,
  Building2,
  Truck,
  GraduationCap,
  Utensils,
  ShoppingCart,
  Shield,
} from "lucide-react";
import { LineComponent } from "./line-component";

export function Industries() {
  const industries = [
    {
      icon: <Landmark className="w-6 h-6 text-white" />,
      title: "Finance",
      desc: "Ensure secure, compliant financial operations with reliable AI-powered routing.",
    },
    
    {
      icon: <Building2 className="w-6 h-6 text-white" />,
      title: "Healthcare",
      desc: "Keep patient data protected with encrypted AI workflows and logs.",
    },
    
    {
      icon: <GraduationCap className="w-6 h-6 text-white" />,
      title: "Academia",
      desc: "Enable affordable, multi-model AI access for faster research.",
    },
    
    {
      icon: <ShoppingCart className="w-6 h-6 text-white" />,
      title: "Retail",
      desc: "Personalize shopping, optimize stock, and prevent fraud.",
    },
    {
      icon: <SignalHigh className="w-6 h-6 text-white" />,
      title: "Telco",
      desc: "Smarter networks, automated support, and fraud control.",
    },
    {
      icon: <Truck className="w-6 h-6 text-white" />,
      title: "Transportation",
      desc: "Optimize routes, ensure safety, predict maintenance.",
    },
    {
      icon: <Utensils className="w-6 h-6 text-white" />,
      title: "Food",
      desc: "Forecast demand, streamline supply, engage customers.",
    },
    {
      icon: <Shield className="w-6 h-6 text-white" />,
      title: "Insurance",
      desc: "Streamline underwriting, claims processing, and risk assessment with secure, auditable AI workflows.",
    },
  ];

  return (
    <section className="pt-12 md:pt-25 pb-12 md:pb-30 bg-[#00288F] relative">
      <div className="container max-w-7xl mx-auto px-4 md:px-4 lg:px-6 relative z-10">
        <div>
          <p className="text-start text-[16px] font-semibold text-white mb-4">
            Industries
          </p>
          <h1 className="text-start text-[32px] md:text-[48px] font-bold mb-4 text-white">
            Built for every industry
          </h1>
          <p className="text-start text-base font-normal text-white mb-12">
            From finance to healthcare, our AI gateway adapts to your needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {industries.map((item, index) => (
            <div key={index} className="space-y-3">
              <div>{item.icon}</div>
              <div className="flex items-center space-x-3">
                <div className="w-[3px] h-6 rounded-[1px] bg-gradient-to-b from-cyan-400 via-blue-500 to-blue-700"></div>
                <h3 className="text-lg font-semibold text-white">{item.title}</h3>
              </div>
              <p className="text-sm text-white">{item.desc}</p>
            </div>
          ))}
        </div>       
      </div>
       <LineComponent />
    </section>
  );
}
