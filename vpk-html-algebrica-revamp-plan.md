# vpk-html identity revamp: Atlassian → Algebrica (editorial grayscale + Geist)

## Context

The `/vpk-html` skill (`.agents/skills/vpk-html/`) currently renders offline single-file HTML artifacts in an Atlassian deck identity — Charlie Display/Text + Atlassian Mono embedded as data URIs, ADS blue accent, `var(--ds-*)` token fallbacks. The user wants the styling completely revamped to match **algebrica.org**: editorial, print-like, warm paper, near-monochrome, typography-led — and wants a **machine-enforced guarantee** that every generated SVG (diagrams, charts, illustrations) matches the algebrica media-library figure language.

Ground truth gathered: the user's extracted `design.md` (Dia agent context) for page styling, plus direct sampling of 17 of the 251 real SVGs in github.com/antoniolupetti/algebrica. Real figure conventions: ink `#333333`, secondary labels `#636363` at 11–13px normal weight, construction lines `#BABABA` (often `stroke-dasharray="4"`), fills `#E6E6E6`/`#EAEAEA`, arrows `#979797`, frames `#C9C9C9` rounded-rect, stroke widths 1–2, round linecaps, root `fill="none"`, **zero hue anywhere**. Algebrica's own SVG labels use Geist.

## Decisions locked with the user

1. **SVGs: faithful grayscale.** Focal rule becomes "one darkest-ink element" (`var(--focal)` + `stroke-width="2"`). Multi-series charts distinguish by tone ramp + dash patterns + point markers — never hue.
2. **Fonts: Geist / Geist Mono / Geist Pixel** (all OFL), embedded via the existing data-URI pipeline. **All-Geist roles:** Geist Sans headings + body; Geist Mono for code/numerals/figure labels/metadata; Geist Pixel as rare display garnish only (never inside SVGs).
3. **Dark mode: keep full parity** with a warm "paper-dark" theme (paper `#171614`, ink `#e8e6e0` — warm bias, never cold gray).
4. **Status colors: muted trio kept** (success `#2f6f4f`, warning `#8a6d1a`, danger `#8c3a32` + tints + dark variants), semantic use only.
5. **SVG lint: hard fail** in `check-html.mjs`, with `data-vpk-external-asset` opt-out for user-supplied logos/screenshots.
6. **Accent: muted green `#2f6f4f`**, page chrome only (link hover, focus ring, active nav, key-insight wash). Links default to ink + underline. Accent never enters figures.
7. **Scope: everything in one pass** — tokens, styles.css, all 28 templates, 14 diagrams, 5 illustrations, all demos (~76MB regenerated), landing shells, catalog index.html, all references, SKILL.md. Old and new identities must never coexist.

## Verified constraints (shape the implementation)

- **Kami upstream (`~/.agents/skills/kami`) has no assets** — `port-kami.mjs` cannot rerun. The 8 kami templates, 14 diagrams, 4 curated demos, and `index.html` must be migrated **in place** via a new deterministic migration script.
- **`retrofit.mjs` refreshes only the shared `:root`/dark/motion block**, not `@font-face` blocks — migration must swap font-face regions too.
- **All committed figure SVGs already use `var(--…)` exclusively** — dark inversion keeps working by re-pointing token values.
- **`build.mjs` currently BANS Geist** (`legacyFontFamilyPattern`, `vercel.com/font`) as pre-Atlassian leakage — invert to ban Charlie/Atlassian/ADS-blue instead.
- **`check-html.mjs` raw-color exemption keys on `var(--ds-…, #hex)`** (lines 43–44) — dropping ADS wrappers from tokens.json requires redesigning this exemption in the same change.
- **`gates.mjs --check-focal` counts `var(--primary-blue)`** (line 132) and `checks-thresholds.json` `maxPrimaryBlueElements` — rename to focal.
- Repo CI does not run vpk-html tests or size-gate its assets; the huge diff is safe, but run `node --test` on the skill's own tests.

## New tokens (`references/tokens.json`)

Drop `var(--ds-*, …)` wrappers → plain values (offline files never resolve them). Keep key names except three renames + one addition:

- `primaryBlue` → **`accent`** (`#2f6f4f` / dark `#5a9e7c`), `primaryBlueTint` → **`accentSoft`** (`rgba(47,111,79,0.08)`), `primaryBlueTintStrong` → **`accentSoftStrong`**; new **`focal`** = ink (`#1a1a1a` / `#e8e6e0`) for figure focal elements.
- Surfaces: `paperBackground #faf9f6` (warm reading paper) / dark `#171614`; `paper`/`surfaceRaised` `#ffffff` / dark `#1f1e1b`–`#211f1c`; `surfaceSunken #f0efe9` / `#121110`.
- Ink: `headline`/`ink`/`bodyText` `#1a1a1a` / `#e8e6e0`; `mutedText #4a4a4a`; `subtlestText #8a8a8a`. Never `#000` / pure-white reading bg.
- Rules: `rule #e6e4de`, `ruleStrong #d0cdc4` (+ warm-dark equivalents).
- `illLine/illTone1-3/illHatch/illInk50` become the **grayscale figure ramp** (`#333333`, `#eaeaea`, `#dddbd4`, `#c9c7bf`, `#bababa`, `#636363` + dark inversions), same keys.
- `link` = ink; `linkPressed`/`focusRing`/`selected` = accent/accent-soft.
- `accentLime…accentRed` + `collection*` keys kept but re-pointed to grayscale/status values (documented deprecated-for-decoration); `info` demoted to neutral gray; `mathHighlight`/`codeSurface` → warm gray washes; `shadow` → none/hairline (borders over shadows).
- Status trio per decision 4.

Update `TOKEN_ORDER`, `pushThemeAliases` (`--brand/--accent` → accent; add `--font-pixel`), and motion durations (~140ms transitions; keep `--vpk-dur-enter` literal in sync with build.mjs's grep).

## Implementation sequence

### Phase A — foundations
1. **Fonts**: add `Geist[wght].woff2`, `GeistMono[wght].woff2`, one Geist Pixel face + `OFL.txt` to `assets/fonts/`; delete all Charlie/Atlassian files. Source: github.com/vercel/geist releases (fallback google/fonts `ofl/geist*`). Update `ensure-fonts.mjs` SOURCE_NOTES → regen MANIFEST.
2. **`scripts/shared.mjs`**: FONT_STACKS (all-Geist + `pixel`), FONT_FILES (variable weight `"100 900"`; `Geist Mono Numeric` reuses the mono file with `unicode-range: U+0030-0039`; drop italics — Geist has none, synthetic oblique is fine), delete `semanticWithFallback`, emit plain token values, new TOKEN_ORDER.
3. **`scripts/check-html.mjs`**: replace the `--ds-` exemption (token-declaration allowlist derived from `loadTokens()` + keep only `var(--ds-brand-override, #hex)` for the brand-profile mechanism) and add **`collectSvgGrammarIssues`** — the hard-fail SVG lint:
   - Rule 1 palette: every fill/stroke/stop-color/style color must be `none|transparent|currentColor|inherit`, `var(--allowed-figure-token)`, `color-mix` of one, or raw hex from the fixed algebrica grayscale set.
   - Rule 2: no `<linearGradient>/<radialGradient>/<filter>/feDropShadow/filter=/drop-shadow(`.
   - Rule 3: `font-family` inside SVG must resolve to Geist Mono (`Geist Pixel` and body `Geist` rejected).
   - Rule 4: `stroke-width` numeric within 0.5–2.5.
   - Rule 5: `var(--accent*)`/`var(--link*)` forbidden inside SVG.
   - Opt-out: `data-vpk-external-asset` on the SVG root. Cap 12 findings/file. Unit tests in `build.test.js`.
4. **`scripts/build.mjs`**: invert legacy bans (unban Geist; ban `Charlie Display|Text`, `Atlassian Mono`, `#0c66e4`, `#579dff`, `#0055cc`, `#e9f2ff`, `--primary-blue`); `REQUIRED_FONT_FACES` + Playwright `verify()` families → Geist set; wire SVG lint into `--check-templates`.
5. **`scripts/gates.mjs` + `references/checks-thresholds.json`**: focal gate matches `var(--focal)`; threshold key → `maxFocalElements`.
6. **`scripts/kami-color-map.mjs`**: re-point blue/brand targets to `var(--focal)`/tones so a future re-port can't resurrect blue.
7. Run `node scripts/ensure-fonts.mjs` then `node scripts/build.mjs --write-styles` (regenerates `styles.css`).

### Phase B — regenerate/migrate committed HTML (order matters)
8. Update generator scripts' identity CSS: `port-engineering.mjs`, `port-engineering-demos.mjs` (alias blocks → accent/focal, flat borders, radius ≤6px, 42rem measure, 18px/1.75 body, weight-600 headings), `build-demos.mjs` (`inlineDemoSvg` → grayscale grammar), `build-illustrations.mjs`, `landing.mjs` (ink links + accent hover, optional Geist Pixel eyebrow garnish), `presentation.mjs` if it carries identity colors.
9. **New `scripts/migrate-identity.mjs`** (idempotent; for the 8 kami templates, 14 diagrams, 4 curated demos, `index.html`): swap legacy `@font-face` regions with `buildFontFaceBlock()` output; reuse exported `refreshSharedCss` from `retrofit.mjs`; context-split literal map — inside `<svg>`: `--primary-blue`→`--focal`, tints→`--ill-tone1/2`; elsewhere: `--primary-blue`→`--accent`; font strings longest-first (`Charlie Display/Text`→`Geist`, `Atlassian Mono Numeric`→`Geist Mono Numeric`, `Atlassian Mono`→`Geist Mono`); then rewrite the known chrome override blocks (eyebrow/fig-tag/link/strong) to ink-led identity.
10. Run in order: `port-engineering.mjs` → `migrate-identity.mjs` → `retrofit.mjs` → `build-demos.mjs` → `port-engineering-demos.mjs` → `build-illustrations.mjs` → `landing.mjs`.

### Phase C — docs
11. Rewrite `references/design.md` (algebrica identity: warm paper, quiet weight-600 headings, 42rem measure, 1.75 leading, hairline rules, borders-over-shadows, accent-as-garnish), `references/diagrams.md` (darkest-ink focal rule, grayscale token map, series-by-tone/dash/marker), `references/illustrations.md` (grayscale ramp), `references/brand-profile.md` (brand hue lands on `--accent` chrome only), `references/quality-gates.md` (focal wording).
12. **New `references/svg-style.md`** — the figure grammar: palette table (token ↔ faithful hex), focal rule, multi-series-without-hue recipes, line grammar (linecap round, widths 1–2, `rx≤9` frames, root `fill="none"`), figure text (Geist Mono 11–13px, `var(--ill-ink50)`), dark parity (tokens not raw hex), status-color quarantine, opt-out attribute, lint rule list.
13. Update `SKILL.md` Identity section (fonts, type scale 18px/1.75 body + weight-600 headings, accent rules, link style; add svg-style.md to references table), plus `CHEATSHEET.md`, `README.md`, `llms.txt` identity phrases.

## Verification

```bash
node .agents/skills/vpk-html/scripts/build.mjs --sync            # tokens ↔ styles.css ↔ committed HTML
node .agents/skills/vpk-html/scripts/build.mjs --check-templates # identity + SVG lint, all 28 templates
node .agents/skills/vpk-html/scripts/build.mjs                   # Playwright render + Geist font-load verify
node .agents/skills/vpk-html/scripts/check-html.mjs <all demos/diagrams/illustrations/index.html>
node --test .agents/skills/vpk-html/scripts/build.test.js .agents/skills/vpk-html/scripts/landing-links.test.js
pnpm run validate:skills && pnpm run verify:root-artifacts
```

Acceptance demo: fill `long-doc.html` with a 2-series bar/line chart (tone + dash differentiation), run `check-html` + `--check-focal --strict`, screenshot 1280px light **and** `data-theme="dark"` — warm paper both ways, grayscale figures, ink links with green hover, Geist everywhere. Negative tests: inject `#0c66e4` fill, a gradient, and `font-family="Charlie Text"` into a scratch file → three distinct hard failures; add `data-vpk-external-asset` → passes. Migration idempotency: run `migrate-identity.mjs` twice → byte-identical.

## Risks

- The `--ds-` exemption redesign and token de-wrapping must land together or every file fails lint.
- Half-migrated states trip gates in both directions (by design — identities can't coexist); Phases A+B land as one change.
- Geist ships no italics (synthetic oblique; check resume/letter rendering).
- Tone-ramp contrast ordering must hold in both themes — verify visually on `layer-stack.html`.
- File sizes should *shrink* (~1.4MB Charlie OTF payload → ~150–250KB Geist variable woff2 per file); expect a massive but mostly-generated diff.
