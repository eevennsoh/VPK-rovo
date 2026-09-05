# Authoring detail

Use this reference after the skill interface has selected the authoring track.

## Contents

- [Artifact layout](#artifact-layout)
- [Intent and template selection](#intent-and-template-selection)
- [Source and material pass](#source-and-material-pass)
- [Asset policy](#asset-policy)
- [Filling the template](#filling-the-template)
- [Metadata](#metadata)
- [Long documents and presentations](#long-documents-and-presentations)

## Artifact layout

Every user artifact lives at `artifacts/vpk-html/<slug>/<slug>.html`. Keep its
PDFs, screenshots, validation images, and iteration captures inside the same
slug folder; use a `screenshots/` child when there are many captures. Do not put
generated HTML in the repository root, `docs/html`, or directly at the top of
`artifacts/vpk-html`.

Artifacts are durable local deliverables even though Git ignores the directory.
Automation and housekeeping must not delete or rewrite them. Deletion requires
a separate explicit request naming the exact artifact path.

## Intent and template selection

Infer purpose, audience, hard constraints, and the success outcome. Before
choosing a template, write a private two-line reader-job note:

- **Quick read:** what must the reader understand, decide, or change within
  about 30 seconds?
- **Deep audit:** what evidence must remain available when they inspect the
  artifact closely?

Use that job to choose and adapt the template. Do not let available slots decide
the information architecture. Ask one compact question only when at least two
dimensions are genuinely unclear.

### General documents

| Request | Template |
| --- | --- |
| One-pager, proposal, executive brief | `one-pager.html` |
| White paper, long document, report | `long-doc.html` |
| Letter, memo, cover letter | `letter.html` |
| Portfolio or case studies | `portfolio.html` |
| Resume or CV | `resume.html` |
| Slides, deck, keynote | `slides.html` |
| Equity report or investment memo | `equity-report.html` |
| Release notes or changelog | `changelog.html` |
| Broadsheet, index, issue opener | `broadsheet.html` |
| Annual report, brand book, colophon | `annual-report.html` |
| Interview, Q&A, profile | `interview.html` |
| Lookbook or artifact gallery | `lookbook.html` |
| Long-form or data essay | `feature-essay.html` |

### Engineering artifacts

| Request | Template |
| --- | --- |
| Technical approaches or options | `exploration-code-approaches.html` |
| UI concepts or visual directions | `exploration-visual-designs.html` |
| Code or PR review | `code-review-pr.html` |
| Codebase map or module walkthrough | `code-understanding.html` |
| Design system or token contract | `design-system.html` |
| Component variants or state matrix | `component-variants.html` |
| Motion concept | `prototype-animation.html` |
| Interaction prototype | `prototype-interaction.html` |
| Technical deck | `slide-deck.html` |
| SVG or technical illustration brief | `svg-illustrations.html` |
| Status or weekly report | `status-report.html` |
| Incident report or postmortem | `incident-report.html` |
| Flowchart or decision process | `flowchart-diagram.html` |
| Feature research explainer | `research-feature-explainer.html` |
| Concept research note | `research-concept-explainer.html` |
| Implementation or rollout plan | `implementation-plan.html` |
| PR description or change summary | `pr-writeup.html` |
| Issue or bug triage | `editor-triage-board.html` |
| Feature flag matrix | `editor-feature-flags.html` |
| Prompt tuning or evaluation | `editor-prompt-tuner.html` |

## Source and material pass

Inventory the supplied material before drafting. Distinguish quoted or observed
facts from interpretation, resolve conflicting figures, and retain attribution.
Do not browse merely to decorate a document, but verify factual claims when the
task depends on current or external evidence. Follow `source-policy.md`.

Distill repeated content into one strong claim, prefer data to adjectives, and
match detail to the reader's decision. Do not pad empty template regions.

## Asset policy

The final file must open offline without network or local-file dependencies.
Inline required CSS and scripts. Inline local raster images as `data:image/*`
URIs and embed SVG markup directly. Use shipped fonts and primitives rather
than remote CDNs. A customer logo from a brand profile must also be base64
inlined; a missing logo produces no placeholder.

Do not use remote URLs, `file:` paths, stock-image descriptions, or data that is
not licensed or supplied for the task. The checker treats unresolved external
assets as a failure.

## Filling the template

1. Copy the selected template into the artifact folder.
2. Preserve its CSS, shared runtime hooks, semantic structure, and single
   `<main>` landmark; replace content and explicit placeholders.
3. Read `writing.md` and the document-specific reference before drafting.
4. Avoid every failure mode in `anti-patterns.md`.
5. Keep code samples, commands, `pre`, and inline `code` on the mono face after
   any document typography overrides.
6. Center diagrams and technical illustrations optically unless the prompt asks
   for another composition. Move related SVG nodes and connectors together.
7. Wrap long SVG labels or widen their nodes. Make connectors meet node edges
   exactly and use consistent filled-triangle markers.

Never leave `{{...}}`, lorem ipsum, `[Insert here]`, or `TBD`. Do not invent
metrics, financial figures, statistics, sources, or quotations. Use
`[DATA NEEDED: description]` for a real evidence gap. Do not write body copy
that merely repeats its heading.

## Metadata

Fill each template's title placeholder and these head values:

| Field | Rule |
| --- | --- |
| Author | Person for resumes/letters/portfolios; otherwise supplied identity or blank |
| Description | One sentence, no more than 150 characters, derived from opening content |
| Keywords | Three to five terms from title and headings |
| Document title | Match the visible primary heading |

Keep `<meta name="generator" content="vpk-html">` unchanged.

## Long documents and presentations

For screen-read long documents, use real table-of-contents links, stable section
IDs, visible heading self-links, and `scroll-margin-top`. Prefix page-like TOC
metadata (`Pg 03`) so it cannot be confused with section numbers.

When using the shared document-navigation runtime, keep visible previous/next
controls, section counter, progress, keyboard navigation, and presenter support.
Speaker notes are the last child of each `main > section` and remain hidden from
the audience and print output. Scope dimming to navigation focus and release it
on manual wheel or touch scrolling. Read `presentation.md` for the full runtime
contract.
