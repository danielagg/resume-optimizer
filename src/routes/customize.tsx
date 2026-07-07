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
import { loadApiKey, saveApiKey, loadResume } from "@/lib/storage"
import { alignResume, AlignmentError } from "@/lib/align"
import { useAlignmentStore } from "@/store/alignment"
import { resumeSchema, type Resume } from "@/types/resume"

export const Route = createFileRoute("/customize")({
  component: CustomizePage,
  beforeLoad: () => {
    const stored = loadResume()
    if (!stored) {
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
  const setAlignment = useAlignmentStore((s) => s.setAlignment)
  const [apiKey, setApiKey] = useState(() => loadApiKey())
  const [jobPosting, setJobPosting] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<AlignmentError | null>(null)

  const stored = loadResume()
  const resume = stored as Resume
  const parsed = resumeSchema.safeParse(resume)

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
    if (!parsed.success) {
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
      setAlignment(result.alignedResume, result.notes)
      navigate({ to: "/preview" })
    } catch (e) {
      setError(e as AlignmentError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8 flex justify-center">
        <StepIndicator steps={STEPS} currentIndex={1} />
      </div>

      <div className="mb-6">
        <Link
          to="/builder"
          className="text-sm text-muted-foreground underline hover:text-foreground"
        >
          ← Edit Resume
        </Link>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>OpenAI API key</CardTitle>
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
            <p className="mt-1.5 text-xs text-muted-foreground">
              Stored only in your browser's localStorage. Used directly from
              the browser to call OpenAI.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Job Posting</CardTitle>
          </CardHeader>
          <CardContent>
            <Label htmlFor="jd">Paste the job description text</Label>
            <Textarea
              id="jd"
              rows={10}
              value={jobPosting}
              onChange={(e) => setJobPosting(e.target.value)}
              placeholder="Paste here — works with any source: LinkedIn, Indeed, company careers page, email forward…"
              className="mt-1.5"
            />
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Alignment failed</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end">
          <Button onClick={handleAlign} disabled={loading} size="lg">
            {loading ? "Aligning…" : "Align my CV"}
          </Button>
        </div>
      </div>
    </main>
  )
}