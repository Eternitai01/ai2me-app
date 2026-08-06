import { CaseStudy } from "@/components/industries/case-study";
import { FeatureSection } from "@/components/industries/feature-section";
import { FinanceHeroSection } from "@/components/industries/finance-hero";
import { GetStarted } from "@/components/industries/get-started";
import { HowItWorksSection } from "@/components/industries/how-it-works-section";
import { UseCases } from "@/components/industries/use-case";
import { TestimonialsSection } from "@/components/organisms/testimonials-section";


export default function page(){
    return(
        <>
        <FinanceHeroSection />
        <UseCases />
        <HowItWorksSection />
        <FeatureSection />
        <CaseStudy />
        <TestimonialsSection/>
        <GetStarted />  
        </>
    )
}