# Technical Illustrations

vpk-html has two SVG families:

- **Diagram primitives** in `assets/diagrams/`: keep the one-primary-blue focal
  rule.
- **Technical illustrations** in `assets/illustrations/`: may use the full
  ADS blue ramp through the `--ill-*` tokens for linework, faces, hatching,
  and labels.

Use a technical illustration when the reader needs to inspect object structure,
assembly, mechanism, pipeline topology, or cross-section detail. Use a diagram
when the reader needs a data shape, flow, hierarchy, timeline, or system map.

## Tokens

| Role | Token |
|---|---|
| Darkest linework | `--ill-line` |
| Light face | `--ill-tone1` |
| Mid face | `--ill-tone2` |
| Deep face | `--ill-tone3` |
| Hatching | `--ill-hatch` |
| 50 percent label ink | `--ill-ink50` |

These tokens are generated from `references/tokens.json` into `styles.css` and
into every committed template/demo through the shared CSS generator.

## Recipe

- SVGs are inline and use `fill="none"` at the root.
- Outlines are uniform 1px strokes in `var(--ill-line)`.
- Face shading uses flat two- or three-tone fills; do not use gradients.
- Isometric faces are built from parallelogram paths.
- Hatching is a bundle of repeated parallel strokes using `var(--ill-hatch)`.
- Dimension lines use `stroke-dasharray="24 6"` and filled triangle arrowheads.
- Leader lines can curl into their target; labels use uppercase Atlassian Mono
  around 10px with `var(--ill-ink50)`.
- Figure frames can use a dotted 3x3 or 9x9 tile at low opacity through
  `color-mix(... var(--ill-hatch) ...)`.

## Motion Policy

SMIL is allowed only for technical illustrations and only when it is safe for
PDF and reduced-motion users:

- every `animateTransform` uses `begin="indefinite"`
- every animated illustration includes a `<script data-vpk-smil-starter>`
- the starter checks `prefers-reduced-motion: reduce` and does nothing when
  reduction is requested
- static/PDF output always lands on the assembled pose

`scripts/check-html.mjs` enforces this contract.

## Exemplars

Run:

```bash
node .agents/skills/vpk-html/scripts/build-illustrations.mjs
```

This generates source exemplars in `assets/illustrations/` and matching gallery
demos in `assets/demos/demo-illustration-*.html`:

- `isometric-device`
- `exploded-assembly`
- `annotated-mechanism`
- `hatched-cross-section`
- `isometric-pipeline`
