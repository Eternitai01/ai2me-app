import { TestimonialsSection } from "@/components/organisms/testimonials-section";
import { CaseStudy } from "@/components/transportation/case-study";
import { FeatureSection } from "@/components/transportation/feature-section";
import { GetStarted } from "@/components/transportation/get-started";
import { HowItWorksSection } from "@/components/transportation/how-it-works-section";
import { TransportationHeroSection } from "@/components/transportation/transportation-hero";
import { UseCases } from "@/components/transportation/use-case";

export default function page(){
    return(
        <>
        <TransportationHeroSection />
        <UseCases />
        <HowItWorksSection />
        <FeatureSection />
        <CaseStudy />
        <TestimonialsSection/>
        <GetStarted />  
        </>
    )
}