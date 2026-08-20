import { describe, expect, test } from "bun:test"
import { PassThrough } from "node:stream"
import { promptForPastedText } from "./paste-input"

describe("promptForPastedText", () => {
  test("captures a bracketed multiline paste as one opaque block", async () => {
    const input = new PassThrough()
    const output = new PassThrough()
    let rendered = ""
    output.on("data", (chunk) => {
      rendered += String(chunk)
    })

    const resultPromise = promptForPastedText({ input, output })
    input.write("\u001b[200~First paragraph\n\nSecond paragraph\u001b[201~")
    input.write("\r")

    expect(await resultPromise).toBe("First paragraph\n\nSecond paragraph")
    expect(rendered.includes("[Pasted 3 lines]")).toBe(true)
    expect(rendered.includes("First paragraph")).toBe(false)
    expect(rendered.includes("Second paragraph")).toBe(false)
  })

  test("handles paste markers split across terminal chunks", async () => {
    const input = new PassThrough()
    const output = new PassThrough()
    const resultPromise = promptForPastedText({ input, output })

    input.write("\u001b[20")
    input.write("0~Line one\nLine two\u001b[20")
    input.write("1~")
    input.write("\r")

    expect(await resultPromise).toBe("Line one\nLine two")
  })
})
