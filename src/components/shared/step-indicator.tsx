import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface Step {
  label: string
}

interface StepIndicatorProps {
  steps: Step[]
  currentIndex: number
  className?: string
}

export function StepIndicator({
  steps,
  currentIndex,
  className,
}: StepIndicatorProps) {
  return (
    <nav
      aria-label="Progress"
      className={cn(
        "inline-flex max-w-full items-center rounded-2xl border border-border/70 bg-card/80 p-1.5 shadow-sm backdrop-blur-xl",
        className
      )}
    >
      {steps.map((step, idx) => {
        const isCurrent = idx === currentIndex
        const isDone = idx < currentIndex
        return (
          <div key={step.label} className="flex min-w-0 items-center">
            <div
              className={cn(
                "flex items-center gap-2 rounded-xl px-2.5 py-2 transition-colors sm:px-4",
                isCurrent && "bg-foreground text-background shadow-sm"
              )}
            >
              <div
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full font-mono text-[0.6rem] font-bold transition-all duration-300",
                  isDone && "bg-primary/15 text-primary",
                  isCurrent && "bg-accent text-accent-foreground",
                  !isCurrent && !isDone && "bg-muted text-muted-foreground"
                )}
              >
                {isDone ? <Check className="size-3" /> : <span>{idx + 1}</span>}
              </div>
              <span
                className={cn(
                  "hidden text-xs font-semibold transition-colors sm:inline",
                  isDone && "text-foreground",
                  isCurrent && "text-background",
                  !isCurrent && !isDone && "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={cn(
                  "mx-1 h-px w-3 transition-colors duration-300 sm:w-6",
                  idx < currentIndex ? "bg-primary/60" : "bg-border"
                )}
              />
            )}
          </div>
        )
      })}
    </nav>
  )
}
