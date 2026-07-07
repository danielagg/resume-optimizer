import OpenAI from "openai"
import { z } from "zod"
import { resumeSchema } from "@/types/resume"
import alignmentPrompt from "@/prompts/alignment.md?raw"

const responseSchema = z.object({
  alignedResume: resumeSchema,
  notes: z.string(),
})

export type AlignmentErrorKind =
  | "invalid-api-key"
  | "rate-limit"
  | "schema-mismatch"
  | "network"
  | "refusal"
  | "server"
  | "unknown"

export class AlignmentError extends Error {
  kind: AlignmentErrorKind
  constructor(kind: AlignmentErrorKind, message: string) {
    super(message)
    this.name = "AlignmentError"
    this.kind = kind
  }
}

export interface AlignmentResult {
  alignedResume: z.infer<typeof resumeSchema>
  notes: string
}

export async function alignResume(args: {
  apiKey: string
  resume: z.infer<typeof resumeSchema>
  jobPosting: string
}): Promise<AlignmentResult> {
  let client: OpenAI
  try {
    client = new OpenAI({
      apiKey: args.apiKey,
      dangerouslyAllowBrowser: true,
    })
  } catch {
    throw new AlignmentError("unknown", "Failed to initialize OpenAI client")
  }

  let completion
  try {
    completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: alignmentPrompt },
        {
          role: "user",
          content: JSON.stringify({
            resume: args.resume,
            job_posting: args.jobPosting,
          }),
        },
      ],
      response_format: { type: "json_object" },
    })
  } catch (e) {
    const err = e as { status?: number; message?: string; error?: { type?: string } }
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

  const validation = responseSchema.safeParse(parsed)
  if (!validation.success) {
    throw new AlignmentError(
      "schema-mismatch",
      "Unexpected response shape from the LLM. Try again, or simplify your Resume."
    )
  }

  return validation.data
}