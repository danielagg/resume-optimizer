import { describe, expect, test } from "bun:test"
import { isNewerVersion } from "./update"

describe("isNewerVersion", () => {
  test("recognizes newer semantic versions", () => {
    expect(isNewerVersion("v0.1.1", "0.1.0")).toBe(true)
    expect(isNewerVersion("v0.2.0", "0.1.9")).toBe(true)
    expect(isNewerVersion("v1.0.0", "0.9.9")).toBe(true)
  })

  test("ignores the current and older versions", () => {
    expect(isNewerVersion("v0.1.0", "0.1.0")).toBe(false)
    expect(isNewerVersion("v0.0.9", "0.1.0")).toBe(false)
  })

  test("treats a stable version as newer than its prerelease", () => {
    expect(isNewerVersion("v1.0.0", "1.0.0-rc.1")).toBe(true)
    expect(isNewerVersion("v1.0.0-rc.1", "1.0.0")).toBe(false)
  })
})
