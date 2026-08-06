import type React from "react"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center">
        <div className="w-full">{children}</div>
      </main>

      {/* Minimal footer */}
      {/* <footer className="border-t bg-muted/50 py-6">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>© 2024 AI2me. All rights reserved.</p>
            <div className="flex gap-4">
              <Link href="/privacy" className="hover:text-foreground">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-foreground">
                Terms
              </Link>
              <Link href="/contacts" className="hover:text-foreground">
                Support
              </Link>
            </div>
          </div>
        </div>
      </footer> */}
    </div>
  )
}

