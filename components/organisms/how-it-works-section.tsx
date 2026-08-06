import { Card,  CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { COLORS } from "@/constants/colors"
import {  AppWindow, GitMerge, Server, ChartSpline } from "lucide-react"
import { LineComponent } from "./line-component"

export function HowItWorksSection() {
  const steps = [
    {
      icon: AppWindow,
      title: "Your App",
      description: "Send requests through a single endpoint.",
    },
    {
      icon: GitMerge,
      title: "AI Gateway",
      description: "Smart router optimizes provider selection.",
    },
    {
      icon: Server,
      title: "AI Providers",
      description: "Access 7 top providers without extra code.",
    },
    
    {
      icon: ChartSpline,
      title: "Dashboard & Reports",
      description: "Track usage, performance, and costs in real time.",
    },
  ]

  return (
    <section className="pt-14 pb-18 md:pt-18 relative">
      <div className="container mx-auto max-w-7xl px-4 sm:px-4 lg:px-6 relative z-10">
        <div className="text-center space-y-2 mb-12">
          <p className={`text-[16px] text-[#0033AF] font-bold`}>How It Works</p>
          <h2 className={`text-[32px] md:text-[48px] font-bold text-[${COLORS.typography.heading}]`}>
            How Our AI Gateway Works
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <Card className="text-center h-full border border-[#C3CAD180] shadow-[0px_16px_24px_0px_#3232470A]">
                <CardHeader>
                  <div className="mx-auto mb-4">
                    <step.icon strokeWidth={1} className="w-12 h-12 text-[#0033AF]" />
                  </div>
                  <CardTitle className="text-xl">{step.title}</CardTitle>
                  <CardDescription className="text-base leading-[24px] font-normal">{step.description}</CardDescription>
                </CardHeader>
              </Card>
            </div>
          ))}
        </div>
      </div>
      <LineComponent />
    </section>
  )
}
