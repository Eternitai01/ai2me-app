import { Card,  CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { COLORS } from "@/constants/colors"
import { Key, Shuffle, ChartBarBig } from "lucide-react"
import { LineComponent } from "../organisms/line-component"

export function HowItWorksSection() {
  const steps = [
    {
      icon: Key,
      title: "Connect",
      description: "Plug in API keys (OpenAI, Claude Gemini, etc.)",
    },
    {
      icon: Shuffle,
      title: "Route",
      description: "AI2me’s smart router directs queries to best-fit provider.",
    },
    {
      icon: ChartBarBig,
      title: "Optimize",
      description: "Track costs, latency, and compliance in the dashboard.",
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <Card className="text-center h-full py-8 border border-[#C3CAD180] shadow-[0px_16px_24px_0px_#3232470A]">
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
