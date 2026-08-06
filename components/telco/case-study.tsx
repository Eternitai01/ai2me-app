import Image from "next/image";

export function CaseStudy() {
    return (
        <>
            <section className="py-8 md:py-20 bg-[#00288F] relative overflow-hidden">
                <div className="container max-w-7xl mx-auto px-4 md:px-4 lg:px-6">
                    <div className="content text-white max-w-lg relative z-10">
                        <p className="text-sm font-semibold mb-2">Case Study</p>
                        <h2 className="text-[32px] md:text-[48px] font-bold mb-4 text-pretty">
                           Telco Cut Fraud Losses by 30%
                        </h2>
                        <p className="text-base font-light mb-5">
                            A leading telecom operator integrated AI2mes fraud detection and routing system. SIM-swap fraud reduced by 30%, while customer service speed improved by 25%.
                        </p>
                        <div className="py-3 px-5 bg-[#0033AF] font-base rounded-md font-normal mb-6">
                            <p>“AI2me stopped fraud before it reached our customers”</p>
                        </div>
                        <div className="mt-4">
                          
                            {/* <Button className="flex items-center gap-2" variant={"outline"}>Read Full Case Study<ArrowRight className="w-4 h-4" /></Button> */}
                        </div>
                    </div>
                </div>
                <div className="p-6 rounded-2xl bg-[#ffffff2e] rounded-bl-[0px] rounded-tr-[0px] pb-6 pr-6  lg:pb-0 lg:pr-0 relative mt-8 lg:mt-0 lg:absolute bottom-0 right-0 w-[100%] lg:w-[684px] h-[240px] md:h-[419px]">
                    <Image 
                        src={"/images/telcoCaseStudy.png"} 
                        width={684} 
                        height={419} 
                        className="w-full h-[200px] md:h-full rounded-t-2xl rounded-tr-[0px] object-cover object-left-top md:object-cover" 
                        alt="A graph showing reduced financial fraud " 
                    />
                </div>
            </section>
        </>
    );
}