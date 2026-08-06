import { Building, Mail, Phone } from "lucide-react";
import Image from "next/image";

export default function page() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-indigo-50 to-indigo-100 pt-18 mt-20">
      <div className="max-w-5xl mx-auto bg-white shadow-lg rounded-2xl overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left: Hero + Contact Details */}
          <section className="p-8 md:p-12">
            <h1 className="text-3xl md:text-4xl font-semibold leading-tight mb-3">Contact Us</h1>
            <p className="text-sm text-gray-600 mb-6">We&quot;d love to hear from you — whether it&quot;s a question, feedback, or a collaboration idea. Reach out using any of the options below.</p>

            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-lg border border-gray-100 shadow-sm">
                <div className="flex-none w-10 h-10 min-w-10 rounded-full bg-indigo-50 flex items-center justify-center">
                  {/* Address Icon */}
                  <Building className="h-5 w-5 text-[#0033AF]" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Address</h3>
                  <p className="text-sm text-gray-600">Miami, Florida</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-lg border border-gray-100 shadow-sm">
                <div className="flex-none w-10 h-10 min-w-10 rounded-full bg-indigo-50 flex items-center justify-center">
                  {/* Email Icon */}
                  <Mail className="h-5 w-5 text-[#0033AF]" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Email</h3>
                  <p className="text-sm text-gray-600"><a href="mailto:team@ai2me.com" className="underline">team@ai2me.com</a></p>
                </div>
              </div>
            </div>

            {/* <p className="mt-6 text-xs text-gray-400">Office hours: Mon — Fri, 9:00 AM — 6:00 PM</p> */}
          </section>

          {/* Right: Map / Illustration */}
          <aside className="p-0 md:p-0 bg-indigo-50 flex items-center justify-center">
            <Image src={"/images/contact.png"} height={500} width={800} className="!h-full !w-full object-cover" alt="" />
            </aside>
        </div>

      </div>
      {/* <div className="mt-20">
        <iframe  title="office-location" src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d114964.53920138007!2d-80.30779518498541!3d25.782390792685803!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x88d9b0a20ec8c111%3A0xff96f271ddad4f65!2sMiami%2C%20FL%2C%20USA!5e0!3m2!1sen!2sin!4v1758621075491!5m2!1sen!2sin"  className="w-full h-[500px] border-0" loading="lazy" ></iframe>
      </div> */}
    </main>
  );
}
