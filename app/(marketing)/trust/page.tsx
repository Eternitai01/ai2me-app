import { Shield, Lock, Globe, FileCheck, Server } from "lucide-react";
import { COLORS } from "@/constants/colors";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function TrustPage() {
    return (
        <div className="min-h-screen bg-[#F7F8F9]">
            <div className="container max-w-5xl mx-auto px-4 sm:px-4 lg:px-6 py-12 md:py-20">
                <div className="text-center mb-12">
                    <h1 className="text-[32px] md:text-[48px] font-bold mb-4 text-[#121416]">
                        Trust Center
                    </h1>
                    <p className="text-lg text-[#626970] max-w-2xl mx-auto">
                        AI2me is built on AWS infrastructure certified for enterprise-grade
                        security and compliance.
                    </p>
                </div>

                <div className="space-y-8">
                    <section className="bg-white rounded-xl border border-[#C3CAD180] p-8">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-12 h-12 rounded-lg bg-[#0033AF]/10 flex items-center justify-center flex-shrink-0">
                                <Server className="w-6 h-6 text-[#0033AF]" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold mb-3 text-[#121416]">
                                    Infrastructure
                                </h2>
                                <p className="text-[#626970] leading-relaxed">
                                    AI2me is hosted on AWS infrastructure that holds SOC 2, ISO
                                    27001, HIPAA, GDPR, PCI DSS, FedRAMP, and ISO 27017/27018
                                    certifications. This means your data runs on infrastructure
                                    that meets the highest security and compliance standards.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section className="bg-white rounded-xl border border-[#C3CAD180] p-8">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-12 h-12 rounded-lg bg-[#0033AF]/10 flex items-center justify-center flex-shrink-0">
                                <Lock className="w-6 h-6 text-[#0033AF]" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold mb-3 text-[#121416]">
                                    Encryption
                                </h2>
                                <p className="text-[#626970] leading-relaxed">
                                    All traffic is encrypted in transit with TLS 1.3 and at rest
                                    with AES-256. AI2me applies policy checks and optional
                                    redaction before data reaches any AI provider. API keys,
                                    credentials, and sensitive payloads never touch unencrypted
                                    storage.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section className="bg-white rounded-xl border border-[#C3CAD180] p-8">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-12 h-12 rounded-lg bg-[#0033AF]/10 flex items-center justify-center flex-shrink-0">
                                <FileCheck className="w-6 h-6 text-[#0033AF]" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold mb-3 text-[#121416]">
                                    Audit Trails
                                </h2>
                                <p className="text-[#626970] leading-relaxed">
                                    Every AI request generates a tamper-evident log anchored on
                                    blockchain. Give auditors and regulators concrete, verifiable
                                    evidence — not slide decks. All activity is logged with
                                    detailed access controls so your security team can see exactly
                                    who did what, when.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section className="bg-white rounded-xl border border-[#C3CAD180] p-8">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-12 h-12 rounded-lg bg-[#0033AF]/10 flex items-center justify-center flex-shrink-0">
                                <Globe className="w-6 h-6 text-[#0033AF]" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold mb-3 text-[#121416]">
                                    Data Residency
                                </h2>
                                <p className="text-[#626970] leading-relaxed">
                                    Choose where your data lives. Deploy in US, EU, or APAC
                                    regions to meet local regulatory requirements and data
                                    sovereignty laws. We maintain Data Processing Agreements
                                    (DPAs) with all AI providers in our network.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section className="bg-white rounded-xl border border-[#C3CAD180] p-8">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-12 h-12 rounded-lg bg-[#0033AF]/10 flex items-center justify-center flex-shrink-0">
                                <Shield className="w-6 h-6 text-[#0033AF]" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold mb-3 text-[#121416]">
                                    Contact
                                </h2>
                                <p className="text-[#626970] leading-relaxed mb-4">
                                    For security inquiries, compliance documentation requests, or
                                    to discuss enterprise requirements, please contact our team.
                                </p>
                                <Link href="/contacts">
                                    <Button variant="default">Contact Us</Button>
                                </Link>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

