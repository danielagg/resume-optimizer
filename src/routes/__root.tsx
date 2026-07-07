import { useEffect } from "react"
import { createRootRoute, Outlet, useLocation } from "@tanstack/react-router"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { SessionPopover } from "@/components/shared/session-popover"
import { useAlignmentStore } from "@/store/alignment"
import { getActiveSession, getMRUSession } from "@/lib/storage"

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
  const sessionDisabled = path === "/" || path === "/builder"

  return (
    <div className="min-h-svh bg-background text-foreground">
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        <SessionPopover disabled={sessionDisabled} />
        <ThemeToggle />
      </div>
      <Outlet />
    </div>
  )
}