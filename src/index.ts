import { glyphs, type GlyphName, type Variant } from "./generated.js"

export { glyphs }
export type { GlyphName, Variant }
export { renderZsh, type RenderZshOptions } from "./render.js"

/**
 * Resolve a glyph to its rendered string for the given variant (default
 * `nerd`). Returns `""` when the glyph has no value for that variant — callers
 * decide their own fallback (e.g. unicode → nerd for a non-Nerd terminal).
 */
export const glyph = (name: GlyphName, variant: Variant = "nerd"): string =>
  (glyphs[name] as Partial<Record<Variant, string>>)[variant] ?? ""
