# Deployment guide

Use this guide for first-time Micros setup or when local deployment
configuration no longer matches the remote service. For a routine redeploy with
a valid `.deploy.local`, use `pnpm run deploy:micros`.

## Runtime contract

VPK has one source tree and two runtime shapes:

| Mode | Frontend | API |
| --- | --- | --- |
| Local development | Next.js development server | Next.js route adapters proxy to Express |
| Micros | Static export served by Express | Express owns `/api/*`, SSE, and WebSockets |

The production image is `backend/Dockerfile`:

- Node 24 installs production dependencies from the root pnpm workspace and
  `pnpm-lock.yaml`.
- `corepack pnpm run build:export` creates `out/` before the Docker build.
- The image copies `out/` to `backend/public`; it does not build Next.js
  inside Docker.

Do not remove App Router routes by hand for an export. The checked-in
`scripts/build-static-export.mjs` wrapper temporarily moves runtime-only
routes and restores them even when the build fails or is interrupted.

## Preconditions

- Docker Desktop with buildx support.
- Atlas CLI installed and authenticated.
- Docker identity token with access to `docker.atl-paas.net`.
- A lowercase, hyphenated service name no longer than 26 characters.
- One supported environment:

| Micros environment | AWS region | URL suffix |
| --- | --- | --- |
| `pdev-west2` | `us-west-2` | `us-west-2.platdev.atl-paas.net` |
| `pdev-apse2` | `ap-southeast-2` | `ap-southeast-2.platdev.atl-paas.net` |

Micros stashes are environment-specific. Switching environments requires
restashing every required variable.

## Inspect before changing configuration

Read `.deploy.local` when it exists, but confirm its values against Micros:

```bash
atlas micros service show -s "$SERVICE_NAME" -e "$ENV"
atlas micros stash list -s "$SERVICE_NAME" -e "$ENV"
```

Use names and counts only when reporting stash state; never print secret
values. `No such service` or `Unknown service` means the service still needs
to be created even when local files contain its name.

## Configure a new or recovered service

### 1. Local deployment configuration

Create ignored `.deploy.local` with the service identity and Docker
credentials:

```bash
SERVICE_NAME="your-service-name"
ENV="pdev-west2"
DOCKER_USERNAME="your-staff-id"
DOCKER_PASSWORD="your-docker-identity-token"
```

Never commit this file or echo `DOCKER_PASSWORD`.

### 2. Service descriptor

Replace service-name placeholders in `service-descriptor.yml`, including the
image namespace and SSM paths. A full backend deployment needs these variables
in the descriptor and in the selected environment's stash:

```text
AI_GATEWAY_URL
AI_GATEWAY_USE_CASE_ID
AI_GATEWAY_CLOUD_ID
AI_GATEWAY_USER_ID
ASAP_KID
ASAP_ISSUER
ASAP_PRIVATE_KEY
OPENAI_REALTIME_MODEL
OPENAI_REALTIME_WS_URL
OPENAI_REALTIME_VOICE
VPK_RUNTIME_ADMIN_TOKEN
```

`VPK_RUNTIME_ADMIN_TOKEN` is mandatory in production. Generate a unique,
high-entropy value, stash it, and unset the local shell variable after use:

```bash
VPK_RUNTIME_ADMIN_TOKEN="$(openssl rand -hex 32)"
atlas micros stash set -s "$SERVICE_NAME" -e "$ENV" \
  -k VPK_RUNTIME_ADMIN_TOKEN -v "$VPK_RUNTIME_ADMIN_TOKEN"
unset VPK_RUNTIME_ADMIN_TOKEN
```

Realtime model, URL, and voice defaults may exist in local development, but
stash explicit production values so the deployment is reproducible.

### 3. Create the Micros service

```bash
atlas micros service create --service="$SERVICE_NAME" --no-sd
```

Creating an already-existing service is not a recovery step. Inspect it first.

### 4. Stash variables

Load credential values from their authoritative local stores, then use
`atlas micros stash set` without printing them. Use a JSON file for the
multiline ASAP private key:

```bash
(
  set -e
  umask 077
  STASH_FILE="$(mktemp)"
  trap 'rm -f -- "$STASH_FILE"' EXIT
  trap 'exit 1' HUP INT TERM
  jq '{ASAP_PRIVATE_KEY: .privateKey}' .asap-config > "$STASH_FILE"
  atlas micros stash set -s "$SERVICE_NAME" -e "$ENV" -f "$STASH_FILE"
)
```

Set the remaining variables individually:

```bash
atlas micros stash set -s "$SERVICE_NAME" -e "$ENV" -k AI_GATEWAY_URL -v "$AI_GATEWAY_URL"
atlas micros stash set -s "$SERVICE_NAME" -e "$ENV" -k AI_GATEWAY_USE_CASE_ID -v "$AI_GATEWAY_USE_CASE_ID"
atlas micros stash set -s "$SERVICE_NAME" -e "$ENV" -k AI_GATEWAY_CLOUD_ID -v "$AI_GATEWAY_CLOUD_ID"
atlas micros stash set -s "$SERVICE_NAME" -e "$ENV" -k AI_GATEWAY_USER_ID -v "$AI_GATEWAY_USER_ID"
atlas micros stash set -s "$SERVICE_NAME" -e "$ENV" -k ASAP_KID -v "$ASAP_KID"
atlas micros stash set -s "$SERVICE_NAME" -e "$ENV" -k ASAP_ISSUER -v "$ASAP_ISSUER"
atlas micros stash set -s "$SERVICE_NAME" -e "$ENV" -k OPENAI_REALTIME_MODEL -v "$OPENAI_REALTIME_MODEL"
atlas micros stash set -s "$SERVICE_NAME" -e "$ENV" -k OPENAI_REALTIME_WS_URL -v "$OPENAI_REALTIME_WS_URL"
atlas micros stash set -s "$SERVICE_NAME" -e "$ENV" -k OPENAI_REALTIME_VOICE -v "$OPENAI_REALTIME_VOICE"
```

Verify names after setting them:

```bash
atlas micros stash list -s "$SERVICE_NAME" -e "$ENV"
```

Stop if a required name is absent. Do not assume a stash from the other pdev
environment is available.

### 5. Authenticate Docker

```bash
atlas packages permission grant
atlas packages secrets -t docker -i "$DOCKER_PASSWORD"
```

The permission command updates registry authorization. The secrets command
updates local Docker credentials; they solve different problems.

## Validate and deploy

Run the static contract check when Docker is intentionally unavailable:

```bash
bash .agents/skills/vpk-deploy/scripts/deploy-check.sh --check-only
```

Before a real deployment, run the full preflight:

```bash
bash .agents/skills/vpk-deploy/scripts/deploy-check.sh
```

Then use the canonical script:

```bash
.agents/skills/vpk-deploy/scripts/deploy.sh "$SERVICE_NAME" 1.0.1 "$ENV"
```

It requires an explicit Docker-tag-safe version, checks that the descriptor
image and every SSM path match `SERVICE_NAME`, and verifies the service and all
required stashes before building or pushing. A service that exists but has no
stack is ready for its initial deployment. The script then runs
`corepack pnpm run build:export`, requires `out/index.html`, builds a
`linux/amd64` image, pushes it, and invokes Micros. For the exact underlying
commands, read
[`guide-manual-deployment.md`](guide-manual-deployment.md).

## Verify

Follow the deployment ID returned by Micros until it reaches a final state:

```bash
atlas micros events -s "$SERVICE_NAME" -e "$ENV" -d "<deployment-id>"
```

Map the environment to its region and verify the deployed runtime:

```bash
node .agents/skills/vpk-deploy/scripts/verify-runtime.mjs \
  "https://$SERVICE_NAME.<region>.platdev.atl-paas.net"
```

A backend-backed prototype is complete only when:

- The Micros stack reaches a stable success state.
- The main route, static assets, fonts, and `/api/health` return successfully.
- Changed AI, voice, SSE, WebSocket, or API interactions work in the deployed
  browser.
- Browser console and server logs show no new errors.

The service URL requires Atlassian VPN. If a command fails, stop and diagnose
with [`troubleshooting.md`](troubleshooting.md) instead of retrying blindly.
