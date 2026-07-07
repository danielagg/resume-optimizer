import { createRootRoute, Outlet } from "@tanstack/react-router"
import { ThemeToggle } from "@/components/shared/theme-toggle"

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <Outlet />
    </div>
  )
}