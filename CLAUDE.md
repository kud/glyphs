# @kud/glyphs — Project Instructions

## Overview

Multi-language source of truth for terminal glyphs — Nerd Font codepoints and
Unicode/emoji fallbacks, emitted as escape-safe code by construction. Consumed
by @kud TypeScript CLIs and by zsh design systems (shui) so no project ever
hand-maps codepoints again.

## Source of truth

`glyphs.json` is the **only** file edited by hand. It maps each kebab-case name
to its variants:

```json
"check":  { "nerd": "F00C", "emoji": "✅" }
"bullet": { "nerd": "2022", "unicode": "203A", "emoji": "•" }
```

- `nerd` / `unicode` — codepoint **hex** (a single scalar). Stored as hex so the
  output is escaped by construction, never a raw byte.
- `emoji` — a **literal** string, which may be a multi-scalar grapheme cluster
  (`⚠️` = U+26A0 U+FE0F). Stored literally; escaped only on output.
- `nerd` is expected on every glyph; `unicode` and `emoji` are optional.

## Generated files — never hand-edit

`npm run generate` reads `glyphs.json` and writes:

- `src/generated.ts` — the typed `glyphs` record (variants as `\u{XXXX}`).
- `glyphs.plugin.zsh` — a default zsh plugin: `ICON_*` vars, nerd variant.

Both carry a "do not edit by hand" banner. After any `glyphs.json` change, run
`npm run generate` and commit the regenerated outputs alongside it.

## Escapes by construction

Never write a raw Private-Use-Area byte anywhere — they are invisible in editors
and AI tooling, and mangle in diffs. Codepoints become escapes programmatically:
JS `\u{XXXX}`, zsh `$'\U0000XXXX'` (normalised 8-hex). This is a hard rule and
the whole reason the library exists.

## Consumer-agnostic by design

glyphs names **no specific consumer**. A consumer wanting its own variable prefix
calls `renderZsh({ prefix, variant })` — the prefix is the caller's namespace
(`SHUI_ICON` → `SHUI_ICON_CHECK`); glyphs defaults to `ICON`. Never reintroduce a
hardcoded `SHUI_ICON` alias or any project-specific name into the library.

## Commands

```zsh
npm run generate   # regenerate outputs from glyphs.json
npm run typecheck  # tsc --noEmit
npm test           # vitest run
npm run build      # generate + tsup → dist
```
