#!/usr/bin/env node
// Subsets the full Symbols Nerd Font Mono (demo/font-source) to the nerd
// codepoints glyphs.json uses, writing demo/fonts/ (gitignored, never committed).
// Run by the demo's dev and build scripts so the font cannot drift from the data.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import subsetFont from "subset-font"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
export const FONT_NAME = "SymbolsNerdFontMono-Regular.woff2"
export const sourceFont = join(root, "demo/font-source", FONT_NAME)
export const subsetFontPath = join(root, "demo/fonts", FONT_NAME)

export const nerdCodepoints = () => {
  const data = JSON.parse(readFileSync(join(root, "glyphs.json"), "utf8"))
  return [
    ...new Set(
      Object.values(data)
        .map((g) => g.nerd)
        .filter(Boolean)
        .map((hex) => parseInt(hex, 16)),
    ),
  ].sort((a, b) => a - b)
}

export const buildSubset = async () => {
  const text = String.fromCodePoint(...nerdCodepoints())
  const out = await subsetFont(readFileSync(sourceFont), text, {
    targetFormat: "woff2",
  })
  mkdirSync(dirname(subsetFontPath), { recursive: true })
  writeFileSync(subsetFontPath, out)
  copyFileSync(
    join(root, "demo/font-source/LICENSE"),
    join(root, "demo/fonts/LICENSE"),
  )
  return out.length
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const before = readFileSync(sourceFont).length
  const after = await buildSubset()
  console.log(`nerd font subset: ${before} -> ${after} bytes (${nerdCodepoints().length} glyphs)`)
}
