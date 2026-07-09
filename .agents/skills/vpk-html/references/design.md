# vpk-html Design System

The visual system is the Algebrica editorial identity: warm paper, black-ink
typography, quiet rules, and figures that look like media-library line art
rather than product UI chrome. It is built for technical briefs, strategy
decks, reports, and code explanations that need to feel printed and precise.

## Fonts

Generated HTML embeds local OFL font files as data URIs:

- Display and body: `Geist`
- Mono: `Geist Mono`
- Numeric: `Geist Mono Numeric`, sourced from Geist Mono with
  `unicode-range: U+0030-0039`
SVG text must use Geist Mono. Do not put the body face inside figures.

## Tokens

Tokens are authored once in `references/tokens.json` and mirrored in root
`styles.css`. The renderer embeds the resolved theme block in every HTML
document; individual templates do not own independent palettes.

The core groups are paper/background, ink, muted ink, rules, raised/sunken
surfaces, grayscale `--accent` chrome, `--focal` figure emphasis, the sampled
Algebrica `--ill-*` figure ramp, table header wash, pill/search/chip chrome,
warm heatmap ramp, tinted code cards, and muted success/warning/danger status
tokens. Values are plain offline colors, not `var(--ds-*)` wrappers.

## Dark Mode

Every rendered document includes `color-scheme: light dark` and a full
`[data-theme="dark"]` token block. Dark mode is warm paper-dark
(`#171614`-biased), never cold gray. Figure colors must route through tokens so
SVGs invert correctly under `data-theme="dark"`.

## Operative Rules

### Type Hierarchy

Hierarchy comes from position, measure, weight, and whitespace. Display
headings use Geist at weight 400-500; do not use 600+ for page titles. Body
copy is 17px / 23px in long-form prose. Long-form `.post-section` content is
justified, hyphenated, and break-word safe, with 25px paragraph spacing and the
Algebrica section rhythm: 60px bottom padding, a `--rule-strong` hairline, and
50px margin before the next section. Use a 42rem reading measure for document
prose unless the template has a specific page or deck geometry.

### Case

Use normal case and direct technical labels. The single uppercase role is the
breadcrumb/eyebrow: Geist Mono, 12px, weight 600, 2px letter-spacing, muted ink,
and `text-transform: uppercase`. Metadata, figure tags, counters, and route
labels are 13px muted Geist; use Geist Mono only when the label is a number,
file name, date, or technical identifier.

### Spacing Rhythm

Spacing follows an 8px rhythm except where Algebrica components define fixed
rhythm: post sections use 60px / 50px separation, tables and figures end with
30px margin, bordered list-table cards start 40px below their centered section
head, and centered section heads use a 500px measure. Screen-first long docs
should leave enough air around anchor jumps to feel intentional.

### Borders And Elevation

The surface is flat. Separate content with whitespace, hairline borders, and
subtle `--surface-sunken` or `--surface-raised` shifts. Prefer borders over
shadows. Generic cards and callouts may use a 1px ink/rule border and radius no
larger than 6px; the Algebrica bordered list-table card is the explicit 12px
radius exception. Hard shadows are not part of the default identity.

Side stripes remain banned: no `border-left` or `border-right` greater than 1px
as a colored accent on cards, list items, callouts, or alerts.

### Color Discipline

Use semantic aliases, never raw color literals in authored or generated
surfaces. Links never show a default underline. Content links (prose links,
table-of-contents rows, index/list-row titles) use `text-decoration-line:
underline` with transparent decoration that transitions to ink on hover/focus
over about 180ms and keeps a 4px underline offset. Chrome links (sidebar nav,
header/meta, footer links, breadcrumbs, and docnav controls) never underline;
they shift opacity or muted/ink color on hover. Focus-visible states keep the
ink focus ring and do not rely on hover-only affordance. `--accent` resolves to
ink, while `--accent-soft` and
`--accent-soft-strong` are warm gray washes for pill controls, selection, and
key-insight emphasis.

There is no hue accent in the built-in identity. Figure emphasis uses `--focal`
plus stroke-width 2-2.5. Series are distinguished by tone, dash, and markers,
not hue. Heatmap and intensity charts use the official warm ramp
`--heat0` -> `--heat4`.

Status colors are meaning-bearing only. Success is grayscale; warning and
danger keep their semantic tints and dark variants. Do not use them as
decoration.

### Figure Grammar

All generated SVGs follow `references/svg-style.md`: token-only grayscale
fills/strokes, no gradients, no filters, Geist Mono labels, numeric
stroke-widths from 0.5 to 2.5, and no `--accent*` or `--link*` tokens. User
logos/screenshots can opt out with `data-vpk-external-asset` on the SVG root.

Tables follow the Algebrica article treatment: Geist 12px, collapsed borders,
all cells `1px solid var(--rule)`, `8px 12px` centered padding, `th` weight
500, `--table-header` header wash, no radius, no zebra striping, and no hover
row treatment.

### Motion Discipline

Shared motion comes from `scripts/shared.mjs`, not per-template timing tweaks.
Use `--ease-out`, `--ease-in-out`, and the `--vpk-dur-*` tokens. Entrance and
micro-interaction motion should sit around 140ms unless a document-specific
runtime has a reason to go slower. Print CSS neutralizes motion, and
reduced-motion removes movement while preserving legibility.

Chart motion uses the shared `.vpk-chart-*` utilities only: draw strokes with
`--vpk-draw-length`, grow bars/areas with transform-based scale, reveal points
with `--vpk-stagger-index`, and reserve the focal pulse for a single focal
value. Charts must render complete static SVGs when JavaScript is disabled and
must snap to their final state under reduced motion. See `references/charts.md`
before adding chart templates.

### Presentation Layer

Deck screen behavior is additive. Presentation CSS and JS live behind
`@media screen` and `data-vpk-presentation-runtime`; print/PDF geometry remains
the template source of truth. Speaker notes are hidden in the main deck and
print output, then read only by the presenter window.
