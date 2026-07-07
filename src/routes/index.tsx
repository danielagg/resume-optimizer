import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { getMRUSession } from "@/lib/storage"

export const Route = createFileRoute("/")({
  component: HomePage,
})

function HomePage() {
  const navigate = useNavigate()

  const handleGetStarted = () => {
    const mru = getMRUSession()
    if (mru && mru.alignedResume) {
      navigate({ to: "/preview" })
    } else if (mru) {
      navigate({ to: "/customize" })
    } else {
      navigate({ to: "/builder" })
    }
  }

  return (
    <main className="mx-auto flex min-h-svh max-w-3xl flex-col items-center justify-center gap-8 px-6 py-20 text-center">
      <div className="space-y-4">
        <h1 className="text-4xl font-medium tracking-tight sm:text-5xl">
          Resume Optimizer
        </h1>
        <p className="mx-auto max-w-xl text-base text-muted-foreground sm:text-lg">
          Input your CV, paste a job posting, get a tailored version in seconds.
          No sign-up. Your data never leaves your browser except to talk to
          OpenAI with your own key.
        </p>
      </div>
      <Button size="lg" onClick={handleGetStarted}>
        Get Started
      </Button>
      <p className="text-xs text-muted-foreground">
        Press <kbd className="rounded border px-1">d</kbd> to toggle dark mode
      </p>
    </main>
  )
}