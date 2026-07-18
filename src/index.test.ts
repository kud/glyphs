import { describe, it, expect } from "vitest"
import { glyphs, glyph, renderZsh } from "./index.js"

const cps = (s: string) =>
  [...s].map((c) => c.codePointAt(0)!.toString(16).toUpperCase())

describe("glyphs data", () => {
  it("resolves the nerd variant by default", () => {
    expect(cps(glyph("check"))).toEqual(["F00C"])
    expect(cps(glyph("cross"))).toEqual(["F00D"])
    expect(cps(glyph("arrowRight"))).toEqual(["F061"])
  })

  it("exposes per-variant values where the sets diverge", () => {
    // bullet is the canonical divergent case: a different glyph in every set.
    expect(cps(glyphs.bullet.nerd)).toEqual(["2022"])
    expect(cps(glyphs.bullet.unicode!)).toEqual(["203A"])
    expect(cps(glyphs.bullet.emoji!)).toEqual(["2022"])
  })

  it("keeps multi-scalar emoji intact", () => {
    // ⚠️ is U+26A0 U+FE0F — a grapheme cluster, not a single scalar.
    expect(cps(glyph("warning", "emoji"))).toEqual(["26A0", "FE0F"])
  })

  it("returns empty for an absent variant", () => {
    expect(glyph("plArrowRight", "emoji")).toBe("")
  })

  it("has more than 80 glyphs, each with a nerd variant", () => {
    const entries = Object.values(glyphs)
    expect(entries.length).toBeGreaterThan(80)
    expect(entries.every((e) => "nerd" in e)).toBe(true)
  })
})

describe("renderZsh", () => {
  it("emits escape-safe assignments under the caller's prefix", () => {
    const out = renderZsh({ prefix: "SHUI_ICON", variant: "nerd" })
    expect(out).toContain("SHUI_ICON_SUCCESS=$'\\U0000F00C'")
    expect(out).toContain("SHUI_ICON_PL_ARROW_RIGHT=$'\\U0000E0B0'")
  })

  it("defaults to the ICON prefix and nerd variant", () => {
    expect(renderZsh()).toContain("ICON_CHECK=$'\\U0000F00C'")
  })

  it("escapes multi-scalar emoji as consecutive \\U sequences", () => {
    const out = renderZsh({ prefix: "SHUI_ICON", variant: "emoji" })
    expect(out).toContain("SHUI_ICON_WARNING=$'\\U000026A0\\U0000FE0F'")
  })

  it("emits an empty value for a glyph lacking the variant (parity)", () => {
    const out = renderZsh({ prefix: "SHUI_ICON", variant: "emoji" })
    expect(out).toContain("SHUI_ICON_PL_ARROW_RIGHT=''")
  })

  it("restricts output to the given names, in order", () => {
    const out = renderZsh({ prefix: "P", names: ["circle", "bullet"] })
    expect(out.split("\n")).toEqual([
      `P_CIRCLE=${glyphToZsh(glyphs.circle.nerd)}`,
      `P_BULLET=${glyphToZsh(glyphs.bullet.nerd)}`,
    ])
  })
})

// Mirror of render.ts's escape, used only to assert exact output above.
const glyphToZsh = (s: string) =>
  "$'" +
  [...s]
    .map(
      (c) =>
        `\\U${c.codePointAt(0)!.toString(16).toUpperCase().padStart(8, "0")}`,
    )
    .join("") +
  "'"
