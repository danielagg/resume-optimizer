import {
  createFileRoute,
  Link,
  useNavigate,
  redirect,
} from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { StepIndicator } from "@/components/shared/step-indicator"
import { ResumeTemplate } from "@/components/template/resume-template"
import { downloadResumePdf } from "@/components/template/download-pdf"
import { useAlignmentStore } from "@/store/alignment"

export const Route = createFileRoute("/preview")({
  component: PreviewPage,
  beforeLoad: () => {
    const aligned = useAlignmentStore.getState().alignedResume
    if (!aligned) {
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

  if (!alignedResume || !notes) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <RedirectHint />
      </main>
    )
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

      {notes && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertTitle>Read-only feedback from the LLM</AlertTitle>
              <AlertDescription>
                <pre className="mt-2 whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {notes}
                </pre>
              </AlertDescription>
            </Alert>
            <p className="mt-4 text-xs text-muted-foreground">
              No "act on" affordance in v1 — these are FYI only.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="mt-8 flex justify-between">
        <Link
          to="/builder"
          className="text-sm text-muted-foreground underline hover:text-foreground"
        >
          ← Back to Builder
        </Link>
        <Button variant="outline" onClick={() => navigate({ to: "/customize" })}>
          Re-align with a different posting →
        </Button>
      </div>
    </main>
  )
}

function RedirectHint() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        No alignment yet — redirecting you to Customize…
      </p>
      <Button onClick={() => (window.location.href = "/customize")}>
        Go to Customize manually
      </Button>
    </div>
  )
}