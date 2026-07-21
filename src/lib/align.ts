import type { AlignmentResponse, Resume } from "@/types/resume"
import alignmentPrompt from "@/prompts/alignment.md?raw"
import { runResumeCompletion } from "@/lib/resume-ai"

export { AlignmentError, type AlignmentErrorKind } from "@/lib/resume-ai"

export type AlignmentResult = AlignmentResponse

export async function alignResume(args: {
  apiKey: string
  resume: Resume
  jobPosting: string
}): Promise<AlignmentResult> {
  return runResumeCompletion({
    apiKey: args.apiKey,
    systemPrompt: alignmentPrompt,
    userPayload: {
      resume: args.resume,
      job_posting: args.jobPosting,
    },
    dangerouslyAllowBrowser: true,
  })
}
