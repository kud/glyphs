import { describe, it, expect } from "vitest"
import { glyphs, glyph } from "./index.js"

const hex = (s: string) =>
  (s.codePointAt(0) ?? 0).toString(16).toUpperCase().padStart(4, "0")

describe("glyphs", () => {
  it("resolves known glyphs to their codepoints", () => {
    expect(hex(glyph("check"))).toBe("F00C")
    expect(hex(glyph("cross"))).toBe("F00D")
    expect(hex(glyph("arrowRight"))).toBe("F061")
  })

  it("exposes glyphs as a keyed record with camelCased names", () => {
    expect(hex(glyphs.check)).toBe("F00C")
    expect(Object.keys(glyphs).length).toBeGreaterThan(80)
  })

  it("emits single code-point strings", () => {
    for (const value of Object.values(glyphs)) {
      expect([...value]).toHaveLength(1)
    }
  })
})
