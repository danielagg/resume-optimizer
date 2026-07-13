import { useEffect } from "react"
import { createRootRoute, Outlet, useLocation } from "@tanstack/react-router"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { SessionPopover } from "@/components/shared/session-popover"
import { useAlignmentStore } from "@/store/alignment"
import { getActiveSession, getMRUSession } from "@/lib/storage"
import { FileText, Sparkles } from "lucide-react"

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
      {!isHome && (
        <div className="app-grid pointer-events-none fixed inset-0 z-0 opacity-70" />
      )}
      {!isHome && (
        <div className="pointer-events-none fixed inset-x-0 top-0 z-0 h-[32rem] bg-[radial-gradient(ellipse_at_top,oklch(from_var(--primary)_l_c_h/0.10),transparent_65%)]" />
      )}

      <header
        className={`fixed top-0 right-0 left-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-2xl transition-all duration-300 ${
          isHome ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <a
            href="/"
            className="group flex shrink-0 items-center gap-2.5 text-sm font-semibold tracking-[-0.02em]"
          >
            <div className="relative flex size-8 items-center justify-center rounded-[0.7rem] bg-foreground text-background shadow-sm transition-transform group-hover:-rotate-3">
              <FileText className="size-4" />
              <Sparkles className="absolute -top-1 -right-1 size-3 rounded-full bg-accent p-0.5 text-accent-foreground" />
            </div>
            <span className="hidden sm:inline">Resume Optimizer</span>
          </a>
          <div className="flex items-center gap-1.5">
            <SessionPopover disabled={sessionDisabled} />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <div className={`relative z-10 ${isHome ? "" : "pt-16"}`}>
        <Outlet />
      </div>
    </div>
  )
}
