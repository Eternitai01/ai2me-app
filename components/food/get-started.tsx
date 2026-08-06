import Link from "next/link";
import { LineComponent } from "../organisms/line-component";


export function GetStarted() {
  return (
    <section className="w-full flex justify-center  pb-12 md:pb-10 pt-10 md:pt-10 relative">
      <div className="w-full max-w-7xl px-4 md:px-4 lg:px-6 relative z-10">
      <div className="w-full rounded-2xl py-20 text-center" 
       style={{
       backgroundImage: `url(/images/borderTesture.png), radial-gradient(ellipse at center, #004EFD 20%, #0033AF 80%)`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    }}
        >
        
        <h2 className="text-[32px] md:text-[48px] font-bold text-white mb-5 leading-[42px] md:leading-[62px]">
          Ready to Transform  <br className="hidden md:block" /> Food & Beverage with Smarter AI
        </h2> 

        <p className="text-white/80 max-w-2xl mx-auto mb-8 text-base font-normal md:text-lg">
        AI2me empowers food businesses to streamline supply chains, maintain quality standards, and understand customer preferences — all through one seamless AI solution.
        </p>

        <Link href={"/"}>
        <button className="bg-white text-black cursor-pointer font-medium py-3 px-6 rounded-full shadow-md hover:shadow-lg transition">
          Get Started
        </button>
        </Link>
      </div>
      </div>
      <LineComponent />
    </section>
  );
}

