import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-20 w-full resize-none rounded-xl border border-input/80 bg-background/70 px-3.5 py-3 text-base leading-relaxed transition-[color,border-color,box-shadow,background-color] outline-none placeholder:text-muted-foreground/70 hover:border-primary/30 focus-visible:border-primary/60 focus-visible:bg-card focus-visible:ring-3 focus-visible:ring-ring/12 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 md:text-sm dark:aria-invalid:border-destructive/50",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
