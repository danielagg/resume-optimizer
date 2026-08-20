import { PDFViewer } from "@react-pdf/renderer"
import { createRoot } from "react-dom/client"
import { ResumePdfTemplate } from "./resume-pdf-template"
import { resumeSchema, type Resume } from "./resume"
import "./design.css"

type PreviewState =
  | { status: "loading" }
  | { status: "ready"; resume: Resume }
  | { status: "error"; message: string }

function DesignPreview({ state }: { state: PreviewState }) {
  if (state.status === "loading") {
    return <main className="status">Loading base_cv.json…</main>
  }

  if (state.status === "error") {
    return (
      <main className="status error">
        <h1>Could not load the Resume</h1>
        <pre>{state.message}</pre>
      </main>
    )
  }

  return (
    <PDFViewer className="pdf-viewer" showToolbar>
      <ResumePdfTemplate resume={state.resume} />
    </PDFViewer>
  )
}

async function loadResume(): Promise<Resume> {
  const response = await fetch("/__resume/base-cv", { cache: "no-store" })
  if (!response.ok) throw new Error(await response.text())

  const parsed = resumeSchema.safeParse(await response.json())
  if (!parsed.success) {
    throw new Error(
      parsed.error.issues
        .map((issue) => `${issue.path.join(".") || "resume"}: ${issue.message}`)
        .join("\n")
    )
  }
  return parsed.data
}

const rootElement = document.getElementById("root")
if (!rootElement) throw new Error("Missing #root element")

const root = createRoot(rootElement)
root.render(<DesignPreview state={{ status: "loading" }} />)

loadResume()
  .then((resume) => {
    root.render(<DesignPreview state={{ status: "ready", resume }} />)
  })
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error)
    root.render(<DesignPreview state={{ status: "error", message }} />)
  })
