import { FAQ } from "@/components/organisms/faq"
import { GetStarted } from "@/components/organisms/get-started"
import { Industries } from "@/components/organisms/industries"
import { TestimonialsSection } from "@/components/organisms/testimonials-section"
import { BannerSection } from "@/components/product/banner-section"
import { HowItWorksSection } from "@/components/product/how-it-works-section"
import { KeyFeatures } from "@/components/product/key-features"
import { ProductPreview } from "@/components/product/product-preview"

export default function ProductsPage() {
 

  return (
    <div className="">
      <BannerSection />
      <KeyFeatures />
      <HowItWorksSection />
      <ProductPreview />
      <Industries />
            
            <TestimonialsSection />
            <FAQ />
            <GetStarted />

    </div>
  )
}
