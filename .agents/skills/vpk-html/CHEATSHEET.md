# vpk-html Cheatsheet

`/vpk-html` is required to trigger the skill. Optional doc-type hints and flags
may follow, e.g. `/vpk-html resume`, `/vpk-html one-pager`,
`/vpk-html --github`.

## Documents

| User intent | Template |
|---|---|
| Executive summary / proposal / brief | `assets/templates/one-pager.html` |
| White paper / long-form report / chapter | `assets/templates/long-doc.html` |
| Memo / formal letter / cover letter | `assets/templates/letter.html` |
| Portfolio / case studies / work samples | `assets/templates/portfolio.html` |
| Resume / CV | `assets/templates/resume.html` |
| Slide deck / keynote | `assets/templates/slides.html` |
| Investment memo / valuation / equity research | `assets/templates/equity-report.html` |
| Release notes / changelog | `assets/templates/changelog.html` |

## Engineering templates (Phase 2)

These original shells map the document patterns from
`ThariqS/html-effectiveness` into the same offline template-edit workflow.

| User intent | Template |
|---|---|
| Compare technical implementation approaches | `assets/templates/exploration-code-approaches.html` |
| Compare UI / visual design directions | `assets/templates/exploration-visual-designs.html` |
| Pull request review findings | `assets/templates/code-review-pr.html` |
| Explain a code path or module | `assets/templates/code-understanding.html` |
| Design system / token contract | `assets/templates/design-system.html` |
| Component variant matrix | `assets/templates/component-variants.html` |
| Motion / animation prototype spec | `assets/templates/prototype-animation.html` |
| Interaction prototype spec | `assets/templates/prototype-interaction.html` |
| Engineering slide deck plan | `assets/templates/slide-deck.html` |
| SVG / technical illustration brief | `assets/templates/svg-illustrations.html` |
| Engineering status report | `assets/templates/status-report.html` |
| Incident report / postmortem | `assets/templates/incident-report.html` |
| Flowchart / process diagram plan | `assets/templates/flowchart-diagram.html` |
| Feature explainer / capability research | `assets/templates/research-feature-explainer.html` |
| Concept explainer / technical research note | `assets/templates/research-concept-explainer.html` |
| Implementation plan / rollout plan | `assets/templates/implementation-plan.html` |
| Pull request writeup | `assets/templates/pr-writeup.html` |
| Static triage board snapshot | `assets/templates/editor-triage-board.html` |
| Feature flag matrix / rollout controls | `assets/templates/editor-feature-flags.html` |
| Prompt tuning / prompt eval worksheet | `assets/templates/editor-prompt-tuner.html` |

## Diagrams (embed inside the templates above)

| Data shape / intent | Diagram |
|---|---|
| Components + connections in a system | `assets/diagrams/architecture.html` |
| Process with decision branches | `assets/diagrams/flowchart.html` |
| Cross-team or cross-role process | `assets/diagrams/swimlane.html` |
| Lifecycle / states + transitions | `assets/diagrams/state-machine.html` |
| Time-ordered events / milestones | `assets/diagrams/timeline.html` |
| Hierarchy / depth ≥ 2 | `assets/diagrams/tree.html` |
| Layered architecture / stack | `assets/diagrams/layer-stack.html` |
| 2×2 strategic positioning | `assets/diagrams/quadrant.html` |
| Set overlaps (2–3 groups) | `assets/diagrams/venn.html` |
| Category comparison, no time | `assets/diagrams/bar-chart.html` |
| Series across time | `assets/diagrams/line-chart.html` |
| Sums to ~100%, ≤ 6 items | `assets/diagrams/donut-chart.html` |
| OHLC / stock price history | `assets/diagrams/candlestick.html` |
| + and − bridge to a total | `assets/diagrams/waterfall.html` |
| Quartiles, whiskers, outliers | `assets/diagrams/box-plot.html` |
| Frequency distribution | `assets/diagrams/histogram.html` |
| Multiple stacked distributions | `assets/diagrams/ridgeline.html` |
| Individual observations with density | `assets/diagrams/beeswarm.html` |
| One-dimensional individual observations | `assets/diagrams/dot-strip.html` |
| Before/after rank or share change | `assets/diagrams/slope-chart.html` |
| Current vs target gap by category | `assets/diagrams/dumbbell.html` |
| Ranked values with lightweight stems | `assets/diagrams/lollipop.html` |
| Actual value against target and bands | `assets/diagrams/bullet.html` |
| Mirrored demographic cohorts | `assets/diagrams/population-pyramid.html` |
| Time series with event callouts | `assets/diagrams/annotated-line.html` |
| Relative change from baseline 100 | `assets/diagrams/index-chart.html` |
| Repeated comparable time-series panels | `assets/diagrams/small-multiples.html` |
| Observed trend against expected band | `assets/diagrams/band-chart.html` |
| Changing composition over time | `assets/diagrams/stacked-area.html` |
| Daily intensity over a calendar year | `assets/diagrams/calendar-heatmap.html` |
| Two-category intensity matrix | `assets/diagrams/matrix-heatmap.html` |
| Fixed-count part-to-whole units | `assets/diagrams/waffle.html` |
| Regional intensity on a simple grid | `assets/diagrams/grid-choropleth.html` |
| Hierarchical area share | `assets/diagrams/treemap.html` |
| Flow volumes between stages | `assets/diagrams/sankey.html` |
| Ordered node relationships | `assets/diagrams/arc-diagram.html` |
| Two-variable relationship | `assets/diagrams/scatter.html` |
| Two-variable trajectory over time | `assets/diagrams/connected-scatter.html` |
| Hierarchical composition by depth | `assets/diagrams/icicle.html` |

Read `references/diagrams.md` for the selection guide and focal rule. Read
`references/charts.md` before editing animation or interaction behavior.

## Technical illustrations

Use `assets/illustrations/` when the reader needs to inspect an object,
assembly, mechanism, cross-section, or pipeline topology. These are SVG
exemplars to remix, not data-shape diagrams.

| Visual job | Exemplar |
|---|---|
| Hardware shell / product surface | `assets/illustrations/isometric-device.html` |
| Layered component stack | `assets/illustrations/exploded-assembly.html` |
| Mechanism with dimension/leader lines | `assets/illustrations/annotated-mechanism.html` |
| Cutaway material section | `assets/illustrations/hatched-cross-section.html` |
| Architecture pipeline / module flow | `assets/illustrations/isometric-pipeline.html` |

Read `references/illustrations.md` and `references/svg-style.md` before
drawing. Ordinary diagrams keep one darkest-ink focal element; technical
illustrations use the grayscale `--ill-*` figure ramp. SMIL motion must use
`begin="indefinite"` plus the
`data-vpk-smil-starter` guard.

## Workflow at a glance

```
1. Confirm /vpk-html invocation
2. Extract intent (purpose / audience / constraint / success)
3. Pick template from table above
4. Source + material pass (for branded / fact-heavy docs)
5. Distill raw content (if input is unstructured)
6. Layout note (≤80 words, transparent)
7. Copy template to `output/vpk-html/<slug>/<slug>.html`, fill placeholders
8. Build & verify:
   node scripts/build.mjs --check-placeholders <file>
   node scripts/build.mjs --verify <file>
9. If invoked with `--github`, publish after validation:
   node scripts/build.mjs --github <file> [--repo owner/name]
```

## Filling a template

```bash
# Start a new document
mkdir -p output/vpk-html/<slug>
cp .agents/skills/vpk-html/assets/templates/<doc>.html output/vpk-html/<slug>/<slug>.html

# Edit only the body; CSS stays untouched.
# Replace every {{placeholder}} with real content.

# Validate
node .agents/skills/vpk-html/scripts/build.mjs --check-placeholders output/vpk-html/<slug>/<slug>.html
node .agents/skills/vpk-html/scripts/build.mjs --verify output/vpk-html/<slug>/<slug>.html
```

Keep every generated artifact in its own slug folder. Related PDFs,
screenshots, and review captures stay beside that HTML file or in a nested
`screenshots/` folder when the capture set is large.

## GitHub Pages publish

Use this only when the user invokes `/vpk-html --github` or otherwise asks for
a live hosted page.

```bash
node .agents/skills/vpk-html/scripts/build.mjs --github output/vpk-html/<slug>/<slug>.html [--repo owner/name] [--public|--private]
```

The helper validates the document, copies it to `index.html`, creates
`.nojekyll`, commits only those two files in the artifact folder's nested repo,
pushes to GitHub, enables Pages from `main` + `/`, and prints the Pages URL.
Read `references/github-pages.md` before changing the publish shape.

## Shared theme

```bash
# Check token JSON, root styles.css, and generated HTML are in sync
node .agents/skills/vpk-html/scripts/build.mjs --sync

# After editing references/tokens.json
node .agents/skills/vpk-html/scripts/build.mjs --write-styles

# Refresh committed HTML after shared CSS / presentation / docnav edits
node .agents/skills/vpk-html/scripts/retrofit.mjs

# Regenerate technical illustration sources + gallery demos
node .agents/skills/vpk-html/scripts/build-illustrations.mjs
```

Future templates, demos, and diagrams should import `scripts/shared.mjs` from
their generator scripts instead of copying color maps, color variables, or font
faces into each output path by hand.

## Embedding a diagram

1. Open `.agents/skills/vpk-html/assets/diagrams/<type>.html`.
2. Copy the `<svg>…</svg>` block.
3. Paste inside a `<figure>` element in your filled template:

```html
<figure class="diagram">
  <svg viewBox="0 0 960 460" xmlns="http://www.w3.org/2000/svg">
    <!-- pasted SVG content; replace {{System name}} etc. -->
  </svg>
  <figcaption>One darkest-ink node marks the focal component.</figcaption>
</figure>
```

## Presentation mode

Decks (`section.slide` count >= 2) include a screen-only runtime and preserve
their print/PDF page geometry.

| Key | Action |
|---|---|
| Left / Right | Previous / next whole slide |
| Home / End | First / last slide |
| `p` | Open synced presenter window |

Speaker notes go in `<aside class="speaker-notes" aria-hidden="true">` as the
last child of each slide. They stay hidden in the main window and print/PDF.
Read `references/presentation.md` for presenter sync and recording rules.

For narrated MP4 output, do not use the browser deck runtime. Follow
`references/video-export.md` and re-author the deck into a Hyperframes
general-video composition after user approval.

## Identity

Algebrica editorial / engineering manual: warm paper, near-monochrome ink,
quiet borders, Geist typography, and grayscale figures.

**Light (default):** `--paper`, `--paper-background`, `--ink`, grayscale
`--accent` chrome, `--focal`, sampled `--ill-*` figure tokens, component
chrome, and `--heat0` → `--heat4` resolve from embedded offline tokens.
**Dark** (`<html data-theme="dark">`): the same unprefixed aliases switch to
warm paper-dark fallbacks without importing runtime CSS.

- Fonts: **Geist** for mastheads, slide titles, prose, labels, tables, and ordinary document text; **Geist Mono** for code, metrics, dates, counters, figure/table numbers, chart labels, and technical identifiers.
- Numerals: **Geist Mono Numeric** is embedded with `unicode-range: U+0030-0039` so digits inside Geist text render in Geist Mono.
- Display headings: Geist 400-500, no negative tracking, in `var(--headline)` or `var(--ink)`.
- Body bg: plain `var(--paper-background)` with flat document surfaces, hairline rules, and borders over shadows.
- Type scale: page title 36px / h1 36px / h2 26px / h3 19px / h4-h6 15px / long-form body+p 17px / 23px / labels 13px.
- Prose: `.post-section` content is justified, hyphenated, break-word safe, and separated by 60px padding, a hairline, and 50px margin.
- Breadcrumb/eyebrow: the only uppercase role; Geist Mono 12px / 600 with 2px tracking in muted ink.
- Tables: Geist 12px, collapsed 1px `--rule` cells, `8px 12px` centered padding, `--table-header` header wash, no radius/zebra/hover.
- Links: no visible default underline. Content links animate a 4px-offset underline in on hover/focus; chrome links never underline and shift only opacity or muted/ink color. Focus rings use ink.
- Figures: one `var(--focal)` element at `stroke-width="2"`; supporting series use grayscale tone, dash, marker, and layering. No hue in generated SVGs.
- Components: use bordered list-table cards, vote chips, tinted code cards, grayscale pill buttons, centered section heads, steps lists, and the warm heatmap ramp.
- Deck rule: `<hr class="ascii">` for a quiet dotted separator.
- Dotted divider: `<hr>` styled via radial-gradient row of 1px dots.
- `long-doc.html` only: `.spread` two-column primitive (prose left ~42%, figure right ~58%) with vertical `.gutter-tag` for FIG_NN labels.

**Bans:** no `border-left/right > 1px` colored side stripes; no raw color
literals in authored/generated surfaces; no gradients, filters, `--accent*`,
or `--link*` inside generated SVGs. Use `data-vpk-external-asset` only for
user-supplied logos/screenshots.

**Activate dark mode in any rendered doc:**
```js
document.documentElement.setAttribute('data-theme', 'dark');
```

## Reference reading order

1. `references/anti-patterns.md` (before drafting any document)
2. `references/writing.md` (for prose rules)
3. Template-specific: `references/resume-writing.md` for resumes,
   `references/diagrams.md` for diagrams,
   `references/illustrations.md` for technical illustrations,
   `references/svg-style.md` for SVG grammar,
   `references/presentation.md` for decks
4. `references/design.md` (only if touching CSS, tokens, or motion)
5. `references/video-export.md` (only for user-approved MP4 conversion)
6. `references/quality-gates.md` (when running advisory polish gates)
7. `references/production.md` (only when troubleshooting)
