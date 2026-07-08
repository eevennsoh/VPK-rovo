# Optional PDF export

vpk-html is **HTML-first**: the single-file HTML artifact is always the source of
truth. PDF is an **optional, derived** output for when a recipient needs a
fixed-page document (print, attachment, archival).

## Contract

- **Node-only, no Python.** PDF is rendered with headless Chromium via Playwright
  (`page.pdf()`), the same engine `--verify` already drives. There is no
  WeasyPrint and no Python dependency.
- **Derived, never authoritative.** Exporting a PDF does not modify the HTML and
  does not relax any offline invariant. `scripts/check-html.mjs` still governs
  the HTML; the PDF is a snapshot of it.
- **Offline in, offline out.** Because fonts are base64-inlined in the HTML,
  Chromium embeds them in the PDF — no network fetch at export or view time.

## Usage

```bash
node scripts/build.mjs --pdf output/vpk-html/q2-status/q2-status.html
node scripts/build.mjs --pdf output/vpk-html/q2-status/q2-status.html --out output/vpk-html/q2-status/q2-status.pdf
```

Programmatic:

```js
import { exportPdf } from "./scripts/pdf.mjs";
await exportPdf("output/vpk-html/q2-status/q2-status.html", "output/vpk-html/q2-status/q2-status.pdf"); // → { ok, out, bytes }
```

## Page sizing

`page.pdf()` is called with `preferCSSPageSize: true` and `printBackground: true`:

- If a template declares its own `@page { size: ... }`, that wins (slides keep
  their landscape geometry, letters keep Letter, etc.).
- Otherwise the export falls back to **A4**.

## Print-CSS coverage (important)

Chromium emulates **print media** when generating a PDF, so the export renders a
template's `@media print` / unscoped CSS — *not* its screen-only override block
(`@media screen`: drop caps, dotted dividers, masthead sizing, etc.). This is by
design: the print layer is the one that paginates cleanly. When adding or editing
a template, keep its **print layer self-sufficient** so the PDF is not visually
degraded relative to the on-screen HTML.

Because PDF is optional, a weak print layer never blocks the core HTML path — but
it does reduce PDF quality, so treat print-CSS parity as part of "done" for any
template likely to be exported.
