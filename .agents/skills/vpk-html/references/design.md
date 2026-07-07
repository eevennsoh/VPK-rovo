# vpk-html Design System

The visual system is a portable editorial manual. It is type-led, technical,
slightly raw, and suitable for long-form explanations as well as compact
business documents.

## Fonts

Generated HTML declares these families and embeds local OTF/TTF files as data
URIs:

- Display: `Charlie Display`
- Body: `Charlie Text`
- Mono: `Atlassian Mono`
- Numeric: `Atlassian Mono Numeric`, sourced from Atlassian Mono with `unicode-range: U+0030-0039`

System fallbacks remain in the CSS so the file is readable even if a browser
declines a font face.

## Tokens

Tokens are authored once in `references/tokens.json` and mirrored in root
`styles.css`, matching Kami's top-level stylesheet shape. The renderer embeds the resolved theme block in every
HTML document instead of letting individual templates own hard-coded palettes.

Token groups cover paper/background, headline/body ink, muted text, primary
blue, collection accents, chart/diagram accents, technical-illustration ramp
tokens (`--ill-*`), grid dots/lines, rule, raised surfaces, focus ring, code
surface, math highlight, motion tokens, and success/warning/danger/info accents
for light and dark modes.

## Dark Mode

Every rendered document includes `color-scheme: light dark`, initializes from
`prefers-color-scheme`, renders a visible toggle when `theme.allowToggle` is
true, persists only that user override in `localStorage`, and respects
`prefers-reduced-motion`. Light and dark must reach **parity** — every token
group in `references/tokens.json` defines both a `light` and a `dark` value, so
no surface is left unstyled in either mode.

## Operative rules

These are the load-bearing visual rules for every generated document. Values
live in `references/tokens.json`; this section names *how* to apply them. (For
*content* quality — emptiness, fabrication, tone — see
`references/anti-patterns.md`.)

### Type hierarchy

Hierarchy comes from **family, weight, and position — not size inflation**.
Headlines use `Charlie Display`, body uses `Charlie Text`, code/figures use
`Atlassian Mono`. Keep the type scale collapsed: separate a heading from body by
switching family and weight before reaching for a larger font-size. Avoid
overlines/eyebrows and decorative all-caps labels.

### Case

Headings and UI labels are **title case** (sentence-case body). No SCREAMING
CAPS headings; small-caps/letter-spacing tricks are not a substitute for real
hierarchy.

### Spacing rhythm

Spacing follows an 8px-based rhythm (4px for tight inline gaps). Vertical
rhythm between sections should be consistent across a document — uneven gaps
read as accidental. Prefer one generous, repeated spacing step over many
bespoke margins.

### Borders & elevation — flat editorial surface

The surface is **flat**. Banned outright (enforced by
`scripts/build.mjs --check-templates` and `references/anti-patterns.md`):

- No `border-left`/`border-top` accent **side-stripes** on sections, cards,
  callouts, or figures.
- No rounded-corner frames or `box-shadow` chrome on content blocks.

Separation is achieved with whitespace, a single hairline `rule` token, or a
`surfaceSunken`/`surfaceRaised` token shift — never a decorative frame. The one
sanctioned elevation is the opt-in raised-surface `shadow` token; use it
sparingly and only where a true overlay plane exists.

### Color discipline

Use the semantic alias layer (`--paper`, `--ink`, `--primary-blue`,
`--accent-*`, `--success`/`--warning`/`--danger`/`--info`) — never raw hex in a
template. Accent ramps are **decoration only**; semantic role colors
(success/warning/danger/info) carry meaning and must not be used for mere
decoration. In a diagram, one focal node gets the accent; demote the rest.

Technical illustrations are the exception to the one-blue diagram rule. SVGs
marked `data-vpk-illustration` may use the full `--ill-line`, `--ill-tone1`,
`--ill-tone2`, `--ill-tone3`, `--ill-hatch`, and `--ill-ink50` ramp for object
faces, hatching, labels, and dimension lines. They still stay flat: no
gradients, blur, glow, or decorative color outside the ADS blue ramp.

### Motion discipline

Shared motion comes from `scripts/shared.mjs`, not per-template timing tweaks.
Use `--ease-out`, `--ease-in-out`, and the `--vpk-dur-*` tokens. Do not use
bare `ease-in`; entrance and slide motion should stay at or under 300ms unless
the advisory `motion-budget` gate is intentionally waived. Print CSS must
neutralize animation/transition/transform, and reduced-motion must remove
movement while preserving readable opacity changes.

### Presentation layer

Deck screen behavior is additive. Presentation CSS and JS live behind
`@media screen` and `data-vpk-presentation-runtime`; print/PDF geometry remains
the template source of truth. Speaker notes are hidden in the main deck and
print output, then read only by the presenter window.
