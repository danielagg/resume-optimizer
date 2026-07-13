import { useState } from "react"
import {
  createFileRoute,
  useNavigate,
  Link,
  redirect,
} from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { StepIndicator } from "@/components/shared/step-indicator"
import {
  loadApiKey,
  saveApiKey,
  loadOriginalResume,
  createSession,
  updateSession,
  generateSessionName,
} from "@/lib/storage"
import { alignResume, AlignmentError } from "@/lib/align"
import { useAlignmentStore } from "@/store/alignment"
import { resumeSchema } from "@/types/resume"
import {
  ArrowLeft,
  BriefcaseBusiness,
  KeyRound,
  ShieldCheck,
  WandSparkles,
} from "lucide-react"

export const Route = createFileRoute("/customize")({
  component: CustomizePage,
  beforeLoad: () => {
    const original = loadOriginalResume()
    if (!original) {
      throw redirect({ to: "/builder" })
    }
  },
})

const STEPS = [
  { label: "Builder" },
  { label: "Customize" },
  { label: "Preview" },
]

function CustomizePage() {
  const navigate = useNavigate()
  const {
    activeSessionName,
    jobPosting: storeJobPosting,
    setAlignment,
    hydrateFromSession,
  } = useAlignmentStore()

  const [apiKey, setApiKey] = useState(() => loadApiKey())
  const [jobPosting, setJobPosting] = useState(storeJobPosting ?? "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<AlignmentError | null>(null)

  const original = loadOriginalResume()
  const parsed = original ? resumeSchema.safeParse(original) : null

  const handleAlign = async () => {
    setError(null)
    if (!apiKey.trim()) {
      setError(
        new AlignmentError(
          "invalid-api-key",
          "Please paste your OpenAI API key first."
        )
      )
      return
    }
    if (!jobPosting.trim()) {
      setError(
        new AlignmentError("unknown", "Please paste the Job Posting text.")
      )
      return
    }
    if (!parsed || !parsed.success) {
      setError(
        new AlignmentError(
          "unknown",
          "Your Resume has incomplete required fields. Go back to Builder and fix them."
        )
      )
      return
    }

    setLoading(true)
    saveApiKey(apiKey)

    try {
      const result = await alignResume({
        apiKey,
        resume: parsed.data,
        jobPosting,
      })

      let sessionName = activeSessionName
      if (!sessionName) {
        sessionName = generateSessionName()
        const session = createSession(sessionName, jobPosting)
        hydrateFromSession(session)
      } else {
        updateSession(sessionName, { jobPosting })
      }
      updateSession(sessionName, {
        alignedResume: result.alignedResume,
        notes: result.notes,
      })

      setAlignment(result.alignedResume, result.notes, jobPosting)
      navigate({ to: "/preview" })
    } catch (e) {
      setError(e as AlignmentError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="page-wrap">
      <div className="mb-10 grid items-end gap-6 border-b border-border/60 pb-8 lg:grid-cols-[1fr_auto]">
        <div className="max-w-2xl">
          <p className="eyebrow mb-3">Make the match</p>
          <h1 className="page-title">Tune it to the role</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
            Give us the role in its own words. We’ll strengthen relevance while
            keeping every claim grounded in your experience.
          </p>
        </div>
        <StepIndicator steps={STEPS} currentIndex={1} />
      </div>

      <div className="mb-5">
        <Link
          to="/builder"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Edit base CV
        </Link>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[0.78fr_1.42fr]">
        <Card className="lg:sticky lg:top-24">
          <CardHeader className="border-b border-border/60 bg-muted/25">
            <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <KeyRound className="size-4.5" />
            </div>
            <CardTitle>Connect OpenAI</CardTitle>
            <p className="text-sm leading-6 text-muted-foreground">
              Your key powers the alignment directly from this browser.
            </p>
          </CardHeader>
          <CardContent>
            <Label htmlFor="api-key">Your OpenAI key</Label>
            <Input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-…"
              className="mt-1.5"
            />
            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-primary/10 bg-primary/5 p-3 text-xs leading-5 text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
              Stored only in localStorage and sent directly to OpenAI. It never
              touches an app server.
            </div>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader className="border-b border-border/60 bg-muted/25">
              <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-accent/45 text-accent-foreground">
                <BriefcaseBusiness className="size-4.5" />
              </div>
              <CardTitle>Job posting</CardTitle>
              <p className="text-sm leading-6 text-muted-foreground">
                Paste the complete description for a more precise result.
              </p>
            </CardHeader>
            <CardContent>
              <Label htmlFor="jd">Role description</Label>
              <Textarea
                id="jd"
                rows={14}
                value={jobPosting}
                onChange={(e) => setJobPosting(e.target.value)}
                placeholder="Paste here — from LinkedIn, a careers page, an email, or anywhere else…"
                className="mt-2 min-h-[320px]"
              />
            </CardContent>
          </Card>

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Alignment failed</AlertTitle>
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card/75 p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="px-2 text-xs leading-5 text-muted-foreground">
              Usually takes under a minute. You’ll review every suggestion.
            </p>
            <Button onClick={handleAlign} disabled={loading} size="lg">
              <WandSparkles className="size-4" />
              {loading ? "Aligning your CV…" : "Align my CV"}
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
