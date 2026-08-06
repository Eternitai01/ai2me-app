"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { sections, type Section } from "./term-sections"
import { cn } from "@/lib/utils"

function useActiveSection(ids: string[]) {
  const [active, setActive] = useState<string | null>(ids[0] || null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    const opts: IntersectionObserverInit = {
      root: null,
      rootMargin: "0px 0px -60% 0px",
      threshold: 0.1,
    }
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActive(entry.target.id)
      })
    }, opts)
    observerRef.current = obs
    ids.forEach((id) => {
      const el = document.getElementById(id)
      if (el) obs.observe(el)
    })
    return () => obs.disconnect()
  }, [ids])

  return active
}

export function DesktopTOC({ items = sections }: { items?: Section[] }) {
  const ids = useMemo(() => items.map((s) => s.id), [items])
  const active = useActiveSection(ids)

  return (
    <nav aria-label="Table of contents" className="hidden lg:block sticky top-28">
      <div className="rounded-lg border bg-card text-card-foreground p-4">
        <h2 className="text-sm font-medium text-muted-foreground mb-3">Table of Contents</h2>
        <ul className="space-y-1">
          {items.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className={cn(
                  "block rounded px-2 py-1 text-sm transition-colors",
                  active === s.id ? "bg-[#0033AF] text-accent-foreground" : "hover:bg-muted",
                )}
              >
                {s.title}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}

export function MobileTOC({ items = sections }: { items?: Section[] }) {
  return (
    <nav aria-label="Mobile table of contents" className="lg:hidden">
      <div defaultValue="toc">
        <div className="border rounded-lg">
          <div className="px-4">Table of Contents</div>
          <div>
            <ul className="px-2 pb-2">
              {items.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="block rounded px-2 py-2 text-sm hover:bg-muted">
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </nav>
  )
}
