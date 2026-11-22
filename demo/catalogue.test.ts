import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { glyphs } from "../src/generated.js"
import {
  ansi256ToHex,
  buildCatalogue,
  renderCatalogue,
  renderPage,
  renderSwatches,
  renderTerminal,
  VARIANTS,
  type ColorData,
  type GlyphData,
} from "./catalogue"

const read = (rel: string) =>
  readFileSync(new URL(rel, import.meta.url), "utf8")
const data: GlyphData = JSON.parse(read("../glyphs.json"))
const colors: ColorData = JSON.parse(read("../colors.json"))
const html = renderCatalogue(data)

const camel = (k: string) => k.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase())
const unescapeHtml = (s: string) =>
  s.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")

describe("demo catalogue", () => {
  it("lists every glyph in glyphs.json exactly once, alphabetically", () => {
    const listed = [...html.matchAll(/data-glyph="([^"]+)"/g)].map((m) => m[1])
    expect(listed).toEqual(Object.keys(data).sort())
  })

  it("renders a column for every variant a glyph carries, and marks the rest absent", () => {
    for (const entry of buildCatalogue(data)) {
      const card = html.split("\n").find((l) => l.includes(`data-glyph="${entry.name}"`))!
      for (const v of VARIANTS) {
        const present = data[entry.name][v] != null
        expect(card.includes(`<div class="variant" data-variant="${v}">`)).toBe(present)
        expect(card.includes(`<div class="variant is-absent" data-variant="${v}">`)).toBe(!present)
      }
    }
  })

  it("offers the same JS escapes the library generates", () => {
    for (const entry of buildCatalogue(data)) {
      const lib = glyphs[camel(entry.name) as keyof typeof glyphs] as Partial<
        Record<(typeof VARIANTS)[number], string>
      >
      for (const v of VARIANTS) {
        const e = entry.variants[v]
        if (!e) continue
        // Evaluate the escape the user would paste and compare it to the library.
        const pasted = e.js.replace(/\\u\{([0-9A-F]+)\}/g, (_, h) =>
          String.fromCodePoint(parseInt(h, 16)),
        )
        expect(pasted, `${entry.name}.${v}`).toBe(lib[v])
        expect(html).toContain(`data-copy="${e.js}"`)
      }
    }
  })

  it("offers the same zsh escapes as the published zsh/<variant>.zsh files", () => {
    for (const v of VARIANTS) {
      const published = new Map(
        [...read(`../zsh/${v}.zsh`).matchAll(/^ICON_([A-Z0-9_]+)=(.+)$/gm)].map((m) => [m[1], m[2]]),
      )
      for (const entry of buildCatalogue(data)) {
        const e = entry.variants[v]
        if (!e) continue
        const key = entry.name.toUpperCase().replace(/-/g, "_")
        expect(e.zsh, `${entry.name}.${v}`).toBe(published.get(key))
        expect(unescapeHtml(html)).toContain(`data-copy="${e.zsh}"`)
      }
    }
  })

  it("never emits a raw Private-Use-Area character", () => {
    const pua = /[-\u{F0000}-\u{FFFFD}\u{100000}-\u{10FFFD}]/u
    for (const out of [html, renderTerminal(data, colors), renderSwatches(colors)])
      expect(out).not.toMatch(pua)
    expect(read("./catalogue.ts")).not.toMatch(pua)
    expect(read("./main.ts")).not.toMatch(pua)
    expect(read("./index.html")).not.toMatch(pua)
  })

  it("renders a terminal line per state and a swatch per colour token", () => {
    const term = renderTerminal(data, colors)
    for (const state of Object.keys(colors.states))
      expect(term).toContain(`data-state="${state}"`)
    const swatches = renderSwatches(colors)
    for (const token of Object.keys(colors.tokens))
      expect(swatches).toContain(`<code class="swatch-name">${token}</code>`)
  })

  it("maps 256-colour indices to the xterm reference palette", () => {
    expect(ansi256ToHex(1)).toBe("#CD0000")
    expect(ansi256ToHex(16)).toBe("#000000")
    expect(ansi256ToHex(79)).toBe("#5FD7AF")
    expect(ansi256ToHex(208)).toBe("#FF8700")
    expect(ansi256ToHex(236)).toBe("#303030")
    expect(ansi256ToHex(255)).toBe("#EEEEEE")
  })

  it("fills the page template without mangling the zsh escapes", () => {
    const page = renderPage(read("./index.html"), data, colors)
    expect(page).not.toMatch(/<!--(glyph-count|catalogue|terminal|swatches)-->/)
    expect(page).toContain(`data-copy="$&#39;\\U0000F00C&#39;"`)
    expect(page).toContain(`${Object.keys(data).length} terminal glyphs`)
  })
})
