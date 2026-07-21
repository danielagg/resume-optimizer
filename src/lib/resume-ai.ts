import OpenAI from "openai"
import { alignmentResponseSchema, type AlignmentResponse } from "@/types/resume"

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

export interface ResumeCompletionArgs {
  apiKey: string
  systemPrompt: string
  userPayload: unknown
  dangerouslyAllowBrowser?: boolean
}

export function parseAlignmentResponse(raw: string): AlignmentResponse {
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

function mapOpenAIError(error: unknown): AlignmentError {
  const err = error as {
    status?: number
    error?: { type?: string }
  }
  const status = err.status ?? 0

  if (status === 401 || err.error?.type === "invalid_api_key") {
    return new AlignmentError(
      "invalid-api-key",
      "Your OpenAI API key looks invalid — recheck it and try again."
    )
  }
  if (status === 429) {
    return new AlignmentError(
      "rate-limit",
      "OpenAI is rate-limiting you or overloaded — wait a moment and retry."
    )
  }
  if (status >= 500) {
    return new AlignmentError(
      "server",
      "OpenAI's servers had an error. Try again in a few seconds."
    )
  }
  return new AlignmentError(
    "network",
    "Could not reach OpenAI. Check your internet connection and try again."
  )
}

export async function runResumeCompletion({
  apiKey,
  systemPrompt,
  userPayload,
  dangerouslyAllowBrowser = false,
}: ResumeCompletionArgs): Promise<AlignmentResponse> {
  let client: OpenAI
  try {
    client = new OpenAI({ apiKey, dangerouslyAllowBrowser })
  } catch {
    throw new AlignmentError("unknown", "Failed to initialize OpenAI client")
  }

  let completion
  try {
    completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify(userPayload) },
      ],
      response_format: { type: "json_object" },
    })
  } catch (error) {
    throw mapOpenAIError(error)
  }

  const raw = completion.choices[0]?.message?.content
  if (!raw) {
    throw new AlignmentError(
      "refusal",
      "The model returned an empty response (possibly a safety refusal). Try simplifying your inputs."
    )
  }

  return parseAlignmentResponse(raw)
}
