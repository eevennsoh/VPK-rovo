# Technical Illustrations

vpk-html has two SVG families:

- **Diagram primitives** in `assets/diagrams/`: data shapes with one
  `--focal` element.
- **Technical illustrations** in `assets/illustrations/`: object, mechanism,
  assembly, cross-section, and pipeline figures using the grayscale `--ill-*`
  ramp.

Use a technical illustration when the reader needs to inspect structure or
mechanics. Use a diagram when the reader needs a data shape, flow, hierarchy,
timeline, or system map.

Read `references/svg-style.md` before drawing or modifying any SVG.

## Grayscale Ramp

| Role | Token | Faithful light value |
|---|---|---|
| Darkest linework | `--ill-line` | `#333333` |
| Secondary label ink | `--ill-ink50` | `#636363` |
| Guide / axis | `--ill-guide` | `#bababa` |
| Dashed guide | `--ill-guide-dashed` | `#d3d3d3` |
| Frame | `--ill-frame` | `#c9c9c9` |
| Light face | `--ill-fill-alt`, `--ill-tone1` | `#f6f6f6` |
| Mid face | `--ill-fill`, `--ill-tone2` | `#eaeaea` |
| Construction / hatch line | `--ill-hatch` | `#bababa` |
| Focal stroke/fill | `--focal` | `#000000` |

Use tokens, not raw hex. Raw grayscale literals fail the SVG lint because they
cannot invert under `data-theme="dark"`.

## Recipe

- SVG roots use `fill="none"`.
- Outlines are 1-2px strokes, usually `var(--ill-line)`.
- One focal construction path may use `var(--focal)` at stroke-width 2.
- Face shading uses flat two- or three-tone fills; never gradients.
- Isometric faces are built from parallelogram paths.
- Hatching is repeated parallel strokes using `var(--ill-hatch)`.
- Dimension lines use `var(--ill-guide)` / `var(--ill-guide-dashed)` and filled triangle arrowheads.
- Leader lines can curl into their target.
- Labels use Geist Mono around 11-13px when space allows and
  `var(--ill-ink50)` for secondary text.
- Frames use hairline `--ill-frame` borders and `rx <= 9`.

Do not use shadows, blur, glow, gradients, `filter`, or hue as decoration.
Status colors are allowed only when the figure is explicitly communicating a
status state.

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
