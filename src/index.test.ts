import { describe, expect, test } from "bun:test"
import { readJobPosting, runAlignmentLoop } from "./index"
import type { Resume } from "./resume"

const resume: Resume = {
  fullName: "Ada Lovelace",
  headline: "Engineer",
  location: "London",
  email: "ada@example.com",
  phone: null,
  profile: "Builds analytical systems.",
  socials: [],
  workExperience: [
    {
      positionTitle: "Engineer",
      company: "Analytical Engines",
      location: "London",
      from: "2020",
      to: null,
      description: "Builds systems.",
      keyAchievements: [],
      techStack: ["TypeScript"],
      methodologies: [],
    },
  ],
  education: [],
  otherAchievements: [],
  languages: [],
}

describe("readJobPosting", () => {
  test("accepts a pasted multiline job description", async () => {
    const posting = await readJobPosting(
      async () => "  Senior engineer\nTypeScript required  "
    )

    expect(posting).toBe("Senior engineer\nTypeScript required")
  })

  test("rejects an empty job description", async () => {
    let message = ""
    try {
      await readJobPosting(async () => "   ")
    } catch (error) {
      message = error instanceof Error ? error.message : String(error)
    }

    expect(message).toBe("The job description cannot be empty.")
  })
})

describe("runAlignmentLoop", () => {
  test("aligns, applies checked points, and finishes explicitly", async () => {
    const reviewEvents: string[] = []
    const payloads: unknown[] = []
    let call = 0
    let reviewCount = 0

    const result = await runAlignmentLoop({
      baseResume: resume,
      jobPosting: "Senior TypeScript engineer",
      review: {
        selectAction: async () => {
          if (reviewCount === 0) {
            reviewCount += 1
            reviewEvents.push("selected:0")
            return { kind: "revise", selected: [0] }
          }
          reviewEvents.push("finished")
          return { kind: "finish" }
        },
        askInstruction: async (_note, index) => {
          reviewEvents.push(`instruction:${index}`)
          return ""
        },
      },
      complete: async ({ userPayload }) => {
        payloads.push(userPayload)
        call += 1
        return call === 1
          ? {
              alignedResume: resume,
              notes: [
                {
                  severity: "Medium",
                  text: "Strengthen the headline.",
                  suggestedFix: "Use Senior Engineer.",
                },
              ],
            }
          : {
              alignedResume: { ...resume, headline: "Senior Engineer" },
              notes: [],
            }
      },
    })

    expect(result.headline).toBe("Senior Engineer")
    expect(reviewEvents).toEqual(["selected:0", "instruction:0", "finished"])
    expect(payloads.length).toBe(2)
  })

  test("always offers an explicit finish action", async () => {
    let calls = 0
    const noteCounts: number[] = []
    const result = await runAlignmentLoop({
      baseResume: resume,
      jobPosting: "TypeScript engineer",
      review: {
        selectAction: async (notes) => {
          noteCounts.push(notes.length)
          return { kind: "finish" }
        },
        askInstruction: async () => "unused",
      },
      complete: async () => {
        calls += 1
        return {
          alignedResume: resume,
          notes: [
            {
              severity: "Info",
              text: "Prepare to discuss your experience.",
              suggestedFix: null,
            },
          ],
        }
      },
    })

    expect(result).toEqual(resume)
    expect(calls).toBe(1)
    expect(noteCounts).toEqual([1])
  })

  test("requires explicit finishing even after Codex has no more notes", async () => {
    const noteCounts: number[] = []
    const result = await runAlignmentLoop({
      baseResume: resume,
      jobPosting: "TypeScript engineer",
      review: {
        selectAction: async (notes) => {
          noteCounts.push(notes.length)
          return { kind: "finish" }
        },
        askInstruction: async () => "unused",
      },
      complete: async () => ({
        alignedResume: { ...resume, headline: "Senior Engineer" },
        notes: [],
      }),
    })

    expect(result.headline).toBe("Senior Engineer")
    expect(noteCounts).toEqual([0])
  })
})
