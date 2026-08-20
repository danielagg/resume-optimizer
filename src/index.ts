#!/usr/bin/env bun

import { readFile } from "node:fs/promises"
import { resolve } from "node:path"
import {
  cancel,
  intro,
  isCancel,
  multiselect,
  note as showNote,
  outro,
  spinner,
  text,
} from "@clack/prompts"
import { exportPdf } from "./export-pdf"
import { PasteCancelledError, promptForPastedText } from "./paste-input"
import { promptFor } from "./prompts"
import { runResumeCompletion } from "./resume-ai"
import { resumeSchema, type Note, type Resume } from "./resume"

const BASE_CV_PATH = resolve("base_cv.json")
const OUTPUT_PATH = resolve("tailored_cv.pdf")
type Complete = typeof runResumeCompletion

interface ReviewInput {
  selectAction(notes: Note[]): Promise<ReviewAction>
  askInstruction(note: Note, index: number): Promise<string>
}

type ReviewAction = { kind: "finish" } | { kind: "revise"; selected: number[] }

const FINISH_ACTION = "finish" as const

class UserCancelledError extends Error {}

function unwrapPrompt<T>(value: T | symbol): T {
  if (isCancel(value)) {
    cancel("Cancelled — no PDF was generated.")
    throw new UserCancelledError()
  }
  return value
}

const interactiveReview: ReviewInput = {
  async selectAction(notes) {
    const selected = unwrapPrompt(
      await multiselect<number | typeof FINISH_ACTION>({
        message: "Select revisions, or finish with the current Resume",
        options: [
          {
            value: FINISH_ACTION,
            label: "Finished, generate PDF",
            hint: "use the current Resume JSON",
          },
          ...notes.map((note, index) => ({
            value: index,
            label: `[${note.severity}] ${note.text}`,
            hint: note.severity === "Info" ? "awareness only" : undefined,
            disabled: note.severity === "Info",
          })),
        ],
        required: true,
      })
    )

    if (selected.includes(FINISH_ACTION)) return { kind: "finish" }
    return {
      kind: "revise",
      selected: selected.filter((value): value is number =>
        Number.isInteger(value)
      ),
    }
  },

  async askInstruction(note, index) {
    if (note.suggestedFix) {
      showNote(note.suggestedFix, `Suggested fix for point ${index + 1}`)
    }

    return unwrapPrompt(
      await text({
        message: note.suggestedFix
          ? "Press Enter to apply the suggestion, or type another instruction"
          : `How should point ${index + 1} be addressed?`,
        placeholder: note.suggestedFix
          ? "Apply suggested fix"
          : "Describe the change",
        validate(value) {
          if (!note.suggestedFix && !value?.trim()) {
            return "An instruction is required for this point."
          }
        },
      })
    )
  },
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

export async function readJobPosting(
  paste: () => Promise<string> = async () => {
    try {
      return await promptForPastedText()
    } catch (error) {
      if (error instanceof PasteCancelledError) {
        cancel("Cancelled — no PDF was generated.")
        throw new UserCancelledError()
      }
      throw error
    }
  }
): Promise<string> {
  const jobPosting = (await paste()).trim()
  if (!jobPosting) throw new Error("The job description cannot be empty.")
  return jobPosting
}

async function collectRevisionInput(
  review: ReviewInput,
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
    const response = await review.askInstruction(note, index)
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

async function withProgress<T>(
  activeMessage: string,
  doneMessage: string,
  task: () => Promise<T>
): Promise<T> {
  if (!process.stdout.isTTY) return task()

  const progress = spinner()
  progress.start(activeMessage)
  try {
    const result = await task()
    progress.stop(doneMessage)
    return result
  } catch (error) {
    progress.error(`${activeMessage} failed`)
    throw error
  }
}

async function align(
  resume: Resume,
  jobPosting: string,
  complete: Complete
): Promise<{ alignedResume: Resume; notes: Note[] }> {
  return withProgress("Aligning Resume with Codex", "Alignment ready", () =>
    complete({
      systemPrompt: promptFor("alignment"),
      userPayload: { resume, job_posting: jobPosting },
    })
  )
}

async function revise(
  jobPosting: string,
  currentResume: Resume,
  addressedNotes: Array<Note & { userResponse: string | null }>,
  dismissedNotes: Note[],
  complete: Complete
): Promise<{ alignedResume: Resume; notes: Note[] }> {
  return withProgress("Revising Resume JSON", "Revision ready", () =>
    complete({
      systemPrompt: promptFor("revision"),
      userPayload: {
        jobPosting,
        currentAlignedResume: currentResume,
        addressedNotes: addressedNotes.map((note) => ({
          severity: note.severity,
          text: note.text,
          suggestedFix: note.suggestedFix,
          userResponse: note.userResponse,
        })),
        dismissedNotes: dismissedNotes.map((note) => ({
          severity: note.severity,
          text: note.text,
          suggestedFix: note.suggestedFix,
        })),
      },
    })
  )
}

export async function runAlignmentLoop({
  baseResume,
  jobPosting,
  review = interactiveReview,
  complete = runResumeCompletion,
}: {
  baseResume: Resume
  jobPosting: string
  review?: ReviewInput
  complete?: Complete
}): Promise<Resume> {
  let result = await align(baseResume, jobPosting, complete)

  while (true) {
    const action = await review.selectAction(result.notes)
    if (action.kind === "finish") break
    if (action.selected.length === 0) continue

    const revisionInput = await collectRevisionInput(
      review,
      result.notes,
      action.selected
    )
    result = await revise(
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
  intro("Resume Optimizer")

  const jobPosting = await readJobPosting()
  const baseResume = await loadBaseResume()
  const finalResume = await runAlignmentLoop({
    baseResume,
    jobPosting,
  })

  await exportPdf(finalResume, OUTPUT_PATH)
  outro(`PDF ready: ${OUTPUT_PATH}`)
}

if (import.meta.main) {
  main().catch((error: unknown) => {
    if (error instanceof UserCancelledError) return
    const message = error instanceof Error ? error.message : String(error)
    console.error(`\nError: ${message}`)
    process.exitCode = 1
  })
}
