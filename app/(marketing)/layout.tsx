import type React from "react";
import { Suspense } from "react";
import { Header } from "@/components/organisms/header";
import { Footer } from "@/components/organisms/footer";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Suspense fallback={null}>
        <Header />
      </Suspense>

      <main className="flex-1">{children}</main>

      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </div>
  );
}
