import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { type Severity } from "@/types/resume"

const severityClasses: Record<Severity, string> = {
  Critical: "bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30",
  Important:
    "bg-orange-500/15 text-orange-700 dark:text-orange-400 border border-orange-500/30",
  Medium:
    "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border border-yellow-500/30",
  Low: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30",
  Info: "bg-muted text-muted-foreground border border-border",
}

export function SeverityBadge({
  severity,
  className,
}: {
  severity: Severity
  className?: string
}) {
  return (
    <Badge
      className={cn(
        "rounded-md px-1.5 py-0.5 text-[0.65rem] font-medium",
        severityClasses[severity],
        className
      )}
    >
      {severity}
    </Badge>
  )
}

// re-export for convenience without tripping react-refresh
export { type Severity as SeverityType } from "@/types/resume"