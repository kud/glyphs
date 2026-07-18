import { glyphs, type GlyphName, type Variant } from "./generated.js"

const zshEscape = (s: string): string =>
  s
    ? "$'" +
      [...s]
        .map(
          (c) =>
            `\\U${c.codePointAt(0)!.toString(16).toUpperCase().padStart(8, "0")}`,
        )
        .join("") +
      "'"
    : "''"

const upperSnake = (camel: string): string =>
  camel.replace(/([A-Z])/g, "_$1").toUpperCase()

export interface RenderZshOptions {
  /** Variable-name prefix. `SHUI_ICON` → `SHUI_ICON_CHECK`. Defaults to `ICON`. */
  prefix?: string
  /** Which glyph variant to emit. Defaults to `nerd`. */
  variant?: Variant
  /** Restrict and order the output to these glyph names. Defaults to all. */
  names?: GlyphName[]
}

/**
 * Render zsh variable assignments for a set of glyphs, escape-safe by
 * construction (`$'\U0000XXXX'`, never raw PUA bytes). The prefix is the
 * caller's namespace — this library names no specific consumer.
 *
 * A glyph lacking the requested variant is emitted empty (`NAME=''`) so a
 * consumer relying on cross-set parity still gets every token declared.
 */
export const renderZsh = (options: RenderZshOptions = {}): string => {
  const { prefix = "ICON", variant = "nerd", names } = options
  const keys = names ?? (Object.keys(glyphs) as GlyphName[])
  return keys
    .map((name) => {
      const value =
        (glyphs[name] as Partial<Record<Variant, string>>)[variant] ?? ""
      return `${prefix}_${upperSnake(name)}=${zshEscape(value)}`
    })
    .join("\n")
}
