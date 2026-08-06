import { TestimonialsSection } from "@/components/organisms/testimonials-section";
import { CaseStudy } from "@/components/retail/case-study";
import { FeatureSection } from "@/components/retail/feature-section";
import { GetStarted } from "@/components/retail/get-started";
import { HowItWorksSection } from "@/components/retail/how-it-works-section";
import { RetailHeroSection } from "@/components/retail/retail-hero";
import { UseCases } from "@/components/retail/use-case";




export default function page(){
    return(
        <>
        <RetailHeroSection />
        <UseCases />
        <HowItWorksSection />
        <FeatureSection />
        <CaseStudy />
        <TestimonialsSection/>
        <GetStarted />  
        </>
    )
}