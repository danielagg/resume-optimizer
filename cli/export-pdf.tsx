import { resolve } from "node:path"
import { renderToFile } from "@react-pdf/renderer"
import { ResumePdfTemplate } from "../src/components/template/resume-pdf-template"
import type { Resume } from "../src/types/resume"

export async function exportPdf(
  resume: Resume,
  outputPath: string
): Promise<string> {
  const absolutePath = resolve(outputPath)
  await renderToFile(<ResumePdfTemplate resume={resume} />, absolutePath)
  return absolutePath
}
