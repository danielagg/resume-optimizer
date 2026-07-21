import { describe, expect, test } from "bun:test"
import { AlignmentError, parseAlignmentResponse } from "../src/lib/resume-ai"

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

  test("classifies schema mismatches", () => {
    expect(() => parseAlignmentResponse(JSON.stringify({ notes: [] }))).toThrow(
      AlignmentError
    )
  })
})
