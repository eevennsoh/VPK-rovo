# Quality gates

Optional, **advisory** content-quality checks for finished artifacts. They are
heuristics, not correctness checks — they catch the kinds of layout/typography
weaknesses that make a generated document look unfinished. By default they only
**warn**; pass `--strict` to make findings fail the process (exit 1).

kami's equivalents are PDF/pixel-based. vpk-html is HTML-first, so these are
re-grounded on the same headless-Chromium DOM that `--verify` opens
(`scripts/gates.mjs`). They never modify the artifact. Thresholds live in
`references/checks-thresholds.json`.

## Running

```bash
node scripts/build.mjs --check-density        <file> [--strict]
node scripts/build.mjs --check-resume-balance <file> [--strict]
node scripts/build.mjs --check-rhythm         <file> [--strict]
node scripts/build.mjs --check-orphans        <file> [--strict]
# or run several directly:
node scripts/gates.mjs <file> --check-density --check-orphans
```

## The gates

### density
Flags a `section` (taller than `minSectionHeightPx`) whose **trailing empty
space** exceeds `maxTrailingRatio` (default 25%) of its height, when it is not
the last section. Symptom: a section padded with whitespace instead of content —
often the "emptiness" anti-pattern wearing a full-height box.

### resume-balance
For paged content, estimates pages as `scrollHeight / pageHeightPx` (default A4
1123px). If the document spills just past a page boundary and the final page is
less than `minLastPageFill` full (default 20%), it warns to tighten the content
to fit. Only runs once the document is at least `onlyWhenPagesAtLeast` pages.

### rhythm
For slide decks, fingerprints each slide by its child structure (count, heading
count, child tag sequence) and warns when `maxIdenticalConsecutive` (default 3)
or more **consecutive** slides share an identical fingerprint — a monotonous deck
that needs layout variety.

### orphans
Measures each paragraph/list-item with `Range.getClientRects()`. A block longer
than one line whose **last line** is both narrow (< `minLastLineWidthRatio` of
the widest line) and a short word (< `minLastLineChars`) is flagged as a widow.
Symptom: a lone short word dangling on its own line.

## Tuning

Edit `references/checks-thresholds.json`. All gates degrade gracefully: a
template type a gate doesn't apply to (e.g. `rhythm` on a one-pager with no
slides) simply reports clean.
