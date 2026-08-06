"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Menu, X } from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import { COLORS } from "@/constants/colors";
import { usePathname, useRouter } from "next/navigation";
// import { useAuthModal } from "@/context/AuthModalContext";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openIndustries, setOpenIndustries] = useState(false);
  // const { openModal } = useAuthModal();
  const router = useRouter();
  const pathname = usePathname();
  const industries = [
    "Finance",
    "Healthcare",
    "Academic",
    "Retail",
    "Telco",
    "Transportation",
    "Food",
  ];

  const linkClass = (href: string) =>
    `inline-flex h-10 items-center justify-center px-4 py-2 text-sm font-medium ${pathname === href
      ? "text-white font-semibold"
      : "text-white/70 hover:text-white"
    }`;

  return (
    <header className="absolute top-0 z-50 w-full">
      <div className="container max-w-7xl mx-auto px-4 sm:px-4 lg:px-6">
        <div className="flex h-auto py-4 items-center justify-between">
          <div className="flex items-center gap-10">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src={"/images/logo-transparent.png"}
                width={150}
                height={72}
                className="!h-auto !w-[105px]"
                alt="AI2ME"
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden xl:flex">
              <ul className="flex space-x-1">
                <li>
                  <Link
                    href="/company"
                    className={`inline-flex h-10 items-center justify-center px-3 py-2 text-sm font-semibold [${COLORS.typography.heading}] ${linkClass("/")}`}
                  >
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    href="/products"
                    className={`inline-flex h-10 items-center justify-center px-3 py-2 text-sm font-medium text-white/70 hover:text-white ${linkClass("/products")}`}
                  >
                    Products
                  </Link>
                </li>
                <li className="relative flex items-center group">
                  <Link
                    href="###"
                    className={`inline-flex h-10 items-center justify-center px-3 py-2 text-sm font-medium text-white/70 hover:text-white ${linkClass("/industries")}`}
                  >
                    Industries <ChevronDown className="ml-1 h-4 w-4" />
                  </Link>
                  <div className="absolute top-[70%] left-0 w-[150px] h-auto z-30 bg-white rounded-2xl shadow-lg mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 invisible group-hover:visible">
                    <ul>
                      {industries.map((item, index) => (
                        <li key={index}>
                          <Link
                            href={`/industries/${item.toLowerCase()}`}
                            className={`block px-4 py-2 text-sm text-[${COLORS.typography.neutralText}] hover:bg-gray-100 hover:text-[${COLORS.typography.heading}]  ${index === 0 ? "rounded-t-2xl" : ""} 
        ${index === industries.length - 1 ? "rounded-b-2xl" : ""}`}
                          >
                            {item}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
                <li>
                  <Link
                    href="/docs"
                    className={`inline-flex h-10 items-center justify-center px-3 py-2 text-sm font-medium text-white/70 hover:text-white ${linkClass("/docs")}`}
                  >
                    Docs
                  </Link>
                </li>
                <li>
                  <Link
                    href="/status"
                    className={`inline-flex h-10 items-center justify-center px-3 py-2 text-sm font-medium text-white/70 hover:text-white ${linkClass("/status")}`}
                  >
                    Status
                  </Link>
                </li>
                <li>
                  {/* OLD: linked to pricing page — redirect to contact per requirement. */}
                  {/* <Link href="/pricing" ...>Pricing</Link> */}
                  <Link
                    href="/pricing"
                    className={`inline-flex h-10 items-center justify-center px-3 py-2 text-sm font-medium text-white/70 hover:text-white ${linkClass("/pricing")}`}
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about-us"
                    className={`inline-flex h-10 items-center justify-center px-3 py-2 text-sm font-medium text-white/70 hover:text-white ${linkClass("/about-us")}`}
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className={`inline-flex h-10 items-center justify-center px-3 py-2 text-sm font-medium text-white/70 hover:text-white ${linkClass("/contact")}`}
                  >
                    Contact
                  </Link>
                </li>
                <li>
                  <Link
                    href="/press"
                    className={`inline-flex h-10 items-center justify-center px-3 py-2 text-sm font-medium text-white/70 hover:text-white ${linkClass("/press")}`}
                  >
                    Press
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Desktop CTA Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              {/* OLD: opened login modal — redirect to contact per requirement. */}
              {/* <Button ... onClick={() => openModal("login")}>Get Started</Button> */}
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto bg-white text-black hover:bg-black hover:text-white border-black transition-colors"
                onClick={() => router.push("/?auth=signup")}
              >
                Get Started
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="xl:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="xl:hidden border-t bg-white fixed top-0 left-0 w-full h-[100vh] md:h-[103vh]  !z-[99999999999] p-6">
            <div className="flex items-center justify-between mb-10">
              <Link href="/" className="flex items-center space-x-2">
                <Image
                  src={"/images/logo-transparent.png"}
                  width={150}
                  height={72}
                  className="!h-auto !w-[105px]"
                  alt="AI2ME"
                />
              </Link>
              <button
                className="lg:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="flex flex-col space-y-4">
              <Link href="/company" className="text-sm font-medium hover:text-secondary">
                Home
              </Link>
              <Link href="/products" className="text-sm font-medium hover:text-secondary">
                Products
              </Link>

              {/* Industries Dropdown */}
              <div>
                <button
                  onClick={() => setOpenIndustries(!openIndustries)}
                  className="flex items-center justify-between w-full text-sm font-medium hover:text-secondary"
                >
                  Industries
                  {openIndustries ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>

                {openIndustries && (
                  <div className="mt-4 flex flex-col space-y-2.5 pl-2">
                    {industries.map((item, idx) => (
                      <Link
                        key={idx}
                        href={`/industries/${item.toLowerCase()}`}
                        className="text-sm hover:text-secondary"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <Link href="/docs" className="text-sm font-medium hover:text-secondary">
                Docs
              </Link>
              <Link href="/status" className="text-sm font-medium hover:text-secondary">
                Status
              </Link>
              {/* OLD: linked to /pricing — redirect to contact per requirement. */}
              {/* <Link href="/pricing">Pricing</Link> */}
              <Link href="/pricing" className="text-sm font-medium hover:text-secondary" onClick={() => setMobileMenuOpen(false)}>
                Pricing
              </Link>
              <Link href="/about-us" className="text-sm font-medium hover:text-secondary" onClick={() => setMobileMenuOpen(false)}>
                About Us
              </Link>
              <Link href="/contact" className="text-sm font-medium hover:text-secondary">
                Contact
              </Link>
              {/* <Link
                href="/chat"
                className="inline-flex items-center justify-center px-5 py-2 text-sm font-medium text-white bg-black hover:bg-gray-800 rounded-full transition-colors whitespace-nowrap"
              >
                Launch Productivity App
              </Link> */}

              <div className="flex flex-col space-y-2 pt-4 border-t">
                {/* OLD: opened login modal — redirect to contact per requirement. */}
                {/* <button ... onClick={() => { openModal("login"); setMobileMenuOpen(false); }}>Get Started</button> */}
                <button
                  className="text-sm font-medium hover:text-secondary text-left bg-white text-black px-4 py-2 rounded-full border border-black hover:bg-black hover:text-white transition-colors"
                  onClick={() => {
                    router.push("/?auth=signup");
                    setMobileMenuOpen(false);
                  }}
                >
                  Get Started
                </button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}



