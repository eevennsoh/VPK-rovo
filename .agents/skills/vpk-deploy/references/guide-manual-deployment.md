# Manual Deployment Commands

This document contains the manual deployment commands for reference. The automated deploy script at `.cursor/skills/vpk-deploy/scripts/deploy.sh` is recommended for most deployments.

---

## Initial Deploy Commands (Manual)

```bash
SERVICE_NAME="your-service-name"
ENV=pdev-west2
VERSION=1.0.1

# 1. Create service
atlas micros service create --service=$SERVICE_NAME --no-sd

# 2. Set ALL 7 environment variables (CRITICAL!)
AI_GATEWAY_URL=$(grep "^AI_GATEWAY_URL=" .env.local | cut -d'=' -f2-)
AI_GATEWAY_USER_ID=$(git config user.email)
ASAP_KID=$(cat .asap-config | jq -r '.kid')
ASAP_ISSUER=$(cat .asap-config | jq -r '.issuer')

atlas micros stash set -s $SERVICE_NAME -e $ENV -k AI_GATEWAY_URL -v "$AI_GATEWAY_URL"
atlas micros stash set -s $SERVICE_NAME -e $ENV -k AI_GATEWAY_USE_CASE_ID -v "caid-proto"
atlas micros stash set -s $SERVICE_NAME -e $ENV -k AI_GATEWAY_CLOUD_ID -v "internal-dummy-caid-proto"
atlas micros stash set -s $SERVICE_NAME -e $ENV -k AI_GATEWAY_USER_ID -v "$AI_GATEWAY_USER_ID"

# ASAP_PRIVATE_KEY requires JSON file approach (handles multiline correctly)
cat .asap-config | jq '{ASAP_PRIVATE_KEY: .privateKey}' > /tmp/asap_stash.json
atlas micros stash set -s $SERVICE_NAME -e $ENV -f /tmp/asap_stash.json
rm /tmp/asap_stash.json

atlas micros stash set -s $SERVICE_NAME -e $ENV -k ASAP_KID -v "$ASAP_KID"
atlas micros stash set -s $SERVICE_NAME -e $ENV -k ASAP_ISSUER -v "$ASAP_ISSUER"

# 3. Verify all 7 variables are set
atlas micros stash list -s $SERVICE_NAME -e $ENV

# 4. Authenticate Docker (first time)
docker login docker.atl-paas.net
atlas packages permission grant

# 5. Build & push
docker buildx build --platform linux/amd64 --no-cache \
  -t docker.atl-paas.net/$SERVICE_NAME:app-${VERSION} \
  -f backend/Dockerfile . --load
docker push docker.atl-paas.net/$SERVICE_NAME:app-${VERSION}

# 6. Deploy (takes 10-15 min first time)
export VERSION=$VERSION
atlas micros service deploy --service=$SERVICE_NAME --env=pdev-west2 --file=service-descriptor.yml

# 7. Verify deployment
curl https://$SERVICE_NAME.us-west-2.platdev.atl-paas.net/api/health
```

---

## Redeploy Commands

```bash
SERVICE_NAME="your-existing-service"
VERSION=1.0.2  # Increment from previous

# 1. Build new version
docker buildx build --platform linux/amd64 --no-cache \
  -t docker.atl-paas.net/$SERVICE_NAME:app-${VERSION} \
  -f backend/Dockerfile . --load

# 2. Push
docker push docker.atl-paas.net/$SERVICE_NAME:app-${VERSION}

# 3. Deploy (takes ~30 sec)
export VERSION=$VERSION
atlas micros service deploy --service=$SERVICE_NAME --env=pdev-west2 --file=service-descriptor.yml

# 4. Verify (hard refresh browser: Cmd+Shift+R)
curl https://$SERVICE_NAME.us-west-2.platdev.atl-paas.net/api/health
```

---

## Environment Variable Reference

All 7 variables that must be set for deployment:

| Variable | Source | Description |
|----------|--------|-------------|
| `AI_GATEWAY_URL` | `.env.local` | AI Gateway endpoint |
| `AI_GATEWAY_USE_CASE_ID` | Hardcoded | Usually `caid-proto` |
| `AI_GATEWAY_CLOUD_ID` | Hardcoded | Staging dummy `internal-dummy-<use-case-id>` |
| `AI_GATEWAY_USER_ID` | `git config user.email` | Your Atlassian email |
| `ASAP_PRIVATE_KEY` | `.asap-config` | RSA private key (use JSON file method) |
| `ASAP_KID` | `.asap-config` | Key ID |
| `ASAP_ISSUER` | `.asap-config` | Issuer name |
