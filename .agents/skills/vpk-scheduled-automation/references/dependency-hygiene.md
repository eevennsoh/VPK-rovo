# Dependency Hygiene Lanes

Read this reference only for the Dependency hygiene automation, after the main
`vpk-scheduled-automation` policy. Choose exactly one lane per run. Never combine
package/install changes with a logo-asset harvest in one branch or PR.

## Choose one lane

- **Lane A — package/install hygiene:** direct dependencies, catalog families,
  overrides, advisories, and evidence-backed removals. This lane uses the repo
  `.npmrc`, pnpm lockfile, trust policy, and minimum-release-age rules.
- **Lane B — Atlassian SVG logo harvest:** visual-asset freshness via `npm pack`
  outside the repo. Use this for `@atlassian/logo-third-party` by default when a
  fresh repo-registry probe cannot install the target. For `@atlaskit/logo`, try
  Lane A first and use Lane B only when registry, release-age, trust, or lockfile
  policy blocks the package bump.

Select the lane from current evidence, not a previous run's registry result. If
both lanes have plausible work, choose the higher-confidence single candidate
and leave the other for a later run. If lane ownership is unclear, stop.

## Lane A — package/install hygiene

### Discover and rank

Inspect `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, and `.npmrc`, then
run:

```bash
corepack pnpm run deps:check
corepack pnpm outdated --long
corepack pnpm audit --json
```

Rank candidates in this order:

1. Narrow security-advisory or correctness fixes.
2. Patch/minor in-range Float (`^`) or Cautious (`~`) updates.
3. Proven-unused dependencies, obsolete overrides, or superseded packages.
4. Small deliberate latest-stable direct bumps.
5. One coordinated catalog-family bump.
6. Locked exact bumps with clear release, peer, and migration evidence.

Confirm the target is stable rather than prerelease/canary/experimental. Review
official notes, peer ranges, advisories, and migrations. Prove the exact target
resolves through the repo registry with a dry scratch install/add; an outdated
row alone is not reachability evidence. Registry 404, `NO_MATCHING_VERSION`,
private-auth uncertainty, or unexplained tarball-source changes are stop signals.

### Apply one narrow change

- Float/Cautious: prefer a targeted `corepack pnpm update <pkg>` or narrow
  manifest edit plus `corepack pnpm install` when a full update would re-resolve
  unrelated packages.
- Workspace-root adds require `corepack pnpm add -w`.
- Locked framework/core dependencies require a deliberate manifest edit and
  `corepack pnpm install`.
- Coordinated `tiptap`, `json-render`, and `remotion` families move only through
  the `catalog:` version in `pnpm-workspace.yaml`; never replace individual
  `"catalog:"` references.
- Overrides require a documented security, compatibility, or dedupe reason.
- Removal requires zero tracked imports, runtime/config/script references, and
  generated/vendored consumers. Re-resolve the lockfile and prove behavior.
- Revert unrelated lockfile churn unless it is mechanically required and fully
  explained.

`trustPolicy: no-downgrade` is a safety boundary. Never bypass it with
`--config.trustPolicy=none`. A benign false positive may justify a separate,
version-pinned `trustPolicyExclude` infrastructure candidate only when evidence
is strong enough for human review; otherwise stop.

### Lane A validation and handoff

After the scoped install/update/removal, run:

```bash
corepack pnpm run verify:lockfile
```

It must report `Verified pnpm-lock.yaml`. Rewrite only verifier-reported package
URLs that belong on `npm-remote`; preserve the explicitly allowed
`@atlassian/logo-third-party` tarball source. Then run the focused package or
touched-surface check followed by the main skill's `corepack pnpm run ci:pr`.

Use `[Automation] Dependency hygiene: <summary>` and request the existing
`automation`, `codex`, and `dependencies` labels. Add before/after versions or
removed packages, selection evidence, release/advisory notes, peer and migration
risk, lockfile verification, and any trust-policy decision to the normal PR
evidence. Dependency PRs are serialized because they usually touch
`pnpm-lock.yaml`; any overlapping dependency PR is a no-PR stop condition.

## Lane B — Atlassian SVG logo harvest

Use this lane only for visual-asset freshness without an install-graph change.
It should not modify package manifests or `pnpm-lock.yaml`.

The repository has no committed logo-harvest command. Do not infer or invoke
one. Use the manual path and note a durable harvester only as a possible
follow-up:

1. Create a temporary directory outside the repo and run `npm pack` there so
   user-level `atlassian-npm` authentication applies instead of repo `.npmrc`:

   ```bash
   npm pack @atlaskit/logo@latest
   npm pack @atlassian/logo-third-party@latest
   ```

2. Extract the SVG string literals from package artifacts. Preserve CSS custom
   property defaults so assets render standalone and remain themeable.
3. Normalize names and update `public/1p/<brand>-{icon,logo}.svg` and
   `public/3p/<brand>.svg`; strip index/entry-point artifacts.
4. Update the existing VPK logo demos that consume the harvested assets.
5. Produce a precise added/changed/removed brand diff against the current
   `public/` assets.

Run focused asset/demo checks, lint and typecheck, then the main skill's
`corepack pnpm run ci:pr`. Use `$agent-browser` only when rendered demo proof is
needed; spot-check representative logos, including light/dark theming where it
matters. Confirm the final diff contains no manifest or lockfile changes.

Use `[Automation] Logo asset refresh: <n brands updated>` and request the
existing `automation`, `codex`, and `dependencies` labels. Add source package
versions, the brand diff, focused validation, and representative screenshots to
the normal PR evidence.

## Lane-specific stop rules

Stop without a PR for unsafe/overlapping state, mixed lanes, more than one
dependency family, unclear migration or removal evidence, unstable or
unreachable versions, unresolved supply-chain policy, unexplained lockfile
churn, asset extraction that cannot be verified, or any validation failure not
proven unrelated under the main skill.
