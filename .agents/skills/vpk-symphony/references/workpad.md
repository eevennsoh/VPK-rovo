# Codex Workpad

Use one active Linear comment headed exactly:

```markdown
## Codex Workpad
```

## Required Content

Keep the workpad compact and current:

- Environment stamp: `<host>:<abs-workdir>@<short-sha>`.
- Hierarchical plan checklist with parent tasks and child tasks.
- Acceptance criteria copied from issue `Validation`, `Test Plan`, or
  `Testing` sections when present.
- Validation results with exact commands or browser evidence.
- Decisions and assumptions.
- Branch and PR links.
- Handoff summary.

## Update Rules

- Reuse the live unresolved workpad; do not create duplicate progress comments.
- Check off completed items as the run progresses.
- Preserve the parent/child task structure as scope evolves.
- Record sync evidence before edits: merge source, result, and resulting short
  SHA.
- For visible UI, browser-observable behavior, generated/offline HTML output,
  or visual artifact changes, record browser evidence availability and artifact
  links. If evidence is skipped, record the exact capture blocker before
  closing or review handoff.
- Put uploaded screenshots, inline GIF previews, and WebM links in the workpad
  `### Evidence` section.
- Use markdown image syntax for screenshots and GIF previews so Linear renders
  inline image previews.
- Put uploaded WebM asset URLs on their own line as downloadable recording
  evidence; do not rely on Linear to render WebM uploads as playable inline
  video.

## Answer-Only Issues

For explanation, triage, codebase-tour, or operational-guidance tickets with no
requested repo change, write the answer in the workpad handoff, move the issue
to `Done`, and do not create a branch, commit, PR, or follow-up issue. If the
skill was invoked ad-hoc without an existing issue, still create or attempt to
create the Linear ticket first; do not skip ticketing just because the final
deliverable is an answer.
