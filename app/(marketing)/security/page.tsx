import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SecurityPage() {
    return (
        <div className="min-h-screen bg-[#F7F8F9]">
            <div className="container max-w-5xl mx-auto px-4 sm:px-4 lg:px-6 py-12 md:py-20">
                <div className="text-center mb-12">
                    <h1 className="text-[32px] md:text-[48px] font-bold mb-4 text-[#121416]">
                        Security
                    </h1>
                    <p className="text-lg text-[#626970] max-w-2xl mx-auto">
                        Learn more about AI2me's security practices and compliance
                        certifications.
                    </p>
                </div>

                <div className="bg-white rounded-xl border border-[#C3CAD180] p-8 text-center">
                    <p className="text-[#626970] mb-6">
                        For detailed security information, please visit our Trust Center.
                    </p>
                    <Link href="/trust">
                        <Button variant="default">Visit Trust Center</Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

