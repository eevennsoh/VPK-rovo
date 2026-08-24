---
name: vpk-deploy
description: Deploy, redeploy, or check status for a VPK prototype on Atlassian Micros.
validation_command: corepack pnpm run build:export
---

# VPK deploy

Deploy a VPK prototype to Atlassian Micros, update an existing deployment, or
inspect its current service and environment state. Prefer the skill scripts for
the normal path and use the references for setup detail and failures.

## When to use

Use this skill for an initial Micros service, a redeploy, deployment status,
environment inspection, or a Micros failure. Do not use it to extract a route
into a standalone app; run `vpk-build` first. Do not claim a backend-backed AI,
voice, or chat prototype is healthy from static export or `/api/health` alone.

## Preconditions and invariants

- Work from the intended prototype checkout and inspect its current status
  before changing deployment configuration.
- Treat `.deploy.local` and `service-descriptor.yml` as hints; confirm the
  service and stash state in Micros before choosing initial versus redeploy.
- Keep service names at 26 characters or fewer and use only the supported pdev
  environments: `pdev-west2` or `pdev-apse2`.
- Preserve the application's runtime contract. Static-only routes may use the
  minimal export scaffold; API, SSE, realtime, WebSocket, AI, and voice routes
  need the full backend and security/static-serving behavior.
- Stashes are environment-specific. Verify required variables in the chosen
  environment and never print secret values.
- Build Docker images for `linux/amd64`; verify the deployed browser/runtime,
  not only the image push or deployment command.

## Choose the path

```text
.deploy.local exists                  -> fast redeploy
descriptor still has YOUR-SERVICE-NAME -> initial deploy
custom descriptor, no .deploy.local  -> inspect Micros, then recover config
```

If the local signals disagree or the user did not choose an action, ask whether
they want status, deploy changes, initial setup, or environment inspection.
Read [deployment guide](references/guide-deployment.md) before initial setup or
configuration recovery.

## Status

Read service and environment from `.deploy.local` when present, then query
Micros without exposing values:

```bash
atlas micros service show -s "$SERVICE_NAME" -e "$ENV"
atlas micros stash list -s "$SERVICE_NAME" -e "$ENV"
```

Report the service, environment, URL, deployed version/state, variable names or
count, and missing configuration. `No such service` or `Unknown service` means
the Micros service must be created even when local files contain a name.

## Happy path

### Initial deploy or recovered configuration

1. Read [deployment guide](references/guide-deployment.md) and collect the
   service name, target environment, Docker identity token, and required local
   credentials without echoing secrets.
2. Create `.deploy.local`, replace descriptor placeholders, and create the
   Micros service if it does not exist.
3. Stash and list all required variables in the selected environment.
4. Authenticate Docker and run the preflight:

```bash
./.agents/skills/vpk-deploy/scripts/deploy-check.sh
```

5. Deploy with the canonical script:

```bash
./.agents/skills/vpk-deploy/scripts/deploy.sh <service-name> <version> [env]
```

The script requires an explicit Docker-tag-safe version, validates the
descriptor image and SSM identity, and checks the service and every required
stash before any build, push, or deployment. An existing service with no stack
is a valid initial-deploy state. It then produces and verifies the static export
through `corepack pnpm run build:export`, builds and pushes the `linux/amd64`
image, and invokes Micros. Initial deployments commonly take 10–15 minutes.
When a deployment ID is returned, follow events to a final state:

```bash
atlas micros events -s <service-name> -e <env> -d <deployment-id>
```

Use [manual deployment](references/guide-manual-deployment.md) only when the
canonical script cannot cover the requested operation.

### Fast redeploy

When `.deploy.local` is valid and the existing service is confirmed:

```bash
pnpm run deploy:micros
```

The fast path generates a collision-resistant, Docker-tag-safe version when
one is omitted. It validates descriptor identity, remote service existence, and
required stashes before registry permission or login.

Do not run `pnpm deploy`; that is pnpm's unrelated workspace deployment command
and can fail with `ERR_PNPM_NOTHING_TO_DEPLOY`.

## Verify

Run the export/build validation appropriate to the project, then verify the
deployed URL:

```bash
node .agents/skills/vpk-deploy/scripts/verify-runtime.mjs "https://<service-name>.<region>.platdev.atl-paas.net"
```

Confirm the service reaches a stable stack, the main route and `/api/health`
succeed, browser-shaped static/font requests return `200`, and every changed
backend-backed interaction works. The service URL requires Atlassian VPN.

## Failures

Do not retry blindly. Read [troubleshooting](references/troubleshooting.md) for
Docker authentication, missing packages, ASAP formatting, health failures,
verification lag, and ALB subnet exhaustion. If west2 lacks subnet capacity,
verify the condition before switching to `pdev-apse2`, then restash every
required variable in that environment.

## References

- [guide-deployment.md](references/guide-deployment.md): prerequisites,
  configuration, initial deployment, runtime contracts, and full command detail.
- [guide-manual-deployment.md](references/guide-manual-deployment.md): explicit
  manual command sequence.
- [troubleshooting.md](references/troubleshooting.md): error messages,
  diagnosis, environment fallback, and recovery.
