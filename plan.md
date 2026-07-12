# @kud/glyphs — plan

A single source of truth for terminal glyphs (Nerd Font + unicode), rendered into
multiple languages by codegen, so no project hand-maps codepoints again.

## Problem

Terminal glyphs are referenced by opaque Private-Use-Area codepoints (``),
which are **invisible in most editors and in AI tooling** — you can't eyeball
them, and a wrong codepoint is silent. Today the mapping is redone per project:

- **shui** has ~91 icons hand-mapped in zsh (`SHUI_ICON_SUCCESS=$'\U0000F00C'`),
  with inconsistent escape widths (`\U0000F00C` vs `\UF0FC`) and a mix of Nerd
  Font PUA and plain unicode.
- **@kud/ink-ui** wants Nerd glyphs behind an opt-in icon mode, and would
  otherwise add a _second_ hand-map that drifts from shui's.
- Other @kud CLIs (Node and zsh) have the same need.

One source, many outputs, written as escapes **by construction** (codepoint →
escape), never by hand or by eye.

## Use cases

- `@kud/ink-ui` components render a Nerd glyph in "nerd" icon mode, falling back
  to a unicode glyph in "text" mode (mirrors gtv-cli's `IconStyle`).
- shui sources a generated `glyphs.zsh` instead of maintaining its own inline map.
- Any @kud Node CLI imports typed named glyphs: `glyphs.arrowRight`,
  `glyph("nf-fa-check")`.

## Scope

**In (v1):**

- Source-of-truth `glyphs.json`: `name → { nerd: codepoint, unicode?: fallback, category }`.
- Seeded from shui's 91 curated entries (normalised).
- Codegen → **TypeScript** (`src/index.ts`: typed named consts + a `glyph(name)` lookup)
  and **zsh** (`glyphs.zsh`: `GLYPH_*` vars, plus `SHUI_ICON_*` aliases for shui compat).
- Escapes by construction: JS `\u{XXXX}`, zsh `$'\U0000XXXX'` (normalised 8-hex).
- Per-glyph unicode fallback so consumers can offer a non-Nerd mode.

**Out (v1, revisit later):**

- Bundling the full ~10k official Nerd Fonts `glyphnames.json` (structure allows
  it; v1 stays curated to what's actually used).
- fish / bash / lua / python emitters (trivial to add — same table, different
  escape syntax — but not needed day one).
- Shipping the font itself.

## Decisions

- **Name / package:** `@kud/glyphs`. Repo/folder `~/Projects/glyphs`.
- **Source format:** hand-authored `glyphs.json`, seeded from
  `~/Projects/shui/src/icons/*.zsh` (91 entries). Each entry carries the Nerd
  codepoint and, where sensible, a plain-unicode fallback.
- **Codegen:** a Node ESM script (`scripts/generate.mjs`) reads `glyphs.json` and
  emits `src/generated.ts` + `dist/glyphs.zsh`. tsup builds the TS to `dist`.
- **Escapes:** always emit escapes, normalised — never raw PUA bytes (they mangle
  in editors/diffs, and are invisible in AI tooling; this is a hard rule).
- **ink-ui integration:** ink-ui gains a text/nerd icon mode; unicode is the safe
  default, Nerd is opt-in (a glyph rendering as a tofu box on a non-Nerd terminal
  is worse than `✓`).
- **Toolchain:** matches @kud/ink-ui — Ink-free (this is data, not components),
  ESM, tsup + vitest, exact-pinned deps, published via CI/OIDC on tag.

## Open questions

- v1 curated set only, or also wrap the full official `glyphnames.json` for
  `glyph("nf-fa-*")` lookups? (Lean: curated v1, official as a later `full` export.)
- zsh naming: emit `GLYPH_*` and keep `SHUI_ICON_*` aliases, or have shui migrate
  to `GLYPH_*`? (Lean: emit both; shui sources the file and drops its inline map.)
- Provide unicode fallback for every glyph, or only where a sensible one exists?
  (Lean: optional per entry; ink-ui text mode uses it when present.)

## Next steps

1. Scaffold the `@kud/glyphs` lib (lib-scaffolder): package.json, tsconfig,
   tsup.config, vitest, LICENSE, README, GitHub repo.
2. Author `glyphs.json`, porting shui's 91 entries (normalise escape widths;
   split Nerd vs unicode; add categories).
3. Write `scripts/generate.mjs` → `src/generated.ts` + `dist/glyphs.zsh`; add a
   test asserting a few known codepoints round-trip correctly.
4. Publish `@kud/glyphs@0.1.0`.
5. Wire `@kud/ink-ui`: add a text/nerd icon mode consuming `@kud/glyphs`.
6. Migrate shui to source the generated `glyphs.zsh` (drop its inline map).

## Seed data

shui's curated glyphs: `~/Projects/shui/src/icons/*.zsh` (~91 `SHUI_ICON_*`
entries). Mix of Nerd Font PUA (`F00C`, `E76F`) and plain unicode (`2022`,
`25CB`); escape widths are inconsistent and must be normalised on import.
