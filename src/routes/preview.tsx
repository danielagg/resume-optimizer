import { useState } from "react"
import {
  createFileRoute,
  Link,
  useNavigate,
  redirect,
} from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { alignResume, AlignmentError } from "@/lib/align"
import {
  loadApiKey,
  loadOriginalResume,
  updateSession,
  getActiveSession,
  getMRUSession,
} from "@/lib/storage"
import { resumeSchema, type Note } from "@/types/resume"

export const Route = createFileRoute("/preview")({
  component: PreviewPage,
  beforeLoad: () => {
    const active = getActiveSession()
    if (active && active.alignedResume) return
    const mru = getMRUSession()
    if (mru && mru.alignedResume) return
    throw redirect({ to: "/customize" })
  },
})

const STEPS = [
  { label: "Builder" },
  { label: "Customize" },
  { label: "Preview" },
]

function PreviewPage() {
  const navigate = useNavigate()
  const {
    activeSessionName,
    alignedResume,
    notes,
    jobPosting,
    setAlignment,
  } = useAlignmentStore()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<AlignmentError | null>(null)
  const [realignOpen, setRealignOpen] = useState(false)
  const [realignLoading, setRealignLoading] = useState(false)

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
      if (activeSessionName) {
        updateSession(activeSessionName, {
          alignedResume: result.alignedResume,
          notes: result.notes,
        })
      }
    } catch (e) {
      setError(e as AlignmentError)
    } finally {
      setLoading(false)
    }
  }

  const handleRealign = async () => {
    setError(null)
    setRealignLoading(true)
    const apiKey = loadApiKey()
    const original = loadOriginalResume()
    if (!original) {
      setRealignLoading(false)
      setRealignOpen(false)
      navigate({ to: "/builder" })
      return
    }
    const parsed = resumeSchema.safeParse(original)
    if (!parsed.success) {
      setRealignLoading(false)
      setRealignOpen(false)
      navigate({ to: "/builder" })
      return
    }
    try {
      const result = await alignResume({
        apiKey,
        resume: parsed.data,
        jobPosting,
      })
      setAlignment(result.alignedResume, result.notes, jobPosting)
      if (activeSessionName) {
        updateSession(activeSessionName, {
          alignedResume: result.alignedResume,
          notes: result.notes,
        })
      }
      setRealignOpen(false)
    } catch (e) {
      setError(e as AlignmentError)
    } finally {
      setRealignLoading(false)
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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setRealignOpen(true)}
            disabled={realignLoading}
          >
            Re-align to original
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              downloadResumePdf(
                alignedResume,
                `${alignedResume.fullName}-aligned`
              )
            }
          >
            Download Aligned CV
          </Button>
        </div>
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

      {/* Re-align confirm dialog */}
      <Dialog open={realignOpen} onOpenChange={setRealignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Re-align to original</DialogTitle>
            <DialogDescription>
              This will discard the current aligned CV and all revision work
              for this session, then run a fresh Alignment against your current
              input Resume and this session's Job Posting. This cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRealignOpen(false)}
              disabled={realignLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRealign}
              disabled={realignLoading}
            >
              {realignLoading ? "Re-aligning…" : "Re-align"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}