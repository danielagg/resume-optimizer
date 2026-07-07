import { cn } from "@/lib/utils"

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
        "flex items-center justify-center gap-2 text-xs text-muted-foreground",
        className
      )}
    >
      {steps.map((step, idx) => {
        const isCurrent = idx === currentIndex
        const isDone = idx < currentIndex
        return (
          <div key={step.label} className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-6 items-center gap-1.5 rounded-full border px-2.5",
                isCurrent && "border-primary text-foreground",
                isDone && "border-primary/40 text-muted-foreground",
                !isCurrent && !isDone && "border-border"
              )}
            >
              <span
                className={cn(
                  "flex size-3.5 items-center justify-center rounded-full",
                  isCurrent && "bg-primary text-primary-foreground",
                  isDone && "bg-primary/40",
                  !isCurrent && !isDone && "bg-transparent"
                )}
              >
                {idx + 1}
              </span>
              <span>{step.label}</span>
            </div>
            {idx < steps.length - 1 && <span className="text-border">→</span>}
          </div>
        )
      })}
    </nav>
  )
}