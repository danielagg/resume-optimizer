import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { getMRUSession } from "@/lib/storage"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import {
  ArrowRight,
  Check,
  FileText,
  LockKeyhole,
  PenLine,
  Sparkles,
  Target,
} from "lucide-react"

export const Route = createFileRoute("/")({
  component: HomePage,
})

const steps = [
  {
    icon: FileText,
    label: "Build your base",
    desc: "Add your experience once.",
  },
  { icon: PenLine, label: "Set the target", desc: "Paste any job posting." },
  { icon: Sparkles, label: "Refine the fit", desc: "Review, revise, export." },
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
    <main className="relative min-h-svh overflow-hidden">
      <div className="app-grid pointer-events-none absolute inset-0 opacity-70" />
      <div className="pointer-events-none absolute -top-40 right-[-12rem] size-[42rem] rounded-full bg-accent/25 blur-[100px]" />
      <div className="pointer-events-none absolute top-[32rem] -left-64 size-[34rem] rounded-full bg-primary/10 blur-[110px]" />

      <header className="relative z-20 mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
        <a
          href="/"
          className="group flex items-center gap-2.5 text-sm font-semibold tracking-[-0.02em]"
        >
          <div className="relative flex size-9 items-center justify-center rounded-xl bg-foreground text-background shadow-sm transition-transform group-hover:-rotate-3">
            <FileText className="size-4" />
            <Sparkles className="absolute -top-1 -right-1 size-3.5 rounded-full bg-accent p-0.5 text-accent-foreground" />
          </div>
          Resume Optimizer
        </a>
        <div className="flex items-center gap-3">
          <span className="hidden font-mono text-[0.65rem] tracking-[0.14em] text-muted-foreground uppercase sm:block">
            Private by design
          </span>
          <ThemeToggle />
        </div>
      </header>

      <section className="relative z-10 mx-auto grid max-w-7xl items-center gap-14 px-5 pt-14 pb-20 sm:px-8 sm:pt-20 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20 lg:pt-24 lg:pb-28">
        <div className="max-w-2xl">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-card/70 px-3 py-1.5 shadow-sm backdrop-blur-xl">
            <span className="flex size-5 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <Target className="size-3" />
            </span>
            <span className="eyebrow">Built for the shortlist</span>
          </div>
          <h1 className="text-[clamp(3.25rem,7vw,6.7rem)] leading-[0.93] font-semibold tracking-[-0.065em] text-balance">
            Your story,
            <span className="mt-1 block text-primary">better aligned.</span>
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-8 text-balance text-muted-foreground sm:text-xl">
            Turn one solid CV into a sharp, role-specific application — without
            sanding away the voice that makes it yours.
          </p>
          <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Button
              size="lg"
              onClick={handleGetStarted}
              className="h-13 gap-2 px-7 text-base"
            >
              Optimize my CV
              <ArrowRight className="size-4 transition-transform group-hover/button:translate-x-1" />
            </Button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <LockKeyhole className="size-4 text-primary" />
              No account. No server storage.
            </div>
          </div>
          <div className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-muted-foreground">
            {[
              "Guided improvements",
              "PDF-ready output",
              "You stay in control",
            ].map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <Check className="size-3.5 text-primary" /> {item}
              </span>
            ))}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[660px] lg:mx-0">
          <div className="absolute -inset-5 -z-10 rotate-2 rounded-[2.25rem] bg-accent/35" />
          <div className="surface-shadow overflow-hidden rounded-[1.75rem] border border-border/70 bg-card/95 backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-primary" />
                <span className="font-mono text-[0.68rem] font-semibold tracking-[0.14em] uppercase">
                  Alignment report
                </span>
              </div>
              <span className="rounded-full bg-accent/50 px-2.5 py-1 font-mono text-[0.62rem] font-semibold tracking-wider text-accent-foreground uppercase">
                Ready to refine
              </span>
            </div>
            <div className="grid gap-0 sm:grid-cols-[1.2fr_0.8fr]">
              <div className="border-b border-border/60 p-6 sm:border-r sm:border-b-0 sm:p-8">
                <div className="flex items-center gap-4">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <FileText className="size-5" />
                  </div>
                  <div>
                    <p className="font-semibold">Senior Product Designer</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Amsterdam · Product Studio
                    </p>
                  </div>
                </div>
                <div className="mt-7 space-y-3">
                  <div className="h-2 w-2/3 rounded-full bg-foreground/80" />
                  <div className="h-1.5 w-full rounded-full bg-muted" />
                  <div className="h-1.5 w-[92%] rounded-full bg-muted" />
                  <div className="h-1.5 w-[76%] rounded-full bg-muted" />
                </div>
                <div className="mt-7 space-y-4">
                  {[78, 93, 64].map((width, index) => (
                    <div
                      key={width}
                      className="rounded-xl border border-border/60 bg-background/50 p-3.5"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <div className="h-1.5 w-24 rounded-full bg-foreground/70" />
                        <span className="font-mono text-[0.6rem] text-muted-foreground">
                          0{index + 1}
                        </span>
                      </div>
                      <div
                        className="h-1.5 rounded-full bg-primary/25"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-muted/35 p-6 sm:p-8">
                <p className="eyebrow">Signal check</p>
                <div className="mt-5 flex items-end gap-2">
                  <span className="text-5xl font-semibold tracking-[-0.06em]">
                    86
                  </span>
                  <span className="mb-1 text-sm text-muted-foreground">
                    / 100
                  </span>
                </div>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-border/70">
                  <div className="h-full w-[86%] rounded-full bg-primary" />
                </div>
                <div className="mt-8 space-y-3">
                  {[
                    "Role language aligned",
                    "Impact made clearer",
                    "Two details to review",
                  ].map((item, index) => (
                    <div
                      key={item}
                      className="flex items-start gap-2.5 text-xs leading-5"
                    >
                      <span
                        className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full ${index === 2 ? "bg-accent/60 text-accent-foreground" : "bg-primary/12 text-primary"}`}
                      >
                        {index === 2 ? (
                          <Sparkles className="size-2.5" />
                        ) : (
                          <Check className="size-2.5" />
                        )}
                      </span>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="absolute -right-3 -bottom-6 hidden rotate-2 rounded-xl border border-border/60 bg-foreground px-4 py-3 text-background shadow-xl sm:block">
            <p className="font-mono text-[0.62rem] tracking-wider text-background/60 uppercase">
              Your CV, upgraded
            </p>
            <p className="mt-1 text-sm font-medium">Still unmistakably you.</p>
          </div>
        </div>
      </section>

      <section className="relative z-10 border-t border-border/60 bg-card/55">
        <div className="mx-auto grid max-w-7xl gap-0 px-5 py-5 sm:px-8 md:grid-cols-3">
          {steps.map((step, idx) => (
            <div
              key={step.label}
              className="group flex items-start gap-4 border-border/60 px-2 py-5 md:border-r md:px-7 md:last:border-r-0"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/8 text-primary transition-transform group-hover:-rotate-3">
                <step.icon className="size-4.5" />
              </div>
              <div>
                <p className="mb-1 font-mono text-[0.62rem] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                  0{idx + 1}
                </p>
                <p className="text-sm font-semibold">{step.label}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
