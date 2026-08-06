import { CaseStudy } from "@/components/healthcare/case-study";
import { FeatureSection } from "@/components/healthcare/feature-section";
import { GetStarted } from "@/components/healthcare/get-started";
import { HealthHeroSection } from "@/components/healthcare/health-hero";
import { HowItWorksSection } from "@/components/healthcare/how-it-works-section";
import { UseCases } from "@/components/healthcare/use-case";
import { TestimonialsSection } from "@/components/organisms/testimonials-section";



export default function page(){
    return(
        <>
        <HealthHeroSection />
        <UseCases />
        <HowItWorksSection />
        <FeatureSection />
        <CaseStudy />
        <TestimonialsSection/>
        <GetStarted />  
        </>
    )
}