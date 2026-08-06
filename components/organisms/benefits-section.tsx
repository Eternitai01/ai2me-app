import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Network, Shield, TrendingDown } from "lucide-react"

export function BenefitsSection() {
  const benefits = [
    {
      icon: Network,
      title: "7 AI Providers, 1 API",
      description: "Route to OpenAI, Anthropic, Google, and more. Smart routing based on cost, latency, and quality.",
      features: ["No vendor lock-in", "Automatic failover", "Performance optimization"],
    },
    {
      icon: Shield,
      title: "Blockchain-Anchored Audit Trails",
      description: "Immutable logging with Hyperledger. Meet ISO 27001, SOC 2, HIPAA, GDPR requirements.",
      features: ["Hourly blockchain anchoring", "Regulatory compliance", "Audit trail verification"],
    },
    {
      icon: TrendingDown,
      title: "Intelligent Cost Management",
      description: "Automatic routing to cheapest providers. Real-time cost tracking and forecasting.",
      features: ["Cost optimization", "Usage analytics", "Budget alerts"],
    },
  ]

  return (
    <section className="py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold">Why Choose AI2me?</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Enterprise-grade AI infrastructure designed for regulated industries
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <Card key={index} className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                  <benefit.icon className="w-6 h-6 text-secondary" />
                </div>
                <CardTitle className="text-xl">{benefit.title}</CardTitle>
                <CardDescription className="text-base">{benefit.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {benefit.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-secondary rounded-full mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
