#!/usr/bin/env bun

import { readFile } from "node:fs/promises"
import { resolve } from "node:path"
import { createInterface } from "node:readline"
import { exportPdf } from "./export-pdf"
import { promptFor } from "./prompts"
import { runResumeCompletion } from "./resume-ai"
import { resumeSchema, type Note, type Resume } from "./resume"

const BASE_CV_PATH = resolve("base_cv.json")
const OUTPUT_PATH = resolve("tailored_cv.pdf")
type Complete = typeof runResumeCompletion

interface Prompter {
  ask(prompt: string): Promise<string>
}

interface PostingInput extends Prompter {
  readBlock(prompt: string, endMarker: string): Promise<string>
}

class TerminalInput implements PostingInput {
  private readonly readline = createInterface({ input: process.stdin })
  private readonly queuedLines: string[] = []
  private readonly waiters: Array<{
    resolve: (line: string) => void
    reject: (error: Error) => void
  }> = []
  private closed = false

  constructor() {
    this.readline.on("line", (line) => {
      const waiter = this.waiters.shift()
      if (waiter) waiter.resolve(line)
      else this.queuedLines.push(line)
    })
    this.readline.on("close", () => {
      this.closed = true
      const error = new Error("Input closed before the workflow finished.")
      this.waiters.splice(0).forEach((waiter) => waiter.reject(error))
    })
  }

  private nextLine(): Promise<string> {
    const queued = this.queuedLines.shift()
    if (queued !== undefined) return Promise.resolve(queued)
    if (this.closed) return Promise.reject(new Error("Input is closed."))
    return new Promise((resolve, reject) => {
      this.waiters.push({ resolve, reject })
    })
  }

  ask(prompt: string): Promise<string> {
    process.stdout.write(prompt)
    return this.nextLine()
  }

  async readBlock(prompt: string, endMarker: string): Promise<string> {
    console.log(prompt)
    const lines: string[] = []
    while (true) {
      const line = await this.nextLine()
      if (line.trim() === endMarker) return lines.join("\n").trim()
      lines.push(line)
    }
  }

  close(): void {
    this.readline.close()
  }
}

function decodeHtml(value: string): string {
  const namedEntities: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  }

  return value.replace(
    /&(#\d+|#x[\da-f]+|[a-z]+);/gi,
    (entity, code: string) => {
      if (code.startsWith("#x")) {
        return String.fromCodePoint(Number.parseInt(code.slice(2), 16))
      }
      if (code.startsWith("#")) {
        return String.fromCodePoint(Number.parseInt(code.slice(1), 10))
      }
      return namedEntities[code.toLowerCase()] ?? entity
    }
  )
}

export function htmlToText(html: string): string {
  return decodeHtml(
    html
      .replace(/<(script|style|noscript)[^>]*>[\s\S]*?<\/\1>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(address|article|div|h[1-6]|li|p|section)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/[^\S\n]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim()
}

async function loadBaseResume(): Promise<Resume> {
  let raw: unknown
  try {
    raw = JSON.parse(await readFile(BASE_CV_PATH, "utf8")) as unknown
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Could not read ${BASE_CV_PATH}: ${message}`, {
      cause: error,
    })
  }

  const result = resumeSchema.safeParse(raw)
  if (!result.success) {
    const details = result.error.issues
      .map(
        (issue) => `  - ${issue.path.join(".") || "resume"}: ${issue.message}`
      )
      .join("\n")
    throw new Error(
      `Fill in ${BASE_CV_PATH} before running the tool:\n${details}`
    )
  }
  return result.data
}

async function fetchJobPosting(url: string): Promise<string> {
  let parsedUrl: URL
  try {
    parsedUrl = new URL(url)
  } catch {
    throw new Error("The Job Posting must be a valid URL.")
  }
  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error("The Job Posting URL must use HTTP or HTTPS.")
  }

  console.log("Fetching Job Posting…")
  const response = await fetch(parsedUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; ResumeOptimizer/1.0; +local CLI)",
    },
  })
  if (!response.ok) {
    throw new Error(
      `Could not fetch the Job Posting (${response.status} ${response.statusText}).`
    )
  }

  const body = await response.text()
  const contentType = response.headers.get("content-type") ?? ""
  const jobPosting = contentType.includes("html")
    ? htmlToText(body)
    : body.trim()
  if (!jobPosting) throw new Error("The Job Posting page contained no text.")
  return jobPosting
}

export async function readJobPosting(
  input: PostingInput,
  fetchPosting: (url: string) => Promise<string> = fetchJobPosting
): Promise<string> {
  while (true) {
    const source = await input.ask(
      "Job Posting ([Enter] paste text, or enter URL): "
    )
    const trimmed = source.trim()

    if (/^https?:\/\//i.test(trimmed)) return fetchPosting(trimmed)

    const rest = await input.readBlock(
      "Paste the description/requirements. Finish with END on its own line:",
      "END"
    )
    const jobPosting = [source, rest].filter(Boolean).join("\n").trim()
    if (jobPosting) return jobPosting
    console.log("The Job Posting cannot be empty.\n")
  }
}

function printNotes(notes: Note[]): void {
  console.log("")
  notes.forEach((note, index) => {
    console.log(`${index + 1}. [${note.severity}] ${note.text}`)
    if (note.suggestedFix) console.log(`   Suggested: ${note.suggestedFix}`)
    if (note.severity === "Info") console.log("   Awareness only")
    console.log("")
  })
}

function parseSelection(answer: string, notes: Note[]): number[] {
  if (!answer.trim()) return []

  const selected = [
    ...new Set(
      answer.split(",").map((value) => Number.parseInt(value.trim(), 10) - 1)
    ),
  ]
  const invalid = selected.find(
    (index) =>
      !Number.isInteger(index) ||
      index < 0 ||
      index >= notes.length ||
      notes[index]?.severity === "Info"
  )
  if (invalid !== undefined) {
    throw new Error("Choose valid, non-Info Note numbers separated by commas.")
  }
  return selected
}

async function askForSelection(
  readline: Prompter,
  notes: Note[]
): Promise<number[]> {
  while (true) {
    const answer = await readline.ask(
      "Notes to address (comma-separated, or Enter to finish): "
    )
    try {
      return parseSelection(answer, notes)
    } catch (error) {
      console.log((error as Error).message)
    }
  }
}

async function collectRevisionInput(
  readline: Prompter,
  notes: Note[],
  selected: number[]
): Promise<{
  addressedNotes: Array<Note & { userResponse: string | null }>
  dismissedNotes: Note[]
}> {
  const selectedSet = new Set(selected)
  const addressedNotes: Array<Note & { userResponse: string | null }> = []

  for (const index of selected) {
    const note = notes[index]
    let response = await readline.ask(
      note.suggestedFix
        ? `Instruction for Note ${index + 1} (Enter = apply suggestion): `
        : `Instruction for Note ${index + 1}: `
    )
    while (!note.suggestedFix && !response.trim()) {
      response = await readline.ask("An instruction is required: ")
    }
    addressedNotes.push({
      ...note,
      userResponse: response.trim() || null,
    })
  }

  return {
    addressedNotes,
    dismissedNotes: notes.filter((_, index) => !selectedSet.has(index)),
  }
}

async function align(
  apiKey: string,
  resume: Resume,
  jobPosting: string,
  complete: Complete
): Promise<{ alignedResume: Resume; notes: Note[] }> {
  console.log("\nAligning Resume…")
  return complete({
    apiKey,
    systemPrompt: promptFor("alignment"),
    userPayload: { resume, job_posting: jobPosting },
  })
}

async function revise(
  apiKey: string,
  jobPosting: string,
  currentResume: Resume,
  addressedNotes: Array<Note & { userResponse: string | null }>,
  dismissedNotes: Note[],
  complete: Complete
): Promise<{ alignedResume: Resume; notes: Note[] }> {
  console.log("\nRevising Resume…")
  return complete({
    apiKey,
    systemPrompt: promptFor("revision"),
    userPayload: {
      jobPosting,
      currentAlignedResume: currentResume,
      addressedNotes: addressedNotes.map((note) => ({
        severity: note.severity,
        text: note.text,
        suggestedFix: note.suggestedFix ?? null,
        userResponse: note.userResponse,
      })),
      dismissedNotes: dismissedNotes.map((note) => ({
        severity: note.severity,
        text: note.text,
        suggestedFix: note.suggestedFix ?? null,
      })),
    },
  })
}

export async function runAlignmentLoop({
  apiKey,
  baseResume,
  jobPosting,
  readline,
  complete = runResumeCompletion,
}: {
  apiKey: string
  baseResume: Resume
  jobPosting: string
  readline: Prompter
  complete?: Complete
}): Promise<Resume> {
  let result = await align(apiKey, baseResume, jobPosting, complete)

  while (result.notes.length > 0) {
    printNotes(result.notes)
    const selected = await askForSelection(readline, result.notes)
    if (selected.length === 0) break

    const revisionInput = await collectRevisionInput(
      readline,
      result.notes,
      selected
    )
    result = await revise(
      apiKey,
      jobPosting,
      result.alignedResume,
      revisionInput.addressedNotes,
      revisionInput.dismissedNotes,
      complete
    )
  }

  return result.alignedResume
}

async function main(): Promise<void> {
  const input = new TerminalInput()

  try {
    const jobPosting = await readJobPosting(input)
    const apiKey = process.env.OPENAI_API_KEY?.trim()
    if (!apiKey) throw new Error("Set OPENAI_API_KEY before running the tool.")
    const baseResume = await loadBaseResume()
    const finalResume = await runAlignmentLoop({
      apiKey,
      baseResume,
      jobPosting,
      readline: input,
    })

    await exportPdf(finalResume, OUTPUT_PATH)
    console.log(`\nDone: ${OUTPUT_PATH}`)
  } finally {
    input.close()
  }
}

if (import.meta.main) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`\nError: ${message}`)
    process.exitCode = 1
  })
}
