import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { defineConfig, type Plugin } from "vite"
import { renderPage } from "./demo/catalogue.ts"

const read = (rel: string) =>
  JSON.parse(readFileSync(new URL(rel, import.meta.url), "utf8"))

// Renders the catalogue into demo/index.html from glyphs.json and colors.json,
// re-reading them on every request in dev so an edit shows on reload.
const catalogue = (): Plugin => ({
  name: "glyphs-catalogue",
  configureServer(server) {
    server.watcher.add(["glyphs.json", "colors.json"])
    server.watcher.on("change", (file) => {
      if (/(glyphs|colors)\.json$/.test(file)) server.ws.send({ type: "full-reload" })
    })
  },
  transformIndexHtml(html) {
    return renderPage(html, read("./glyphs.json"), read("./colors.json"))
  },
})

// The hosted demo is served at kud.io/projects/glyphs/demo through a rewrite,
// so every built asset URL carries that absolute prefix (preview serves the build
// under it too); dev serves from /.
export default defineConfig(({ command, isPreview }) => ({
  root: fileURLToPath(new URL("./demo", import.meta.url)),
  base: command === "build" || isPreview ? "/projects/glyphs/demo/" : "/",
  plugins: [catalogue()],
  build: { outDir: "dist", emptyOutDir: true },
  preview: { open: false },
}))
