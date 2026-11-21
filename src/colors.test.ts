import { describe, it, expect } from "vitest"
import { execFileSync } from "child_process"
import { readFileSync } from "fs"
import { fileURLToPath } from "url"
import { colors, states, glyphs, glyph } from "./index.js"

const root = fileURLToPath(new URL("..", import.meta.url))
const source = JSON.parse(readFileSync(`${root}colors.json`, "utf8")) as {
  tokens: Record<string, { ansi16: number; ansi256: number; hex: string | null }>
  states: Record<
    string,
    { glyph: string | null; color: string; spinner: boolean }
  >
}
const camel = (k: string) =>
  k.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase())
const upper = (k: string) => k.toUpperCase().replace(/-/g, "_")

// Selin's ruling: muted is ANSI bright-black, never a grey hex. These tokens
// deliberately carry no truecolour layer so they follow the terminal palette.
const FLOOR_ONLY = new Set(["muted"])

describe("generated files", () => {
  it("match their sources (no drift)", () => {
    // Throws (non-zero exit) if any generated file differs from a fresh render.
    expect(() =>
      execFileSync("node", ["scripts/generate.mjs", "--check"], {
        cwd: root,
        stdio: "pipe",
      }),
    ).not.toThrow()
  })

  it("export the same tokens and states as colors.json", () => {
    expect(Object.keys(colors)).toEqual(Object.keys(source.tokens).map(camel))
    for (const [name, value] of Object.entries(source.tokens))
      expect(colors[camel(name) as keyof typeof colors]).toEqual(value)
    expect(Object.keys(states)).toEqual(Object.keys(source.states).map(camel))
  })

  it("emit every token and state into zsh/colors.zsh as static assignments", () => {
    const zsh = readFileSync(`${root}zsh/colors.zsh`, "utf8")
    const lines = zsh.split("\n").filter((l) => l && !l.startsWith("#"))
    // Static assignments only: NAME=value, no functions or substitutions.
    for (const l of lines) expect(l).toMatch(/^[A-Z0-9_]+=('[^'$`]*'|\d+)$/)
    for (const [name, { ansi16, ansi256, hex }] of Object.entries(
      source.tokens,
    )) {
      const n = `COLOR_${upper(name)}`
      expect(lines).toContain(`${n}_ANSI16=${ansi16}`)
      expect(lines).toContain(`${n}_ANSI256=${ansi256}`)
      expect(lines).toContain(`${n}_HEX='${hex ?? ""}'`)
    }
    expect(lines).toContain("STATE_PENDING_GLYPH='CIRCLE_EMPTY'")
    expect(lines).toContain("STATE_RUNNING_SPINNER=1")
  })
})

describe("colour tokens", () => {
  it("include the agreed vocabulary", () => {
    expect(Object.keys(colors).sort()).toEqual(
      [
        "accent",
        "success",
        "warning",
        "error",
        "info",
        "group",
        "muted",
        "secondary",
        "dim",
        "track",
        "link",
        "added",
        "removed",
      ].sort(),
    )
  })

  it("each carry all three layers", () => {
    for (const [name, value] of Object.entries(colors)) {
      expect(Object.keys(value).sort()).toEqual(["ansi16", "ansi256", "hex"])
      expect(Number.isInteger(value.ansi16)).toBe(true)
      expect(value.ansi16).toBeGreaterThanOrEqual(0)
      expect(value.ansi16).toBeLessThanOrEqual(15)
      expect(Number.isInteger(value.ansi256)).toBe(true)
      expect(value.ansi256).toBeGreaterThanOrEqual(0)
      expect(value.ansi256).toBeLessThanOrEqual(255)
      if (FLOOR_ONLY.has(name)) expect(value.hex).toBeNull()
      else expect(value.hex).toMatch(/^#[0-9A-F]{6}$/)
    }
  })

  it("hold the ANSI floor from the contract", () => {
    expect(colors.accent.ansi16).toBe(3) // yellow
    expect(colors.accent.hex).toBe("#FF8C00")
    expect(colors.success.ansi16).toBe(2) // green
    expect(colors.warning.ansi16).toBe(3) // yellow
    expect(colors.error.ansi16).toBe(1) // red
    expect(colors.info.ansi16).toBe(6) // cyan
    expect(colors.group.ansi16).toBe(5) // magenta
    expect(colors.muted.ansi16).toBe(8) // bright black
    expect(colors.muted.ansi256).toBe(8) // same palette slot, never a fixed grey
  })
})

describe("states", () => {
  it("map each state to an existing glyph and colour token", () => {
    for (const s of Object.values(states)) {
      expect(s.color in colors).toBe(true)
      if (s.glyph === null) expect(s.spinner).toBe(true)
      else expect(s.glyph in glyphs).toBe(true)
    }
  })

  it("use the agreed glyphs", () => {
    const cps = (str: string) =>
      [...str].map((c) => c.codePointAt(0)!.toString(16).toUpperCase())
    expect(cps(glyph(states.success.glyph, "emoji"))).toEqual(["2713"]) // ✓
    expect(cps(glyph(states.error.glyph, "emoji"))).toEqual(["2717"]) // ✗
    expect(cps(glyph(states.warning.glyph, "emoji"))[0]).toBe("26A0") // ⚠
    expect(cps(glyph(states.info.glyph, "emoji"))[0]).toBe("2139") // ℹ
    expect(cps(glyph(states.pending.glyph, "unicode"))).toEqual(["25CB"]) // ○
    expect(states.running).toEqual({
      glyph: null,
      color: "accent",
      spinner: true,
    })
  })
})
