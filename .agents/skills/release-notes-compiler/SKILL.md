---
name: release-notes-compiler
description: This skill should be used when the user asks to "generate release
  notes", "write the changelog", "what's in this release", "summarize merged
  PRs", "draft the release announcement", "what changed since the last version",
  or pastes a list of merged pull requests, commits, or resolved Jira issues
  that need to become customer-facing or internal release notes.
---

# Release Notes Compiler

> Convert merged PRs, commits, and resolved issues into clear, grouped release
> notes — one version for customers, one for the team — without losing the
> important breaking changes.

## Quick Start

| Input | Action |
| --- | --- |
| Merged PR list / commits | Group by type → write notes |
| Resolved Jira issues | Map to highlights + fixes |
| "Customer release notes" | Benefit-led, jargon-free version |
| "Internal changelog" | Full technical list with links |

```
/release-notes-compiler "v2.4.0 — here are the merged PRs since v2.3.0"
```

## Classification

Group every change into one of:

| Category | Customer-facing? | Order |
| --- | --- | --- |
| Highlights / New features | Yes | 1 |
| Improvements | Yes | 2 |
| Bug fixes | Yes | 3 |
| Breaking changes | Yes (prominent) | 0 — show first |
| Security | Yes (brief) | with fixes |
| Internal / chore / refactor | No (internal only) | last |

Use Conventional Commit prefixes (`feat`, `fix`, `perf`, `refactor`, `chore`,
`docs`, `BREAKING CHANGE`) when present; otherwise infer from the title/labels.

## Writing Rules

- **Customer notes**: lead with the user benefit, not the implementation.
  "Faster search" not "switched to inverted index."
- **Breaking changes**: always call out the migration step and who is affected.
- Keep each entry to one line; link the PR/issue key in parentheses.
- De-duplicate: collapse multiple commits for one feature into a single entry.
- Drop pure noise (version bumps, formatting) from the customer version.

## Output Format

```markdown
## <version> — <date>

### Breaking changes
- <what changed and the required action> (#PR / KEY)

### Highlights
- <benefit-led summary> (#PR / KEY)

### Improvements
- ... (#PR / KEY)

### Bug fixes
- ... (#PR / KEY)

---
<details><summary>Internal changes</summary>

- chore/refactor/docs entries with links
</details>
```

## Boundaries

- Never invent features or fixes not present in the input.
- If a change's user impact is unclear, place it under Internal and flag it for
  author review rather than guessing a customer benefit.
