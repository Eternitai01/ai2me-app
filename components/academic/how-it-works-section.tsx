import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { COLORS } from "@/constants/colors"
import { Wallet, ShieldCheck, Layers, Eye } from "lucide-react"
import { LineComponent } from "../organisms/line-component"

export function HowItWorksSection() {
  const steps = [
    {
      icon: Wallet,
      title: "Affordability",
      description: "Optamize research budgets with cost-effective AI routing.",
    },
    {
      icon: ShieldCheck,
      title: "Compliance",
      description: "Stay audit-ready with GDPR, SOC 2, and ISO-certified AI pipelines.",
    },
    {
      icon: Layers,
      title: "Flexibility",
      description: "Access NLP, vision, and analytics models with no vendor lock-in.",
    },
    
    {
      icon: Eye,
      title: "Transparency",
      description: "Ensure research integrity with blockchain-backed audit trails.",
    },
  ]

  return (
    <section className="pt-8 pb-10 md:pb-18 md:pt-18 relative">
      <div className="container mx-auto max-w-7xl px-4 sm:px-4 lg:px-6 relative z-10">
        <div className="text-center space-y-2 mb-8 md:mb-12">
          <p className={`text-[16px] text-[#0033AF] font-bold`}>Why Choose</p>
          <h2 className={`text-[32px] md:text-[48px] font-bold text-[${COLORS.typography.heading}]`}>
            AI Build for Research & Education
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
                  <CardTitle className="text-base text-[#121416]">{step.title}</CardTitle>
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
