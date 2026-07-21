import { mkdir, readFile, rename, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { z } from "zod"
import {
  resumeSchema,
  sessionSchema,
  type Resume,
  type Session,
} from "../src/types/resume"

const stateSchema = z.object({
  activeSessionName: z.string().nullable(),
  sessions: z.record(z.string(), sessionSchema),
})

export type CliState = z.infer<typeof stateSchema>

export function resumePath(dataDir: string): string {
  return join(dataDir, "resume.json")
}

export function statePath(dataDir: string): string {
  return join(dataDir, "state.json")
}

async function readJson(path: string): Promise<unknown> {
  try {
    return JSON.parse(await readFile(path, "utf8"))
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null
    throw new Error(`Could not read ${path}: ${(error as Error).message}`, {
      cause: error,
    })
  }
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true })
  const temporaryPath = `${path}.${process.pid}.tmp`
  await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, {
    mode: 0o600,
  })
  await rename(temporaryPath, path)
}

export async function loadResume(dataDir: string): Promise<Resume> {
  const path = resumePath(dataDir)
  const raw = await readJson(path)
  if (raw === null) {
    throw new Error(`No Resume found. Run "resume-optimizer init" first.`)
  }
  const parsed = resumeSchema.safeParse(raw)
  if (!parsed.success) {
    const details = parsed.error.issues
      .map(
        (issue) => `  - ${issue.path.join(".") || "resume"}: ${issue.message}`
      )
      .join("\n")
    throw new Error(`Resume validation failed in ${path}:\n${details}`)
  }
  return parsed.data
}

export async function saveResume(
  dataDir: string,
  resume: Resume
): Promise<void> {
  await writeJson(resumePath(dataDir), resume)
}

export async function loadState(dataDir: string): Promise<CliState> {
  const raw = await readJson(statePath(dataDir))
  if (raw === null) return { activeSessionName: null, sessions: {} }
  const parsed = stateSchema.safeParse(raw)
  if (!parsed.success) {
    throw new Error(`CLI state is invalid in ${statePath(dataDir)}.`)
  }
  return parsed.data
}

export async function saveState(
  dataDir: string,
  state: CliState
): Promise<void> {
  await writeJson(statePath(dataDir), state)
}

export function activeSession(state: CliState): Session | null {
  if (state.activeSessionName) {
    const active = state.sessions[state.activeSessionName]
    if (active) return active
  }
  return (
    Object.values(state.sessions).sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt)
    )[0] ?? null
  )
}

export function createSession(
  state: CliState,
  name: string,
  jobPosting: string
): Session {
  if (state.sessions[name]) {
    throw new Error(`A session named "${name}" already exists.`)
  }
  const now = new Date().toISOString()
  const session: Session = {
    name,
    jobPosting,
    alignedResume: null,
    notes: [],
    createdAt: now,
    updatedAt: now,
  }
  state.sessions[name] = session
  state.activeSessionName = name
  return session
}

export function updateSession(
  state: CliState,
  name: string,
  updates: Partial<Omit<Session, "name" | "createdAt">>
): Session {
  const session = state.sessions[name]
  if (!session) throw new Error(`Session "${name}" does not exist.`)
  const updated = {
    ...session,
    ...updates,
    updatedAt: new Date().toISOString(),
  }
  state.sessions[name] = updated
  return updated
}

export function generatedSessionName(state: CliState): string {
  const now = new Date()
  const date = now.toISOString().slice(0, 10)
  if (!state.sessions[date]) return date
  const time = now.toISOString().slice(11, 16)
  const base = `${date} ${time}`
  if (!state.sessions[base]) return base
  let suffix = 2
  while (state.sessions[`${base} ${suffix}`]) suffix += 1
  return `${base} ${suffix}`
}
