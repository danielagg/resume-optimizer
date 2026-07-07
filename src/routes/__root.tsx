import { useEffect } from "react"
import { createRootRoute, Outlet, useLocation } from "@tanstack/react-router"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { SessionPopover } from "@/components/shared/session-popover"
import { useAlignmentStore } from "@/store/alignment"
import { getActiveSession, getMRUSession } from "@/lib/storage"
import { FileText } from "lucide-react"

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  const location = useLocation()
  const { hydrateFromSession } = useAlignmentStore()

  useEffect(() => {
    const active = getActiveSession()
    if (active) {
      hydrateFromSession(active)
      return
    }
    const mru = getMRUSession()
    if (mru) {
      hydrateFromSession(mru)
    }
  }, [hydrateFromSession])

  const path = location.pathname
  const isHome = path === "/"
  const sessionDisabled = path === "/" || path === "/builder"

  return (
    <div className="min-h-svh bg-background text-foreground">
      {/* Full-page ambient background — edge to edge */}
      {!isHome && (
        <div
          className="pointer-events-none fixed inset-0 z-0"
          style={{
            backgroundImage: `
              radial-gradient(ellipse at 15% 15%, oklch(from var(--primary) l c h / 0.12) 0%, transparent 45%),
              radial-gradient(ellipse at 85% 85%, oklch(from var(--accent) l c h / 0.1) 0%, transparent 45%),
              radial-gradient(ellipse at 50% 0%, oklch(from var(--primary) l c h / 0.05) 0%, transparent 60%),
              linear-gradient(180deg, transparent 0%, oklch(from var(--primary) l c h / 0.02) 50%, transparent 100%)
            `,
          }}
        >
          {/* Geometric rings — top-left */}
          <div className="absolute -top-24 -left-24 h-[500px] w-[500px] opacity-25 dark:opacity-35">
            <svg viewBox="0 0 400 400" fill="none" className="h-full w-full text-primary">
              <circle cx="200" cy="200" r="180" stroke="currentColor" strokeWidth="0.5" />
              <circle cx="200" cy="200" r="120" stroke="currentColor" strokeWidth="0.5" />
              <circle cx="200" cy="200" r="60" stroke="currentColor" strokeWidth="0.5" />
              <line x1="20" y1="200" x2="380" y2="200" stroke="currentColor" strokeWidth="0.5" />
              <line x1="200" y1="20" x2="200" y2="380" stroke="currentColor" strokeWidth="0.5" />
            </svg>
          </div>

          {/* Hexagons — bottom-right */}
          <div className="absolute -bottom-20 -right-20 h-[350px] w-[350px] opacity-20 dark:opacity-30">
            <svg viewBox="0 0 100 100" fill="none" className="h-full w-full text-primary/80">
              <polygon points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5" stroke="currentColor" strokeWidth="0.5" />
              <polygon points="50,20 80,35 80,65 50,80 20,65 20,35" stroke="currentColor" strokeWidth="0.5" />
              <polygon points="50,32 68,41 68,59 50,68 32,59 32,41" stroke="currentColor" strokeWidth="0.5" />
            </svg>
          </div>

          {/* Floating dots */}
          <div className="absolute top-1/4 right-1/3 h-2 w-2 rounded-full bg-primary/20 dark:bg-primary/30" />
          <div className="absolute bottom-1/3 left-1/4 h-3 w-3 rounded-full bg-amber-400/20 dark:bg-amber-400/30" />
          <div className="absolute top-2/3 right-1/4 h-1.5 w-1.5 rounded-full bg-primary/15 dark:bg-primary/25" />
        </div>
      )}

      <header
        className={`fixed top-0 left-0 right-0 z-40 border-b border-border/50 bg-background/60 backdrop-blur-xl transition-all duration-300 ${
          isHome ? "-translate-y-full" : "translate-y-0"
        }`}
        style={{
          backgroundImage: `
            linear-gradient(to right, oklch(from var(--primary) l c h / 0.04), transparent 40%, transparent 60%, oklch(from var(--accent) l c h / 0.04))
          `,
        }}
      >
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <a
            href="/"
            className="flex items-center gap-2 text-sm font-semibold tracking-tight"
          >
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <FileText className="size-3.5" />
            </div>
            Resume Optimizer
          </a>
          <div className="flex items-center gap-1.5">
            <SessionPopover disabled={sessionDisabled} />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <div className={`relative z-10 ${isHome ? "" : "pt-14"}`}>
        <Outlet />
      </div>
    </div>
  )
}
