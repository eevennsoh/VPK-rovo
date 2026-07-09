# vpk-html

> Render structured material into offline, single-file HTML documents with the
> vpk-html Atlassian deck/editorial identity. **[See the index →](index.html)**

vpk-html is a static-document skill used inside the VPK-Rovo monorepo. It is
built on [kami's](https://github.com/tw93/Kami) template-edit architecture: the
LLM copies an HTML template, fills `{{placeholders}}` with real content, and
ships a single self-contained HTML file. Visual identity, fonts, and layout
stay locked across all documents.

## Identity

- **Display font:** Charlie Display for mastheads, slide titles, headline stats, and section heads.
- **Body font:** Charlie Text for prose, labels, body copy, tables, and ordinary document text.
- **Mono font:** Atlassian Mono for code, metrics, dates, counters, figure/table numbers, chart labels, and technical identifiers.
- **Numeric face:** Atlassian Mono Numeric uses `unicode-range: U+0030-0039` so digits inside Charlie text render in Atlassian Mono.
- **Surface:** `--paper`, backed by VPK/ADS surface semantics with offline fallbacks.
- **Accent:** `--primary-blue`, with lime, purple, saffron, orange, navy, green, and red semantic accents for collections, charts, diagrams, and status.
- **Status:** `--success`, `--warning`, `--danger`, and `--info` for meaning-bearing accents.
- **Canvas:** plain `--paper-background` page backdrop with flat surfaces and opt-in raised cards.

The look is deliberately *Atlassian deck × technical editorial*. It is compact,
readable, and unambiguous while leaving enough structure for strategy decks,
status readouts, and implementation briefs.

## What you get

- **28 document templates** at `assets/templates/`: 8 base document shells
  plus 20 Phase 2 engineering templates patterned after the
  [ThariqS/html-effectiveness](https://github.com/ThariqS/html-effectiveness)
  use-case catalog. Each is a complete standalone HTML file with inline CSS
  and fonts.
- **14 SVG diagram primitives** at `assets/diagrams/` — architecture, flowchart,
  swimlane, tree, waterfall, candlestick, and friends. Extract the `<svg>` block
  and embed inside any long-form template.
- **5 technical illustration exemplars** at `assets/illustrations/` —
  isometric, exploded, annotated, cross-section, and pipeline SVGs built for
  remixing inside technical docs.
- **52 demos** at `assets/demos/`: filled document showcases, Phase 2
  `html-effectiveness` ports, diagram previews, technical illustration previews,
  and vpk-native examples.
- **A reference-manual homepage** at [`index.html`](index.html).
- **LLM-facing reference docs** for writing, anti-patterns, diagrams,
  illustrations, presentation mode, video export, PDF export, quality gates,
  GitHub Pages publishing, and production troubleshooting.

## Quick start

```bash
# 1. Pick a template and create one folder for this generated artifact
mkdir -p output/vpk-html/my-doc
cp .agents/skills/vpk-html/assets/templates/one-pager.html output/vpk-html/my-doc/my-doc.html

# 2. Open my-doc.html and replace every {{placeholder}} with real content.
#    CSS stays untouched — only edit the body.

# 3. Validate
node .agents/skills/vpk-html/scripts/build.mjs --check-placeholders output/vpk-html/my-doc/my-doc.html
node .agents/skills/vpk-html/scripts/build.mjs --verify output/vpk-html/my-doc/my-doc.html
```

Generated user artifacts are grouped per slug under `output/vpk-html/<slug>/`.
Keep the HTML source at `output/vpk-html/<slug>/<slug>.html`, with optional
PDFs, screenshots, and validation captures inside the same slug folder.

## Invoking the skill

In Cursor / Claude Code, prefix your message with `/vpk-html`. Optional
doc-type hints and flags can follow: `/vpk-html resume`,
`/vpk-html one-pager`, `/vpk-html --github`.

Use `/vpk-html --github` when the final artifact should be live on GitHub
Pages. The publish helper validates the document, copies it to `index.html`,
creates or reuses a GitHub repo, pushes `main`, enables Pages from `/`, and
prints the public URL.

See [`CHEATSHEET.md`](CHEATSHEET.md) for the route table that maps user intent
to template file.

## Commands

```bash
node scripts/build.mjs                            # check every template
node scripts/build.mjs --check-placeholders <file>
node scripts/build.mjs --check-templates          # CSS / token / font sanity
node scripts/build.mjs --verify <file>            # Playwright render + load check

node scripts/check-html.mjs <file>                # static HTML validity
node scripts/ensure-fonts.mjs                     # fetch fonts to assets/fonts/

node scripts/build.mjs --pdf <file> [--out <f.pdf>]  # optional derived PDF (Chromium, Node-only)
node scripts/build.mjs --landing <file> [--out <dir>] [--origin <url>]  # landing companions + responsive verify
node scripts/build.mjs --github <file> [--repo owner/name] [--public|--private]  # publish to GitHub Pages
node scripts/build.mjs --check-density|--check-resume-balance|--check-rhythm|--check-orphans|--check-focal|--check-motion-budget|--check-caption-echo <file> [--strict]

node scripts/port-kami.mjs [--templates|--diagrams|--demos]  # re-port templates + diagrams + curated demos from kami
node scripts/retrofit.mjs                        # idempotently refresh committed HTML with shared CSS + presentation/docnav
node scripts/port-engineering.mjs                 # regenerate Phase 2 engineering templates
node scripts/build-demos.mjs [--curated|--landing]  # regenerate curated demos + landing mock previews
node scripts/port-engineering-demos.mjs           # copy + restyle direct Phase 2 upstream demo ports
node scripts/build-illustrations.mjs              # regenerate technical illustration exemplars + gallery demos
node scripts/landing.mjs                          # regenerate assets/landing/ shells
```

## Directory map

| Path | Purpose |
|---|---|
| `SKILL.md` | Agent-facing skill manifest (workflow + rules) |
| `CHEATSHEET.md` | Route table: user intent → template file |
| `README.md` | This file |
| `index.html` | Local demo catalog |
| `LICENSE`, `llms.txt`, `.gitignore`, `.claude-plugin/` | Top-level metadata |
| `assets/templates/` | 28 offline HTML templates: 8 base document shells + 20 Phase 2 engineering shells |
| `assets/diagrams/` | 14 standalone SVG diagram primitives |
| `assets/illustrations/` | 5 technical illustration exemplars for remixing |
| `assets/html-effectiveness/` | Snapshot of the 20 upstream html-effectiveness HTML demos plus index |
| `assets/demos/` | 52 demo HTML outputs plus the embedded media needed by individual demos |
| `assets/fonts/` | Charlie Display, Charlie Text, and Atlassian Mono (inlined as base64 at port time) |
| `output/vpk-html/<slug>/` | Ignored per-artifact folders for generated user HTML, PDFs, screenshots, and review captures |
| `styles.css` | Shared root stylesheet, matching Kami's top-level CSS contract |
| `references/` | Anti-patterns, diagrams, illustrations, presentation, video-export, resume-writing, writing, design, GitHub Pages publishing, production, source-policy, accessibility, tokens.json |
| `scripts/` | build (validator), check-html, shared helpers, presentation, retrofit, port-*.mjs, build-demos, build-illustrations, landing, gates, pdf, ensure-fonts |

## Rules of the road

- **No remote assets.** Every filled document is self-contained — local fonts
  are inlined as base64 data URIs at port time. Move a filled file anywhere
  and it still renders identically.
- **CSS stays untouched.** Templates ship with their CSS locked. Only the
  body content changes per document.
- **Theme stays shared.** Author semantic colors in `references/tokens.json`,
  mirror them to root `styles.css`, and import `scripts/shared.mjs` from
  generators instead of hard-coding palette or font blocks per demo.
- **Motion stays shared.** Templates opt into `data-vpk-motion`; the shared CSS
  owns entrance, document reveal, micro-interaction, reduced-motion, and print
  neutralizer behavior.
- **Presentation is screen-only.** Deck runtime and speaker notes are injected by
  `scripts/presentation.mjs`; print/PDF geometry stays unchanged.
- **Fill every placeholder.** Run `build.mjs --check-placeholders` before
  shipping. Unfilled `{{...}}` slots fail the check.
- **Visible sources.** When external research or copied material is used,
  the document must include a visible "Sources and Credits" section.
- **One template, one document.** Don't compose multiple templates into one
  file; pick the closest fit and adapt.

## How vpk-html relates to kami

vpk-html adopted kami's template-edit architecture (Phase 1, May 2026). Phase
2 adds original engineering-focused shells mapped from the
`html-effectiveness` use cases into the same offline template-edit workflow.
The visual identity diverges; the workflow does not.

| | vpk-html | kami |
|---|---|---|
| Surface | Semantic white paper via `--paper` | Warm parchment |
| Accent | Primary blue plus ADS-style collection accents | Ink-blue `#1B365D` (deeper) |
| Display | Charlie Display | Charter / TsangerJinKai02 (serif) |
| Body | Charlie Text with Atlassian Mono numerals | Charter / TsangerJinKai02 |
| Render pipeline | Template edit (kami-style) | Template edit |
| Build toolchain | Node ESM | Python (WeasyPrint, python-pptx) |
| Output | Single offline HTML | HTML + PDF + optional PPTX + PNG |
| Templates | 28 (8 kami-ported base shells + 20 original Phase 2 engineering shells) | 8 |
| Diagrams | 14 SVG primitives (kami-ported) | 14 SVG primitives |
| Technical illustrations | 5 vpk-native exemplars | N/A |
| Languages | EN | CN primary, EN, JA best-effort |

vpk-html's theme source of truth is `references/tokens.json` -> root
`styles.css`, with helpers in `scripts/shared.mjs`, matching Kami's
`styles.css` + `references/tokens.json` + `scripts/shared.py` shape. After
token edits, run `node .agents/skills/vpk-html/scripts/build.mjs --write-styles`,
then `node .agents/skills/vpk-html/scripts/build.mjs --sync`.

## Phase 2 engineering templates

The Phase 2 template generator maps the 20 engineering document patterns from
[ThariqS/html-effectiveness](https://github.com/ThariqS/html-effectiveness)
into vpk-html shells for approach exploration, code review, code
understanding, design-system specs, component variants, prototypes, status and
incident reports, research explainers, implementation plans, PR writeups, and
editor-style triage/flag/prompt worksheets.

The Phase 2 demo generator copies the upstream HTML examples from
`assets/html-effectiveness/` into the local `assets/demos/demo-*.html` paths,
applies the vpk-html visual shell, and groups them on the homepage using the
same category rhythm as `html-effectiveness`: Exploration & Planning, Code
Review & Understanding, Design, Prototyping, Illustrations & Diagrams, Decks,
Research & Learning, Reports, and Custom Editing Interfaces.

The Phase 2 templates remain original vpk-html template shells. The Phase 2
demos preserve upstream structure, JavaScript, and sample content, then add the
local vpk-html overlay: embedded Charlie and Atlassian Mono font declarations,
primary-blue/paper tokens, source comments, shared motion, presentation/docnav
runtime where applicable, and accessibility landmarks where the upstream page
omitted them.

## Motion, Presentation, Illustrations, Video

- Motion tokens and shared CSS live in `references/tokens.json`,
  `scripts/shared.mjs`, and `styles.css`. Run `--write-styles`, `retrofit.mjs`,
  and `--check-templates` after changes.
- Decks use `scripts/presentation.mjs` for Left/Right slide navigation,
  `#slide-N` deep links, hidden speaker notes, and a synced presenter window.
  See `references/presentation.md`.
- Technical illustrations use `assets/illustrations/` plus
  `references/illustrations.md`. Ordinary diagrams still keep the one-blue
  focal rule; illustrations may use the full `--ill-*` ADS blue ramp.
- MP4 export is intentionally a Hyperframes re-authoring contract, not the deck
  runtime. See `references/video-export.md`.

## License

Inherits the VPK-Rovo monorepo license. The 8 base HTML templates and 14
diagram primitives in `assets/templates/` and `assets/diagrams/` are ported
from [tw93/kami](https://github.com/tw93/Kami) (MIT) and re-skinned with
vpk-html's visual identity; the layout structure and SVG geometry are kami's
work. The 20 Phase 2 engineering templates are original vpk-html shells based
on the `html-effectiveness` use-case catalog.

## Acknowledgements

- Kami by [@tw93](https://github.com/tw93) — template architecture, diagram
  primitives, demo curation, and the broader idea of constraint-based document
  design systems for AI agents.
- html-effectiveness by [@ThariqS](https://github.com/ThariqS) — engineering
  document use-case catalog that informed the Phase 2 template set.
- Charlie Display, Charlie Text, and Atlassian Mono font assets are committed locally for the offline artifact contract.
