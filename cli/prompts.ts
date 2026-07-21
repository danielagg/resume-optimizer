import alignmentPrompt from "../src/prompts/alignment.md" with { type: "text" }
import revisionPrompt from "../src/prompts/revision.md" with { type: "text" }

export function promptFor(name: "alignment" | "revision"): string {
  return name === "alignment" ? alignmentPrompt : revisionPrompt
}
