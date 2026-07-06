# Codex Automations

Generated on July 7, 2026 at 1:24 AM GMT+10 from saved Codex automation files in `/Users/esoh/.codex/automations`.

This file consolidates the current automation configs and companion memory notes into one Markdown inventory. Schedules are translated into plain English; raw recurrence strings are intentionally omitted. Regenerate this snapshot whenever a saved automation prompt or schedule changes.

- Total automations: 13
- Active automations: 13
- Cron automations: 12
- Heartbeat automations: 1

## Summary

| Name | ID | Kind | Status | Schedule | Environment | Model |
| --- | --- | --- | --- | --- | --- | --- |
| Artifact cleanup | `artifact-cleanup` | cron | ACTIVE | Daily at 11:20 PM | local | gpt-5.5 |
| Bug scan | `bug-scan` | cron | ACTIVE | Weekly on Monday, Wednesday, and Friday at 12:30 AM | worktree | gpt-5.5 |
| Code simplification | `code-simplification` | cron | ACTIVE | Weekly on Thursday and Sunday at 8:30 AM | worktree | gpt-5.5 |
| Dependency hygiene | `dependency-sweep` | cron | ACTIVE | Weekly on Tuesday at 4:45 AM | worktree | gpt-5.5 |
| Deprecation audit | `deprecation-audit` | cron | ACTIVE | Weekly on Saturday at 4:40 AM | worktree | gpt-5.5 |
| Engineering improvement map | `engineering-improvement-map` | cron | ACTIVE | Weekly on Friday at 10:30 AM | worktree | gpt-5.5 |
| Frontend runtime audit | `frontend-runtime-audit` | cron | ACTIVE | Weekly on Tuesday, Thursday, and Saturday at 1:30 AM | worktree | gpt-5.5 |
| Interface contract audit | `interface-contract-audit` | cron | ACTIVE | Weekly on Monday and Thursday at 5:30 AM | worktree | gpt-5.5 |
| Performance audit | `performance-audit` | cron | ACTIVE | Weekly on Wednesday and Sunday at 3:30 AM | worktree | gpt-5.5 |
| Standup summary | `standup-summary` | heartbeat | ACTIVE | Daily at 9:30 AM, 1:30 PM, and 5:30 PM | thread | Default |
| Test coverage | `test-coverage` | cron | ACTIVE | Weekly on Tuesday and Friday at 6:30 AM | worktree | gpt-5.5 |
| UI design quality audit | `ui-design-quality-audit` | cron | ACTIVE | Weekly on Wednesday and Saturday at 7:30 AM | worktree | gpt-5.5 |
| Update AGENTS.md | `update-agents-md` | cron | ACTIVE | Weekly on Sunday at 12:20 PM | worktree | gpt-5.5 |

## Details

### Artifact cleanup

| Field | Value |
| --- | --- |
| ID | `artifact-cleanup` |
| Kind | cron |
| Status | ACTIVE |
| Schedule | Daily at 11:20 PM |
| Execution environment | local |
| Working directory | `/Users/esoh/Documents/Labs/vpk-rovo` |
| Model | gpt-5.5 |
| Reasoning effort | medium |
| Created | May 1, 2026, 11:24 AM GMT+10 |
| Updated | Jun 21, 2026, 10:28 PM GMT+10 |
| Config source | `/Users/esoh/.codex/automations/artifact-cleanup/automation.toml` |
| Memory source | `/Users/esoh/.codex/automations/artifact-cleanup/memory.md` |

#### Prompt

````markdown
## Task
Clean disposable ignored/generated local artifacts in the VPK-rovo checkout. Preserve tracked files, dependencies, secrets, config, fixtures, snapshots, docs/product assets, and active runtime state. This is local housekeeping only: do not create branches, commits, pushes, PRs, or staged changes.

## Commands
Start with:
```bash
git rev-parse --show-toplevel
git status --short --ignored -uall
```
For each candidate, prove eligibility with commands such as:
```bash
git check-ignore -- <path>
git ls-files -- <path>
find <path> -maxdepth 2 -print
stat <path>
file <path>
rg --fixed-strings -- <path-or-token> .
lsof +D <path>
```
Use `rm` or `rmdir` only after all checks prove the path is inside the repo, ignored or an eligible empty directory, untracked, allowlisted, and idle.

## Judgment
Allow automatic cleanup for browser artifacts, build/report output, disposable caches/temp paths, generated language artifacts, logs/debug output, OS/editor temp files, `*.tsbuildinfo`, stale `.dev-*` metadata, generated `.rovodev/*.generated.*`, and generated `.gsd/` artifacts. Treat `.tmp/` carefully: preserve known state such as personal graph and Symphony data, and remove only exact disposable subpaths. Empty non-ignored directories may be removed only when empty at deletion time, untracked, unreferenced, idle, and not protected state/source placeholders.

## Validation
Rerun scoped `git status --short --ignored -uall` for touched categories. Confirm no tracked files were deleted or staged and tracked cleanup candidates remain untouched.

## Handoff
Report ignored paths removed, empty directories removed, category counts, skipped paths with reasons, process blockers, tracked cleanup candidates with suggested commands, and final scoped status. If nothing is safe to remove, say why briefly.

## Stop Conditions
Stop or skip a candidate if it is outside the repo, not ignored and not an eligible empty directory, tracked, protected state/config/dependency/source/test data, ambiguous, process-owned without safe path-scoped evidence, or would require branch/commit/PR work.
````

#### Memory Notes

````markdown
# Artifact Cleanup Memory

- 2026-07-05T13:23:40Z: Persistent checkout `/Users/esoh/Documents/Labs/vpk-rovo`. Removed only exact idle ignored Symphony runtime logs: `.tmp/symphony/runtime/log/merge-guard.log` and `.tmp/symphony/runtime/log/log/symphony.log.{1,idx,siz}`; then removed empty dirs `.tmp/symphony/runtime/log/log` and `.tmp/symphony/runtime/log`. Preserved live `.next` and `.dev-*` because frontend PID 19993 listened on 4786 and held `.next` files; backend PID 20019 listened on 8080. Preserved dependencies, secrets/config, personal graph/qmd caches, backend app state, generated illustration assets imported by code/tests, public illustration assets, `.claude/worktrees`, and untracked `ARCHITECTURE_IMPROVEMENT_PLAN.md`.
- 2026-07-06T13:25:16Z: Persistent checkout `/Users/esoh/Documents/Labs/vpk-rovo`. Removed only ignored, untracked, idle generated language artifact `next-env.d.ts`. Preserved tracked generated illustration source `components/ui-custom/rovo-illustration/assets.generated.ts` because it is tracked and imported by runtime/tests. Preserved `.tmp/personal-graph/*` and `.tmp/symphony/*` as protected or ambiguous personal/Symphony state, including the nested `.tmp/symphony/openai-symphony` clone. No `.dev-*`, `output/`, `.gsd/`, `.rovodev/`, coverage, Playwright report, or `*.tsbuildinfo` candidates were present. Validation showed no tracked deletions, no staged changes, and only unrelated untracked `CODEX_AUTOMATIONS.md` in ordinary status.
````

### Bug scan

| Field | Value |
| --- | --- |
| ID | `bug-scan` |
| Kind | cron |
| Status | ACTIVE |
| Schedule | Weekly on Monday, Wednesday, and Friday at 12:30 AM |
| Execution environment | worktree |
| Working directory | `/Users/esoh/Documents/Labs/vpk-rovo` |
| Model | gpt-5.5 |
| Reasoning effort | xhigh |
| Created | Apr 18, 2026, 3:19 AM GMT+10 |
| Updated | Jul 7, 2026, 1:19 AM GMT+10 |
| Config source | `/Users/esoh/.codex/automations/bug-scan/automation.toml` |
| Memory source | `/Users/esoh/.codex/automations/bug-scan/memory.md` |

#### Prompt

````markdown
## Task
Scan commits since the last successful run recorded in automation memory for one clearly evidenced VPK-rovo regression. If no usable last-run timestamp exists, fall back to the last 72 hours so weekend commits are covered. If one review-ready fix exists, make the smallest root-cause patch and hand it off in a PR. If evidence is weak, stop with a brief no-PR report.

## Commands
Start with repo and branch safety:
```bash
git status --short --branch
git branch --show-current
git worktree list --porcelain
gh pr list --state open --search "[Automation] Bug scan" --json number,title,headRefName,state,isDraft
```
Run all pnpm commands via `corepack pnpm ...` so the repo-pinned pnpm version from `package.json#packageManager` is used instead of the runtime PATH pnpm.

Before editing, do not work from detached HEAD. Create or switch to `automation/bug-scan` only when that branch/worktree is safe and clean. Check for overlapping open or recent PRs before handoff. If a clean worktree cannot create Git lock files or switch branches safely, pivot to a fresh ignored scratch checkout or documented safe alternate worktree; if no PR is opened, clean up any temporary automation branch created by the run. Use concrete evidence commands before patching: recent `git log`/`git diff`, failing tests, `gh pr checks`, runtime logs, route/component/backend inspection, or browser reproduction when useful. For browser work, use `npx agent-browser` first for browser testing, local web verification, screenshots, UI probes, isolated/public pages, visual debugging, responsive checks, and unauthenticated verification, regardless of whether the run is in Codex App. Do not use `@Browser` as the default path; treat it as unavailable unless the user explicitly asks for it. Use `@Chrome` only when signed-in state, cookies, extensions, existing browser tabs, or multi-tab authenticated browser work matters. Fall back to the Playwright CLI only when `agent-browser` is unavailable or blocked. For local browser checks, start frontend/backend with `corepack pnpm run dev:tmux:start` when needed and use `corepack pnpm ports` or `.dev-frontend-port` / `.dev-backend-port` for actual URLs; do not assume default ports.

## Judgment
Fix only a high-confidence regression with user/system impact, narrow scope, and a validation path. Do not invent bugs, mask symptoms, weaken validation/security, or mix broad cleanup into the fix. CI triage must start from `gh pr checks`, isolate one actionable failure, patch one root cause, push, and recheck.

## Validation
Run focused validation for the touched behavior. After any code, dependency, or config edit, run `corepack pnpm run ci:pr`. If the full gate cannot run in the sandbox, run at minimum: the focused test for the touched behavior, `corepack pnpm run lint`, `corepack pnpm run typecheck`, plus the verify gates relevant to the touched surface (`corepack pnpm run verify:file-size` and `corepack pnpm run verify:repo-map` for file moves/splits, `corepack pnpm run verify:route-manifest` for route changes, `corepack pnpm run verify:catalog` / `corepack pnpm run verify:lazy-load` for component/demo changes, `corepack pnpm run verify:api-surfaces` for backend route changes, `corepack pnpm run verify:doc-scripts` for docs changes), and document which gates were skipped and why. Prefer a regression test that would have failed before the fix. Recheck CI-derived failures.

## Handoff
Push the branch and create or update `[Automation] Bug scan: <short summary>` with labels `automation, codex, bugfix`. Include evidence, root cause, fix, validation, regression guard status, CI-loop result when relevant, freshness/overlap check, and reviewer focus. Preserve unrelated local changes. Do not merge from this producer job; the separate review/merge workflow owns review and merge.

## Stop Conditions
Stop without editing or PR if branch/worktree state is unsafe, overlap makes behavior unclear, validation cannot support readiness, or the bug is speculative, expected behavior is unclear, CI triage would be broad/speculative, or the change would weaken security or require broad refactoring.
````

#### Memory Notes

````markdown
# Bug Scan Automation Memory

## 2026-07-05T14:38:07Z

- Started in `/Users/esoh/.codex/worktrees/d348/vpk-rovo` at detached `HEAD`; did not edit or create a PR.
- `automation/bug-scan` was already checked out in `/Users/esoh/.codex/worktrees/62b5/vpk-rovo`, clean, with `origin/automation/bug-scan` gone, so this run stayed read-only unless a high-confidence fix emerged.
- No open `[Automation] Bug scan` PRs. Open automation PRs #1111-#1116 all had passing `gh pr checks`.
- `origin/main` had no first-parent commits in the last 24 hours. Since the prior run, recent merged surfaces were title prefixing, visual demos, product sidebar actions, lozenge metrics, and lockfile verification.
- Evidence checks: targeted recent tests passed after warming dependencies; `pnpm run test:unit:js` passed; `pnpm run verify:root-artifacts` passed; `git diff --check origin/main~8..origin/main` passed.
- Decision: no clearly evidenced VPK-rovo regression found; no branch/PR created.
````

### Code simplification

| Field | Value |
| --- | --- |
| ID | `code-simplification` |
| Kind | cron |
| Status | ACTIVE |
| Schedule | Weekly on Thursday and Sunday at 8:30 AM |
| Execution environment | worktree |
| Working directory | `/Users/esoh/Documents/Labs/vpk-rovo` |
| Model | gpt-5.5 |
| Reasoning effort | xhigh |
| Created | Apr 17, 2026, 10:12 PM GMT+10 |
| Updated | Jul 7, 2026, 1:20 AM GMT+10 |
| Config source | `/Users/esoh/.codex/automations/code-simplification/automation.toml` |
| Memory source | `/Users/esoh/.codex/automations/code-simplification/memory.md` |

#### Prompt

````markdown
## Task
Find one worthwhile VPK-rovo code simplification from a broader recent-change scan, then simplify only one cohesive code area when behavior preservation is obvious and the review surface stays small. If no justified simplification exists, stop with a no-PR report.

## Commands
Start with repo and branch safety:
```bash
git status --short --branch
git branch --show-current
git worktree list --porcelain
gh pr list --state open --search "[Automation] Code simplification" --json number,title,headRefName,state,isDraft
```
Run all pnpm commands via `corepack pnpm ...` so the repo-pinned pnpm version from `package.json#packageManager` is used instead of the runtime PATH pnpm.

Before editing, do not work from detached HEAD. Create or switch to `automation/code-simplification` only when that branch/worktree is safe and clean. Check for overlapping open or recent PRs before handoff. If a clean worktree cannot create Git lock files or switch branches safely, pivot to a fresh ignored scratch checkout or documented safe alternate worktree; if no PR is opened, clean up any temporary automation branch created by the run.

After choosing a candidate, check for active overlap before editing. Inspect open PRs that may touch the same files, feature area, or route with `gh pr list --state open --base main --json number,title,headRefName,state,isDraft` and, for plausible overlaps, `gh pr view <number> --json files,title,body,headRefName`. Stop if another open PR makes behavior ownership unclear.

## Candidate Discovery
Do not inspect only one recent file by default. First build a small candidate shortlist from recent merged work:
```bash
gh pr list --state merged --base main --limit 5 --json number,title,mergedAt,headRefName,author
```
For the most relevant recent PRs, inspect changed files and diffs with `gh pr view <number> --json files,title,body,mergedAt` and targeted `git show` / `git log --name-only` as needed. If the last 5 merged PRs are too sparse or irrelevant, fall back to files changed on `main` in roughly the last 14 days. Use this scan to identify 2-4 candidate areas, not to broaden the eventual edit.

For each candidate, inspect recent diffs, call sites, adjacent tests, and nearby patterns before changing code. Prefer candidates where the simplification deletes real complexity: duplicated local JSX, unreachable branches, redundant abstractions, repeated conditionals, needless casts/optionality, or a narrow helper that can make behavior more direct. Do not choose a target just because it is the most recent file.

## Architecture Quality Bar
Use the `AGENTS.md` Architecture Quality Bar as the primary review lens: clear owners over busy files, behavior in the canonical layer, data normalized at boundaries, fewer repeated conditionals/null modes, 1000-line files treated as decomposition alarms, migrate-and-delete shared abstractions in one change, orchestration split from business logic, and deterministic contract tests for extracted helpers or boundaries.

Use `$thermo-nuclear-code-quality-review` only as a supplementary read-only maintainability lens over the candidate shortlist and final diff. Use it to decide whether any candidate is worth simplifying, which single candidate has the best complexity-reduction payoff with the lowest behavior risk, whether there is a code-judo move that deletes branches/wrappers/casts/concepts, and what structural concern the reviewer should focus on. If the final diff adds spaghetti branches, thin wrappers, unclear type boundaries, wrong-layer logic, or file-size/decomposition risk, refactor it before handoff or stop without a PR.

When the candidate involves reusable UI taxonomy, primitive/component/block/template classification, accessibility, design tokens, catalog/demo ownership, registry/docs expectations, or public prop typing, consult `$building-components` before making the component decision. When the simplification candidate involves reusable component API shape, boolean prop proliferation, compound components, context/provider boundaries, render-prop versus children patterns, or React 19 composition APIs, consult `$vercel-composition-patterns`. When the candidate touches VPK React component surfaces under `app/**` or `components/**`, consult `$vpk-tidy` for route-local placement, component/hook/data split thresholds, retired shared-bucket gates, catalog/demo wiring, and UI validation expectations. When the candidate touches Next.js App Router route files, RSC/client boundaries, async route APIs, route handlers, metadata, image/font/script handling, Suspense boundaries, hydration, or bundling-sensitive imports, consult `$vercel:nextjs`.

## Judgment
Refine readability, control flow, names, or redundant abstractions only after understanding why the code exists. Inputs, outputs, errors, side effects, SSR/client behavior, accessibility behavior, and public contracts must remain unchanged. The broader recent-PR scan and review lenses are discovery/design inputs; they are not permission for a broad redesign. Keep the final edit narrow and behavior-preserving.

Use `building-components`, `vercel-composition-patterns`, `vpk-tidy`, and `vercel:nextjs` only as review/checklist inputs for the touched candidate. Do not let them expand a small simplification into a redesign, migration, new component system, or shared API extraction. Use composition or Next guidance only to reject risky simplifications or choose the narrowest local expression of an existing pattern, not to introduce a new architecture. Do not mix simplification with fixes, features, dependency updates, migrations, broad formatting, or unrelated cleanup.

## Validation
For any VPK-rovo code edit, run `corepack pnpm run ci:pr`. If the full gate cannot run in the sandbox, run at minimum: focused adjacent tests for the touched behavior when available, `corepack pnpm run lint`, `corepack pnpm run typecheck`, `corepack pnpm run verify:file-size`, `corepack pnpm run verify:repo-map`, and `corepack pnpm run verify:route-manifest`, plus any other touched-surface gates (`corepack pnpm run verify:catalog` / `corepack pnpm run verify:lazy-load` for component/demo changes, `corepack pnpm run verify:api-surfaces` for backend route changes, `corepack pnpm run verify:doc-scripts` for docs changes). Document which gates were skipped and why. If a broad source-contract or adjacent test command fails on unrelated stale expectations, keep the focused touched-behavior test as the regression gate only after documenting why the failure is unrelated and after lint/typecheck are clean or separately blocked by known unrelated baseline issues.

## Handoff
Push the branch and create or update `[Automation] Code simplification: <short summary>` with labels `automation, codex, refactor`. Include candidate-scan summary, overlap check, Architecture Quality Bar findings, supplementary review findings if used, rationale, preserved behavior, validation, and reviewer focus. Preserve unrelated local changes. Do not merge from this producer job; the separate review/merge workflow owns review and merge.

## Stop Conditions
Stop without editing or PR if branch/worktree state is unsafe, overlap makes behavior unclear, validation cannot support readiness, behavior preservation is uncertain, the abstraction purpose is unclear, the Architecture Quality Bar/review lens finds no high-confidence simplification target, or the change expands beyond one cohesive simplification.
````

#### Memory Notes

````markdown
# Code simplification automation memory

Last run: 2026-07-04T22:56:15Z

- Opened PR #1097, "[Automation] Code simplification: share product-sidebar hover actions", from scratch checkout /private/tmp/vpk-rovo-code-simplification.e5p4D5/repo after the managed worktree could edit files but could not create the Git worktree index lock for staging.
- Branch: automation/code-simplification; commit: b89c4a05 refactor(product-sidebar): share navigation hover actions.
- Simplification: extracted duplicate hover action button JSX from components/blocks/product-sidebar/components/navigation-item.tsx and navigation-item-with-hover-chevron.tsx into feature-local navigation-item-actions.tsx; public props and behavior stayed unchanged.
- Candidate scan: last 5 merged PRs were dependency-only, so fallback recent history produced RovoGeneration, control-plane jobs, AgentAvatarVisual, and product-sidebar candidates; thermo review chose product-sidebar and rejected the broader or riskier candidates.
- Overlap: only open PR was #1091 Lozenge metric fix; product-sidebar PR search returned no overlaps.
- Validation: node --test components/blocks/product-sidebar/variants/jira.test.js, git diff --check, direct full eslint, and direct tsc --noEmit passed using the persistent checkout dependency tree. pnpm run lint/typecheck were blocked before script execution by baseline Atlaskit tarball URL policy mismatches; browser smoke was blocked because Turbopack rejects a temporary external node_modules symlink.
- GitHub PR checks for #1097 failed in pnpm install --frozen-lockfile before repo checks: ERR_PNPM_FETCH_404 for @atlaskit/platform-feature-flags@2.0.0 from npm-remote with no auth header. The PR does not touch package.json, pnpm-lock.yaml, or pnpm-workspace.yaml.
- Original worktree cleanup: removed the unstaged copied patch after opening the PR; /Users/esoh/.codex/worktrees/3137/vpk-rovo is clean but remains on local automation/code-simplification because switching would require the same blocked git lock write.

- Run: 2026-07-04T22:56:15Z
- Opened PR #1115, "[Automation] Code simplification: centralize Card Glow theme styles", from scratch checkout /Users/esoh/.codex/worktrees/6ccf/vpk-rovo/.tmp/code-simplification/repo after the existing automation/code-simplification worktree was clean/current but outside the patch tool writable project scope.
- Branch: automation/code-simplification; commit: 7817d6c7 refactor(card-glow): centralize theme styles.
- Candidate scan: last 5 merged PRs were #1110 document title prefixing, #1109 Card Glow avatar alignment, #1108 Liquid Metal flattening, #1107 Border Beam demo variants, and #1106 lockfile registry routing. Shortlist was document-title prefix helpers, Card Glow theme styling, Liquid Metal showcase helper/casts, Border Beam demo wrappers, and lockfile verifier messaging.
- Thermo review chose Card Glow because four repeated light/dark/system helper branches could collapse into one typed local CARD_GLOW_THEME_STYLES data boundary without changing public exports, catalog wiring, or rendered style values.
- Overlap: open PRs #1111, #1112, #1113, and #1114 touched unrelated areas; card glow/card-glow open PR searches returned no overlap.
- Validation: node --test components/website/demos/visual/card-glow-demo.test.js, git diff --check, pnpm run lint, and pnpm run typecheck passed. Scratch checkout needed CI=true pnpm install --prefer-offline because it started without node_modules.
- PR labels: requested automation/refactor labels were unavailable; applied codex. Remote PR checks were pending at handoff.
````

### Dependency hygiene

| Field | Value |
| --- | --- |
| ID | `dependency-sweep` |
| Kind | cron |
| Status | ACTIVE |
| Schedule | Weekly on Tuesday at 4:45 AM |
| Execution environment | worktree |
| Working directory | `/Users/esoh/Documents/Labs/vpk-rovo` |
| Model | gpt-5.5 |
| Reasoning effort | medium |
| Created | Apr 18, 2026, 3:23 AM GMT+10 |
| Updated | Jul 7, 2026, 1:22 AM GMT+10 |
| Config source | `/Users/esoh/.codex/automations/dependency-sweep/automation.toml` |
| Memory source | `/Users/esoh/.codex/automations/dependency-sweep/memory.md` |

#### Prompt

````markdown
# Dependency Hygiene — VPK-rovo

> Periodically sweep, retire, and update dependencies in VPK-rovo. This kit lives in two dependency worlds, and no single pass spans both. Pick the lane that fits the task; never try to do Lane B's work through Lane A tools.
>
> - **Lane A — npm dependency hygiene**: normal deps, catalog, overrides, removals. Bounded by repo `.npmrc` (`npm-remote`), lockfile CI guardrails, trust policy, and `minimumReleaseAge`.
> - **Lane B — Atlassian logo asset harvest**: keeps Atlassian visual assets current by vendoring SVGs via `npm pack` when package installs are blocked or not the goal. This is the default path for `@atlassian/logo-third-party` asset freshness unless a current repo-registry probe proves the target is reachable through Lane A. For `@atlaskit/logo`, try Lane A first and use Lane B only when install reachability, release-age, trust, or lockfile policy blocks a package bump.

Run all pnpm commands via `corepack pnpm ...` so the repo-pinned pnpm version from `package.json#packageManager` is used instead of the runtime PATH pnpm.

---

## Why two lanes

| | Install world (Lane A) | Fetch world (Lane B) |
|---|---|---|
| Tool | `corepack pnpm install` / `corepack pnpm update` / `corepack pnpm add` | `npm pack` run outside the repo |
| Config used | repo `.npmrc` -> `packages.atlassian.com/api/npm/**npm-remote**` | user `~/.npmrc` -> `.../artifactory/api/npm/**atlassian-npm**` when authenticated |
| `@atlaskit` / `@atlassian` scopes | forced to `npm-remote`, which may lag or omit packages | authenticated `atlassian-npm`, usually complete/latest |
| Gated by | `scripts/verify-pnpm-lockfile.js`, `trustPolicy`, `minimumReleaseAge`, lockfile | no install-graph gate; downloads a tarball |

`corepack pnpm outdated` can report versions that are not installable through the repo registry. Re-probe current reachability each run before treating any target as a Lane A candidate. Do not hardcode prior registry state as current truth.

---

# Lane A — npm dependency hygiene

## Task
Discover newer stable releases for direct dependencies, catalog families, overrides, and advisory-affected packages, then apply the smallest update set that is clearly safe and reviewable. Remove or replace old, unused, or superseded dependencies only when current source and lockfile evidence proves the change is safe. Prefer no PR over a risky, broad, or weakly validated change. Explicitly exclude `@atlassian/logo-third-party` version bumps unless a fresh repo-registry probe proves the target is reachable through Lane A. Do not permanently exclude `@atlaskit/logo`; probe it like any other direct dependency and route only visual-asset freshness to Lane B when the install path is blocked.

## Repo and branch safety
```bash
git status --short --branch
git branch --show-current
git worktree list --porcelain
gh pr list --state open --search "[Automation] Dependency hygiene" --json number,title,headRefName,state,isDraft
gh pr list --state open --search "[Automation] Safe dependency updates" --json number,title,headRefName,state,isDraft
gh pr list --state open --search "[Automation] Dependency sweep" --json number,title,headRefName,state,isDraft
```
- Do not work from a detached HEAD. Create/switch to `automation/dependency-hygiene` only when that branch/worktree is safe and clean.
- Treat `automation/safe-dependency-updates` / `automation/dependency-sweep` branches or PRs as overlapping prior runs, not separate workstreams.
- The main checkout can be touched by concurrent tooling mid-session. Re-verify `git status` is clean immediately before branching; if it is dirty with changes you did not make, stop.
- GitHub `origin` is primary for PRs/CI. `bitbucket` is a manual-push mirror; never push there as part of this job.

## Inventory before changing anything
```bash
corepack pnpm run deps:check
corepack pnpm outdated --long
corepack pnpm audit --json
```
Also inspect `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, and `.npmrc` for direct ranges, exact pins, catalog families, overrides, peer constraints, registry sources, `minimumReleaseAge*` / `trustPolicy*` lists, unused packages, duplicate roles, and stale overrides.

## Non-negotiable gotchas

### 1. Lockfile registry verification
After every install/update/add that touches the lockfile:
```bash
corepack pnpm run verify:lockfile
```
It must print `Verified pnpm-lock.yaml`. If it reports blocked registry URLs, rewrite only the reported package URLs that belong on `npm-remote`, then rerun the verifier. Do not rewrite the explicit allowed `@atlassian/logo-third-party` tarball URL. `verify:lockfile` passing is required before any PR.

### 2. Reachability is not the outdated report
Before proposing any bump, confirm the target resolves via the repo registry with a dry scratch install/add that succeeds, not just an outdated row. If it 404s or returns `NO_MATCHING_VERSION` from `npm-remote`, it is not a Lane A candidate.

### 3. Workspace root adds need `-w`
Use `corepack pnpm add -w <pkg>@<version>` or edit `package.json` + `corepack pnpm install`.

## Latest-stable discovery
Verify current/target from package metadata plus official release notes, changelogs, migration guides, peer ranges, and advisories. Treat `latest` as stable only when it is not prerelease/beta/alpha/rc/canary/nightly/experimental/next. Ignore unstable dist-tags unless the repo already intentionally tracks that channel. Reconcile every candidate against reachability.

## Priority order
1. Security-advisory or correctness fixes with a narrow package/override bump.
2. Patch/minor in-range updates for Float and Cautious deps.
3. Evidence-backed removals of unused direct deps, obsolete overrides, or superseded packages.
4. Safe latest-stable direct bumps needing a small deliberate manifest edit.
5. Catalog-family bumps when every member moves together via the `catalog:` block.
6. Locked exact bumps only when release evidence, peer compatibility, and validation make them clearly review-ready.

## Update and removal rules
- Float `^x.y.z` / Cautious `~x.y.z`: use `corepack pnpm run deps:update` or targeted `corepack pnpm update <pkg>` when the lockfile diff is narrow and explainable. A scoped update or per-package `package.json` edit plus `corepack pnpm install` is often cleaner than a full re-resolve.
- Locked exact deps (`react`, `react-dom`, `next`, `eslint-config-next`, `recharts`, `@modelcontextprotocol/sdk`, and coordinated families): deliberate manifest edit plus `corepack pnpm install` only.
- Catalog families (`tiptap`, `json-render`, `remotion`): bump only in the `catalog:` block of `pnpm-workspace.yaml`; never edit individual `"catalog:"` refs in `package.json`.
- Overrides: acceptable only for documented security, compatibility, or dedupe reasons.
- Removals require zero tracked imports/usages, no runtime/config/script references, no generated/vendored consumer, and lockfile validation after removal. Do not remove a package just because it looks old. Revert unrelated lockfile churn unless the chosen package requires it and you can explain it.

## Trust-downgrade handling
`trustPolicy: no-downgrade` can abort resolution with `ERR_PNPM_TRUST_DOWNGRADE`. If evidence shows a benign false positive for a reputable package and exact version, propose a version-pinned `trustPolicyExclude` entry as a separate, human-reviewed infra PR. Do not silently bundle it into a feature bump and never use `--config.trustPolicy=none`. If uncertain or real signal, stop and report evidence with no PR. Treat `minimumReleaseAge`, registry mismatches, private-auth failures, and unexplained tarball-URL churn as no-PR stop conditions unless there is explicit evidence and approval.

## Validation
After any dependency/config/lockfile/code edit, run in order:
```bash
corepack pnpm install                 # or the scoped update/add used for the chosen change
corepack pnpm run verify:lockfile     # required before any PR
corepack pnpm run ci:pr
```
If `ci:pr` cannot run in the sandbox, run at minimum: `corepack pnpm run verify:lockfile`, the focused check for the touched surface, `corepack pnpm run lint`, `corepack pnpm run typecheck`, `corepack pnpm run test:unit:js`, plus relevant verify gates (`corepack pnpm run verify:file-size`, `corepack pnpm run verify:repo-map`, `corepack pnpm run verify:route-manifest`, `corepack pnpm run verify:catalog`, `corepack pnpm run verify:lazy-load`, `corepack pnpm run verify:api-surfaces`, or `corepack pnpm run verify:doc-scripts` as applicable), and document which gates were skipped and why. Add a focused check for major/framework/build-tool/React-Next/AI-SDK/Rovo/Tailwind/eslint/TypeScript/rendering/browser/Atlassian bumps that exercises the touched surface.

## PR serialization
Every dep PR touches `pnpm-lock.yaml`, so parallel branches off the same base mutually conflict. Ship serially: create PR, enable auto-merge when allowed, wait for merge, sync main, then branch the next off updated main. Keep each PR to one related change set.

## Lane A handoff
Push the branch and create/update `[Automation] Dependency hygiene: <short summary>` with labels `automation, codex, dependencies`. Include before/after versions or removed packages, why selected, latest-stable/unused/superseded evidence, advisory or changelog notes, peer and migration risk, exact validation including `verify:lockfile`, any trust waiver and its justification, freshness/overlap check, and reviewer focus. Preserve unrelated local changes. Do not merge from this producer job unless explicitly authorized.

## Lane A stop conditions
Stop without editing or PR if branch/worktree state is unsafe or dirty from other tooling; overlap makes behavior unclear; validation cannot support readiness; the change is speculative; unrelated packages would be bundled; migration risk is unclear; removal usage-evidence is incomplete; stable release cannot be confirmed or is not reachable via `npm-remote`; a pnpm supply-chain policy blocks it without an approved, version-pinned waiver; or security/correctness would weaken.

---

# Lane B — Atlassian logo asset harvest

Keeps VPK's Atlassian visual assets current even when packages cannot be installed. It uses `npm pack` outside the repo, so it needs no `corepack pnpm install`, lockfile change, trust waiver, or registry mirror. Run on its own cadence and keep Lane B PRs separate from Lane A PRs.

## When to use
- Latest `@atlassian/logo-third-party` 3p brand logos are needed and Lane A reachability is blocked.
- Latest `@atlaskit/logo` 1p product logos are needed and Lane A has just proven a package bump is blocked by release-age, trust, registry, or lockfile policy.
- You are refreshing visual assets only and do not want a package or lockfile change.

## Steps
If the current checkout contains `scripts/harvest-atlassian-logos.mjs` and a `harvest:logos` package script, prefer `corepack pnpm run harvest:logos`. If those do not exist, follow the manual steps below and note the missing committed script as a follow-up rather than calling a nonexistent command.

1. Fetch latest into a temp dir outside the repo so user `~/.npmrc` / `atlassian-npm` auth applies, not the repo `.npmrc`:
```bash
cd "$(mktemp -d)"
npm pack @atlaskit/logo@latest
npm pack @atlassian/logo-third-party@latest
```
2. Extract SVG string literals from the package artifacts (`@atlaskit/logo` logo-components `var svg = "..."`; `@atlassian/logo-third-party` `var markup = '...'`). Preserve CSS custom-property defaults so SVGs render standalone and stay themeable.
3. Write assets to `public/1p/<brand>-{icon,logo}.svg` and `public/3p/<brand>.svg`, normalizing brand names and stripping entry-point/index artifacts.
4. Refresh VPK logo demo and third-party logo demo components to render from harvested SVGs.
5. Produce a diff report listing brands added, changed, and removed versus the current `public/` set.

## Lane B validation
```bash
corepack pnpm run lint
corepack pnpm run typecheck
```
Spot-check a few rendered logos in demos with `npx agent-browser`, including light and dark where theming matters. Because nothing enters the install graph, `verify:lockfile`, trust, and `minimumReleaseAge` do not apply.

## Lane B handoff
Push and open `[Automation] Logo asset refresh: <n brands updated>` with labels `automation, codex, dependencies`. Include the brand add/change/remove diff, source package versions harvested, and screenshots of a few refreshed demos. Keep Lane B PRs separate from Lane A PRs.

## Quick reference
| Symptom | Cause | Remedy |
|---|---|---|
| `verify-pnpm-lockfile.js` fails on blocked `atlassian-npm` URLs | user npm config or refresh wrote tarball URLs outside repo registry contract | rewrite only reported package URLs that belong on `npm-remote`, leave allowed `@atlassian/logo-third-party` URL alone, rerun verifier |
| `ERR_PNPM_TRUST_DOWNGRADE` on a locked transitive | publish-date heuristic or provenance downgrade | version-pinned `trustPolicyExclude` via reviewed infra PR, otherwise stop |
| `ERR_PNPM_FETCH_404` for new `@atlaskit/*` target | target or transitive not mirrored to `npm-remote` | stop Lane A; for visual-only logo freshness, harvest via Lane B |
| `NO_MATCHING_VERSION @atlassian/logo-third-party@<new>` | `npm-remote` lacks the version | Lane B harvest; keep npm dep pinned at reachable version |
| `ERR_PNPM_ADDING_TO_ROOT` | workspace root | use `corepack pnpm add -w ...` |
| Parallel dep PRs conflict | both touch lockfile | serialize: merge, sync main, branch next |
| Main checkout dirty with changes you did not make | concurrent tooling | stop; re-verify clean before branching |

## Cadence suggestion
- Lane A: weekly narrow sweep; one PR per related change set.
- Lane B: independent weekly or on-demand visual asset refresh; never conflicts with Lane A and never touches the lockfile.
````

#### Memory Notes

````markdown
2026-06-30T11:49:38Z - No PR opened. Worktree was clean but detached at 99c20acd, so a temporary automation/dependency-sweep branch was created and later deleted. Open dependency-sweep PR check was empty; recent dependency-sweep PRs were already merged. `pnpm run deps:check` reported 33 newer releases. `pnpm audit --json` reported four advisories: nanoid via Excalidraw paths, dompurify 3.4.10 via Mermaid paths, and high-severity linkify-it 3.0.3 via ansi-to-react. The narrow candidate was dompurify 3.4.10 -> 3.4.11 because the existing override permits it and 3.4.11 is past the 7-day maturity gate. `pnpm update dompurify --store-dir .pnpm-store` produced unrelated lockfile tarball URL churn without changing dompurify, so the churn was reverted. A narrower public-registry lockfile refresh `pnpm update dompurify@3.4.11 --lockfile-only --store-dir .pnpm-store --registry=https://registry.npmjs.org` stopped on `ERR_PNPM_TRUST_DOWNGRADE` for eslint-import-resolver-typescript@3.10.1 while resolving eslint-config-next@16.2.9. Per policy, no trust-policy exception or risky transitive major override was added. Final worktree status was clean and detached at main.
````

### Deprecation audit

| Field | Value |
| --- | --- |
| ID | `deprecation-audit` |
| Kind | cron |
| Status | ACTIVE |
| Schedule | Weekly on Saturday at 4:40 AM |
| Execution environment | worktree |
| Working directory | `/Users/esoh/Documents/Labs/vpk-rovo` |
| Model | gpt-5.5 |
| Reasoning effort | medium |
| Created | Apr 30, 2026, 2:55 PM GMT+10 |
| Updated | Jul 7, 2026, 1:19 AM GMT+10 |
| Config source | `/Users/esoh/.codex/automations/deprecation-audit/automation.toml` |
| Memory source | `/Users/esoh/.codex/automations/deprecation-audit/memory.md` |

#### Prompt

````markdown
## Task
Find one obsolete tracked VPK-rovo surface and remove it only when usage evidence proves the cleanup is safe. If no reviewable cleanup exists, stop with a no-PR report.

## Commands
Start with repo and branch safety:
```bash
git status --short --branch
git branch --show-current
git worktree list --porcelain
gh pr list --state open --search "[Automation] Deprecation audit" --json number,title,headRefName,state,isDraft
```
Run all pnpm commands via `corepack pnpm ...` so the repo-pinned pnpm version from `package.json#packageManager` is used instead of the runtime PATH pnpm.

Before editing, do not work from detached HEAD. Create or switch to `automation/deprecation-audit` only when that branch/worktree is safe and clean. Check for overlapping open or recent PRs before handoff. If a clean worktree cannot create Git lock files or switch branches safely, pivot to a fresh ignored scratch checkout or documented safe alternate worktree; if no PR is opened, clean up any temporary automation branch created by the run. Prove unused or superseded status with callers, imports, routes, docs, config, tests, git/PR state, or runtime evidence. If removal touches compatibility, replacement paths, active consumers, public APIs, or a migration boundary, consult `$deprecation-and-migration` for safe deprecation/removal guidance. If the target is a VPK React component or local wrapper, consult `$vpk-tidy` for wrapper inventory, migrate-first gates, route impact, and validation expectations before removal.

## Judgment
Keep one coherent removal or migration area per run. Prefer removing truly dead code over adding deprecation machinery. Use `deprecation-and-migration` only to verify replacement coverage, active-consumer risk, and migration completeness; do not turn one obsolete-surface cleanup into a broad migration program. Ignored local artifacts belong to `artifact-cleanup`, not this PR-producing job. Do not remove live compatibility paths or ambiguous surfaces. Do not delete retired shared UI wrappers or other local wrappers until every callsite is migrated, compilation succeeds, and no retired imports remain; follow current `vpk-tidy` inventory rather than stale path names.

## Validation
Run focused validation for the touched behavior. After any code, dependency, or config edit, run `corepack pnpm run ci:pr`. If the full gate cannot run in the sandbox, run at minimum: the focused test for the touched behavior, `corepack pnpm run lint`, `corepack pnpm run typecheck`, plus relevant verify gates (`corepack pnpm run verify:file-size` and `corepack pnpm run verify:repo-map` for removals/moves/splits, `corepack pnpm run verify:route-manifest` for route changes, `corepack pnpm run verify:catalog` / `corepack pnpm run verify:lazy-load` for component/demo changes, `corepack pnpm run verify:api-surfaces` for backend route changes, `corepack pnpm run verify:doc-scripts` for docs changes), and document which gates were skipped and why. Update only tests/docs that reference the removed or migrated surface.

## Handoff
Push the branch and create or update `[Automation] Deprecation audit: <short summary>` with labels `automation, codex, cleanup`. Include unused/superseded evidence, compatibility risk, files changed, validation, freshness/overlap check, and reviewer focus. Preserve unrelated local changes. Do not merge from this producer job; the separate review/merge workflow owns review and merge.

## Stop Conditions
Stop without editing or PR if branch/worktree state is unsafe, overlap makes behavior unclear, validation cannot support readiness, or usage is ambiguous, the target is ignored local state, live callers remain, or the change becomes a broad migration/refactor.
````

#### Memory Notes

````markdown
2026-06-26T23:11:05Z

- Run opened PR #1058, `[Automation] Deprecation audit: remove obsolete VAD assets`, from branch `automation/deprecation-audit`.
- Removed orphaned tracked `public/vad/*` assets, stale `public/vad/**` lint/doctor ignores, and the VAD-era ONNX Turbopack alias plus COOP/COEP headers in `next.config.ts`.
- Safety evidence: `@ricky0123/vad-web`, `onnxruntime-web`, and `onnxruntime-common` were already removed in commit `2c5264095`; current tracked source/package searches found no remaining references to the removed VAD assets, VAD-web, ONNX runtime, COOP/COEP headers, or `SharedArrayBuffer`.
- Validation passed: `pnpm run lint`; `pnpm run typecheck`.
- Overlap: no open deprecation-audit PR existed before branch creation or before PR creation; recent open automation PRs were in test coverage, bug scan, engineering-improvement-map, and code simplification areas.

2026-06-27T11:44:12Z

- Run stopped without edits or a new PR because the required safety checks found this checkout detached and `automation/deprecation-audit` already checked out in `/Users/esoh/.codex/worktrees/f77c/vpk-rovo`.
- Open overlap: PR #1058, `[Automation] Deprecation audit: remove obsolete VAD assets`, is still open from `automation/deprecation-audit` and already contains the coherent obsolete VAD/ONNX cleanup from the previous run.
- Existing automation worktree was clean against `origin/automation/deprecation-audit`; no temporary branch was created in this run.
- Repository labels available for the PR did not include `automation` or `cleanup`; only `codex` was present among the requested/related labels.

2026-07-04T11:48:04Z

- Run opened PR #1113, `[Automation] Deprecation audit: remove unused AI dark PNG`, from branch `automation/deprecation-audit`.
- Removed tracked `public/illustration-ai/ai/dark.png`; current Studio/sidebar-chat consumers and tests reference the SVG replacement pair `public/illustration-ai/ai/light.svg` and `public/illustration-ai/ai/dark.svg`.
- Safety evidence: exact source/test/docs/config/script searches found no `dark.png` or `/illustration-ai/ai/dark.png` references; recent 14-day history for the PNG/SVG siblings had no commits.
- Validation passed: `pnpm run lint`; `pnpm run typecheck`.
- Overlap: no open deprecation-audit PR existed before branch creation; open PRs were unrelated UI design quality and engineering improvement map automations. Only `codex` label existed among requested/related labels; PR CI was in progress at handoff.
````

### Engineering improvement map

| Field | Value |
| --- | --- |
| ID | `engineering-improvement-map` |
| Kind | cron |
| Status | ACTIVE |
| Schedule | Weekly on Friday at 10:30 AM |
| Execution environment | worktree |
| Working directory | `/Users/esoh/Documents/Labs/vpk-rovo` |
| Model | gpt-5.5 |
| Reasoning effort | xhigh |
| Created | Apr 18, 2026, 3:20 AM GMT+10 |
| Updated | Jul 7, 2026, 1:20 AM GMT+10 |
| Config source | `/Users/esoh/.codex/automations/engineering-improvement-map/automation.toml` |
| Memory source | `/Users/esoh/.codex/automations/engineering-improvement-map/memory.md` |

#### Prompt

````markdown
## Task
Review recent VPK-rovo PRs, comments, rework, validation failures, automation outcomes, and reviewer feedback. Produce 3 to 5 evidence-backed engineering-practice recommendations, and patch only the smallest repo-owned improvement when clearly safe.

## Commands
Start with repo and branch safety:
```bash
git status --short --branch
git branch --show-current
git worktree list --porcelain
gh pr list --state open --search "[Automation] Engineering improvement map" --json number,title,headRefName,state,isDraft
```
Run all pnpm commands via `corepack pnpm ...` so the repo-pinned pnpm version from `package.json#packageManager` is used instead of the runtime PATH pnpm.

Before editing, do not work from detached HEAD. Create or switch to `automation/engineering-improvement-map` only when that branch/worktree is safe and clean. Check for overlapping open or recent PRs before handoff. If a clean worktree cannot create Git lock files or switch branches safely, pivot to a fresh ignored scratch checkout or documented safe alternate worktree; if no PR is opened, clean up any temporary automation branch created by the run. Use recent PRs, review comments, fix-up commits, validation failures, issues, docs, workflow rules, and automation outcomes as evidence.

## Judgment
Avoid generic coaching and speculative trends. Classify each recommendation as one-off reminder, automation prompt rule, repo doc/AGENTS update, regression test, lint/check rule, or VPK-owned skill/rule update. Patch only small repo-owned docs, tests, checks, workflow rules, or VPK-owned rules with strong evidence and a validation path. Remain analysis-only when no patch is justified.

## Validation
Trace every recommendation to concrete evidence and explain why its durability level fits the recurrence/risk. If a patch changes code, dependency, or config, run `corepack pnpm run ci:pr`. If the full gate cannot run in the sandbox, run at minimum: the focused test for the touched behavior, `corepack pnpm run lint`, `corepack pnpm run typecheck`, plus relevant verify gates (`corepack pnpm run verify:file-size`, `corepack pnpm run verify:repo-map`, `corepack pnpm run verify:route-manifest`, `corepack pnpm run verify:catalog`, `corepack pnpm run verify:lazy-load`, `corepack pnpm run verify:api-surfaces`, or `corepack pnpm run verify:doc-scripts` as applicable), and document which gates were skipped and why. For docs/rule-only patches, `corepack pnpm run verify:doc-scripts` is the default lightweight validation when script references or documented commands changed.

## Handoff
If no patch is justified, do not push or create a PR; report the 3 to 5 recommendations with evidence, why now, durability level, next action, and repo example. If a patch is clearly safe, push the branch and create or update `[Automation] Engineering improvement map: <short summary>` with labels `automation, codex`. For a PR, include files changed, validation, and reviewer focus. Preserve unrelated local changes. Do not merge from this producer job; the separate review/merge workflow owns review and merge.

## Stop Conditions
Stop without editing or PR if branch/worktree state is unsafe, overlap makes behavior unclear, validation cannot support readiness, or evidence is unavailable or too thin, the fix would be speculative, non-repo-owned, broad, unsafe to validate, or better left to a human.
````

#### Memory Notes

````markdown
2026-07-03T17:48:13Z - Reviewed recent VPK-rovo PRs, review comments, CI failures, and automation outcomes since the prior run. Created `automation/engineering-improvement-map` from a clean detached worktree after confirming no overlapping open PR. Evidence-backed patch: PR #1111 `[Automation] Engineering improvement map: pass paper shader preview slugs` fixes the still-live PR #1099 review finding where shared Paper Shaders catalog previews inferred slug from `/visual` and fell back to `paper-mesh-gradient`. Changed `components/website/website-preview.tsx`, `components/website/demos/visual/shaders-paper-demo.tsx`, and `components/website/demos/visual/shaders-paper-demo.test.js`; commit `e20bed4ca`. Validation passed: `pnpm exec node --test components/website/demos/visual/shaders-paper-demo.test.js`, `pnpm run test:unit:js`, `pnpm run lint`, `pnpm run typecheck`, `git diff --check`. GitHub PR checks were still in progress at handoff; repo label `automation` was unavailable, so only `codex` was applied.

Recommendations carried forward from this run: (1) shared catalog previews need explicit identity rather than route inference, best guarded by regression/source-contract tests; (2) source-contract tests should include negative or ordered assertions, based on PR #1105 and PR #1086 review rework; (3) automation prompts should preserve existing opt-out/disabled affordances when changing global observers or optional controls, based on PR #1110, PR #1101, and PR #1089; (4) lockfile registry policy should remain a fast lint/check gate and CI install failures should be inspected before product-code rework, based on recent Atlassian package 404 failures and PR #1106/#1105 hardening.
````

### Frontend runtime audit

| Field | Value |
| --- | --- |
| ID | `frontend-runtime-audit` |
| Kind | cron |
| Status | ACTIVE |
| Schedule | Weekly on Tuesday, Thursday, and Saturday at 1:30 AM |
| Execution environment | worktree |
| Working directory | `/Users/esoh/Documents/Labs/vpk-rovo` |
| Model | gpt-5.5 |
| Reasoning effort | xhigh |
| Created | May 2, 2026, 8:08 PM GMT+10 |
| Updated | Jul 7, 2026, 1:21 AM GMT+10 |
| Config source | `/Users/esoh/.codex/automations/frontend-runtime-audit/automation.toml` |
| Memory source | `/Users/esoh/.codex/automations/frontend-runtime-audit/memory.md` |

#### Prompt

````markdown
## Task
Inspect one recently touched VPK-rovo frontend route or component for a browser-visible runtime regression. Fix only when reproducible, narrow, and review-ready.

## Commands
Start with repo and branch safety:
```bash
git status --short --branch
git branch --show-current
git worktree list --porcelain
gh pr list --state open --search "[Automation] Frontend runtime audit" --json number,title,headRefName,state,isDraft
```
Run all pnpm commands via `corepack pnpm ...` so the repo-pinned pnpm version from `package.json#packageManager` is used instead of the runtime PATH pnpm.

Before editing, do not work from detached HEAD. Create or switch to `automation/frontend-runtime-audit` only when that branch/worktree is safe and clean. Check for overlapping open or recent PRs before handoff. If a clean worktree cannot create Git lock files or switch branches safely, pivot to a fresh ignored scratch checkout or documented safe alternate worktree; if no PR is opened, clean up any temporary automation branch created by the run. Use source inspection, route/component evidence, console logs, screenshots, a11y checks, reproducible interactions, and browser validation when practical. Use `npx agent-browser` first for browser testing, local web verification, screenshots, UI probes, isolated/public pages, visual debugging, responsive checks, and unauthenticated verification, regardless of whether the run is in Codex App. Do not use `@Browser` as the default path; treat it as unavailable unless the user explicitly asks for it. Use `@Chrome` only when signed-in state, cookies, extensions, existing browser tabs, or multi-tab authenticated browser work matters. Fall back to the Playwright CLI only when `agent-browser` is unavailable or blocked. For local browser checks, start frontend/backend with `corepack pnpm run dev:tmux:start` when needed and use `corepack pnpm ports` or `.dev-frontend-port` / `.dev-backend-port` for actual URLs; do not assume default ports. For Next-specific root causes such as RSC/client boundaries, async `params`/`searchParams`, route handlers, metadata, image/script handling, Suspense boundaries, or hydration behavior, consult `$vercel:nextjs`. For CSS or browser-platform runtime issues such as dialogs/popovers, forms/autofill, scroll or motion behavior, container/anchor queries, content visibility, image priority, or other clientside web APIs, consult `$modern-web-guidance` before implementing the fix. Use `$motion` when reproducing or fixing issues in Motion for React code, `motion/react` imports, `MotionConfig`, `AnimatePresence`, MotionValues, variants, layout animations, drag/gesture motion, exit transitions, or reduced-motion handling. Use `$motion-audit` when the runtime issue involves animation jank, layout thrash, compositor/paint cost, `will-change`, frame drops, or missing reduced-motion safeguards. Use `$userinterface-wiki` only when the reproducible regression is motion UX behavior such as confusing timing, broken staging, excessive/incorrect exit animation, or hover/press feel that violates an existing local contract. For Tailwind motion classes, treat `app/tailwind-theme.css` as the source of truth, keep semantic duration/easing utilities, verify ADS values with official ADS docs or `@atlaskit/tokens` artifacts, and do not replace semantic tokens with hardcoded timing values.

## Judgment
Good targets include console errors, hydration/SSR mismatches, broken interactions, unusable loading/error/empty states, keyboard/focus failures, blank screens, obvious route crashes, and browser-only regressions. Restore runtime behavior without drifting into design polish or CSS organization. Use Next, web-platform, and motion guidance only to verify the narrow root cause and repair path; do not turn a runtime fix into a route migration, visual redesign, broad CSS cleanup, or subjective animation retuning. Preserve existing browser-backed tests, accessible-name assertions, route-local motion contracts, reduced-motion behavior, and focus contracts unless fresh evidence proves the contract changed.

## Validation
Run focused validation for the touched behavior. After any code, dependency, or config edit, run `corepack pnpm run ci:pr`. If the full gate cannot run in the sandbox, run at minimum: the focused test for the touched behavior, `corepack pnpm run lint`, `corepack pnpm run typecheck`, plus relevant verify gates (`corepack pnpm run verify:file-size` and `corepack pnpm run verify:repo-map` for file moves/splits, `corepack pnpm run verify:route-manifest` for route changes, `corepack pnpm run verify:catalog` / `corepack pnpm run verify:lazy-load` for component/demo changes, `corepack pnpm run verify:api-surfaces` for backend route changes, `corepack pnpm run verify:doc-scripts` for docs changes), and document which gates were skipped and why. Use browser validation when practical, and state which browser route was used or why browser proof was unavailable. Use ADS/localhost accessibility tooling such as `ads_analyze_localhost_a11y` when available for UI-affecting fixes, plus keyboard/focus and responsive notes when relevant. For motion/runtime fixes, include the specific route, interaction, reduced-motion or animation state checked, and any console evidence.

## Handoff
Push the branch and create or update `[Automation] Frontend runtime audit: <short summary>` with labels `automation, codex, bugfix`. Include reproduction evidence, root cause, fix, validation, freshness/overlap check, and reviewer focus. Preserve unrelated local changes. Do not merge from this producer job; the separate review/merge workflow owns review and merge.

## Stop Conditions
Stop without editing or PR if branch/worktree state is unsafe, overlap makes behavior unclear, validation cannot support readiness, or the issue is speculative, design-only, expected behavior is unclear, browser evidence cannot support the fix, animation feel is subjective without a runtime contract, or the change becomes broad UI redesign/CSS cleanup.
````

#### Memory Notes

````markdown
## 2026-07-01T15:42:35Z

- Run target: recently touched `/jira` route from the large Jira rename/sidebar work (`components/projects/jira/page.tsx`, `app/jira/page.tsx`).
- Safety: initial worktree was clean but detached at `ddcc17572`; created `automation/frontend-runtime-audit`, found no open matching automation PR, then deleted the temporary branch because no PR was opened.
- Browser tooling: `agent-browser` was tried first but could not launch Chrome in this sandbox (`DevToolsActivePort` / early Chrome exit). Playwright CLI fallback also required sandboxed cache setup and then failed Chromium launch with macOS Mach port permission denial.
- Runtime evidence: direct `node scripts/dev-frontend.js` served the worktree on `http://localhost:3060`; `curl http://localhost:3060/jira` returned HTTP 200 and the Next dev log showed `GET /jira 200` after compiling. This is not sufficient browser proof for a browser-visible runtime regression.
- Outcome: no tracked edits, no PR. Stop condition was browser evidence unavailable for a reproducible fix.

## 2026-07-03T15:38:09Z

- Run target: recently merged browser title prefix work (`app/layout.tsx`, `components/utils/document-title-prefix.tsx`, `lib/document-title-prefix.ts`) from PR #1110.
- Safety: initial worktree was clean but detached at `ea880e88e`; created `automation/frontend-runtime-audit`, found no open matching automation PR and no open main PR overlap, then deleted the temporary branch because no PR was opened.
- Browser tooling: loaded `agent-browser` core guidance, used `npx agent-browser` against the worktree Portless URL `https://frontend-runtime-audit.vpk-rovo.localhost`; loaded modern-web-guidance and found only low-similarity generic guidance, so no guide was retrieved.
- Runtime evidence: root title rendered as `frontend-runtime-audit.vpk-rovo:V—P—K: Venn Prototype Kit`; client navigation to `/components/projects/studio` updated to `frontend-runtime-audit.vpk-rovo:Studio — Projects — VPK`; `agent-browser errors` was empty and console output was limited to dev HMR/React Grab logs.
- Artifact: saved ignored screenshot `output/agent-browser/frontend-runtime-audit-studio.png`.
- Outcome: no reproducible browser-visible regression, no tracked edits, no PR. Stopped dev tmux and closed the browser session.
````

### Interface contract audit

| Field | Value |
| --- | --- |
| ID | `interface-contract-audit` |
| Kind | cron |
| Status | ACTIVE |
| Schedule | Weekly on Monday and Thursday at 5:30 AM |
| Execution environment | worktree |
| Working directory | `/Users/esoh/Documents/Labs/vpk-rovo` |
| Model | gpt-5.5 |
| Reasoning effort | xhigh |
| Created | Apr 30, 2026, 2:55 PM GMT+10 |
| Updated | Jul 7, 2026, 1:21 AM GMT+10 |
| Config source | `/Users/esoh/.codex/automations/interface-contract-audit/automation.toml` |
| Memory source | `/Users/esoh/.codex/automations/interface-contract-audit/memory.md` |

#### Prompt

````markdown
## Task
Audit one recently touched VPK-rovo interface boundary for a concrete contract mismatch or fragility. Patch only when the contract and fix are narrow and review-ready.

## Commands
Start with repo and branch safety:
```bash
git status --short --branch
git branch --show-current
git worktree list --porcelain
gh pr list --state open --search "[Automation] Interface contract audit" --json number,title,headRefName,state,isDraft
```
Run all pnpm commands via `corepack pnpm ...` so the repo-pinned pnpm version from `package.json#packageManager` is used instead of the runtime PATH pnpm.

Before editing, do not work from detached HEAD. Create or switch to `automation/interface-contract-audit` only when that branch/worktree is safe and clean. Check for overlapping open or recent PRs before handoff. If a clean worktree cannot create Git lock files or switch branches safely, pivot to a fresh ignored scratch checkout or documented safe alternate worktree; if no PR is opened, clean up any temporary automation branch created by the run. Inspect callers/callees, route handlers, API schemas, message/data parts, component props, config contracts, tests, and recent diffs. When the boundary is a REST/API, module, message/data, storage, config, or public type contract, consult `$api-and-interface-design` for stable contract and boundary guidance. When the boundary is a component prop, context/provider, compound component, render-prop/children, reusable component API, or boolean-prop variant contract, consult `$vercel-composition-patterns`. When the boundary is a Next.js route handler, server action, RSC/client boundary, async route API, metadata, image/font/script convention, Suspense boundary, hydration contract, or route file convention, consult `$vercel:nextjs`. When the boundary is a VPK component prop, context, or wrapper contract under `app/**` or `components/**`, consult `$vpk-tidy` for prop typing, placement, wrapper-migration gates, and route/accessibility validation expectations.

## Judgment
Prefer boundaries where producer/consumer expectations can be proven: API request/response shape, UI message data, storage format, config/env semantics, component prop contract, or script CLI behavior. Use `api-and-interface-design` to clarify observable behavior, error semantics, validation-at-boundary expectations, and additive-versus-breaking contract changes; do not use it to invent broad API redesigns. Use composition and Next guidance to clarify the existing contract and avoid unsafe API shapes, not to rename public contracts or broaden into architecture work. Do not invent abstract interface cleanup, rename public contracts without migration need, or broaden into architecture work. Keep component contract fixes local unless evidence shows a shared primitive or migration is required.

## Validation
Run focused validation for the touched behavior and add or update focused contract coverage when practical. After any code, dependency, or config edit, run `corepack pnpm run ci:pr`. If the full gate cannot run in the sandbox, run at minimum: the focused test for the touched behavior, `corepack pnpm run lint`, `corepack pnpm run typecheck`, plus relevant verify gates (`corepack pnpm run verify:file-size` and `corepack pnpm run verify:repo-map` for file moves/splits, `corepack pnpm run verify:route-manifest` for route changes, `corepack pnpm run verify:catalog` / `corepack pnpm run verify:lazy-load` for component/demo changes, `corepack pnpm run verify:api-surfaces` for backend route changes, `corepack pnpm run verify:doc-scripts` for docs changes), and document which gates were skipped and why.

## Handoff
Push the branch and create or update `[Automation] Interface contract audit: <short summary>` with labels `automation, codex, bugfix`. Include contract evidence, mismatch or risk, fix, validation, freshness/overlap check, and reviewer focus. Preserve unrelated local changes. Do not merge from this producer job; the separate review/merge workflow owns review and merge.

## Stop Conditions
Stop without editing or PR if branch/worktree state is unsafe, overlap makes behavior unclear, validation cannot support readiness, or the contract is ambiguous, callers disagree intentionally, or the change would require a broad migration.
````

#### Memory Notes

````markdown
# Interface Contract Audit Memory

## 2026-07-05T19:38:31Z
- Started from clean detached HEAD `ea880e88e8d76a29debc90960dc103932b0f7cbf`; created `automation/interface-contract-audit`.
- Audited recent boundaries after the 2026-07-01 run and avoided overlap with prior TileAvatar/Lozenge interface PRs and open PRs #1111-#1116.
- Patched the Studio agent creation prompt contract in `components/projects/studio/lib/studio-agent-creation-context.ts`: `knowledge` arrays now explicitly use bare app ids like `confluence`, while `@[knowledge:...]` tokens use two-segment ids like `confluence:all`; template `@[app:id]` tokens are preserved.
- Added focused assertions in `components/projects/studio/lib/studio-agent-creation-context.test.js`.
- Validation passed: `node --test components/projects/studio/lib/studio-agent-creation-context.test.js`; `node --test app/data/directory/repair-agent-result.test.js app/data/directory/agent-generation-e2e.test.js`; `pnpm run lint`; `pnpm run typecheck`.
- Opened PR #1117: `[Automation] Interface contract audit: tighten Studio knowledge prompt contract`. Requested `automation`, `bugfix`, and `codex-automation` labels were unavailable; PR has `codex`.
````

### Performance audit

| Field | Value |
| --- | --- |
| ID | `performance-audit` |
| Kind | cron |
| Status | ACTIVE |
| Schedule | Weekly on Wednesday and Sunday at 3:30 AM |
| Execution environment | worktree |
| Working directory | `/Users/esoh/Documents/Labs/vpk-rovo` |
| Model | gpt-5.5 |
| Reasoning effort | xhigh |
| Created | Apr 18, 2026, 3:25 AM GMT+10 |
| Updated | Jul 7, 2026, 1:21 AM GMT+10 |
| Config source | `/Users/esoh/.codex/automations/performance-audit/automation.toml` |
| Memory source | `/Users/esoh/.codex/automations/performance-audit/memory.md` |

#### Prompt

````markdown
## Task
Find one small VPK-rovo performance improvement with clear evidence and a safe review surface. If no measured or defensible hot path exists, report findings and do not create a PR.

## Commands
Start with repo and branch safety:
```bash
git status --short --branch
git branch --show-current
git worktree list --porcelain
gh pr list --state open --search "[Automation] Performance audit" --json number,title,headRefName,state,isDraft
```
Run all pnpm commands via `corepack pnpm ...` so the repo-pinned pnpm version from `package.json#packageManager` is used instead of the runtime PATH pnpm.

Before editing, do not work from detached HEAD. Create or switch to `automation/performance-audit` only when that branch/worktree is safe and clean. Check for overlapping open or recent PRs before handoff. If a clean worktree cannot create Git lock files or switch branches safely, pivot to a fresh ignored scratch checkout or documented safe alternate worktree; if no PR is opened, clean up any temporary automation branch created by the run. Gather baseline evidence with the narrowest useful tool: timing, trace, benchmark, bundle/source-size check, render count, repeated-work counter, logs, browser performance evidence, or source hot-path proof. For bundle-sensitive work, start with `corepack pnpm run perf:budget:warn` as the default manual baseline. When route load timing is in scope, run `corepack pnpm run perf:baseline`, then pass this worktree's Portless URL to `corepack pnpm run perf:baseline:timing -- --base-url <URL>`. Do not commit `output/perf-baseline.json`.

For general frontend, backend, API, or runtime bottlenecks, consult `$performance-optimization` for measure-identify-fix-verify guidance. For React/Next UI, data fetching, rendering, hydration, bundle size, or server components, consult `$vercel-react-best-practices` while keeping repo rules and nearby conventions higher priority. For Next-specific hot paths such as RSC/server data waterfalls, route handlers, image/font/script handling, Suspense boundaries, metadata, bundling, or hydration behavior, consult `$vercel:nextjs`. For browser-platform performance topics such as Core Web Vitals, LCP/INP, content visibility, Fetch Priority, image optimization, scroll/motion behavior, or other clientside web APIs, consult `$modern-web-guidance` before implementing a browser-facing optimization. Use `$motion-audit` when the hot path involves CSS animations, Motion for React, `AnimatePresence`, MotionValues, layout animations, `will-change`, transform/opacity versus layout properties, reduced-motion behavior, compositor/paint/layout cost, or slow/janky animations. Use `$motion` when implementing a Motion for React fix or changing `motion/react` code. Use `$userinterface-wiki` only to check that a motion performance fix preserves interaction clarity and does not replace a proven perf issue with distracting or contract-breaking animation. For Tailwind motion classes, treat `app/tailwind-theme.css` as the source of truth, keep semantic duration/easing utilities, verify ADS values with official ADS docs or `@atlaskit/tokens` artifacts, and avoid hardcoded timing values unless no semantic token exists.

## Judgment
Optimize only when evidence identifies a real hot path, bottleneck, repeated cost, animation jank, frame-drop risk, or regression. Use `performance-optimization` and `motion-audit` to choose the right measurement and verify the before/after impact; do not use them to justify speculative memoization, caching, bundling, concurrency changes, blanket `will-change`, or animation rewrites. Use React, Next, modern web, and motion guidance only after evidence identifies the relevant layer, and keep the patch to the smallest proven bottleneck. Preserve correctness, security, accessibility, SSR determinism, maintainability, reduced-motion behavior, route-local motion contracts, and data integrity.

## Validation
Run focused validation for the touched behavior and record baseline/treatment evidence when proving a performance claim. After any code, dependency, or config edit, run `corepack pnpm run ci:pr`. If the full gate cannot run in the sandbox, run at minimum: the focused test for the touched behavior, `corepack pnpm run lint`, `corepack pnpm run typecheck`, plus relevant verify gates (`corepack pnpm run verify:file-size` and `corepack pnpm run verify:repo-map` for file moves/splits or size-sensitive changes, `corepack pnpm run verify:route-manifest` for route changes, `corepack pnpm run verify:catalog` / `corepack pnpm run verify:lazy-load` for component/demo changes, `corepack pnpm run verify:api-surfaces` for backend route changes, `corepack pnpm run verify:doc-scripts` for docs changes), and document which gates were skipped and why. For motion performance fixes, name the animated properties, the render-pipeline cost reduced, and the route/interaction checked. Name the invariant that stayed true and add a focused assertion when practical.

## Handoff
Push the branch and create or update `[Automation] Performance audit: <short summary>` with labels `automation, codex, performance`. Include evidence, expected impact, invariant preserved, validation, freshness/overlap check, and reviewer focus. Preserve unrelated local changes. Do not merge from this producer job; the separate review/merge workflow owns review and merge.

## Stop Conditions
Stop without editing or PR if branch/worktree state is unsafe, overlap makes behavior unclear, validation cannot support readiness, or evidence is weak, optimization is speculative, correctness/accessibility/security could change, animation feel is subjective without measured cost, or the fix becomes a broad refactor.
````

#### Memory Notes

````markdown
# Performance Audit Automation Memory

## 2026-07-04T17:43:43Z

- Created `automation/performance-audit` from a clean detached worktree after confirming no open matching PR and no local/remote branch collision.
- Shipped PR #1114, `[Automation] Performance audit: precompute skill draft sort timestamps`, for `backend/lib/hermes-skill-drafts.js`.
- Evidence: `createHermesSkillDraftManager().listDrafts()` over a 3,000-record synthetic draft index improved from median/p90 `8.361ms` / `9.339ms` to `2.552ms` / `3.211ms`; checksum stayed `150850`.
- Guard: added `backend/lib/hermes-skill-drafts.test.js` coverage for newest-first order and exactly one `Date.parse` call per normalized draft.
- Validation passed: `node --test backend/lib/hermes-skill-drafts.test.js`, `pnpm run lint`, `pnpm run typecheck`, and `git diff --check`.
- Labels: only `codex` was available; `automation`, `performance`, and `codex-automation` were not present in the repo label list.
````

### Standup summary

| Field | Value |
| --- | --- |
| ID | `standup-summary` |
| Kind | heartbeat |
| Status | ACTIVE |
| Schedule | Daily at 9:30 AM, 1:30 PM, and 5:30 PM |
| Target thread ID | `019e7e5b-4b78-7d51-b68f-eae310323092` |
| Created | May 31, 2026, 3:39 PM GMT+10 |
| Updated | Jul 7, 2026, 1:22 AM GMT+10 |
| Config source | `/Users/esoh/.codex/automations/standup-summary/automation.toml` |
| Memory source | `/Users/esoh/.codex/automations/standup-summary/memory.md` |

#### Prompt

````markdown
## Role
Create a read-only standup summary for the VPK-rovo repository. Keep the user current on high-signal repo activity without managing Codex threads or doing implementation work.

## Goal
Produce a concise, high-signal summary of what changed since the last successful automation run. Prioritize impact and follow-up risk over completeness.

## Evidence Sources
Use current GitHub and local repository evidence. GitHub PRs, issues, checks, and commits are the primary sources for completed and reviewable work. Inspect local repo files only when they add useful context.

High-signal areas include:
- Merged PRs, open PRs, GitHub issues, status checks, and automation PR outcomes.
- Local git history when GitHub search looks incomplete or merge commits need context.
- CI and workflow files when checks fail or automation behavior changes.
- Package manifests, lockfiles, and workspace config when dependency or package-manager changes land.
- Core project docs and rules, such as `AGENTS.md`, `.agents/docs/`, `.agents/rules/`, and workflow docs, when guidance or process changes land.
- Runtime and automation configuration surfaces when they explain a visible change or follow-up risk.

Do not treat local-only worktrees, branches, Codex threads, Claude worktrees, or chat history as portfolio state unless the user explicitly asks to inspect them.

## Observation Window
Use the time since the previous successful automation run only when it is current and supported by runtime or target-thread evidence. Do not trust stale memory windows. If that evidence is unavailable or older than the current heartbeat cadence, use the current cadence interval as the lookback window.

Use concrete timestamps in commands when needed, but translate them into plain language before showing them to the user. If a merged search looks suspiciously empty, retry with a broader recent window or inspect known recent PRs before concluding there were no merges.

## Date Display
For user-facing output, use plain language with a timezone label, for example:
- `May 29, 2026 at 11:29 PM AEST`
- `from May 29 at 11:29 PM AEST to May 30 at 3:29 AM AEST`

## PR Reference Format
Whenever a pull request appears in the user-facing summary or Watchlist, include both its number and title. Prefer this format:

- `#942 - [Automation] UI design quality audit: fix JSON-render badge aliases`

Do not refer to a PR by number alone unless the title is genuinely unavailable after inspecting GitHub. If the same PR is mentioned multiple times, include the full number and title on first mention, then use a short natural reference afterward.

## Default Evidence Commands
Use read-only commands only. Run local repo commands from the automation working directory. Compute `<window-start>` from the Observation Window section. For merged PRs, fetch a broad recent list and apply the `<window-start>` cutoff locally instead of relying only on GitHub merged-search filters.

```bash
gh pr list --state open --json number,title,author,isDraft,mergeStateStatus,reviewDecision,headRefName,updatedAt,labels,statusCheckRollup
gh pr list --state merged --limit 80 --json number,title,author,mergedAt,files,labels,headRefName
gh issue list --state open --json number,title,author,labels,updatedAt,assignees
gh pr list --state all --search '"[Automation]" updated:>=<window-start>' --json number,title,author,state,isDraft,headRefName,updatedAt,mergedAt,closedAt,labels,reviewDecision,mergeStateStatus,statusCheckRollup
git log --since=<window-start> --oneline --decorate --max-count=50
git diff --name-only HEAD~20..HEAD
```

For unclear or important items, inspect only the relevant PR, issue, check, run, commit, or local file details:

```bash
gh pr view <number> --json number,title,author,state,mergedAt,mergeCommit,headRefName,labels,statusCheckRollup,url,files,body
git show --stat --oneline --no-renames <commit>
```

Use local file inspection selectively. Do not scan broad generated directories or produce file-by-file inventories.

## What To Include
Cluster related changes into 3-7 key bullets. Focus on:
- Major merged PRs and their user or system impact.
- Notable bug fixes, incidents, and risky areas touched.
- Security or dependency-related changes.
- CI, workflow, package-manager, repo-guidance, or runtime configuration changes that affect how the project is built, tested, shipped, or maintained.
- Automation outcomes that opened, updated, merged, closed, blocked, or need attention.
- Follow-ups worth attention: missing tests, rollout risk, possible regressions, failing checks, stale PRs, or open issues.

Do not list every PR if several are low-signal. Group small related PRs into a theme and cite concrete evidence from commits, PRs, checks, issues, or touched high-signal files for every material claim.

## Judgment
Notify only for actionable, surprising, blocked, stale, or summary-worthy changes:
- One or more meaningful PRs merged in the observation window.
- Open PRs need review, have failed checks, blocked merge state, or are stale and important.
- Automation PRs changed state or need intervention.
- Issues are new, recently updated, blocked, or prioritization-relevant.
- Local high-signal repo changes affect dependencies, CI, docs/rules, runtime config, or release safety.

Stay quiet when there are no open PRs needing attention, no meaningful merged PRs, no automation PR activity, no issue changes, no high-signal local changes, and no watchlist risks.

## Safety Boundaries
Do not create branches, commits, PRs, labels, reviews, merges, issues, worktrees, cleanup actions, Slack posts, external messages, or destructive changes. Do not create, search, pin, rename, or send messages to Codex threads from this automation. Do not claim Slack, GitHub, Codex thread, repo, or automation facts unless current tool or command evidence supports them.

## Output Format
Write one clear Codex chat message.

Include:
- `Standup summary`
- `Date range: <human-readable start with timezone> to <human-readable end with timezone>`
- 3-7 key bullets of meaningful changes, each with concrete PR number + title, commit, check, issue, or local file evidence.
- `Watchlist` section with 1-3 risks or pending follow-ups.

If there are no real risks, say `Watchlist: No immediate follow-ups.`
If there are no open PRs, say `No open PRs to review.`
If no automation PR activity is visible in the observation window, say `No automation PR activity visible in this window.`
Avoid raw command dumps. Prefer themes over file-by-file inventories.

## Stop Rules
Stop rather than inventing details if PR data, commit history, or check evidence is unavailable. Report the missing evidence briefly.
````

#### Memory Notes

````markdown
# Standup summary automation memory

- Preference update: user asked on 2026-06-01 to make this automation a heartbeat. Future runs should stay read-only and return a terse heartbeat-style digest: only notify for meaningful PR/issue/CI/automation movement, otherwise say the window was quiet and avoid broad local-only worktree detail.
- Configuration update: user clarified on 2026-06-01 that they meant changing the automation metadata to `kind = "heartbeat"`. Updated `/Users/esoh/.codex/automations/standup-summary/automation.toml` accordingly and left the prompt/schedule unchanged.
- Repair update: restored the missing `target_thread_id = "019e702d-562a-7a63-b676-60ffbb100f74"` binding after verifying prior heartbeat memory said this field was required to keep the standup summary attached to the same chat thread. Refreshed `updated_at` to `1780241537000`.
- Retarget update: user could not see the old heartbeat thread and asked whether a new thread id could be started. On 2026-06-01T01:35:32+1000 AEST, retargeted the automation to the newer visible Standup summary thread `019e7e5b-4b78-7d51-b68f-eae310323092` from the local session index. Left the current `status` unchanged.

- Last successful run: 2026-05-31T20:06:52+1000 AEST
- Observation window used: 2026-05-30T20:05:31+1000 AEST to 2026-05-31T20:06:52+1000 AEST
- No prior memory existed, so this run used a 24-hour standup window.
- Evidence checked: GitHub open PRs, merged PRs since 2026-05-30, open issues, automation-tagged PR activity, local git log since 2026-05-30T10:05:31Z, and recent changed files.
- Outcome: no open PRs, no open issues, no visible automation PR activity. Main activity was 38 merged PRs from #492 through #529, clustered around Studio/agent-template UI polish, Visual catalog additions, ui-custom catalog additions, top-navigation responsiveness, Avatar badges, and pnpm/React Doctor config.

- Last successful run: 2026-06-01T00:06:46+1000 AEST
- Observation window used: 2026-05-31T20:05:11+1000 AEST to 2026-06-01T00:06:46+1000 AEST
- Evidence checked: GitHub open PRs, merged PRs with exact and broader date searches, all PR/issue updates since the exact window start, automation-tagged PR activity, local git log since the exact window start, current HEAD, and local working-tree status.
- Outcome: no open PRs, no open issues, no merged PRs or PR/issue updates in the exact window, and no automation PR activity. Latest local/GitHub activity remained PR #529 / commit f03998d5 before the window. Local checkout was dirty in six UI/test files; treated as local-only work, not completed portfolio state.
````

### Test coverage

| Field | Value |
| --- | --- |
| ID | `test-coverage` |
| Kind | cron |
| Status | ACTIVE |
| Schedule | Weekly on Tuesday and Friday at 6:30 AM |
| Execution environment | worktree |
| Working directory | `/Users/esoh/Documents/Labs/vpk-rovo` |
| Model | gpt-5.5 |
| Reasoning effort | xhigh |
| Created | Apr 19, 2026, 4:17 PM GMT+10 |
| Updated | Jul 7, 2026, 1:20 AM GMT+10 |
| Config source | `/Users/esoh/.codex/automations/test-coverage/automation.toml` |
| Memory source | `/Users/esoh/.codex/automations/test-coverage/memory.md` |

#### Prompt

````markdown
## Task
Inspect recent merged VPK-rovo code and add the minimum useful tests for one meaningful business, contract, or regression risk. If no material gap exists, stop with a no-PR report.

## Commands
Start with repo and branch safety:
```bash
git status --short --branch
git branch --show-current
git worktree list --porcelain
gh pr list --state open --search "[Automation] Test coverage" --json number,title,headRefName,state,isDraft
```
Run all pnpm commands via `corepack pnpm ...` so the repo-pinned pnpm version from `package.json#packageManager` is used instead of the runtime PATH pnpm.

Before editing, do not work from detached HEAD. Create or switch to `automation/test-coverage` only when that branch/worktree is safe and clean. Check for overlapping open or recent PRs before handoff. If a clean worktree cannot create Git lock files or switch branches safely, pivot to a fresh ignored scratch checkout or documented safe alternate worktree; if no PR is opened, clean up any temporary automation branch created by the run. Inspect recent merges, changed files, existing nearby tests, and public contracts before writing tests.

## Judgment
Prioritize new untested paths, production bug fixes, edge-case logic, parsing, concurrency, permissions, auth, data validation, shared utilities, API contracts, and user-visible behavior. Tests should assert public contracts, observable behavior, state, output, or stable source declarations. Avoid trivial snapshots, cosmetic tests, brittle formatting assertions, skipped tests, flaky timing tests, and broad test sweeps.

## Validation
Run the relevant focused test target. When adding JS unit or source-contract tests intended to gate PRs, verify they are included by `corepack pnpm run test:unit:js` or update `scripts/run-js-unit-tests.mjs` deliberately. After any code, dependency, or config edit, run `corepack pnpm run ci:pr`. If the full gate cannot run in the sandbox, run at minimum: the focused test for the touched behavior, `corepack pnpm run lint`, `corepack pnpm run typecheck`, plus relevant verify gates (`corepack pnpm run verify:file-size` and `corepack pnpm run verify:repo-map` for file moves/splits, `corepack pnpm run verify:route-manifest` for route changes, `corepack pnpm run verify:catalog` / `corepack pnpm run verify:lazy-load` for component/demo changes, `corepack pnpm run verify:api-surfaces` for backend route changes, `corepack pnpm run verify:doc-scripts` for docs changes), and document which gates were skipped and why. Production code changes must be limited to tiny testability refactors.

## Handoff
Push the branch and create or update `[Automation] Test coverage: <short summary>` with labels `automation, codex, tests`. Include risk covered, tests added/updated, validation, freshness/overlap check, limitations, and reviewer focus. Preserve unrelated local changes. Do not merge from this producer job; the separate review/merge workflow owns review and merge.

## Stop Conditions
Stop without editing or PR if branch/worktree state is unsafe, overlap makes behavior unclear, validation cannot support readiness, or the test would be low-signal or brittle, behavior is ambiguous, overlap makes the assertion unclear, or production changes would exceed tiny testability work.
````

#### Memory Notes

````markdown
# Test Coverage Automation Memory

## 2026-06-30T16:58:26Z

- Started in `/Users/esoh/.codex/worktrees/847a/vpk-rovo` on a clean detached HEAD at `99c20acd0`, created `automation/test-coverage`, fetched `origin/main`, and confirmed no open `[Automation] Test coverage` PR overlapped.
- Inspected recent merged work since the previous run. Selected PR #1060 (`Hide empty-result popup for / and @ suggestion filters`) because the user-visible editor regression had browser validation but no durable unit/source contract.
- Added `components/ui-custom/rich-text-editor/suggestion-menu-empty-popup.test.js` to assert slash and mention empty filters set popup `display: none` and return before rendering no-results rows. Added only that exact file to `scripts/run-js-unit-tests.mjs` so CI gates it without broadening to all rich-text editor source-contract tests.
- Validation passed: `node --test components/ui-custom/rich-text-editor/suggestion-menu-empty-popup.test.js`, `pnpm run test:unit:js`, `pnpm run lint`, `pnpm run typecheck`, and `git diff --check`.
- Opened PR #1086: `[Automation] Test coverage: empty suggestion popups` from `automation/test-coverage` to `main`. Applied available `codex` label; `automation`, `tests`, and `codex-automation` labels were not present. CI `PR checks` was in progress at handoff.

## 2026-07-02T21:39:12Z

- Started in `/Users/esoh/.codex/worktrees/4f80/vpk-rovo` on a clean detached HEAD at `eca58c67d`, created `automation/test-coverage`, fetched `origin/main`, and confirmed no open `[Automation] Test coverage` PR overlapped.
- Inspected recent merged work since the previous run and selected the CI lockfile registry verifier path from the registry-resolution changes because `@atlassian/logo-third-party` is a narrow allowed `atlassian-npm` exception without direct test coverage.
- Added one focused assertion to `scripts/verify-pnpm-lockfile.test.js` proving `@atlassian/logo-third-party` tarball URLs from `atlassian-npm` produce no findings while existing broad blocked-registry tests remain intact.
- Validation passed: `node --test scripts/verify-pnpm-lockfile.test.js`, `node scripts/verify-pnpm-lockfile.js`, `git diff --check`, and with repo-pinned pnpm via Corepack: `corepack pnpm install --frozen-lockfile --prefer-offline`, `corepack pnpm run test:unit:js`, `corepack pnpm run lint`, and `corepack pnpm run typecheck`.
- Bare `pnpm run test:unit:js`, `pnpm run lint`, and `pnpm run typecheck` failed before repo scripts because PATH resolved to Codex runtime pnpm 11.7.0, whose supply-chain preflight rejects nine existing Atlaskit tarball URL metadata mismatches; Corepack resolved the repo-pinned pnpm 11.1.2 and passed.
- Opened PR #1105: `[Automation] Test coverage: lockfile allowlist` from `automation/test-coverage` to `main`. Applied available `codex` label; `automation`, `tests`, and `codex-automation` labels were not present. CI `PR checks` was in progress at handoff.
````

### UI design quality audit

| Field | Value |
| --- | --- |
| ID | `ui-design-quality-audit` |
| Kind | cron |
| Status | ACTIVE |
| Schedule | Weekly on Wednesday and Saturday at 7:30 AM |
| Execution environment | worktree |
| Working directory | `/Users/esoh/Documents/Labs/vpk-rovo` |
| Model | gpt-5.5 |
| Reasoning effort | xhigh |
| Created | May 2, 2026, 8:01 PM GMT+10 |
| Updated | Jul 7, 2026, 1:21 AM GMT+10 |
| Config source | `/Users/esoh/.codex/automations/ui-design-quality-audit/automation.toml` |
| Memory source | `/Users/esoh/.codex/automations/ui-design-quality-audit/memory.md` |

#### Prompt

````markdown
## Task
Audit recent VPK-rovo UI/CSS changes for one high-confidence design-system drift, CSS drift item, or reusable-component quality issue. Catch real contract drift, not subjective aesthetic preference.

## Commands
Start with repo and branch safety:
```bash
git status --short --branch
git branch --show-current
git worktree list --porcelain
gh pr list --state open --search "[Automation] UI design quality audit" --json number,title,headRefName,state,isDraft
```
Run all pnpm commands via `corepack pnpm ...` so the repo-pinned pnpm version from `package.json#packageManager` is used instead of the runtime PATH pnpm.

Before editing, do not work from detached HEAD. Create or switch to `automation/ui-design-quality-audit` only when that branch/worktree is safe and clean. Check for overlapping open or recent PRs before handoff. If a clean worktree cannot create Git lock files or switch branches safely, pivot to a fresh ignored scratch checkout or documented safe alternate worktree; if no PR is opened, clean up any temporary automation branch created by the run. Use `AGENTS.md`, token/design rules, `app/globals.css`, theme files, recent diffs, screenshots, browser checks, accessibility/focus behavior, and exact source evidence. Use `$modern-web-guidance` before diagnosing CSS or browser-platform drift such as dialogs/popovers, forms/autofill, anchor or container queries, scroll/motion behavior, backdrop/filter effects, image priority, or other clientside web APIs. Use `$motion` when touched code uses Motion for React, `motion/react`, `MotionConfig`, `AnimatePresence`, MotionValues, variants, layout animations, drag/gesture motion, or animation transitions. Use `$motion-audit` when the candidate issue involves animation performance, reduced-motion coverage, compositor-vs-layout cost, `will-change`, layout thrash, or slow/janky animations. Use `$userinterface-wiki` when reviewing motion timing, easing, staging, exit animations, hover/press feel, or animation UX quality. Do not add `web-animation-design` to this recurring audit unless the task is explicitly animation-feel tuning rather than drift detection. Treat `app/tailwind-theme.css` as the Tailwind motion source of truth: keep semantic duration/easing utility names, verify ADS values with official ADS docs or `@atlaskit/tokens` artifacts, and do not replace semantic Tailwind tokens with hardcoded durations or raw curves. Use `$building-components` for reusable component API, focus, accessibility, state, and token/styling contracts. Use `$vercel-composition-patterns` when reusable component quality involves boolean prop proliferation, compound components, context/provider shape, render-prop versus children API choices, or React 19 composition/API decisions. Use `$shadcn` when touched code uses `components.json`, registry components, or `components/ui` primitives. Use `$vpk-tidy` when the likely fix is VPK component cleanup, wrapper migration, route-local versus shared placement, or splitting an overgrown component.

## Judgment
CSS convention drift should be handled through an issue/comment, not a PR. Code fixes are only for small, obvious, review-ready issues that are not CSS-structure decisions. Runtime failures belong to `frontend-runtime-audit` unless design-system or CSS drift is the root cause. For wrapper retirement, follow `vpk-tidy` inventory, migrate-first, compile, and no-retired-import gates before deleting wrapper files. Treat global skill guidance as a check on the narrow issue, not permission to redesign component APIs, reorganize CSS, bypass VPK/ADS primitives, or override repo token rules without local evidence. For motion findings, prefer token cleanup, reduced-motion fixes, import/API corrections, or proven performance repairs over subjective animation taste. Do not broadly reorganize CSS, create new component APIs, bypass primitives, or retune route-local motion contracts without a clear local pattern.

## Validation
Run focused validation for the touched behavior. After any code, dependency, or config edit, run `corepack pnpm run ci:pr`. If the full gate cannot run in the sandbox, run at minimum: the focused test for the touched behavior, `corepack pnpm run lint`, `corepack pnpm run typecheck`, plus relevant verify gates (`corepack pnpm run verify:file-size` and `corepack pnpm run verify:repo-map` for file moves/splits, `corepack pnpm run verify:route-manifest` for route changes, `corepack pnpm run verify:catalog` / `corepack pnpm run verify:lazy-load` for component/demo changes, `corepack pnpm run verify:api-surfaces` for backend route changes, `corepack pnpm run verify:doc-scripts` for docs changes), and document which gates were skipped and why. Use browser validation when practical. Use `npx agent-browser` first for visible checks, screenshots, UI probes, light/dark coverage, visual debugging, and responsive checks, regardless of whether the run is in Codex App. Do not use `@Browser` as the default path; treat it as unavailable unless the user explicitly asks for it. Use `@Chrome` only when signed-in state, cookies, extensions, existing browser tabs, or multi-tab authenticated browser work matters. Fall back to the Playwright CLI only when `agent-browser` is unavailable or blocked. For local browser checks, start frontend/backend with `corepack pnpm run dev:tmux:start` when needed and use `corepack pnpm ports` or `.dev-frontend-port` / `.dev-backend-port` for actual URLs; do not assume default ports. Include light/dark coverage for color, surface-token, animation, or motion-token changes, plus keyboard/focus and responsive notes for UI-affecting fixes. Use ADS/localhost accessibility tooling such as `ads_analyze_localhost_a11y` when available, and state which browser route and a11y route were used or why proof was unavailable.

## Handoff
Push the branch and create or update `[Automation] UI design quality audit: <short summary>` with labels `automation, codex, ui`. For CSS drift, find or create a `css-drift` issue and comment with evidence. For a code PR, include evidence, root cause, validation, freshness/overlap check, and reviewer focus. If no issue is found, exit with exactly: `OK: no UI design, CSS, or component drift in last 7d`. Preserve unrelated local changes. Do not merge from this producer job; the separate review/merge workflow owns review and merge.

## Stop Conditions
Stop without editing or PR if branch/worktree state is unsafe, overlap makes behavior unclear, validation cannot support readiness, or evidence is weak, the change looks intentional, the issue is aesthetic preference, CSS structure needs a human decision, animation feel is subjective without contract drift, or overlap makes the UI contract ambiguous.
````

#### Memory Notes

````markdown
# UI Design Quality Audit Memory

- 2026-07-03T21:44:37Z: Audited recent VPK-rovo UI/CSS changes from clean branch `automation/ui-design-quality-audit`. Found one high-confidence reusable component accessibility drift in the recently extracted product-sidebar row actions: `NavigationItemActions` remained mouse-hover only, so keyboard focus on the Confluence `Content` row could not reveal/tab into `Add to Content` or `More actions for Content`. Fixed both row owners with focus-within visibility state, added `components/blocks/product-sidebar/components/navigation-item-actions.test.js`, validated focused test, lint, typecheck, and `agent-browser` keyboard proof on `/preview/projects/confluence`. Opened PR #1112: `[Automation] UI design quality audit: restore sidebar action keyboard access`. Labels `automation`, `ui`, and `codex-automation` were unavailable; applied `codex`.
````

### Update AGENTS.md

| Field | Value |
| --- | --- |
| ID | `update-agents-md` |
| Kind | cron |
| Status | ACTIVE |
| Schedule | Weekly on Sunday at 12:20 PM |
| Execution environment | worktree |
| Working directory | `/Users/esoh/Documents/Labs/vpk-rovo` |
| Model | gpt-5.5 |
| Reasoning effort | xhigh |
| Created | Apr 18, 2026, 3:22 AM GMT+10 |
| Updated | Jul 7, 2026, 1:20 AM GMT+10 |
| Config source | `/Users/esoh/.codex/automations/update-agents-md/automation.toml` |
| Memory source | `/Users/esoh/.codex/automations/update-agents-md/memory.md` |

#### Prompt

````markdown
## Task
Review VPK-rovo `AGENTS.md` against current repo scripts, commands, workflows, and conventions. Make only material, evidence-backed documentation updates. Also refresh the `<!-- validation-freshness:begin/end -->` block when validation commands or referenced docs changed since the recorded date.

## Commands
Start with repo and branch safety:
```bash
git status --short --branch
git branch --show-current
git worktree list --porcelain
gh pr list --state open --search "[Automation] Update AGENTS.md" --json number,title,headRefName,state,isDraft
```
Run all pnpm commands via `corepack pnpm ...` so the repo-pinned pnpm version from `package.json#packageManager` is used instead of the runtime PATH pnpm.

Before editing, do not work from detached HEAD. Create or switch to `automation/update-agents-md` only when that branch/worktree is safe and clean. Check for overlapping open or recent PRs before handoff. If a clean worktree cannot create Git lock files or switch branches safely, pivot to a fresh ignored scratch checkout or documented safe alternate worktree; if no PR is opened, clean up any temporary automation branch created by the run. Verify claims against `AGENTS.md`, package scripts, workflow docs, `.agents/rules/`, `.agents/docs/`, backend/app routes, provider directories, recent commits, and source files.

## Judgment
Keep changes minimal, provider-neutral where appropriate, and focused on stale or missing guidance. Do not rewrite unrelated sections, document unused workflows, add obvious facts readers can infer from code, or invent details. Prefer local source evidence over memory or assumptions.

## Validation
Confirm every doc change against repo evidence. For docs-only changes, run `corepack pnpm run verify:doc-scripts` by default, especially when script references, validation commands, workflow docs, or the validation-freshness block changed. If any code, dependency, or config changes are included, run `corepack pnpm run ci:pr`. If the full gate cannot run in the sandbox, run at minimum `corepack pnpm run verify:doc-scripts`, `corepack pnpm run lint`, `corepack pnpm run typecheck`, plus any touched-surface verify gates, and document which gates were skipped and why.

## Handoff
Push the branch and create or update `[Automation] Update AGENTS.md: <short summary>` with labels `automation, codex, agents-md`. Include why the change was needed, source evidence, files changed, validation, freshness/overlap check, and reviewer focus. Preserve unrelated local changes. Do not merge from this producer job; the separate review/merge workflow owns review and merge.

## Stop Conditions
Stop without editing or PR if branch/worktree state is unsafe, overlap makes behavior unclear, validation cannot support readiness, or source evidence is incomplete, the change is speculative, overlap makes the correct doc unclear, or the edit would broaden into unrelated documentation cleanup.
````

#### Memory Notes

````markdown
# Update AGENTS.md Automation Memory

## 2026-06-14T02:27:37Z

- Reviewed `AGENTS.md` against package scripts, CI workflow, repo rules, provider dirs, workflow docs, API/source surfaces, and recent commits since the previous automation run.
- Material change made: `AGENTS.md` Testing now documents `pnpm run verify:root-artifacts` as part of `pnpm run ci:pr`, backed by `package.json`, `.github/workflows/ci.yml`, `scripts/verify-root-artifacts.js`, and `.agents/rules/browser-screenshots.mdc`.
- Validation passed: `pnpm run verify:root-artifacts`, `node --test scripts/verify-root-artifacts.test.js`, and `git diff --check`. Lint/typecheck were skipped because the change is documentation-only.
- Opened PR #898: `https://github.com/eevennsoh/vpk-rovo/pull/898`. Requested labels `automation` and `agents-md` were unavailable in the repo.

## 2026-06-21T19:27:29Z

- Reviewed `AGENTS.md` against package scripts, CI workflow, pnpm workspace config, lockfile verification, provider dirs, workflow docs, deployment docs, recent commits since the previous run, and open/recent PRs.
- Material change made: `AGENTS.md` now documents that `pnpm install` needs user-level npm auth for internal Atlassian packages because `@atlassian/logo-third-party` resolves from `atlassian-npm`; CI mirrors this with `ATLASSIAN_NPM_TOKEN` in `$HOME/.npmrc`, and no repo `.npmrc` is tracked.
- Validation passed: `git diff --check` plus focused evidence grep across `AGENTS.md`, `package.json`, `pnpm-workspace.yaml`, `.github/workflows/ci.yml`, and `scripts/verify-pnpm-lockfile.js`. Lint/typecheck skipped because the change is documentation-only.
- Opened PR #1010: https://github.com/eevennsoh/vpk-rovo/pull/1010. Applied `codex` label; requested `automation`, `agents-md`, and `codex-automation` labels were unavailable. Remote PR checks were pending at handoff.

## 2026-06-29T00:17:13Z

- Reviewed `AGENTS.md` against package scripts, CI workflow, provider dirs, workflow docs, `.agents/rules/`, `.agents/docs/`, deployment/runtime files, recent commits since the previous run, and open/recent PRs.
- Material change made: `AGENTS.md` now documents `pnpm run dev:tmux:attach` as the log/attach path for the plain detached dev tmux session, backed by `package.json` and `scripts/dev-tmux-plain.sh`.
- Validation passed: `git diff --check` plus focused evidence grep across `AGENTS.md`, `package.json`, and `scripts/dev-tmux-plain.sh`. Lint/typecheck skipped because the change is documentation-only and no configured docs lint was relevant.
- Opened PR #1067: https://github.com/eevennsoh/vpk-rovo/pull/1067. Applied `codex` label; requested `automation`, `agents-md`, and `codex-automation` labels were unavailable. Remote PR checks were still pending after a short watch at handoff.

## 2026-07-05T02:36:10Z
- Started from clean detached worktree at ea880e88, attached safe branch `automation/update-agents-md`, and confirmed no open overlapping Update AGENTS PR.
- Audited AGENTS.md against package scripts, CI, registry routing, tmux/portless scripts, linked docs, and recent AGENTS-related PRs.
- Material edit: AGENTS.md static-export guidance now explicitly says to use `pnpm run build:export`, not raw `NEXT_OUTPUT=export pnpm run build`, because `scripts/build-static-export.mjs` temporarily moves runtime-only App Router routes before setting NEXT_OUTPUT.
- Validation: `git diff --check`, `node --test scripts/build-static-export.test.js`, and GitHub CI / PR checks passed on PR #1116. Labels `automation` and `agents-md` were unavailable; applied `codex`.
````
