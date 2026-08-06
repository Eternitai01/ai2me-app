
import { TestimonialsSection } from "@/components/organisms/testimonials-section";
import { CaseStudy } from "@/components/telco/case-study";
import { FeatureSection } from "@/components/telco/feature-section";
import { GetStarted } from "@/components/telco/get-started";
import { HowItWorksSection } from "@/components/telco/how-it-works-section";
import { TelcoHeroSection } from "@/components/telco/telco-hero";
import { UseCases } from "@/components/telco/use-case";




export default function page(){
    return(
        <>
        <TelcoHeroSection />
        <UseCases />
        <HowItWorksSection />
        <FeatureSection />
        <CaseStudy />
        <TestimonialsSection/>
        <GetStarted />  
        </>
    )
}