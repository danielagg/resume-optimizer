import OpenAI from "openai"
import {
  alignmentResponseSchema,
  type Note,
  type Resume,
} from "@/types/resume"
import revisionPrompt from "@/prompts/revision.md?raw"
import {
  AlignmentError,
  type AlignmentErrorKind,
  type AlignmentResult,
} from "@/lib/align"

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
  let client: OpenAI
  try {
    client = new OpenAI({
      apiKey: args.apiKey,
      dangerouslyAllowBrowser: true,
    })
  } catch {
    throw new AlignmentError("unknown", "Failed to initialize OpenAI client")
  }

  const userMessage = JSON.stringify({
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
  })

  let completion
  try {
    completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: revisionPrompt },
        { role: "user", content: userMessage },
      ],
      response_format: { type: "json_object" },
    })
  } catch (e) {
    const err = e as {
      status?: number
      message?: string
      error?: { type?: string }
    }
    const status = err.status ?? 0
    if (status === 401) {
      throw new AlignmentError(
        "invalid-api-key",
        "Your OpenAI API key looks invalid — recheck it and try again."
      )
    }
    if (status === 429) {
      throw new AlignmentError(
        "rate-limit",
        "OpenAI is rate-limiting you or overloaded — wait a moment and retry."
      )
    }
    if (status >= 500) {
      throw new AlignmentError(
        "server",
        "OpenAI's servers had an error. Try again in a few seconds."
      )
    }
    if (err.error?.type === "invalid_api_key") {
      throw new AlignmentError(
        "invalid-api-key",
        "Your OpenAI API key looks invalid — recheck it and try again."
      )
    }
    throw new AlignmentError(
      "network",
      "Could not reach OpenAI. Check your internet connection and try again."
    )
  }

  const raw = completion.choices[0]?.message?.content
  if (!raw) {
    throw new AlignmentError(
      "refusal",
      "The model returned an empty response (possibly a safety refusal). Try simplifying your inputs."
    )
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new AlignmentError(
      "schema-mismatch",
      "The model returned malformed JSON. Try again, or simplify your Resume."
    )
  }

  const validation = alignmentResponseSchema.safeParse(parsed)
  if (!validation.success) {
    throw new AlignmentError(
      "schema-mismatch",
      "Unexpected response shape from the LLM. Try again, or simplify your Resume."
    )
  }

  return validation.data
}

export { type AddressedNote, type AlignmentErrorKind }