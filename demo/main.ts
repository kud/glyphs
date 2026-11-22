import "./style.css"

// The catalogue is rendered to static HTML at build time; this script only adds
// search, the variant switcher, copy buttons, the theme toggle and the spinner.

const root = document.documentElement
const cards = [...document.querySelectorAll<HTMLLIElement>(".card")]
const search = document.querySelector<HTMLInputElement>("#search")!
const status = document.querySelector<HTMLParagraphElement>("#status")!
const empty = document.querySelector<HTMLParagraphElement>("#empty")!
const toast = document.querySelector<HTMLDivElement>("#toast")!

// --- filtering ---------------------------------------------------------------

const currentVariant = () =>
  document.querySelector<HTMLInputElement>('input[name="variant"]:checked')!.value

const applyFilters = () => {
  const variant = currentVariant()
  const query = search.value.trim().toLowerCase().replace(/^u\+/, "")
  root.dataset.variant = variant
  let shown = 0
  for (const card of cards) {
    const hasVariant =
      variant === "all" || card.dataset.variants!.split(" ").includes(variant)
    const matches = !query || card.dataset.search!.includes(query)
    card.hidden = !(hasVariant && matches)
    if (!card.hidden) shown++
  }
  empty.hidden = shown > 0
  const scope = variant === "all" ? "" : ` with a ${variant} variant`
  status.textContent = `Showing ${shown} of ${cards.length} glyphs${scope}.`
}

search.addEventListener("input", applyFilters)
for (const radio of document.querySelectorAll<HTMLInputElement>('input[name="variant"]'))
  radio.addEventListener("change", applyFilters)

// "/" focuses the search, as on most catalogue sites.
document.addEventListener("keydown", (event) => {
  const target = event.target as HTMLElement
  if (event.key === "/" && !target.closest("input, textarea")) {
    event.preventDefault()
    search.focus()
  }
})

applyFilters()

// --- copy --------------------------------------------------------------------

let toastTimer: number | undefined
const announce = (message: string) => {
  toast.textContent = message
  toast.classList.add("is-visible")
  clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 1600)
}

const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const area = document.createElement("textarea")
    area.value = text
    area.setAttribute("readonly", "")
    area.style.position = "fixed"
    area.style.opacity = "0"
    document.body.append(area)
    area.select()
    const ok = document.execCommand("copy")
    area.remove()
    return ok
  }
}

document.addEventListener("click", async (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>("button[data-copy]")
  if (!button) return
  const value = button.dataset.copy!
  const ok = await copyText(value)
  announce(ok ? `Copied ${value}` : "Copy failed: your browser blocked the clipboard")
  if (ok) {
    button.classList.add("is-copied")
    setTimeout(() => button.classList.remove("is-copied"), 1200)
  }
})

// --- theme -------------------------------------------------------------------

const toggle = document.querySelector<HTMLButtonElement>(".theme-toggle")!
const toggleLabel = toggle.querySelector<HTMLSpanElement>(".theme-toggle-label")!
const systemDark = window.matchMedia("(prefers-color-scheme: dark)")
const isDark = () =>
  root.dataset.theme ? root.dataset.theme === "dark" : systemDark.matches

const syncToggle = () => {
  toggle.setAttribute("aria-pressed", String(isDark()))
  toggleLabel.textContent = "Dark theme"
}

toggle.addEventListener("click", () => {
  const next = isDark() ? "light" : "dark"
  root.dataset.theme = next
  try {
    localStorage.setItem("glyphs-theme", next)
  } catch {}
  syncToggle()
})
systemDark.addEventListener("change", syncToggle)
syncToggle()

// --- spinner -----------------------------------------------------------------

// Braille spinner frames, built from codepoints like everything else here.
const frames = [0x280b, 0x2819, 0x2839, 0x2838, 0x283c, 0x2834, 0x2826, 0x2827, 0x2807, 0x280f].map(
  (cp) => String.fromCodePoint(cp),
)
const spinners = document.querySelectorAll<HTMLSpanElement>(".term-spinner")
if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches && spinners.length) {
  let i = 0
  setInterval(() => {
    i = (i + 1) % frames.length
    for (const s of spinners) s.textContent = frames[i]
  }, 80)
}

// --- layout ------------------------------------------------------------------

// On a phone the token list would push the catalogue far down: start it closed.
if (window.matchMedia("(max-width: 480px)").matches)
  document.querySelector<HTMLDetailsElement>(".swatches-wrap")?.removeAttribute("open")
