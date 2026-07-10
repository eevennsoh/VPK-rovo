# vpk-html chart & diagram suite expansion (Phase E)

## Context

vpk-html now carries the Algebrica identity (see
`vpk-html-algebrica-revamp-plan.md`, Phases A–D). The user wants two things:

1. **Link behavior fix**: no default underlines anywhere; content-link
   underlines animate in on hover; chrome links (nav/sidebar/meta) shift only
   opacity/color — as algebrica.org does.
2. **A much bigger chart/diagram suite**, inspired by the D3 gallery,
   Observable Plot gallery, NYT "What's Going On in This Graph", the repo's
   own `components/ui-charts/` (~16 chart families with animation/interaction
   infra), and anything else worth harvesting. Charts must be **open web tech
   only** (inline HTML/CSS/JS/SVG, offline single-file, no chart libraries),
   obey the grayscale figure grammar + mauve intensity ramp, and be
   **animatable (CSS/JS) and interactive** with reduced-motion handling and
   static-complete rendering when JS is off (progressive enhancement).

## Execution model (Fable orchestrates, GPT-5.5 executes)

- **E1 Foundation (single executor, warm codex session `019f4513-…`)**:
  link-behavior fix across the identity + shared chart infrastructure:
  animation utility CSS (stroke draw-in, bar grow, staggered reveal via
  custom properties, all gated behind `prefers-reduced-motion`), interaction
  utility JS (tooltip, legend toggle, keyboard focus), chart template
  scaffold, gate accommodations (lint keeps banning gradients/filters but
  tolerates transforms/keyframes/scripted interactivity), and a
  `references/charts.md` stub.
- **E2 Research (2 parallel read-only ephemeral codex workers)**: sweep the
  D3 + Plot galleries and the NYT column; feasibility-rank chart forms
  against the static-SVG/grayscale/animatable constraints; harvest the
  annotation/editorial conventions NYT uses. Local `components/ui-charts/`
  inventory is already captured in this plan's idea pool.
- **E3 Synthesis (Fable)**: consolidate research into the final chart
  catalog (~20–24 new types), grouped into 4–5 disjoint build sets, each
  with anatomy, tokens, animation hooks, and interaction spec.
- **E4 Fan-out build (4–5 parallel fresh codex workers)**: each builds one
  set of standalone chart/diagram template files + matching demo content
  under **disjoint paths only** (new files under `assets/diagrams/` /
  `assets/templates/`); no worker touches shared scripts, docs, or index.
- **E5 Integration (single executor, warm session)**: wire new charts into
  generators, demos regeneration, index.html catalog, `references/charts.md`
  full catalog, SKILL.md/README/CHEATSHEET, migration; run all gates.
- **E6 Review (Fable)**: independent proofs, interaction probes in a real
  browser (hover/tooltip/legend toggle, reduced-motion), light+dark
  screenshots, spot-check animation quality.

## Idea pool (seed; E3 finalizes)

From `components/ui-charts/`: scatter, pie/ring, radar, sankey, funnel,
gauge, heatmap, choropleth (as abstract grid-map), live/streaming line,
composed chart, stat-card sparklines; animation infra worth porting to
CSS/vanilla-JS idiom: phased mount reveal, dash-tail stroke, hover dim,
legend hover, animated domains, scheduled tooltip.

From D3/Plot galleries (feasibility-rank in E2): histogram, box plot,
violin, ridgeline, beeswarm, dot/Cleveland plot, lollipop, bullet, slope,
bump, streamgraph, stacked/normalized area, treemap, icicle/sunburst,
calendar heatmap (mauve ramp), arc diagram, chord, contour/density,
parallel coordinates, small multiples.

From NYT column: annotated line (editorial callouts), connected
scatterplot, dumbbell/range plot, annotated stacked bars — plus their
annotation grammar (direct labeling over legends, focal highlighting).

## Constraints (binding for every phase)

- Inline SVG + vanilla CSS/JS only; single-file offline; no external assets.
- Figure grammar: token-only colors (grayscale ramp + mauve intensity ramp),
  no gradients/filters, Geist Mono figure text, stroke discipline, one focal
  element; passes `check-html.mjs` SVG lint and all existing gates.
- Multi-series differentiation by tone + dash + marker, never hue.
- Animation: CSS-first (custom properties as animatable hooks), JS only for
  interaction/count-ups; `prefers-reduced-motion: reduce` disables all
  motion; chart must render complete with JS disabled.
- Dark parity for every new value; migration idempotency; identities never
  coexist; scope `.agents/skills/vpk-html/**` (+ INDEX.md via updater).

## Verification

Usual battery (`build.mjs --sync/--check-templates/full`, `check-html.mjs`,
`node --test`, `validate:skills`, `verify:root-artifacts`, migration double
run) plus: browser interaction probes on 2–3 new charts (tooltip appears on
hover, legend toggles series, keyboard focus works), reduced-motion check,
JS-disabled render check, light+dark screenshots of the new chart demos.
