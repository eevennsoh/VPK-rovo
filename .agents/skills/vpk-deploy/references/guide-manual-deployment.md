# Manual deployment commands

Use the canonical deploy script unless it cannot cover the requested operation.
These commands expose the same current contract for diagnosis or a controlled
manual run. They mutate registry and Micros state; do not run them for a status
request.

## Inputs

```bash
SERVICE_NAME="your-service-name"
ENV="pdev-west2"
VERSION="1.0.1"
```

Only `pdev-west2` and `pdev-apse2` are supported. Resolve the URL region from
the selected environment:

```bash
case "$ENV" in
  pdev-west2) REGION="us-west-2" ;;
  pdev-apse2) REGION="ap-southeast-2" ;;
  *) echo "Unsupported environment: $ENV"; exit 1 ;;
esac
```

## Initial service setup

Create the service only after `atlas micros service show` confirms it does not
exist:

```bash
atlas micros service create --service="$SERVICE_NAME" --no-sd
```

The descriptor and the selected environment's stash must contain:

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

Use environment variables loaded from authoritative local configuration rather
than copying secrets into shell history:

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

Preserve the multiline private key through JSON:

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

Generate the production runtime-admin token once, stash it, and unset it:

```bash
VPK_RUNTIME_ADMIN_TOKEN="$(openssl rand -hex 32)"
atlas micros stash set -s "$SERVICE_NAME" -e "$ENV" \
  -k VPK_RUNTIME_ADMIN_TOKEN -v "$VPK_RUNTIME_ADMIN_TOKEN"
unset VPK_RUNTIME_ADMIN_TOKEN
```

Verify names without reading values:

```bash
atlas micros stash list -s "$SERVICE_NAME" -e "$ENV"
```

Stop if any required name is missing.

## Build, push, and deploy

Run the checked-in preflight and export wrapper:

```bash
bash .agents/skills/vpk-deploy/scripts/deploy-check.sh
source .agents/skills/vpk-deploy/scripts/deploy-lib.sh
vpk_validate_service_name "$SERVICE_NAME"
vpk_validate_version "$VERSION"
vpk_validate_descriptor_identity "$SERVICE_NAME" service-descriptor.yml
vpk_require_service_and_stashes "$SERVICE_NAME" "$ENV"
corepack pnpm run build:export
test -f out/index.html
```

These identity checks are read-only and must pass before registry login, image
build or push, and Micros deployment. `service show` success is sufficient for
an initial deployment even when that new service has no stack yet.

Build the Node 24 runtime image from the pnpm workspace and prebuilt `out/`:

```bash
if [ -n "${HOME:-}" ] && [ -f "$HOME/.npmrc" ]; then
  docker buildx build --platform linux/amd64 --no-cache \
    --secret "id=npmrc,src=$HOME/.npmrc" \
    -t "docker.atl-paas.net/$SERVICE_NAME:app-$VERSION" \
    -f backend/Dockerfile . --load
else
  docker buildx build --platform linux/amd64 --no-cache \
    -t "docker.atl-paas.net/$SERVICE_NAME:app-$VERSION" \
    -f backend/Dockerfile . --load
fi
docker push "docker.atl-paas.net/$SERVICE_NAME:app-$VERSION"
```

The Dockerfile consumes the optional `npmrc` BuildKit secret only for the
dependency-install layer. This branch is compatible with the macOS system Bash
3 even when `HOME` is unset.

Deploy the exact pushed version:

```bash
export VERSION
atlas micros service deploy \
  --service="$SERVICE_NAME" \
  --env="$ENV" \
  --file=service-descriptor.yml
```

Follow the returned deployment ID to a final state, then verify the regional
URL:

```bash
atlas micros events -s "$SERVICE_NAME" -e "$ENV" -d "<deployment-id>"
node .agents/skills/vpk-deploy/scripts/verify-runtime.mjs \
  "https://$SERVICE_NAME.$REGION.platdev.atl-paas.net"
```

For a redeploy, choose a new version and repeat the build, push, deploy, and
verification sequence. Never deploy a version that was not pushed.
