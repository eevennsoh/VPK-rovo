---
name: vpk-build
description: Extract a VPK route into a standalone, minimal Next.js app with traced imports, source-compatible paths, and Micros-ready scaffolding. Use when asked to invoke vpk-build, extract a route, create a standalone prototype, or hand a VPK route off as an independently deployable app.
validation_command: node --test .agents/skills/vpk-build/scripts/*.test.js
---

# VPK build

Turn one `app/<route>` surface into a sibling Next.js project whose source tree
mirrors VPK, whose dependencies come from the traced import graph, and whose
deployment handoff is compatible with `vpk-deploy`.

## When to use

Use this skill when a route needs its own URL, repository-sized deliverable, or
independent deployment. Keep work in VPK-Rovo while composing across routes or
depending on shared runtime infrastructure that has no explicit export plan.
This workflow extracts one route at a time and does not invent replacement
backend behavior.

## Hard invariants

- Run the trace before scaffolding and inspect every warning or decision point.
- Ask for confirmation after the read-only plan and before creating the sibling
  target.
- Preserve repo-relative source paths and copy source files verbatim where
  possible; put extraction-specific behavior in the target harness.
- Copy the full `public/` tree because runtime data can reference untraced assets.
- Do not treat a successful static build as proof that API, SSE, WebSocket,
  realtime, AI, voice, or scripted-tour behavior works.
- Do not create fake local API shims unless the user explicitly requests a mock.
- Do not edit, move, or rename the scripts in this skill. They are tested and
  pinned by repository validation.

## Interface

```text
/vpk-build /<route>                 # target: sibling vpk-<route>
/vpk-build /<route> <custom-name>   # custom target directory
```

Read [extraction guide](references/extraction-guide.md) for route discovery,
backend-backed export requirements, generated CSS/runtime behavior, failure
diagnosis, ports, and the deployment handoff.

## Workflow

### 1. Plan (read-only)

Trace the route and write the plan under the skill-local cache:

```bash
node .agents/skills/vpk-build/scripts/trace-imports.mjs <route-path> \
  --out .agents/skills/vpk-build/.cache/<route-slug>.plan.json
```

Review file, package, asset, backend-route, dynamic-import, cross-route-link,
and skipped-dispatcher findings. Stop for a decision when:

- backend routes are present but no backend-backed export was requested;
- a dynamic import is not statically resolvable;
- dependencies or graph edges remain unresolved;
- the plan would trim live VPK behavior to a static presentation shell.

For an intentional Studio/chat/Rovo/wiki/realtime export, use the full
backend-backed contract in [extraction guide](references/extraction-guide.md).
Show the plan summary and receive confirmation before continuing.

### 2. Scaffold and copy

```bash
node .agents/skills/vpk-build/scripts/scaffold-target.mjs \
  .agents/skills/vpk-build/.cache/<route-slug>.plan.json \
  [--target <custom-dir>] [--force]
```

The script creates the sibling project, preserves repo-relative paths, copies
planned source plus `public`, rewrites the route entry to its direct demo import,
generates the provider/layout harness, filters unresolved CSS package sources,
adds the Micros scaffold, initializes Git, and wires only the approved setup and
deploy skills.

Static scaffold inputs live under [scaffold references](references/scaffold/).
Micros templates live under [Micros references](references/micros/). Do not edit
the source route to compensate for an extraction-only concern.

### 3. Verify the target

```bash
.agents/skills/vpk-build/scripts/verify-target.sh <target-dir>
```

This runs install, typecheck, and build in the extracted project. Resolve
failures at their owner: dependency versions in target `package.json`, missing
graph edges in the plan/trace, source parity in copied files, and CSS/runtime
setup in the generated harness. Then run the extracted app and verify the real
route, assets, console, and every required interaction.

Backend-backed extracts must also prove the source backend starts, API proxies
work, `/api/realtime/ws-url` resolves correctly, WebSocket upgrades succeed,
and copied behavior remains source-compatible.

### 4. Hand off deployment

After verification passes, enter the sibling project and invoke
`vpk-deploy --initial`. Subsequent deployments use `pnpm run deploy:micros` once
`.deploy.local` exists. Use the full backend deployment shape for any app with
live API, SSE, or WebSocket dependencies.

## Validation

When changing this skill's documentation or extraction contract, run:

```bash
node --test .agents/skills/vpk-build/scripts/*.test.js
```

For an actual extraction, the required proof is a passing `verify-target.sh`
run plus live browser verification of the extracted route.

## Scripts and references

- [trace-imports.mjs](scripts/trace-imports.mjs): deterministic TypeScript
  import walker and catalog-dispatcher resolver.
- [scaffold-target.mjs](scripts/scaffold-target.mjs): plan-driven copier and
  target generator.
- [verify-target.sh](scripts/verify-target.sh): install/typecheck/build gate.
- [extraction-guide.md](references/extraction-guide.md): detailed contracts and
  troubleshooting.
- [scaffold/](references/scaffold/): target project templates.
- [micros/](references/micros/): minimal Micros deployment scaffold.
