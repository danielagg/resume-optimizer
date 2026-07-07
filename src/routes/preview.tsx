import { useState } from "react"
import {
  createFileRoute,
  Link,
  useNavigate,
  redirect,
} from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { StepIndicator } from "@/components/shared/step-indicator"
import { ResumeTemplate } from "@/components/template/resume-template"
import { downloadResumePdf } from "@/components/template/download-pdf"
import {
  NotesList,
  type AddressedNote,
} from "@/components/shared/notes-list"
import { useAlignmentStore } from "@/store/alignment"
import { reviseResume } from "@/lib/revise"
import { AlignmentError } from "@/lib/align"
import { loadApiKey } from "@/lib/storage"
import type { Note } from "@/types/resume"

export const Route = createFileRoute("/preview")({
  component: PreviewPage,
  beforeLoad: () => {
    const { alignedResume } = useAlignmentStore.getState()
    if (!alignedResume) {
      throw redirect({ to: "/customize" })
    }
  },
})

const STEPS = [
  { label: "Builder" },
  { label: "Customize" },
  { label: "Preview" },
]

function PreviewPage() {
  const navigate = useNavigate()
  const alignedResume = useAlignmentStore((s) => s.alignedResume)
  const notes = useAlignmentStore((s) => s.notes)
  const jobPosting = useAlignmentStore((s) => s.jobPosting)
  const setAlignment = useAlignmentStore((s) => s.setAlignment)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<AlignmentError | null>(null)

  if (!alignedResume || !notes) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-sm text-muted-foreground">
          No alignment yet —{" "}
          <Link to="/customize" className="underline hover:text-foreground">
            go to Customize
          </Link>
          .
        </p>
      </main>
    )
  }

  const handleRevise = async (addressed: AddressedNote[], dismissed: Note[]) => {
    setError(null)
    setLoading(true)
    const apiKey = loadApiKey()
    try {
      const result = await reviseResume({
        apiKey,
        jobPosting,
        currentAlignedResume: alignedResume,
        addressedNotes: addressed,
        dismissedNotes: dismissed,
      })
      setAlignment(result.alignedResume, result.notes, jobPosting)
    } catch (e) {
      setError(e as AlignmentError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8 flex justify-center">
        <StepIndicator steps={STEPS} currentIndex={2} />
      </div>

      <div className="mb-6 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ to: "/customize" })}
        >
          ← Back to Customize
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            downloadResumePdf(alignedResume, `${alignedResume.fullName}-aligned`)
          }
        >
          Download Aligned CV
        </Button>
      </div>

      <ResumeTemplate resume={alignedResume} />

      <div className="mt-8 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Notes</h2>
          {notes.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Tick the ones you want to address, then Revise.
            </p>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Revision failed</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}

        <NotesList notes={notes} onRevise={handleRevise} loading={loading} />
      </div>

      <div className="mt-8 flex justify-between">
        <Link
          to="/builder"
          className="text-sm text-muted-foreground underline hover:text-foreground"
        >
          ← Back to Builder
        </Link>
        <Button
          variant="outline"
          onClick={() => navigate({ to: "/customize" })}
        >
          Re-align with a different posting →
        </Button>
      </div>
    </main>
  )
}