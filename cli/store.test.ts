import { describe, expect, test } from "bun:test"
import { mkdtemp } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"
import {
  activeSession,
  createSession,
  loadResume,
  loadState,
  saveResume,
  saveState,
  updateSession,
} from "./store"
import type { Resume } from "../src/types/resume"

const resume: Resume = {
  fullName: "Ada Lovelace",
  headline: "Software Engineer",
  location: "London",
  email: "ada@example.com",
  phone: null,
  profile: "Builds reliable analytical systems.",
  socials: [],
  workExperience: [
    {
      positionTitle: "Engineer",
      company: "Analytical Engines",
      location: "London",
      from: "1842",
      to: null,
      description: "Developed programs for general-purpose computation.",
      keyAchievements: [],
      techStack: [],
      methodologies: [],
    },
  ],
  education: [],
  otherAchievements: [],
  languages: [],
}

describe("CLI store", () => {
  test("persists and validates the original Resume", async () => {
    const directory = await mkdtemp(join(tmpdir(), "resume-optimizer-test-"))
    await saveResume(directory, resume)
    expect(await loadResume(directory)).toEqual(resume)
  })

  test("persists active session updates", async () => {
    const directory = await mkdtemp(join(tmpdir(), "resume-optimizer-test-"))
    const state = await loadState(directory)
    const session = createSession(state, "acme", "Senior engineer role")
    updateSession(state, session.name, { alignedResume: resume, notes: [] })
    await saveState(directory, state)

    const reloaded = await loadState(directory)
    expect(activeSession(reloaded)?.name).toBe("acme")
    expect(activeSession(reloaded)?.alignedResume).toEqual(resume)
  })
})
