# Deployment troubleshooting

Diagnose the first failing boundary and stop. Do not retry a push or deployment
until its prerequisite is repaired.

## Quick reference

| Symptom | Check |
| --- | --- |
| `ERR_PNPM_NOTHING_TO_DEPLOY` | Use `pnpm run deploy:micros`, not `pnpm deploy` |
| Missing or stale `out/` | Run `corepack pnpm run build:export`; require `out/index.html` |
| Docker cannot copy `out/` | Confirm the export completed before `docker buildx build` |
| Package install fails in Docker | Check root `pnpm-lock.yaml`, workspace files, and npm registry credentials |
| `exec format error` | Build with `--platform linux/amd64` |
| Docker push returns 401 | Refresh local Docker credentials and registry permissions |
| Production exits before listening | Verify `VPK_RUNTIME_ADMIN_TOKEN` is in the descriptor and selected environment's stash |
| AI/voice route returns 401 or 403 | Verify AI Gateway and ASAP variables and authorization |
| Health or runtime shows missing variables | Restash in the selected environment, then deploy a new version |
| `stash get` is unavailable | Use `atlas micros stash list`; do not print values |
| ALB reports insufficient IP space | Measure subnet capacity before considering `pdev-apse2` |
| Micros remains `CREATE_IN_PROGRESS` | Follow deployment events; allow reconciliation lag |

## Preflight or export failure

Run the static contract check first:

```bash
bash .agents/skills/vpk-deploy/scripts/deploy-check.sh --check-only
```

It should confirm the root pnpm workspace, Node 24 Dockerfile, export wrapper,
and `COPY out ./backend/public` contract. A missing `out/` is informational
there because both deploy scripts build it before Docker packaging.

Build the export separately to expose the real Next.js failure:

```bash
corepack pnpm run build:export
test -f out/index.html
```

The wrapper temporarily moves runtime-only routes and restores them in a
`finally` path. If it reports a pre-existing backup path, stop and inspect the
named source and backup before changing either one.

For file-casing errors that only appear in Linux, compare import spelling with
the tracked filename exactly. Do not add duplicate case variants on macOS.

## Docker dependency or registry failure

`backend/Dockerfile` installs production dependencies from:

- `package.json`
- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`
- `backend/package.json`

Repair those pnpm inputs instead of creating a backend npm lockfile. If private
registry access fails, confirm `$HOME/.npmrc` contains token-free routing plus
the required user credential and that the Docker build receives it as the
`npmrc` secret.

For a push 401, refresh both local credentials and server-side permission:

```bash
source .deploy.local
atlas packages secrets -t docker -i "$DOCKER_PASSWORD"
atlas packages permission grant
```

`atlas packages secrets` repairs the local keychain entry.
`atlas packages permission grant` updates registry authorization. A successful
Docker login alone does not prove push access.

## Missing production variables

The full backend runtime needs these descriptor and stash names:

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

Inspect names without exposing values:

```bash
atlas micros stash list -s "$SERVICE_NAME" -e "$ENV"
```

Stashes do not cross environments. After changing a stash, deploy a new image
version so the running container receives the new configuration.

### ASAP private-key formatting

Preserve the multiline key through JSON rather than shell newline rewriting:

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

If AI Gateway still rejects the principal, verify the use-case authorization
and key registration through the owning platform. Do not rotate or restash
credentials speculatively.

## Runtime verification failure

`/api/health` proves only that Express responds. Use the runtime verifier and
exercise every changed backend-backed interaction:

```bash
node .agents/skills/vpk-deploy/scripts/verify-runtime.mjs \
  "https://$SERVICE_NAME.$REGION.platdev.atl-paas.net"
```

If production exits with:

```text
VPK_RUNTIME_ADMIN_TOKEN is required when runtime admin protection is enabled
```

ensure the token exists in both the selected environment's stash and
`service-descriptor.yml`. Never print the token while diagnosing it.

## ALB subnet exhaustion

An ALB needs at least eight free addresses in every selected subnet. When
`pdev-west2` reports insufficient IP space, measure the subnets before
retrying:

```bash
aws ec2 describe-subnets --region us-west-2 \
  --query 'Subnets[].{AZ:AvailabilityZone,Free:AvailableIpAddressCount,Subnet:SubnetId}' \
  --output table
```

If the selected subnets cannot satisfy the requirement, `pdev-apse2` is the
only other supported pdev environment. Before switching:

1. Set `ENV="pdev-apse2"` in `.deploy.local`.
2. Restash every required variable into `pdev-apse2`.
3. Verify the stash names.
4. Deploy a new version with the explicit environment.
5. Verify the `ap-southeast-2` URL.

Do not treat an environment switch as a blind retry.

## Micros reconciliation lag

The deploy command can return before Micros finishes reconciling the stack.
Follow the deployment ID:

```bash
atlas micros events -s "$SERVICE_NAME" -e "$ENV" -d "<deployment-id>"
atlas micros service show -s "$SERVICE_NAME" -e "$ENV"
```

Wait for a final state. If direct AWS inspection is authorized and necessary,
assume the service role for the same service/environment and inspect the
matching region; do not infer success from the image push alone.
