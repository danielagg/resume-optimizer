import { describe, expect, test } from "bun:test"
import {
  AlignmentError,
  codexOutputSchema,
  mapCodexError,
  parseAlignmentResponse,
} from "./resume-ai"

const validResponse = {
  alignedResume: {
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
  },
  notes: [],
}

describe("parseAlignmentResponse", () => {
  test("returns a validated Alignment response", () => {
    expect(parseAlignmentResponse(JSON.stringify(validResponse))).toEqual(
      validResponse
    )
  })

  test("classifies malformed JSON", () => {
    expect(() => parseAlignmentResponse("not json")).toThrow(AlignmentError)
  })

  test("reports schema mismatch details", () => {
    expect(() => parseAlignmentResponse(JSON.stringify({ notes: [] }))).toThrow(
      /alignedResume/
    )
  })
})

describe("codexOutputSchema", () => {
  test("uses the strict subset accepted by Codex", () => {
    const schema = JSON.stringify(codexOutputSchema())

    expect(schema.includes('"pattern"')).toBe(false)
    expect(schema.includes('"suggestedFix"')).toBe(true)
  })
})

describe("mapCodexError", () => {
  test("recognizes a missing ChatGPT login", () => {
    const error = mapCodexError("Not logged in. Run codex login.", 1)

    expect(error.kind).toBe("not-authenticated")
    expect(error.message.includes("codex login")).toBe(true)
  })

  test("recognizes a ChatGPT usage limit", () => {
    const error = mapCodexError("Usage limit reached. Try again later.", 1)

    expect(error.kind).toBe("usage-limit")
    expect(error.message.includes("Usage limit reached")).toBe(true)
  })

  test("preserves diagnostics for an unknown Codex failure", () => {
    const error = mapCodexError("Unexpected worker failure", 2)

    expect(error.kind).toBe("codex")
    expect(error.message.includes("Codex exit code: 2")).toBe(true)
    expect(error.message.includes("Unexpected worker failure")).toBe(true)
  })
})
