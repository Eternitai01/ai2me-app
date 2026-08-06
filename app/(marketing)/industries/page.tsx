import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Landmark, Heart, Radio, Building2, ChevronDown, Shield, Zap, BarChart3, Globe } from "lucide-react"

export default function IndustriesPage() {
  const industries = [
    {
      icon: Landmark,
      title: "Banking & Financial Services",
      description: "Meet SOX, Basel III, and regulatory requirements with AI2me's compliant AI infrastructure",
      useCases: [
        "Fraud detection and prevention",
        "Customer service chatbots",
        "Risk assessment and modeling",
        "Compliance reporting automation",
      ],
      compliance: ["SOX", "Basel III", "PCI DSS", "GDPR"],
      color: "text-blue-600",
    },
    {
      icon: Heart,
      title: "Healthcare & Life Sciences",
      description: "HIPAA-compliant AI solutions for patient care and medical research",
      useCases: [
        "Medical report analysis",
        "Patient data insights",
        "Drug discovery support",
        "Clinical decision support",
      ],
      compliance: ["HIPAA", "HITECH", "FDA", "GDPR"],
      color: "text-red-600",
    },
    {
      icon: Radio,
      title: "Telecommunications",
      description: "AI-powered network optimization and customer service for telcos",
      useCases: [
        "Network performance analysis",
        "Customer support automation",
        "Predictive maintenance",
        "Data governance and privacy",
      ],
      compliance: ["GDPR", "CCPA", "Industry regulations", "Data localization"],
      color: "text-green-600",
    },
    {
      icon: Building2,
      title: "Government & Public Sector",
      description: "Secure AI infrastructure for government agencies and public services",
      useCases: [
        "Document processing and analysis",
        "Citizen service automation",
        "Policy analysis and insights",
        "Compliance monitoring",
      ],
      compliance: ["FedRAMP", "FISMA", "State regulations", "Security clearances"],
      color: "text-purple-600",
    },
  ]

  const commonBenefits = [
    {
      icon: Shield,
      title: "Regulatory Compliance",
      description: "Meet industry-specific requirements with built-in compliance features",
    },
    {
      icon: Zap,
      title: "Data Security",
      description: "Enterprise-grade encryption and access controls protect sensitive data",
    },
    {
      icon: BarChart3,
      title: "Audit Trails",
      description: "Blockchain-verified logging ensures complete audit trail visibility",
    },
    {
      icon: Globe,
      title: "Scalability",
      description: "Handle enterprise workloads with intelligent routing and optimization",
    },
  ]

  return (
    <div className="space-y-20">
      {/* Header */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <Badge variant="outline">
              <Building2 className="w-3 h-3 mr-1" />
              Regulated Industries
            </Badge>
            <h1 className="text-4xl lg:text-5xl font-bold">Industries We Serve</h1>
            <p className="text-xl text-muted-foreground">
              AI2me is built for regulated industries that demand compliance, security, and reliability
            </p>
          </div>
        </div>
      </section>

      {/* Industry Sections */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {industries.map((industry, index) => (
              <Card key={index} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-lg bg-muted flex items-center justify-center ${industry.color}`}>
                      <industry.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-2xl mb-2">{industry.title}</CardTitle>
                      <CardDescription className="text-base">{industry.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                        <span className="font-medium">Learn More</span>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-6 pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold mb-3">Use Cases</h4>
                          <ul className="space-y-2">
                            {industry.useCases.map((useCase, useCaseIndex) => (
                              <li key={useCaseIndex} className="flex items-center gap-2 text-sm">
                                <div className="w-1.5 h-1.5 bg-secondary rounded-full" />
                                {useCase}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-3">Compliance Standards</h4>
                          <div className="flex flex-wrap gap-2">
                            {industry.compliance.map((standard, standardIndex) => (
                              <Badge key={standardIndex} variant="outline">
                                {standard}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Common Benefits */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold">Benefits Across All Industries</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Common advantages that AI2me provides to regulated industries
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {commonBenefits.map((benefit, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                    <benefit.icon className="w-6 h-6 text-secondary" />
                  </div>
                  <CardTitle className="text-lg">{benefit.title}</CardTitle>
                  <CardDescription className="text-sm">{benefit.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="max-w-2xl mx-auto text-center">
            <CardHeader>
              <CardTitle className="text-2xl">Ready to Get Started?</CardTitle>
              <CardDescription className="text-base">
                Join other regulated industry leaders who trust AI2me for their AI infrastructure
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg">Get Started Today</Button>
              <a
                href="mailto:team@ai2me.com?subject=AI2ME%20Enterprise%20Inquiry&body=Hi%20AI2ME%20team%2C%0D%0A%0D%0AI%27m%20interested%20in%20the%20Enterprise%20plan.%0D%0A%0D%0ACompany%3A%0D%0AWebsite%3A%0D%0ATeam%20size%3A%0D%0AUse%20case%3A%0D%0A%0D%0AThanks!"
                className="inline-flex"
              >
                <Button variant="outline" size="lg">
                  Contact Sales
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
