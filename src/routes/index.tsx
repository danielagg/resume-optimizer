import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { getMRUSession } from "@/lib/storage"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { ArrowRight, FileText, PenLine, Sparkles } from "lucide-react"

export const Route = createFileRoute("/")({
  component: HomePage,
})

const steps = [
  { icon: FileText, label: "Your CV", desc: "Enter your experience" },
  { icon: PenLine, label: "Job posting", desc: "Paste the description" },
  { icon: Sparkles, label: "Aligned", desc: "Get a tailored version" },
]

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
    <main
      className="relative flex min-h-svh flex-col items-center overflow-hidden px-6"
      style={{
        backgroundImage: `
          radial-gradient(ellipse at 20% 20%, oklch(from var(--primary) l c h / 0.35) 0%, transparent 45%),
          radial-gradient(ellipse at 80% 80%, oklch(from var(--accent) l c h / 0.3) 0%, transparent 45%),
          radial-gradient(ellipse at 50% 0%, oklch(from var(--primary) l c h / 0.08) 0%, transparent 60%)
        `,
      }}
    >
      {/* Geometric rings — top-left */}
      <div className="pointer-events-none absolute top-8 left-8 h-[400px] w-[400px] opacity-40 dark:opacity-50">
        <svg viewBox="0 0 400 400" fill="none" className="h-full w-full text-primary/70">
          <circle cx="200" cy="200" r="180" stroke="currentColor" strokeWidth="0.5" />
          <circle cx="200" cy="200" r="120" stroke="currentColor" strokeWidth="0.5" />
          <circle cx="200" cy="200" r="60" stroke="currentColor" strokeWidth="0.5" />
          <line x1="20" y1="200" x2="380" y2="200" stroke="currentColor" strokeWidth="0.5" />
          <line x1="200" y1="20" x2="200" y2="380" stroke="currentColor" strokeWidth="0.5" />
        </svg>
      </div>

      {/* Hexagons — bottom-right */}
      <div className="pointer-events-none absolute bottom-16 right-16 h-[280px] w-[280px] opacity-35 dark:opacity-45">
        <svg viewBox="0 0 100 100" fill="none" className="h-full w-full text-primary/70">
          <polygon points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5" stroke="currentColor" strokeWidth="0.5" />
          <polygon points="50,20 80,35 80,65 50,80 20,65 20,35" stroke="currentColor" strokeWidth="0.5" />
          <polygon points="50,32 68,41 68,59 50,68 32,59 32,41" stroke="currentColor" strokeWidth="0.5" />
        </svg>
      </div>

      {/* Extra accent — floating dots */}
      <div className="pointer-events-none absolute top-1/3 right-1/4 h-2 w-2 rounded-full bg-primary/30 dark:bg-primary/40" />
      <div className="pointer-events-none absolute bottom-1/3 left-1/4 h-3 w-3 rounded-full bg-amber-400/25 dark:bg-amber-400/35" />
      <div className="pointer-events-none absolute top-1/4 left-1/2 h-1.5 w-1.5 rounded-full bg-primary/20 dark:bg-primary/30" />

      {/* Theme toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Content */}
      <div className="flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-16 py-20 text-center">
        {/* Heading */}
        <div className="space-y-6">
          <h1 className="text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
            <span className="text-balance">
              Tailor your CV{" "}
              <span className="text-primary">to any job</span>
            </span>
          </h1>
          <p className="mx-auto max-w-lg text-balance text-lg leading-relaxed text-muted-foreground">
            Drop in your CV, paste a job description, and get a version written
            to match — with zero sign-up.
          </p>
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center gap-4">
          <Button size="lg" onClick={handleGetStarted} className="gap-1.5 px-8 py-6 text-base">
            Get started
            <ArrowRight className="size-4" />
          </Button>
        </div>

        {/* API key notice */}
        <div className="flex items-center gap-2 rounded-lg border border-amber-400/20 bg-amber-400/5 px-4 py-2.5">
          <span className="rounded-md bg-amber-400/15 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-amber-600 dark:text-amber-400">
            BYOK
          </span>
          <p className="text-xs text-muted-foreground">
            Bring your own OpenAI key — the app routes directly to OpenAI.
            Nothing stored server-side.
          </p>
        </div>

        {/* Process steps card */}
        <div className="flex items-center gap-0 rounded-2xl border border-border/50 bg-background/60 px-8 py-5 backdrop-blur-sm">
          {steps.map((step, idx) => (
            <div key={step.label} className="flex items-center">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                  <step.icon className="size-4 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">{step.label}</p>
                  <p className="text-xs text-muted-foreground">{step.desc}</p>
                </div>
              </div>
              {idx < steps.length - 1 && (
                <div className="mx-5 text-muted-foreground/30">
                  <ArrowRight className="size-4" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
