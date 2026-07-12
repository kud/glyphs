<div align="center">

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white)
![npm](https://img.shields.io/npm/v/%40kud%2Fglyphs?style=flat-square&color=CB3837)
![MIT](https://img.shields.io/badge/licence-MIT-22C55E?style=flat-square)

**Multi-language source of truth for terminal glyphs**

</div>

## Features

- **One source, many outputs** — a single `glyphs.json` (`name → { nerd, unicode?, category }`) generates every language binding, so no project hand-maps codepoints again
- **Escapes by construction** — codepoints are always emitted as normalised escapes (`\u{XXXX}` in TypeScript, `$'\U0000XXXX'` in zsh), never as raw Private-Use-Area bytes that mangle in editors and diffs
- **Typed TypeScript output** — named consts plus a `glyph(name)` lookup, compiled with full `.d.ts` declarations
- **zsh output** — `GLYPH_*` variables for shell tooling, generated from the same table
- **Unicode fallback per glyph** — consumers can offer a non-Nerd mode without a tofu box on terminals that lack the font

## Install

```sh
npm install @kud/glyphs
```

## Usage

```ts
import { VERSION } from "@kud/glyphs"
```

The typed glyph exports are generated from `glyphs.json` via the codegen
script below — run it after editing the source data, then import the named
constants or the `glyph(name)` lookup it produces.

## Development

```sh
npm install
npm run generate   # glyphs.json -> src/generated.ts + dist/glyphs.zsh
npm run build      # tsup -> dist
npm run typecheck
npm test
```

## Licence

MIT
