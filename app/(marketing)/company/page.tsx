import { HeroSection } from "@/components/organisms/hero-section"
import { HowItWorksSection } from "@/components/organisms/how-it-works-section"
import { TestimonialsSection } from "@/components/organisms/testimonials-section"
import { KeyFeatures } from "@/components/organisms/key-features"
import { Industries } from "@/components/organisms/industries"
import { Blogs } from "@/components/organisms/blogs"
import { FAQ } from "@/components/organisms/faq"
import { GetStarted } from "@/components/organisms/get-started"
import { LogoSection } from "@/components/organisms/logo-section"
import { ChooseUs } from "@/components/organisms/why-choose-us"
import { TrustBar } from "@/components/organisms/trust-bar"
import { EnterpriseSecuritySection } from "@/components/organisms/enterprise-security-section"

export default function AboutPage() {
    return (
        <div className="">
            <HeroSection />
            <TrustBar />
            <LogoSection />
            <ChooseUs />
            <KeyFeatures />
            <EnterpriseSecuritySection />
            <HowItWorksSection />
            <Industries />
            <Blogs />

            <TestimonialsSection />
            <FAQ />
            <GetStarted />

        </div>
    )
}
