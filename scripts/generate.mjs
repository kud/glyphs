#!/usr/bin/env node

// TODO: read glyphs.json (name -> { nerd, unicode?, category }) and emit:
//   - src/generated.ts  — typed named consts + a glyph(name) lookup, escapes
//     written as JS \u{XXXX} by construction (never raw PUA bytes)
//   - dist/glyphs.zsh    — GLYPH_* vars (plus SHUI_ICON_* aliases for shui
//     compat), escapes written as zsh $'\U0000XXXX' (normalised 8-hex)
//
// See plan.md for the full spec: source format, escape normalisation rules,
// and the shui seed data this reads from.

console.log("generate: not yet implemented — see TODO in this file")
