# Changelog

All notable changes to this project are documented here.

---

## Unreleased

### Highlights

- Added a web catalogue of every glyph, generated from `glyphs.json` and `colors.json`: each variant rendered side by side with its codepoints and one-click JS and zsh escapes, a variant switcher, search, and a terminal preview of the state colours. Run it with `npm run demo`; hosted at [kud.io/projects/glyphs/demo](https://kud.io/projects/glyphs/demo).

### Breaking

- Node 22 is now the minimum supported version (`engines.node` `>=22`, build target `node22`). Node 20 is end-of-life and the toolchain (vitest, tsup) no longer runs on it. CI now tests on Node 22 and the current LTS.

---

## 0.4.0 — 2026-09-10

### Highlights

- Added a full set of keyboard key glyphs — modifier and navigation keys such as backspace, command, control, option, escape, and the directional arrows — available across the Nerd Font, Unicode, and emoji variants. ([3856f2b](https://github.com/kud/glyphs/commit/3856f2b8455c0559de53fdd6719248fcaa3c8c32))
- Added thin powerline cap variants (`pl-cap-left-thin`, `pl-cap-right-thin`) alongside the existing caps, for terminal powerline prompt designs. ([91645aa](https://github.com/kud/glyphs/commit/91645aa16be9dba613108cc79e8fd857c1278a6b))

<details>
<summary>Internal (5 commits)</summary>

- Moved declaration emit to `tsc` and bumped to TypeScript 7 and `@types/node` 26; upgraded `actions/checkout`/`actions/setup-node` to v7; routine dependency bumps (`@types/node`, `vitest`).

</details>

---
