import type { Note, Resume } from "@/types/resume"
import revisionPrompt from "@/prompts/revision.md?raw"
import type { AlignmentResult } from "@/lib/align"
import { runResumeCompletion, type AlignmentErrorKind } from "@/lib/resume-ai"

interface AddressedNote extends Note {
  userResponse: string | null
}

interface RevisionArgs {
  apiKey: string
  jobPosting: string
  currentAlignedResume: Resume
  addressedNotes: AddressedNote[]
  dismissedNotes: Note[]
}

export async function reviseResume(
  args: RevisionArgs
): Promise<AlignmentResult> {
  return runResumeCompletion({
    apiKey: args.apiKey,
    systemPrompt: revisionPrompt,
    userPayload: {
      jobPosting: args.jobPosting,
      currentAlignedResume: args.currentAlignedResume,
      addressedNotes: args.addressedNotes.map((n) => ({
        severity: n.severity,
        text: n.text,
        suggestedFix: n.suggestedFix ?? null,
        userResponse: n.userResponse,
      })),
      dismissedNotes: args.dismissedNotes.map((n) => ({
        severity: n.severity,
        text: n.text,
        suggestedFix: n.suggestedFix ?? null,
      })),
    },
    dangerouslyAllowBrowser: true,
  })
}

export { type AddressedNote, type AlignmentErrorKind }
