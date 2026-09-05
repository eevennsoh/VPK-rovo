---
name: vpk-html
description: Render supplied material into offline, single-file HTML documents, reports, one-pagers, briefs, memos, decks, changelogs, portfolios, resumes, and engineering workflow surfaces with the Algebrica editorial identity. Use only when explicitly invoked as vpk-html or /vpk-html, optionally with a document hint or --github.
validation_command: node .agents/skills/vpk-html/scripts/check-html.mjs
---

# vpk-html

Produce a durable offline HTML artifact by selecting and filling an existing
template. HTML is the source of truth; the build scripts validate and enhance
it rather than compiling a separate content format.

## Read before drafting

Load only the references needed for the requested document:

| Need or document type | Read |
| --- | --- |
| Core authoring flow, artifact layout, assets, metadata | [authoring detail](references/authoring-detail.md) |
| Visual identity, typography, spacing, color, motion | [design](references/design.md) |
| General prose and document quality bars | [writing](references/writing.md) |
| Banned styling and content failure modes | [anti-patterns](references/anti-patterns.md) |
| Source attribution and missing evidence | [source policy](references/source-policy.md) |
| Resume or CV | [resume writing](references/resume-writing.md) |
| Optional customer identity | [brand profile](references/brand-profile.md) |
| Diagrams or flowcharts | [diagrams](references/diagrams.md) and [SVG style](references/svg-style.md) |
| Data charts | [charts](references/charts.md) |
| Technical illustrations | [illustrations](references/illustrations.md) |
| Slide/deck or document navigation | [presentation](references/presentation.md) |
| Editorial long-form patterns | [editorial patterns](references/editorial-patterns.md) |
| Accessibility | [accessibility](references/accessibility.md) |
| Quality checks | [quality gates](references/quality-gates.md) and [production](references/production.md) |
| Improve this skill or run comparison rounds | [evaluation](references/evaluation.md) |
| Derived PDF | [PDF export](references/pdf-export.md) |
| Landing/product site | [landing](references/landing.md) |
| GitHub Pages | [GitHub Pages](references/github-pages.md) |
| MP4 conversion | [video export](references/video-export.md) |

## When to use

Use this skill only after explicit invocation to turn supplied material into an
editorial document or engineering artifact. It is not a general dynamic web-app
builder, a saturated/cyberpunk visual-design mode, or a PDF/PPTX-first workflow.
When PDF, video, landing, or publishing is requested, generate and validate the
HTML source first and then use the relevant derived track.

## Hard invariants

- Keep the deliverable offline and single-file: inline required CSS, scripts,
  fonts, SVG, and raster assets. Do not leave network or local-file dependencies.
- Write the source artifact to
  `artifacts/vpk-html/<slug>/<slug>.html`; keep its derived files and review
  captures inside the same slug folder.
- Treat `artifacts/**` as durable user output. Never delete, prune, rotate, or
  modify other artifacts as housekeeping.
- Copy an existing file from `assets/templates/` and edit its content. Preserve
  the template structure, shared runtime hooks, single `<main>` landmark, and
  Algebrica identity.
- Do not fabricate facts or leave placeholders. Mark missing evidence as
  `[DATA NEEDED: description]` and follow the source policy.
- Follow the banned-style and content rules in
  [anti-patterns](references/anti-patterns.md); do not override the identity
  with generic dashboard cards, excessive gradients, or decorative clutter.
- Keep all existing files in this skill at their fixed paths. Runtime routes and
  selector code read `SKILL.md`, `references/tokens.json`, scripts, styles, and
  assets directly.

## Workflow

### 1. Frame the reader's job and choose a template

Infer purpose, audience, format/tone constraints, and success criteria. Define
the reader's job in two parts: what they must understand, decide, or change in a
30-second scan, and what evidence they must be able to audit in a deeper read.
Ask one compact question only if two or more cannot be inferred. Then match the
job to a template under `assets/templates/`; the complete general and
engineering template map is in [authoring detail](references/authoring-detail.md).

### 2. Distill and source the material

Separate supplied facts from interpretation, verify source-dependent claims,
and remove repetition before fitting the template. Read the document-specific
writing reference above before drafting. If a brand profile is requested or
available, bake it into the finished file according to its precedence rules.

### 3. Copy and fill

```bash
mkdir -p artifacts/vpk-html/<slug>
cp .agents/skills/vpk-html/assets/templates/<template>.html artifacts/vpk-html/<slug>/<slug>.html
```

Fill every visible placeholder and the title, author, description, and keyword
metadata. Use the shipped diagram and illustration primitives where helpful;
inline any additional permitted asset. See
[authoring detail](references/authoring-detail.md) for asset policy, metadata,
long-document navigation, and fill constraints.

### 4. Validate the source artifact

Run all three required checks:

```bash
node .agents/skills/vpk-html/scripts/build.mjs --check-placeholders artifacts/vpk-html/<slug>/<slug>.html
node .agents/skills/vpk-html/scripts/build.mjs --verify artifacts/vpk-html/<slug>/<slug>.html
node .agents/skills/vpk-html/scripts/check-html.mjs artifacts/vpk-html/<slug>/<slug>.html
```

Inspect the rendered artifact in a browser at the intended viewport. Fix font,
overflow, console, accessibility, focal hierarchy, and content-density issues.
Run relevant advisory checks from
[quality gates](references/quality-gates.md), using `--strict` when the task
requires them to fail validation.

### 5. Produce optional derivatives

Only after the HTML passes. The `/vpk-html --github` invocation authorizes the
GitHub Pages track; do not publish from an ordinary render request.

```bash
# PDF
node .agents/skills/vpk-html/scripts/build.mjs --pdf artifacts/vpk-html/<slug>/<slug>.html

# Landing bundle
node .agents/skills/vpk-html/scripts/build.mjs --landing artifacts/vpk-html/<slug>/<slug>.html

# GitHub Pages
node .agents/skills/vpk-html/scripts/build.mjs --github artifacts/vpk-html/<slug>/<slug>.html [--repo owner/name] [--public|--private]
```

Use the corresponding reference for prerequisites, output layout, and
verification. Do not publish screenshots, PDFs, or the noncanonical source file
unless the user explicitly asks.

## Runtime and library maintenance

For changes to shared templates, tokens, runtime injection, demos, or catalog
assets, read [production](references/production.md) and use the existing scripts
in place. Do not rename or move `scripts/`, `styles.css`, assets, or existing
references; these paths are coupled to runtime code and repository validators.

For changes to authoring judgment, templates, shared mechanics, or quality
gates, also read [evaluation](references/evaluation.md). Run `--check-evals`,
then compare the affected frozen scenarios against the prior skill revision.
Put judgment in prose, reusable mechanics in templates/shared code, and
observable failures in deterministic checks.
