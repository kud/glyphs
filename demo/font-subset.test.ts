import { readFileSync } from "node:fs"
import subsetFont from "subset-font"
import { beforeAll, describe, expect, it } from "vitest"
// @ts-expect-error plain .mjs build script, no declarations
import { buildSubset, nerdCodepoints, sourceFont, subsetFontPath } from "../scripts/subset-font.mjs"

// Codepoints mapped by a TrueType font's cmap (formats 4 and 12).
const cmapCodepoints = (ttf: Buffer): Set<number> => {
  const found = new Set<number>()
  const tables = ttf.readUInt16BE(4)
  let cmap = -1
  for (let i = 0; i < tables; i++) {
    const rec = 12 + i * 16
    if (ttf.toString("latin1", rec, rec + 4) === "cmap") cmap = ttf.readUInt32BE(rec + 8)
  }
  expect(cmap).toBeGreaterThanOrEqual(0)
  const subtables = ttf.readUInt16BE(cmap + 2)
  for (let i = 0; i < subtables; i++) {
    const at = cmap + ttf.readUInt32BE(cmap + 4 + i * 8 + 4)
    const format = ttf.readUInt16BE(at)
    if (format === 12) {
      const groups = ttf.readUInt32BE(at + 12)
      for (let g = 0; g < groups; g++) {
        const o = at + 16 + g * 12
        for (let c = ttf.readUInt32BE(o); c <= ttf.readUInt32BE(o + 4); c++) found.add(c)
      }
    } else if (format === 4) {
      const segs = ttf.readUInt16BE(at + 6) / 2
      const ends = at + 14
      const starts = ends + segs * 2 + 2
      const deltas = starts + segs * 2
      const ranges = deltas + segs * 2
      for (let s = 0; s < segs; s++) {
        const end = ttf.readUInt16BE(ends + s * 2)
        for (let c = ttf.readUInt16BE(starts + s * 2); c <= end && c !== 0xffff; c++) {
          const ro = ttf.readUInt16BE(ranges + s * 2)
          const gid = ro === 0
            ? (c + ttf.readUInt16BE(deltas + s * 2)) & 0xffff
            : ttf.readUInt16BE(ranges + s * 2 + ro + (c - ttf.readUInt16BE(starts + s * 2)) * 2)
          if (gid) found.add(c)
        }
      }
    }
  }
  return found
}

describe("demo nerd font subset", () => {
  let mapped: Set<number>
  let inFullFont: Set<number>
  beforeAll(async () => {
    await buildSubset()
    // Re-encode the built woff2 as plain TrueType so its cmap can be read back.
    const everything = String.fromCodePoint(...nerdCodepoints())
    const ttf = await subsetFont(readFileSync(subsetFontPath), everything, { targetFormat: "sfnt" })
    mapped = cmapCodepoints(Buffer.from(ttf))
    const full = await subsetFont(readFileSync(sourceFont), everything, { targetFormat: "sfnt" })
    inFullFont = cmapCodepoints(Buffer.from(full))
  })

  it("carries every nerd codepoint in glyphs.json that the full font has", () => {
    const wanted: number[] = nerdCodepoints()
    expect(wanted.length).toBeGreaterThan(0)
    expect(inFullFont.size).toBeGreaterThan(wanted.length / 2)
    const missing = wanted
      .filter((cp) => inFullFont.has(cp) && !mapped.has(cp))
      .map((cp) => cp.toString(16).toUpperCase())
    expect(missing).toEqual([])
  })

  it("only lacks codepoints the full font never had, plain Unicode the page falls back for", () => {
    const lacking: number[] = nerdCodepoints().filter((cp: number) => !inFullFont.has(cp))
    expect(lacking.filter((cp) => cp >= 0xe000 && cp <= 0xf8ff || cp >= 0xf0000)).toEqual([])
  })

  it("is a real subset, far smaller than the full font", () => {
    expect(readFileSync(subsetFontPath).length).toBeLessThan(readFileSync(sourceFont).length / 10)
  })
})
