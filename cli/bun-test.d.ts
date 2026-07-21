declare module "bun:test" {
  interface Matchers {
    toBe(expected: unknown): void
    toEqual(expected: unknown): void
    toThrow(expected?: unknown): void
  }

  export function describe(name: string, callback: () => void): void
  export function test(name: string, callback: () => void | Promise<void>): void
  export function expect(actual: unknown): Matchers
}
