const BRACKETED_PASTE_START = "\u001b[200~"
const BRACKETED_PASTE_END = "\u001b[201~"
const ENABLE_BRACKETED_PASTE = "\u001b[?2004h"
const DISABLE_BRACKETED_PASTE = "\u001b[?2004l"
const CLEAR_LINE = "\r\u001b[2K"

interface RawInput extends NodeJS.ReadableStream {
  isRaw?: boolean
  setRawMode?(mode: boolean): unknown
}

interface PastePromptOptions {
  input?: RawInput
  output?: NodeJS.WritableStream
  fallbackIdleMs?: number
}

export class PasteCancelledError extends Error {
  constructor() {
    super("Paste cancelled.")
    this.name = "PasteCancelledError"
  }
}

function normalizePaste(value: string): string {
  return value.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim()
}

function lineCount(value: string): number {
  const normalized = normalizePaste(value)
  return normalized ? normalized.split("\n").length : 0
}

export function promptForPastedText({
  input = process.stdin,
  output = process.stdout,
  fallbackIdleMs = 150,
}: PastePromptOptions = {}): Promise<string> {
  return new Promise((resolve, reject) => {
    const wasRaw = input.isRaw ?? false
    let pending = ""
    let pastedText = ""
    let insideBracketedPaste = false
    let readyToSubmit = false
    let settled = false
    let fallbackTimer: ReturnType<typeof setTimeout> | undefined

    const clearFallbackTimer = () => {
      if (fallbackTimer) clearTimeout(fallbackTimer)
      fallbackTimer = undefined
    }

    const renderReady = () => {
      const count = lineCount(pastedText)
      output.write(
        `${CLEAR_LINE}│ [Pasted ${count} ${count === 1 ? "line" : "lines"}]\n└ Press Enter to continue`
      )
    }

    const markReady = () => {
      clearFallbackTimer()
      if (!normalizePaste(pastedText)) return
      readyToSubmit = true
      renderReady()
    }

    const cleanup = () => {
      clearFallbackTimer()
      input.removeListener("data", onData)
      input.removeListener("end", onEnd)
      input.removeListener("error", onError)
      output.write(DISABLE_BRACKETED_PASTE)
      try {
        input.setRawMode?.(wasRaw)
      } catch {
        // The terminal may already be closed.
      }
      input.pause()
    }

    const finish = () => {
      if (settled) return
      const result = normalizePaste(pastedText)
      if (!result) return
      settled = true
      cleanup()
      output.write("\n")
      resolve(result)
    }

    const abort = (error: Error) => {
      if (settled) return
      settled = true
      cleanup()
      output.write("\n")
      reject(error)
    }

    const scheduleFallbackReady = () => {
      clearFallbackTimer()
      fallbackTimer = setTimeout(markReady, fallbackIdleMs)
    }

    const handleOrdinaryCharacter = (character: string) => {
      if (character === "\u0003") {
        abort(new PasteCancelledError())
        return
      }

      if (readyToSubmit) {
        if (character === "\r" || character === "\n") finish()
        if (character === "\u007f" || character === "\b") {
          pastedText = ""
          readyToSubmit = false
          output.write(`${CLEAR_LINE}│ Waiting for paste…`)
        }
        return
      }

      pastedText += character
      scheduleFallbackReady()
    }

    const processPending = () => {
      while (pending && !settled) {
        if (insideBracketedPaste) {
          if (pending.startsWith(BRACKETED_PASTE_END)) {
            pending = pending.slice(BRACKETED_PASTE_END.length)
            insideBracketedPaste = false
            markReady()
            continue
          }
          if (BRACKETED_PASTE_END.startsWith(pending)) return

          pastedText += pending[0]
          pending = pending.slice(1)
          continue
        }

        if (pending.startsWith(BRACKETED_PASTE_START)) {
          pending = pending.slice(BRACKETED_PASTE_START.length)
          clearFallbackTimer()
          pastedText = ""
          readyToSubmit = false
          insideBracketedPaste = true
          output.write(`${CLEAR_LINE}│ Capturing paste…`)
          continue
        }
        if (BRACKETED_PASTE_START.startsWith(pending)) return

        const character = pending[0]
        pending = pending.slice(1)
        handleOrdinaryCharacter(character)
      }
    }

    function onData(chunk: unknown): void {
      pending += String(chunk)
      processPending()
    }

    function onEnd(): void {
      if (normalizePaste(pastedText)) finish()
      else abort(new Error("Input closed before a job description was pasted."))
    }

    function onError(error: Error): void {
      abort(error)
    }

    output.write(
      `${ENABLE_BRACKETED_PASTE}◆ Paste the complete job description\n│ Waiting for paste…`
    )
    try {
      input.setRawMode?.(true)
    } catch {
      // Non-TTY streams use the idle fallback below.
    }
    input.setEncoding("utf8")
    input.on("data", onData)
    input.once("end", onEnd)
    input.once("error", onError)
    input.resume()
  })
}
