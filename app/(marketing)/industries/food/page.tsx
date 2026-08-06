import { CaseStudy } from "@/components/food/case-study";
import { FeatureSection } from "@/components/food/feature-section";
import { FoodHeroSection } from "@/components/food/food-hero";
import { GetStarted } from "@/components/food/get-started";
import { HowItWorksSection } from "@/components/food/how-it-works-section";
import { UseCases } from "@/components/food/use-case";
import { TestimonialsSection } from "@/components/organisms/testimonials-section";


export default function page(){
    return(
        <>
        <FoodHeroSection />
        <UseCases />
        <HowItWorksSection />
        <FeatureSection />
        <CaseStudy />
        <TestimonialsSection/>
        <GetStarted />  
        </>
    )
}