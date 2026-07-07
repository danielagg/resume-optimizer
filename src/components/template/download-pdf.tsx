import { pdf } from "@react-pdf/renderer"
import type { Resume } from "@/types/resume"
import { ResumePdfTemplate } from "./resume-pdf-template"

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9-]+/g, "-").replace(/^-+|-+$/g, "") || "resume"
}

export async function downloadResumePdf(
  resume: Resume,
  filenamePrefix = "resume"
): Promise<void> {
  const blob = await pdf(<ResumePdfTemplate resume={resume} />).toBlob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${sanitizeFilename(filenamePrefix)}.pdf`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}