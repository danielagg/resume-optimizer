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
import { NotesList, type AddressedNote } from "@/components/shared/notes-list"
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
import {
  ArrowLeft,
  Download,
  FilePenLine,
  RefreshCcw,
  Sparkles,
} from "lucide-react"

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
  const { activeSessionName, alignedResume, notes, jobPosting, setAlignment } =
    useAlignmentStore()

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

  const handleRevise = async (
    addressed: AddressedNote[],
    dismissed: Note[]
  ) => {
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
    <main className="page-wrap !max-w-7xl">
      <div className="mb-8 grid items-end gap-6 border-b border-border/60 pb-8 lg:grid-cols-[1fr_auto]">
        <div className="max-w-2xl">
          <p className="eyebrow mb-3">Review the result</p>
          <h1 className="page-title">Your tailored CV</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
            The draft is ready. Work through the notes, make it stronger, then
            export when it feels true to you.
          </p>
        </div>
        <StepIndicator steps={STEPS} currentIndex={2} />
      </div>

      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-border/70 bg-card/75 p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ to: "/customize" })}
          className="justify-start gap-2"
        >
          <ArrowLeft className="size-4" /> Back to posting
        </Button>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            variant="outline"
            onClick={() => setRealignOpen(true)}
            disabled={realignLoading}
          >
            <RefreshCcw className="size-4" /> Re-align
          </Button>
          <Button
            onClick={() =>
              downloadResumePdf(
                alignedResume,
                `${alignedResume.fullName}-aligned`
              )
            }
          >
            <Download className="size-4" /> Download PDF
          </Button>
        </div>
      </div>

      <div className="grid items-start gap-7 xl:grid-cols-[minmax(0,1.3fr)_minmax(360px,0.7fr)]">
        <div className="overflow-hidden rounded-[1.6rem] border border-border/70 bg-muted/35 p-2 shadow-sm sm:p-4 xl:sticky xl:top-24">
          <div className="mb-3 flex items-center justify-between px-2 pt-1">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-primary" />
              <span className="font-mono text-[0.65rem] font-semibold tracking-[0.13em] text-muted-foreground uppercase">
                Document preview
              </span>
            </div>
            <span className="rounded-full bg-card px-2.5 py-1 font-mono text-[0.6rem] tracking-wider text-muted-foreground uppercase shadow-sm">
              A4 · PDF ready
            </span>
          </div>
          <ResumeTemplate resume={alignedResume} />
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-border/70 bg-card/90 p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent/50 text-accent-foreground">
                <Sparkles className="size-4" />
              </div>
              <div>
                <h2 className="font-semibold tracking-[-0.02em]">
                  Improvement notes
                </h2>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Select the changes you want, add context if needed, and revise
                  the draft in one pass.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Revision failed</AlertTitle>
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}

          <NotesList notes={notes} onRevise={handleRevise} loading={loading} />
        </aside>
      </div>

      <div className="mt-10 flex flex-col gap-3 border-t border-border/60 pt-7 sm:flex-row sm:items-center sm:justify-between">
        <Link
          to="/builder"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <FilePenLine className="size-4" /> Edit base CV
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ to: "/customize" })}
        >
          Optimize for a new posting
        </Button>
      </div>

      {/* Re-align confirm dialog */}
      <Dialog open={realignOpen} onOpenChange={setRealignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Re-align to original CV</DialogTitle>
            <DialogDescription>
              This will discard the current aligned CV and all revision work for
              this session, then run a fresh Alignment against your current
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
