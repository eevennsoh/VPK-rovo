# Editorial Patterns

This reference distills the editorial research pass into reusable document-pattern
decisions for vpk-html. Use it when choosing or adapting one of the editorial
document templates added in WP5.

## Pattern Reference

| Pattern | When to use | Concrete CSS moves | Templates using it |
|---|---|---|---|
| Gallery Ledger | Use for report indexes, colophons, and compact rows where the reader compares names, sections, and page-like references. | Single-column or narrow multi-column rows; `border-top: 1px solid var(--rule-strong)` for group starts; row padding on the 8px rhythm; weight contrast between row title and metadata. | Annual Report / Brand Book |
| Focused Measure | Use for essays, interviews, and any prose-led document where the argument should stay readable on screen and print. | Keep prose at `60-75ch`; use 17px body text with generous line-height; put small-caps labels in Geist Mono with 2px tracking; avoid wide card grids for body copy. | Interview / Q&A Feature, Long-Form Feature Essay |
| Six-Column Broadsheet | Use for front pages, index pages, issue openers, and scanning-heavy editorial summaries. | `display: grid; grid-template-columns: repeat(6, minmax(0, 1fr));`; let lead stories span 4-5 columns; use rules as dividers; keep teaser strips compact. | Broadsheet Front Page / Index |
| Identity Display Reuse | Use when a document needs a strong editorial identity without adding fonts or logos. | Reuse one display role across nameplate, folios, bylines, and department heads; vary scale and spacing instead of switching faces. | Broadsheet Front Page / Index, Interview / Q&A Feature, Long-Form Feature Essay |
| Sticky Stat Moment | Use only when one number should remain visible while a nearby essay section explains it. | `position: sticky; top: 28px;` on a narrow sidebar; no parallax, no reveal scripting, no image stage; print collapses to ordinary flow. | Long-Form Feature Essay |
| Swiss Baseline Ledger | Use for annual reports and brand books where adjacent columns must read as one system. | Define one rhythm variable, usually `--rhythm: 16px`; line-height and padding are multiples of it; tabular numerals anchor year and section labels; use one rule weight. | Annual Report / Brand Book |
| Wood-Type Cover Scale | Use for lookbooks or gallery sections that need a cover/opening title but no photography. | Reserve huge uppercase display type for covers and section openers; use Geist weight, size, and positive tracking; do not apply the treatment to ordinary headings. | Lookbook / Gallery Portfolio |
| Broadsheet Index Strip | Use when a page needs a front-door table of contents before the main story grid. | Place compact rows above the story grid; include folios on one edge; keep each teaser to one headline and one small numeric marker. | Broadsheet Front Page / Index |
| Annual Year Numeral | Use when a report needs one memorable numeric anchor. | Set year or section numerals in `var(--font-numeric)` with tabular figures; let them occupy a full column; keep surrounding copy restrained. | Annual Report / Brand Book |
| Alternating Block Q&A | Use for interviews where question and answer rhythm matters more than pull quotes. | Q label is small-caps/bold and flush; A body gets an indent or 1px gutter rule; margin column carries question numbers or speaker initials. | Interview / Q&A Feature |
| Full-Bleed Caption Grid | Use for lookbooks when the page needs plates but no external imagery is available. | Use token-only SVG plates as full-width figures; pair each plate with a 30-60 word caption; use a three-column uppercase plate index. | Lookbook / Gallery Portfolio |
| Modular Text-as-Nav | Use when portfolio rows should act as both navigation and project summary. | Rows contain number, project name, and one-line description; every row links to a section; asymmetric rhythm comes from row padding and section plate height, not decorative cards. | Lookbook / Gallery Portfolio |

## Guardrails

- Keep the Algebrica identity: paper, ink, hairlines, no shadows, no external assets.
- Use shared tokens and `scripts/shared.mjs` for fonts and theme CSS.
- Use SVG plates only with the grayscale `--ill-*` ramp and Geist Mono labels.
- Do not import new display fonts. Condensed or wood-type effects must come from Geist scale, weight, casing, and positive tracking.
- Speaker notes belong in hidden `<aside class="speaker-notes" aria-hidden="true">` elements when they help future deck or presenter reuse.
- Broadsheet pages can remain non-docnav. Annual reports, interviews, lookbooks, and essays generally benefit from `data-vpk-docnav="true"` because section-stepped reading matches their structure.
