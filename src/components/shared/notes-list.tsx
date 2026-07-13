import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { SeverityBadge } from "@/components/shared/severity-badge"
import { cn } from "@/lib/utils"
import type { Note, Severity } from "@/types/resume"

interface NotesListProps {
  notes: Note[]
  onRevise: (addressed: AddressedNote[], dismissed: Note[]) => void
  loading?: boolean
}

export interface AddressedNote {
  severity: Severity
  text: string
  suggestedFix?: string
  userResponse: string | null
}

export function NotesList({
  notes,
  onRevise,
  loading = false,
}: NotesListProps) {
  const [ticked, setTicked] = useState<Set<number>>(new Set())
  const [responses, setResponses] = useState<Record<number, string>>({})

  const dismissableIndices = notes
    .map((n, i) => (n.severity !== "Info" ? i : -1))
    .filter((i) => i >= 0)

  if (notes.length === 0) {
    return (
      <Card className="border-primary/15 bg-primary/5 shadow-none">
        <CardContent className="py-10 text-center">
          <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-primary/12 text-lg text-primary">
            ✓
          </div>
          <p className="text-sm font-semibold">No further notes</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Your CV is ready — download it below.
          </p>
        </CardContent>
      </Card>
    )
  }

  const toggle = (idx: number) => {
    if (!dismissableIndices.includes(idx)) return
    setTicked((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  const setResponse = (idx: number, value: string) => {
    setResponses((prev) => ({ ...prev, [idx]: value }))
  }

  const handleRevise = () => {
    const dismissed: Note[] = []
    const addressed: AddressedNote[] = []
    notes.forEach((note, idx) => {
      if (note.severity === "Info") {
        dismissed.push(note)
        return
      }
      if (ticked.has(idx)) {
        addressed.push({
          severity: note.severity,
          text: note.text,
          suggestedFix: note.suggestedFix,
          userResponse: responses[idx]?.trim() || null,
        })
      } else {
        dismissed.push(note)
      }
    })
    onRevise(addressed, dismissed)
    setTicked(new Set())
    setResponses({})
  }

  const tickedCount = ticked.size

  return (
    <div className="space-y-3">
      {notes.map((note, idx) => {
        const isInfo = note.severity === "Info"
        const isTicked = ticked.has(idx)
        return (
          <Card
            key={idx}
            className={cn(
              "shadow-none transition-all duration-200",
              !isInfo && "hover:border-primary/25",
              isTicked &&
                "border-primary/40 bg-primary/6 shadow-[0_10px_30px_color-mix(in_oklch,var(--primary)_8%,transparent)]"
            )}
          >
            <CardContent className="space-y-2 py-4.5">
              <div className="flex items-start gap-3">
                {!isInfo && (
                  <Checkbox
                    checked={isTicked}
                    onCheckedChange={() => toggle(idx)}
                    className="mt-0.5"
                  />
                )}
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <SeverityBadge severity={note.severity} />
                  </div>
                  <p className="text-sm leading-6">{note.text}</p>
                  {note.suggestedFix && (
                    <p className="rounded-xl border border-border/50 bg-muted/60 px-3 py-2.5 text-xs leading-5 text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        Suggested direction:
                      </span>{" "}
                      {note.suggestedFix}
                    </p>
                  )}
                  {isTicked && (
                    <Textarea
                      rows={2}
                      placeholder="Optional — tell the LLM how to address this (leave blank to accept the suggested fix as-is)"
                      value={responses[idx] ?? ""}
                      onChange={(e) => setResponse(idx, e.target.value)}
                      className="mt-2"
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}

      <div className="pt-2">
        <Button
          onClick={handleRevise}
          disabled={tickedCount === 0 || loading}
          className="w-full"
          size="lg"
        >
          {loading
            ? "Revising…"
            : `Revise CV${tickedCount > 0 ? ` (${tickedCount} addressed)` : ""}`}
        </Button>
      </div>
    </div>
  )
}
