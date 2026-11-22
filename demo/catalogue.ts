// Builds the catalogue model from glyphs.json and colors.json and renders it to
// static HTML at build time (see vite.demo.config.ts). Every character reaches
// the page as an HTML numeric reference (&#xF00C;) built from the stored hex, so
// neither this source nor the built page ever carries a raw Private-Use-Area
// byte: escapes by construction, the same rule as the library.

export const VARIANTS = ["nerd", "unicode", "emoji"] as const
export type Variant = (typeof VARIANTS)[number]

export type GlyphData = Record<string, Partial<Record<Variant, string>>>

export interface ColorData {
  tokens: Record<string, { ansi16: number; ansi256: number; hex: string | null }>
  states: Record<
    string,
    { glyph: string | null; color: string; spinner: boolean }
  >
}

export interface VariantEntry {
  variant: Variant
  codepoints: number[]
  js: string
  zsh: string
}

export interface GlyphEntry {
  name: string
  variants: Partial<Record<Variant, VariantEntry>>
}

// A stored nerd/unicode value is one codepoint in hex; an emoji value is a
// literal string, possibly a multi-scalar grapheme cluster (⚠️ = U+26A0 U+FE0F).
export const codepointsOf = (variant: Variant, value: string): number[] =>
  variant === "emoji"
    ? [...value].map((c) => c.codePointAt(0)!)
    : [parseInt(value, 16)]

const hex = (cp: number, pad = 4): string =>
  cp.toString(16).toUpperCase().padStart(pad, "0")

export const toJsEscape = (cps: number[]): string =>
  cps.map((cp) => `\\u{${cp.toString(16).toUpperCase()}}`).join("")

export const toZshEscape = (cps: number[]): string =>
  "$'" + cps.map((cp) => `\\U${hex(cp, 8)}`).join("") + "'"

export const toCodepointLabel = (cps: number[]): string =>
  cps.map((cp) => `U+${hex(cp)}`).join(" ")

/** The rendered character(s) as HTML numeric references, never raw bytes. */
export const toHtmlRef = (cps: number[]): string =>
  cps.map((cp) => `&#x${hex(cp)};`).join("")

export const escapeHtml = (s: string): string =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")

export const buildCatalogue = (data: GlyphData): GlyphEntry[] =>
  Object.keys(data)
    .sort()
    .map((name) => {
      const variants: GlyphEntry["variants"] = {}
      for (const variant of VARIANTS) {
        const value = data[name][variant]
        if (value == null) continue
        const codepoints = codepointsOf(variant, value)
        variants[variant] = {
          variant,
          codepoints,
          js: toJsEscape(codepoints),
          zsh: toZshEscape(codepoints),
        }
      }
      return { name, variants }
    })

// --- HTML -------------------------------------------------------------------

const COPY_ICON =
  '<svg aria-hidden="true" viewBox="0 0 16 16" width="14" height="14"><rect x="5" y="5" width="9" height="9" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M11 3.5V3a1.5 1.5 0 0 0-1.5-1.5h-6A1.5 1.5 0 0 0 2 3v6A1.5 1.5 0 0 0 3.5 10.5H4" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>'

const copyButton = (value: string, label: string, text: string): string =>
  `<button type="button" class="copy" data-copy="${escapeHtml(value)}" aria-label="${escapeHtml(label)}">${text}</button>`

const renderVariant = (name: string, variant: Variant, entry?: VariantEntry) => {
  if (!entry)
    return [
      `<div class="variant is-absent" data-variant="${variant}">`,
      `<span class="variant-label">${variant}</span>`,
      `<span class="glyph" aria-hidden="true">&#x2014;</span>`,
      `<span class="cp">no ${variant}</span>`,
      `</div>`,
    ].join("")
  const cps = toCodepointLabel(entry.codepoints)
  return [
    `<div class="variant" data-variant="${variant}">`,
    `<span class="variant-label">${variant}</span>`,
    `<span class="glyph glyph--${variant}" role="img" aria-label="${escapeHtml(`${name}, ${variant} variant, ${cps}`)}">${toHtmlRef(entry.codepoints)}</span>`,
    `<span class="cp">${cps}</span>`,
    `<span class="copies">`,
    copyButton(entry.js, `Copy JavaScript escape for ${name}, ${variant} variant`, "JS"),
    copyButton(entry.zsh, `Copy zsh escape for ${name}, ${variant} variant`, "zsh"),
    `</span>`,
    `</div>`,
  ].join("")
}

export const renderCard = (glyph: GlyphEntry): string => {
  const present = VARIANTS.filter((v) => glyph.variants[v])
  const search = [
    glyph.name,
    ...present.map((v) => toCodepointLabel(glyph.variants[v]!.codepoints)),
  ]
    .join(" ")
    .toLowerCase()
  return [
    `<li class="card" data-glyph="${glyph.name}" data-variants="${present.join(" ")}" data-search="${escapeHtml(search)}">`,
    `<h3 class="card-name">`,
    `<button type="button" class="copy copy--name" data-copy="${glyph.name}" aria-label="Copy glyph name ${glyph.name}"><code>${glyph.name}</code>${COPY_ICON}</button>`,
    `</h3>`,
    `<div class="variants">`,
    ...VARIANTS.map((v) => renderVariant(glyph.name, v, glyph.variants[v])),
    `</div>`,
    `</li>`,
  ].join("")
}

export const renderCatalogue = (data: GlyphData): string =>
  buildCatalogue(data).map(renderCard).join("\n")

// --- colours ----------------------------------------------------------------

const ANSI16_NAMES = [
  "black", "red", "green", "yellow", "blue", "magenta", "cyan", "white",
  "bright black", "bright red", "bright green", "bright yellow",
  "bright blue", "bright magenta", "bright cyan", "bright white",
]

// xterm's default 16-colour palette, the common reference rendering.
const ANSI16_RGB = [
  "#000000", "#CD0000", "#00CD00", "#CDCD00", "#0000EE", "#CD00CD", "#00CDCD", "#E5E5E5",
  "#7F7F7F", "#FF0000", "#00FF00", "#FFFF00", "#5C5CFF", "#FF00FF", "#00FFFF", "#FFFFFF",
]

/** The xterm reference RGB for a 256-colour palette index. */
export const ansi256ToHex = (n: number): string => {
  if (n < 16) return ANSI16_RGB[n]
  const h = (v: number) => v.toString(16).toUpperCase().padStart(2, "0")
  if (n >= 232) {
    const g = 8 + (n - 232) * 10
    return `#${h(g)}${h(g)}${h(g)}`
  }
  const i = n - 16
  const step = (c: number) => (c === 0 ? 0 : 55 + c * 40)
  return `#${h(step(Math.floor(i / 36)))}${h(step(Math.floor(i / 6) % 6))}${h(step(i % 6))}`
}

export const ansi16ToHex = (n: number): string => ANSI16_RGB[n]
export const ansi16Name = (n: number): string => ANSI16_NAMES[n]

/** The colour a dark truecolour terminal shows: hex, else the ansi256 layer. */
export const terminalColour = (t: ColorData["tokens"][string]): string =>
  t.hex ?? ansi256ToHex(t.ansi256)

const chip = (colour: string, label: string) =>
  `<span class="chip"><span class="chip-dot" style="background:${colour}" aria-hidden="true"></span>${label}</span>`

export const renderSwatches = (colors: ColorData): string =>
  Object.entries(colors.tokens)
    .map(([name, t]) =>
      [
        `<li class="swatch">`,
        `<span class="swatch-fill" style="background:${terminalColour(t)}" aria-hidden="true"></span>`,
        `<code class="swatch-name">${name}</code>`,
        `<span class="chips">`,
        chip(ansi16ToHex(t.ansi16), `ansi16 ${t.ansi16} <span class="chip-note">${ansi16Name(t.ansi16)}</span>`),
        chip(ansi256ToHex(t.ansi256), `ansi256 ${t.ansi256}`),
        t.hex
          ? chip(t.hex, `hex ${t.hex}`)
          : `<span class="chip chip--none">hex &#x2014; <span class="chip-note">terminal palette</span></span>`,
        `</span>`,
        `</li>`,
      ].join(""),
    )
    .join("\n")

// One sample line per state. The glyph cell carries every variant the glyph has
// so the page's variant switcher can flip it with CSS alone.
const STATE_MESSAGES: Record<string, string> = {
  success: "Build complete in 1.4s",
  error: "Could not reach registry.npmjs.org",
  warning: "3 dependencies are out of date",
  info: "Using Node 22 from .nvmrc",
  pending: "Waiting for lint",
  running: "Installing packages",
}

export const renderTerminal = (data: GlyphData, colors: ColorData): string =>
  Object.entries(colors.states)
    .map(([state, s]) => {
      const colour = terminalColour(colors.tokens[s.color])
      const glyph = s.glyph ? buildCatalogue({ [s.glyph]: data[s.glyph] })[0] : null
      const cells = glyph
        ? VARIANTS.map((v) => {
            const e = glyph.variants[v] ?? glyph.variants.nerd!
            return `<span class="term-glyph glyph--${glyph.variants[v] ? v : "nerd"}" data-variant="${v}">${toHtmlRef(e.codepoints)}</span>`
          }).join("")
        : `<span class="term-spinner" aria-hidden="true">${toHtmlRef([0x280b])}</span>`
      return [
        `<div class="term-line" data-state="${state}">`,
        `<span class="term-icon" style="color:${colour}" aria-hidden="true">${cells}</span>`,
        `<span class="term-text">${escapeHtml(STATE_MESSAGES[state] ?? state)}</span>`,
        `<span class="term-meta">${state} &#xB7; ${s.glyph ?? "spinner"} &#xB7; ${s.color}</span>`,
        `</div>`,
      ].join("")
    })
    .join("\n")

// --- page -------------------------------------------------------------------

/**
 * Fills demo/index.html's markers. Function replacers on purpose: a replacement
 * string would read the `$'` opening every zsh escape as a replace pattern.
 */
export const renderPage = (
  template: string,
  data: GlyphData,
  colors: ColorData,
): string =>
  template
    .replace("<!--glyph-count-->", () => String(Object.keys(data).length))
    .replace("<!--catalogue-->", () => renderCatalogue(data))
    .replace("<!--terminal-->", () => renderTerminal(data, colors))
    .replace("<!--swatches-->", () => renderSwatches(colors))
