import { describe, expect, it } from "vitest"
import { VERSION } from "./index.js"

describe("VERSION", () => {
  it("is a non-empty string", () => {
    expect(typeof VERSION).toBe("string")
    expect(VERSION.length).toBeGreaterThan(0)
  })
})
