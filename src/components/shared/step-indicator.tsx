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
      className={cn("flex items-center gap-0", className)}
    >
      {steps.map((step, idx) => {
        const isCurrent = idx === currentIndex
        const isDone = idx < currentIndex
        return (
          <div key={step.label} className="flex items-center">
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  "flex size-8 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300",
                  isDone &&
                    "bg-primary text-primary-foreground",
                  isCurrent &&
                    "bg-primary text-primary-foreground ring-4 ring-primary/20",
                  !isCurrent && !isDone &&
                    "bg-muted text-muted-foreground"
                )}
              >
                {isDone ? (
                  <Check className="size-4" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>
              <span
                className={cn(
                  "text-sm font-medium transition-colors",
                  isDone && "text-foreground",
                  isCurrent && "text-foreground",
                  !isCurrent && !isDone && "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={cn(
                  "mx-4 h-px w-12 sm:w-20 transition-colors duration-300",
                  idx < currentIndex
                    ? "bg-primary"
                    : "bg-border"
                )}
              />
            )}
          </div>
        )
      })}
    </nav>
  )
}
