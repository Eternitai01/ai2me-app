/**
 * Privacy Policy Page
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-32 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10 pl-2">
          <div className="inline-block px-3 py-1 bg-blue-50 text-[#0033AF] text-[10px] font-bold rounded-full mb-4 tracking-wider uppercase">
            Platform Policies
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-slate-500 mt-4 text-sm font-medium">
            Last updated: {new Date().toLocaleDateString("en-US", { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </header>

        <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
          <CardContent className="p-8 md:p-12 space-y-12 text-slate-600 leading-relaxed text-lg">
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Information We Collect
              </h2>
              <p>
                We collect information you provide directly to us, such as when
                you create an account, use our services, or contact us for
                support. This may include your name, email address, and other
                contact information.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                How We Use Your Information
              </h2>
              <p>
                We use the information we collect to provide, maintain, and
                improve our services, process transactions, send you technical
                notices and support messages, and communicate with you about
                products, services, and promotional offers.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Cookies and Tracking Technologies
              </h2>
              <p>
                We use cookies and similar tracking technologies to collect and
                use personal information about you. You can control cookies
                through your browser settings and our cookie consent management
                system.
              </p>

              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-xl bg-slate-50 border border-slate-100">
                  <h3 className="font-bold text-slate-900 mb-2">
                    Necessary Cookies
                  </h3>
                  <p className="text-sm text-slate-500 leading-normal">
                    Essential for the website to function properly. These cannot
                    be disabled.
                  </p>
                </div>
                <div className="p-6 rounded-xl bg-slate-50 border border-slate-100">
                  <h3 className="font-bold text-slate-900 mb-2">
                    Analytics Cookies
                  </h3>
                  <p className="text-sm text-slate-500 leading-normal">
                    Help us understand how visitors interact with our website by
                    collecting and reporting information anonymously.
                  </p>
                </div>
                <div className="p-6 rounded-xl bg-slate-50 border border-slate-100">
                  <h3 className="font-bold text-slate-900 mb-2">
                    Functional Cookies
                  </h3>
                  <p className="text-sm text-slate-500 leading-normal">
                    Enable enhanced functionality and personalization, such as
                    remembering your preferences.
                  </p>
                </div>
                <div className="p-6 rounded-xl bg-slate-50 border border-slate-100">
                  <h3 className="font-bold text-slate-900 mb-2">
                    Marketing Cookies
                  </h3>
                  <p className="text-sm text-slate-500 leading-normal">
                    Used to track visitors across websites to display relevant
                    and engaging advertisements.
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Data Security
              </h2>
              <p>
                We implement appropriate technical and organizational measures
                to protect your personal information against unauthorized
                access, alteration, disclosure, or destruction.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Your Rights
              </h2>
              <p>
                You have the right to access, update, or delete your personal
                information. You can also opt out of certain communications from
                us and manage your cookie preferences through our cookie consent
                system.
              </p>
            </section>

            <section className="space-y-6 pt-10 border-t border-slate-100">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Contact Us
              </h2>
              <p>
                If you have any questions about this Privacy Policy, please
                contact us at{" "}
                <a
                  href="mailto:privacy@ai2me.com"
                  className="text-[#0033AF] font-bold hover:underline decoration-2 underline-offset-4"
                >
                  privacy@ai2me.com
                </a>
                .
              </p>
            </section>
          </CardContent>
        </Card>

        <footer className="mt-12 text-center text-slate-400 text-sm">
          <p>© {new Date().getFullYear()} AI2me LLC. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
