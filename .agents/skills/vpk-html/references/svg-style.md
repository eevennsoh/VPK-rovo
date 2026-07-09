# SVG Style

This is the required figure grammar for generated vpk-html SVGs. It applies to
diagrams, charts, and technical illustrations unless the SVG is a user-supplied
external asset.

## Palette

Use tokens only. Raw hex, rgb, hsl, and named decorative colors are rejected in
figure paint attributes because they cannot invert under `data-theme="dark"`.

| Figure role | Token | Faithful light value |
|---|---|---|
| Focal element | `--focal` | `#000000` |
| Primary linework | `--ill-line` | `#333333` |
| Secondary label | `--ill-ink50` | `#636363` |
| Guide / axis | `--ill-guide` | `#bababa` |
| Dashed guide | `--ill-guide-dashed` | `#d3d3d3` |
| Frame | `--ill-frame` | `#c9c9c9` |
| Primary fill | `--ill-fill` / `--ill-tone2` | `#eaeaea` |
| Alternate fill | `--ill-fill-alt` / `--ill-tone1` | `#f6f6f6` |
| Deep tone | `--ill-tone3` | `#d3d3d3` |

Allowed color values in SVG paint/style fields:

- `none`, `transparent`, `currentColor`, `inherit`
- `var(--allowed-figure-token)`
- `color-mix(in srgb, var(--allowed-figure-token) N%, transparent)`

Forbidden in SVGs:

- raw hex, rgb, rgba, hsl, hsla
- `var(--accent*)`
- `var(--link*)`
- gradients, filters, blur, glow, drop shadows

## Focal Rule

One element may be the darkest-ink focal element:

```html
<path d="..." stroke="var(--focal)" stroke-width="2" />
```

Everything else should use `--ill-line`, `--ill-ink50`, `--ill-tone*`, or rule
tokens. Use `--ill-guide`, `--ill-guide-dashed`, `--ill-frame`,
`--ill-fill`, and `--ill-fill-alt` when the sampled Algebrica figure roles are
more precise. If the figure needs multiple focal elements, split the figure.

## Multi-Series Without Hue

Use tone, dash, marker, and layering:

- solid `--focal` for the single focal series
- `--ill-line` / `--ill-ink50` / `--rule-strong` for supporting series
- `stroke-dasharray="4"` or `stroke-dasharray="8 6"` for alternates
- circles, squares, triangles, or hollow points for markers
- direct labels beside each line or bar when possible
- heatmap or intensity charts use `--heat0` through `--heat4`

For animated or interactive charts, follow `references/charts.md`. Keyframe
classes, transforms, CSS custom properties such as `--vpk-draw-length`,
`data-*` hooks, ARIA attributes, and inline `data-vpk-chart-runtime` scripts
are allowed when the SVG still renders complete without JavaScript and every
paint value remains token-safe.

## Line Grammar

- SVG root: `fill="none"`
- Stroke width: numeric 0.5-2.5
- Usual linework: 1-2px
- Focal stroke: 2px
- Line caps and joins: round when the geometry benefits from it
- Frames: rounded rects are allowed, `rx <= 9`
- Arrowheads: filled triangles, not open chevrons
- Construction lines: `stroke-dasharray="4"` or similar short dashes

## Figure Text

SVG text uses Geist Mono. Typical label size is 11-13px; tighter diagrams may
drop below that only when the label remains legible. Secondary labels use
`var(--ill-ink50)`. Avoid long single-line labels in fixed boxes; wrap text
into multiple `<text>` lines or widen the node.

## Dark Parity

Dark mode works only when figures route all paint through tokens. Raw grayscale
is not an exception. The lint rejects raw `#000000`, `#333333`, `#636363`,
`#bababa`, `#d3d3d3`, `#c9c9c9`, `#eaeaea`, `#f6f6f6`, and every other fixed
color inside generated SVGs.

## Status Quarantine

Status tokens are allowed only when the figure communicates a real semantic
state: success, warning, danger, or neutral information. They are not chart
series colors and not decoration. Human-review or approval-gate states default
to warning/yellow semantics, not danger/red semantics, unless the node means an
actual failure.

## External Asset Opt-Out

User-supplied logos, screenshots, or third-party SVGs can opt out:

```html
<svg data-vpk-external-asset aria-label="Partner logo">...</svg>
```

Use this only for externally supplied assets. Generated vpk-html diagrams and
illustrations must not use the opt-out.

## Lint Rules

`scripts/check-html.mjs` hard-fails generated SVGs when:

- fill, stroke, stop-color, or style color is not token-safe
- gradients, filters, or drop shadows appear
- SVG `font-family` does not resolve to Geist Mono
- numeric `stroke-width` is outside 0.5-2.5
- `--accent*` or `--link*` appears inside SVG paint/style

The lint does not reject chart keyframes, transforms, `data-*` attributes,
ARIA attributes, or inline progressive-enhancement scripts by themselves.

`scripts/build.mjs --check-templates` runs the same SVG grammar lint across all
templates.
