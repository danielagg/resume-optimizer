import { describe, expect, test } from "bun:test"
import { htmlToText, readJobPosting, runAlignmentLoop } from "./index"
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

describe("htmlToText", () => {
  test("extracts readable Job Posting text", () => {
    const html = `
      <html>
        <head><style>.hidden { display: none }</style></head>
        <body>
          <h1>Senior Engineer &amp; Technical Lead</h1>
          <p>Build dependable systems.</p>
          <ul><li>TypeScript</li><li>PostgreSQL</li></ul>
          <script>ignoreMe()</script>
        </body>
      </html>
    `

    expect(htmlToText(html)).toBe(
      "Senior Engineer & Technical Lead\nBuild dependable systems.\nTypeScript\nPostgreSQL"
    )
  })
})

describe("readJobPosting", () => {
  test("uses multiline paste mode by default", async () => {
    const prompts: string[] = []
    const posting = await readJobPosting({
      ask: async (prompt) => {
        prompts.push(prompt)
        return ""
      },
      readBlock: async (prompt, endMarker) => {
        prompts.push(`${prompt} [${endMarker}]`)
        return "Senior engineer\nTypeScript required"
      },
    })

    expect(posting).toBe("Senior engineer\nTypeScript required")
    expect(prompts).toEqual([
      "Job Posting ([Enter] paste text, or enter URL): ",
      "Paste the description/requirements. Finish with END on its own line: [END]",
    ])
  })

  test("fetches a supplied URL", async () => {
    const posting = await readJobPosting(
      {
        ask: async () => "https://example.com/job",
        readBlock: async () => "unused",
      },
      async (url) => `Fetched ${url}`
    )

    expect(posting).toBe("Fetched https://example.com/job")
  })
})

describe("runAlignmentLoop", () => {
  test("aligns, applies a selected Note, and stops on convergence", async () => {
    const answers = ["1", ""]
    const prompts: string[] = []
    const payloads: unknown[] = []
    let call = 0

    const result = await runAlignmentLoop({
      apiKey: "test-key",
      baseResume: resume,
      jobPosting: "Senior TypeScript engineer",
      readline: {
        ask: async (prompt) => {
          prompts.push(prompt)
          return answers.shift() ?? ""
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
    expect(prompts).toEqual([
      "Notes to address (comma-separated, or Enter to finish): ",
      "Instruction for Note 1 (Enter = apply suggestion): ",
    ])
    expect(payloads.length).toBe(2)
  })
})
