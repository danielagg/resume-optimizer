#!/usr/bin/env bun

import { access, mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname, extname, resolve } from "node:path"
import { createInterface } from "node:readline/promises"
import { parseArgs } from "node:util"
import { exportPdf } from "./export-pdf"
import { formatNotes, formatResume, formatSessions } from "./format"
import { promptFor } from "./prompts"
import {
  activeSession,
  createSession,
  generatedSessionName,
  loadResume,
  loadState,
  resumePath,
  saveResume,
  saveState,
  statePath,
  updateSession,
} from "./store"
import {
  canSelfUpdate,
  checkForUpdate,
  INSTALL_COMMAND,
  installUpdate,
  markUpdatePrompted,
  type AvailableUpdate,
} from "./update"
import { VERSION } from "./version"
import { runResumeCompletion } from "../src/lib/resume-ai"
import {
  emptyResume,
  resumeSchema,
  type Note,
  type Resume,
} from "../src/types/resume"

const HELP = `Resume Optimizer CLI

Usage:
  resume-optimizer init [--from resume.json] [--force]
  resume-optimizer resume validate|show|import <file>
  resume-optimizer align [--job posting.txt] [--name session]
  resume-optimizer show [--original] [--json]
  resume-optimizer notes [--json]
  resume-optimizer revise --address 1,2 [--response '2=Use this wording']
  resume-optimizer realign --yes
  resume-optimizer export [--original] [--format pdf|json|markdown] [--output file]
  resume-optimizer sessions list|new|use|rename|delete ...
  resume-optimizer update
  resume-optimizer version

Global options:
  --data-dir <path>   State directory (default: ./.resume-optimizer)
  --api-key <key>     OpenAI key (OPENAI_API_KEY is preferred)
  -h, --help          Show help

Typical workflow:
  resume-optimizer init
  # Fill in .resume-optimizer/resume.json
  resume-optimizer resume validate
  OPENAI_API_KEY=sk-... resume-optimizer align --job posting.txt --name acme
  resume-optimizer notes
  resume-optimizer revise --address 1 --response '1=Apply the suggested fix'
  resume-optimizer export --output acme-resume.pdf
`

interface GlobalArgs {
  args: string[]
  dataDir: string
  apiKey: string
}

function extractGlobalArgs(argv: string[]): GlobalArgs {
  const args: string[] = []
  let dataDir = process.env.RESUME_OPTIMIZER_HOME ?? ".resume-optimizer"
  let apiKey = process.env.OPENAI_API_KEY ?? ""

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === "--data-dir") {
      const value = argv[index + 1]
      if (!value) throw new Error("--data-dir requires a path.")
      dataDir = value
      index += 1
    } else if (argument.startsWith("--data-dir=")) {
      dataDir = argument.slice("--data-dir=".length)
    } else if (argument === "--api-key") {
      const value = argv[index + 1]
      if (!value) throw new Error("--api-key requires a value.")
      apiKey = value
      index += 1
    } else if (argument.startsWith("--api-key=")) {
      apiKey = argument.slice("--api-key=".length)
    } else {
      args.push(argument)
    }
  }

  return { args, dataDir: resolve(dataDir), apiKey }
}

function requireApiKey(apiKey: string): string {
  if (!apiKey.trim()) {
    throw new Error(
      "An OpenAI API key is required. Set OPENAI_API_KEY or pass --api-key."
    )
  }
  return apiKey
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

async function readTextInput(path: string): Promise<string> {
  let content: string
  if (path === "-") {
    const chunks: Buffer[] = []
    for await (const chunk of process.stdin) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    }
    content = Buffer.concat(chunks).toString("utf8")
  } else {
    content = await readFile(path, "utf8")
  }
  if (!content.trim()) throw new Error("The Job Posting is empty.")
  return content
}

function selectedSession(
  state: Awaited<ReturnType<typeof loadState>>,
  requireAlignment = false
) {
  const session = activeSession(state)
  if (!session)
    throw new Error("No session found. Run align or sessions new first.")
  if (requireAlignment && !session.alignedResume) {
    throw new Error(`Session "${session.name}" has not been aligned yet.`)
  }
  return session
}

async function initCommand(dataDir: string, args: string[]): Promise<void> {
  const { values } = parseArgs({
    args,
    options: {
      from: { type: "string" },
      force: { type: "boolean", default: false },
    },
  })
  const path = resumePath(dataDir)
  if ((await fileExists(path)) && !values.force) {
    throw new Error(`${path} already exists. Use --force to replace it.`)
  }

  let resume: Resume = emptyResume()
  if (values.from) {
    const raw = JSON.parse(await readFile(values.from, "utf8")) as unknown
    const parsed = resumeSchema.safeParse(raw)
    if (!parsed.success) {
      const issues = parsed.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("\n")
      throw new Error(`Imported Resume is invalid:\n${issues}`)
    }
    resume = parsed.data
  }

  await saveResume(dataDir, resume)
  if (!(await fileExists(statePath(dataDir)))) {
    await saveState(dataDir, { activeSessionName: null, sessions: {} })
  }
  console.log(`Resume workspace initialized at ${dataDir}`)
  console.log(`Edit ${path}, then run: resume-optimizer resume validate`)
}

async function resumeCommand(dataDir: string, args: string[]): Promise<void> {
  const [subcommand, ...rest] = args
  if (subcommand === "validate") {
    await loadResume(dataDir)
    console.log(`Resume is valid: ${resumePath(dataDir)}`)
    return
  }
  if (subcommand === "show") {
    console.log(formatResume(await loadResume(dataDir)))
    return
  }
  if (subcommand === "import") {
    const { positionals, values } = parseArgs({
      args: rest,
      allowPositionals: true,
      options: { force: { type: "boolean", default: false } },
    })
    const source = positionals[0]
    if (!source) throw new Error("Usage: resume-optimizer resume import <file>")
    if ((await fileExists(resumePath(dataDir))) && !values.force) {
      throw new Error("A Resume already exists. Use --force to replace it.")
    }
    const raw = JSON.parse(await readFile(source, "utf8")) as unknown
    const parsed = resumeSchema.safeParse(raw)
    if (!parsed.success)
      throw new Error("Imported Resume does not match the Resume schema.")
    await saveResume(dataDir, parsed.data)
    console.log(`Imported Resume into ${resumePath(dataDir)}`)
    return
  }
  throw new Error("Usage: resume-optimizer resume validate|show|import <file>")
}

async function alignCommand(
  dataDir: string,
  apiKey: string,
  args: string[]
): Promise<void> {
  const { values } = parseArgs({
    args,
    options: {
      job: { type: "string" },
      name: { type: "string" },
    },
  })
  const resume = await loadResume(dataDir)
  const state = await loadState(dataDir)

  let session = values.name ? state.sessions[values.name] : activeSession(state)
  const suppliedPosting = values.job ? await readTextInput(values.job) : null
  const jobPosting = suppliedPosting ?? session?.jobPosting ?? ""
  if (!jobPosting.trim()) {
    throw new Error("Pass a Job Posting with --job <file> (use - for stdin).")
  }

  if (!session) {
    session = createSession(
      state,
      values.name ?? generatedSessionName(state),
      jobPosting
    )
  } else {
    state.activeSessionName = session.name
    if (suppliedPosting)
      session = updateSession(state, session.name, { jobPosting })
  }

  console.error(`Aligning session "${session.name}"…`)
  const result = await runResumeCompletion({
    apiKey: requireApiKey(apiKey),
    systemPrompt: promptFor("alignment"),
    userPayload: { resume, job_posting: jobPosting },
  })
  updateSession(state, session.name, {
    jobPosting,
    alignedResume: result.alignedResume,
    notes: result.notes,
  })
  await saveState(dataDir, state)
  console.log(`Aligned Resume saved to session "${session.name}".`)
  console.log(formatNotes(result.notes))
}

async function showCommand(dataDir: string, args: string[]): Promise<void> {
  const { values } = parseArgs({
    args,
    options: {
      original: { type: "boolean", default: false },
      json: { type: "boolean", default: false },
    },
  })
  let resume: Resume
  if (values.original) {
    resume = await loadResume(dataDir)
  } else {
    const session = selectedSession(await loadState(dataDir), true)
    resume = session.alignedResume as Resume
  }
  console.log(
    values.json ? JSON.stringify(resume, null, 2) : formatResume(resume)
  )
}

async function notesCommand(dataDir: string, args: string[]): Promise<void> {
  const { values } = parseArgs({
    args,
    options: { json: { type: "boolean", default: false } },
  })
  const notes = selectedSession(await loadState(dataDir), true).notes
  console.log(values.json ? JSON.stringify(notes, null, 2) : formatNotes(notes))
}

function parseAddressedNotes(
  notes: Note[],
  addresses: string,
  rawResponses: string[]
): {
  addressedNotes: Array<Note & { userResponse: string | null }>
  dismissedNotes: Note[]
} {
  const indices = new Set(
    addresses.split(",").map((value) => Number.parseInt(value.trim(), 10) - 1)
  )
  if (
    [...indices].some(
      (index) => !Number.isInteger(index) || index < 0 || index >= notes.length
    )
  ) {
    throw new Error("--address contains an invalid Note number.")
  }

  const responses = new Map<number, string>()
  for (const response of rawResponses) {
    const separator = response.indexOf("=")
    if (separator < 1)
      throw new Error("Responses must use NOTE_NUMBER=text syntax.")
    const index = Number.parseInt(response.slice(0, separator), 10) - 1
    if (!indices.has(index))
      throw new Error(`Response ${index + 1} is not in --address.`)
    responses.set(index, response.slice(separator + 1).trim())
  }

  const addressedNotes: Array<Note & { userResponse: string | null }> = []
  const dismissedNotes: Note[] = []
  notes.forEach((note, index) => {
    if (indices.has(index)) {
      if (note.severity === "Info") {
        throw new Error(
          `Note ${index + 1} is Info-only and cannot be addressed.`
        )
      }
      addressedNotes.push({
        ...note,
        userResponse: responses.get(index) || null,
      })
    } else {
      dismissedNotes.push(note)
    }
  })
  return { addressedNotes, dismissedNotes }
}

async function reviseCommand(
  dataDir: string,
  apiKey: string,
  args: string[]
): Promise<void> {
  const { values } = parseArgs({
    args,
    options: {
      address: { type: "string" },
      response: { type: "string", multiple: true, default: [] },
    },
  })
  if (!values.address) throw new Error("Choose Notes with --address 1,2.")
  const state = await loadState(dataDir)
  const session = selectedSession(state, true)
  const { addressedNotes, dismissedNotes } = parseAddressedNotes(
    session.notes,
    values.address,
    values.response
  )

  console.error(`Revising session "${session.name}"…`)
  const result = await runResumeCompletion({
    apiKey: requireApiKey(apiKey),
    systemPrompt: promptFor("revision"),
    userPayload: {
      jobPosting: session.jobPosting,
      currentAlignedResume: session.alignedResume,
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
  updateSession(state, session.name, {
    alignedResume: result.alignedResume,
    notes: result.notes,
  })
  await saveState(dataDir, state)
  console.log(`Revision saved to session "${session.name}".`)
  console.log(formatNotes(result.notes))
}

async function realignCommand(
  dataDir: string,
  apiKey: string,
  args: string[]
): Promise<void> {
  const { values } = parseArgs({
    args,
    options: { yes: { type: "boolean", short: "y", default: false } },
  })
  if (!values.yes) {
    throw new Error(
      "Re-alignment discards this session's revisions. Re-run with --yes."
    )
  }
  const resume = await loadResume(dataDir)
  const state = await loadState(dataDir)
  const session = selectedSession(state)
  if (!session.jobPosting.trim())
    throw new Error("The active session has no Job Posting.")

  console.error(
    `Re-aligning session "${session.name}" from the original Resume…`
  )
  const result = await runResumeCompletion({
    apiKey: requireApiKey(apiKey),
    systemPrompt: promptFor("alignment"),
    userPayload: { resume, job_posting: session.jobPosting },
  })
  updateSession(state, session.name, {
    alignedResume: result.alignedResume,
    notes: result.notes,
  })
  await saveState(dataDir, state)
  console.log(`Session "${session.name}" was re-aligned.`)
  console.log(formatNotes(result.notes))
}

function safeFilename(value: string): string {
  return (
    value.replace(/[^a-zA-Z0-9-]+/g, "-").replace(/^-+|-+$/g, "") || "resume"
  )
}

async function exportCommand(dataDir: string, args: string[]): Promise<void> {
  const { values } = parseArgs({
    args,
    options: {
      original: { type: "boolean", default: false },
      format: { type: "string" },
      output: { type: "string" },
    },
  })
  const session = values.original
    ? null
    : selectedSession(await loadState(dataDir), true)
  const resume = values.original
    ? await loadResume(dataDir)
    : (session?.alignedResume as Resume)
  const inferredExtension = values.output
    ? extname(values.output).toLowerCase()
    : ""
  const format =
    values.format ??
    (inferredExtension === ".json"
      ? "json"
      : inferredExtension === ".md"
        ? "markdown"
        : "pdf")
  if (!["pdf", "json", "markdown"].includes(format)) {
    throw new Error("--format must be pdf, json, or markdown.")
  }
  const extension = format === "markdown" ? "md" : format
  const defaultName = `${safeFilename(resume.fullName)}${values.original ? "" : "-aligned"}.${extension}`
  const output = resolve(values.output ?? defaultName)
  await mkdir(dirname(output), { recursive: true })

  if (format === "pdf") {
    await exportPdf(resume, output)
  } else {
    const content =
      format === "json"
        ? `${JSON.stringify(resume, null, 2)}\n`
        : `${formatResume(resume)}\n`
    await writeFile(output, content)
  }
  console.log(`Exported ${output}`)
}

async function sessionsCommand(dataDir: string, args: string[]): Promise<void> {
  const [subcommand, ...rest] = args
  const state = await loadState(dataDir)

  if (subcommand === "list") {
    const { values } = parseArgs({
      args: rest,
      options: { json: { type: "boolean", default: false } },
    })
    console.log(
      values.json
        ? JSON.stringify(
            {
              activeSessionName: state.activeSessionName,
              sessions: state.sessions,
            },
            null,
            2
          )
        : formatSessions(Object.values(state.sessions), state.activeSessionName)
    )
    return
  }

  if (subcommand === "new") {
    const { positionals, values } = parseArgs({
      args: rest,
      allowPositionals: true,
      options: { job: { type: "string" } },
    })
    const name = positionals[0] ?? generatedSessionName(state)
    const jobPosting = values.job ? await readTextInput(values.job) : ""
    createSession(state, name, jobPosting)
    await saveState(dataDir, state)
    console.log(`Created and selected session "${name}".`)
    return
  }

  if (subcommand === "use") {
    const name = rest.join(" ").trim()
    if (!name || !state.sessions[name])
      throw new Error(`Session "${name}" does not exist.`)
    state.activeSessionName = name
    await saveState(dataDir, state)
    console.log(`Selected session "${name}".`)
    return
  }

  if (subcommand === "rename") {
    const [oldName, newName] = rest
    if (!oldName || !newName) {
      throw new Error("Usage: resume-optimizer sessions rename <old> <new>")
    }
    if (!state.sessions[oldName])
      throw new Error(`Session "${oldName}" does not exist.`)
    if (state.sessions[newName])
      throw new Error(`Session "${newName}" already exists.`)
    const session = state.sessions[oldName]
    delete state.sessions[oldName]
    state.sessions[newName] = {
      ...session,
      name: newName,
      updatedAt: new Date().toISOString(),
    }
    if (state.activeSessionName === oldName) state.activeSessionName = newName
    await saveState(dataDir, state)
    console.log(`Renamed "${oldName}" to "${newName}".`)
    return
  }

  if (subcommand === "delete") {
    const { positionals, values } = parseArgs({
      args: rest,
      allowPositionals: true,
      options: { yes: { type: "boolean", short: "y", default: false } },
    })
    const name = positionals[0]
    if (!name || !state.sessions[name])
      throw new Error(`Session "${name}" does not exist.`)
    if (!values.yes)
      throw new Error("Session deletion is permanent. Re-run with --yes.")
    delete state.sessions[name]
    if (state.activeSessionName === name) state.activeSessionName = null
    await saveState(dataDir, state)
    console.log(`Deleted session "${name}".`)
    return
  }

  throw new Error("Usage: resume-optimizer sessions list|new|use|rename|delete")
}

async function promptToInstall(update: AvailableUpdate): Promise<void> {
  console.error(
    `\nResume Optimizer ${update.version} is available (installed: ${VERSION}).`
  )
  const readline = createInterface({
    input: process.stdin,
    output: process.stderr,
  })
  let answer: string
  try {
    answer = await readline.question("Update now? (Y/n) ")
  } finally {
    readline.close()
  }
  if (["n", "no"].includes(answer.trim().toLowerCase())) {
    await markUpdatePrompted(update.version)
    return
  }

  if (!canSelfUpdate()) {
    console.error(
      `\nThis source build cannot replace itself. Run:\n  ${INSTALL_COMMAND}\n`
    )
    await markUpdatePrompted(update.version)
    return
  }

  console.error("Downloading and verifying the update…")
  try {
    await installUpdate(update)
    await markUpdatePrompted(update.version)
    console.error(`Updated Resume Optimizer to ${update.version}.`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`Update failed: ${message}`)
    console.error(`You can retry with:\n  ${INSTALL_COMMAND}\n`)
  }
}

async function maybeOfferUpdate(
  args: string[],
  force = false
): Promise<boolean> {
  if (process.env.RESUME_OPTIMIZER_NO_UPDATE_CHECK === "1") return false
  if (!process.stdin.isTTY || !process.stderr.isTTY) return false
  if (!force && args.some((argument) => argument === "--json")) return false
  const update = await checkForUpdate(force)
  if (!update) return false
  await promptToInstall(update)
  return true
}

async function main(): Promise<void> {
  const { args, dataDir, apiKey } = extractGlobalArgs(process.argv.slice(2))
  const [command, ...rest] = args
  if (
    !command ||
    command === "help" ||
    command === "--help" ||
    command === "-h"
  ) {
    console.log(HELP)
    return
  }

  if (command === "version" || command === "--version" || command === "-V") {
    console.log(VERSION)
    return
  }
  if (command === "update") {
    const update = await checkForUpdate(true)
    if (!update) {
      console.log(`Resume Optimizer ${VERSION} is up to date.`)
    } else if (process.stdin.isTTY && process.stderr.isTTY) {
      await promptToInstall(update)
    } else {
      console.log(
        `Resume Optimizer ${update.version} is available: ${update.releaseUrl}`
      )
      console.log(INSTALL_COMMAND)
    }
    return
  }

  await maybeOfferUpdate(args)

  if (command === "init") await initCommand(dataDir, rest)
  else if (command === "resume") await resumeCommand(dataDir, rest)
  else if (command === "align") await alignCommand(dataDir, apiKey, rest)
  else if (command === "show") await showCommand(dataDir, rest)
  else if (command === "notes") await notesCommand(dataDir, rest)
  else if (command === "revise") await reviseCommand(dataDir, apiKey, rest)
  else if (command === "realign") await realignCommand(dataDir, apiKey, rest)
  else if (command === "export") await exportCommand(dataDir, rest)
  else if (command === "sessions") await sessionsCommand(dataDir, rest)
  else throw new Error(`Unknown command "${command}".\n\n${HELP}`)
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`Error: ${message}`)
  process.exitCode = 1
})
