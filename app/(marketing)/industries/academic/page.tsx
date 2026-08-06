import { AcademicHeroSection } from "@/components/academic/academic-hero";
import { CaseStudy } from "@/components/academic/case-study";
import { FeatureSection } from "@/components/academic/feature-section";
import { GetStarted } from "@/components/academic/get-started";
import { HowItWorksSection } from "@/components/academic/how-it-works-section";
import { UseCases } from "@/components/academic/use-case";
import { TestimonialsSection } from "@/components/organisms/testimonials-section";



export default function page(){
    return(
        <>
        <AcademicHeroSection />
        <UseCases />
        <HowItWorksSection />
        <FeatureSection />
        <CaseStudy />
        <TestimonialsSection/>
        <GetStarted />  
        </>
    )
}