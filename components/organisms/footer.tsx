import Link from "next/link"
import Image from "next/image"
import { Linkedin, } from "lucide-react"
import { LineComponent } from "./line-component"

export function Footer() {
  return (
    <footer className="bg-[#F7F8F9] pt-10 md:pt-18 relative">
      <div className="container max-w-7xl mx-auto px-4 sm:px-4 lg:px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-8 pb-14">
          {/* Company Info */}
          <div className="space-y-4 md:col-span-2">
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="/images/logo2.png"
                width={110}
                height={60}
                className="!h-auto !w-[110px]"
                alt="AI2me Logo"
              />
            </Link>
            <p className="text-[24px] font-bold text-[#121416] leading-[28px]">
              Your Enterprise + AI2me, <br /> your AI Gateway.
            </p>
            <p className="text-base text-muted-foreground">
              Secure, Scalable, Revenue Driven
            </p>
          </div>

          {/* Navigation */}
          <div className="md:col-span-1">
            <h4 className="font-semibold mb-3">Navigation</h4>
            <nav className="flex flex-col space-y-2 text-sm text-muted-foreground">
              <Link href="/">Home</Link>
              <Link href="/products">Products</Link>
              {/* <Link href="/industries">Industries</Link> */}
              {/* <Link href="/docs">Docs</Link> */}
              <Link href="/status">Status</Link>
            </nav>
          </div>

          {/* Resources */}
          <div className="md:col-span-1">
            <h4 className="font-semibold mb-3">Resources</h4>
            <nav className="flex flex-col space-y-2 text-sm text-muted-foreground">
              {/* <Link href="/help">Help Center</Link> */}
              <Link href="/trust">Trust Center</Link>
              <Link href="/security">Security</Link>
              <Link href="/docs#compliance">Compliance</Link>
              <Link href="/docs#apiReference">API Reference</Link>
            </nav>
          </div>

          {/* Company */}
          <div className="md:col-span-1">
            <h4 className="font-semibold mb-3">Company</h4>
            <nav className="flex flex-col space-y-2 text-sm text-muted-foreground">
              <Link href="/about-us">About Us</Link>
              <Link href="/contacts">Contact</Link>
              <Link href="/privacy-policy">Privacy Policy</Link>
              <Link href="/term-and-conditions">Term & Conditions</Link>
            </nav>
          </div>

          {/* Social Links */}
          <div className="md:col-span-1">
            <h4 className="font-semibold mb-3">Social Links</h4>
            <div className="flex space-x-3">
              <Link
                href="https://www.linkedin.com/company/AI2me/about/?viewAsMember=true"
                target="_blank"
                className="p-2 rounded-full border hover:bg-muted"
              >
                <Linkedin className="w-4 h-4" />
              </Link>
              <Link
                href="https://x.com/Ai2meTeam"
                target="_blank"
                className="p-2 rounded-full border hover:bg-muted"
              >
                <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="100" height="100" className="!h-4 !w-4" viewBox="0 0 30 30">
                  <path d="M26.37,26l-8.795-12.822l0.015,0.012L25.52,4h-2.65l-6.46,7.48L11.28,4H4.33l8.211,11.971L12.54,15.97L3.88,26h2.65 l7.182-8.322L19.42,26H26.37z M10.23,6l12.34,18h-2.1L8.12,6H10.23z"></path>
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t mt-8 pt-4 text-center pb-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} AI2me. All rights reserved.
          </p>
        </div>
      </div>
      <LineComponent />
    </footer>
  )
}
