import Image from "next/image";

export function CaseStudy() {
    return (
        <>
            <section className="py-8 md:py-20 bg-[#00288F] relative overflow-hidden">
                <div className="container max-w-7xl mx-auto px-4 md:px-4 lg:px-6">
                    <div className="content text-white max-w-lg relative z-10">
                        <p className="text-sm font-semibold mb-2">Case Study</p>
                        <h2 className="text-[32px] md:text-[48px] font-bold mb-4 text-pretty">
                            AI2me Boosted Imaging Accuracy by 18%
                        </h2>
                        <p className="text-base font-light mb-5">
                            Hospital network used AI2me to run multiple models on radiology scans. The ensemble AI approach reduced misdiagnosis and improved patient outcomes while staying fully HIPAA-compliant.
                        </p>
                        <div className="py-3 px-5 bg-[#0033AF] font-base rounded-md font-normal mb-6">
                            <p>“18% higher diagnostic accuracy with AI2me.”</p>
                        </div>
                        <div className="mt-4">
                            {/* <a href="#" className="flex items-center text-white font-semibold group">
                                Read Full Case Study
                                <svg className="ml-2 w-6 h-6 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                                </svg>
                            </a> */}
                            {/* <Button className="flex items-center gap-2" variant={"outline"}>Read Full Case Study <ArrowRight className="w-4 h-4" /></Button> */}
                        </div>
                    </div>
                </div>
                <div className="p-6 rounded-2xl bg-[#ffffff2e] rounded-bl-[0px] rounded-tr-[0px] pb-6 pr-6  lg:pb-0 lg:pr-0 relative mt-8 lg:mt-0 lg:absolute bottom-0 right-0 w-[100%] lg:w-[684px] h-[240px] md:h-[419px]">
                    <Image 
                        src={"/images/healthcareCasestudy.png"} 
                        width={684} 
                        height={419} 
                        className="w-full h-[200px] md:h-full rounded-t-2xl rounded-tr-[0px] object-contain md:object-cover" 
                        alt="A graph showing reduced financial fraud" 
                    />
                </div>
            </section>
        </>
    );
}