"use client"


import { PolicySections, SmoothScroll } from "@/components/term-and-conditions/term-sections"
import { DesktopTOC, MobileTOC } from "@/components/term-and-conditions/term-toc"
import { Card, CardContent } from "@/components/ui/card"

export default function Page() {
  return (
    <main className="mx-auto max-w-6xl px-4 md:px-6 py-10 mt-20">
      <SmoothScroll />

      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-balance">AI2me Terms and Conditions</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Last Updated: September 16, 2025 Effective Date: September 16, 2025 
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-6">
        <aside>
          <DesktopTOC />
        </aside>

        <div className="space-y-6">
          <MobileTOC />

          <Card className="border">
            <CardContent>
              <PolicySections />
            </CardContent>
          </Card>

          <div className="flex items-center justify-end">
            <a
              href="#top"
              className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
              onClick={(e) => {
                e.preventDefault()
                window.scrollTo({ top: 0, behavior: "smooth" })
              }}
            >
              Back to top
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}
