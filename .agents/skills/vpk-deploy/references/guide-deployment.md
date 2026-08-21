# Deployment Guide

Complete guide for deploying the VPK prototype to Atlassian Micros platform with seamless local-to-deployment workflow.

---

## Architecture & Workflow Overview

### The Zero-Change Workflow

The project uses a **single codebase** that works seamlessly in two modes **without requiring code changes**:

| Mode                  | Frontend      | Backend       | Connection                                       |
| --------------------- | ------------- | ------------- | ------------------------------------------------ |
| **Local Development** | Next.js :3000 | Express :8080 | Next.js API routes proxy requests                |
| **Production**        | Static files  | Express :8080 | Express serves static files + handles API routes |

**Key Insight:** Both environments use `/api/*` relative paths. The difference is:

- **Local dev**: Next.js API routes intercept and proxy to backend
- **Production**: Express backend handles them directly (same domain)

### How It Works: Relative Paths

**Local Development Flow:**

```
Browser
  ↓ http://localhost:3000
Next.js Dev Server (:3000)
  ↓ /api/chat-sdk request
API Route Proxy (app/api/chat-sdk/route.ts)
  ↓ forwards to http://localhost:8080/api/chat-sdk
Express Backend (:8080)
  ↓ authenticates with ASAP
AI Gateway
```

**Production Deployment Flow:**

```
Browser
  ↓ https://your-service.platdev.atl-paas.net
Express Server (:8080)
  ├─ GET / → Serves static HTML from /app/public
  ├─ GET /assets/* → Serves static assets
  └─ POST /api/chat-sdk → API handler in server.js
       ↓ authenticates with ASAP
     AI Gateway
```

**Zero Code Changes:** Both use the same relative paths and ASAP authentication!

---

## Prerequisites

1. **Docker Desktop** with buildx support (for multi-platform builds)
2. **Atlas CLI** installed and authenticated
3. **Access to docker.atl-paas.net** registry
4. **ASAP credentials** for AI Gateway (see SETUP_GUIDE.md)
5. **API Key** from https://packages.atlassian.com/ for Docker registry auth
6. **Service Name Decision**
   - Maximum 26 characters
   - Use lowercase and hyphens only
   - Examples: `my-prototype`, `chat-demo`, `ai-assistant`
   - Your service URL will be: `<service-name>.us-west-2.platdev.atl-paas.net`

---

## Quick Start Reference

### First-Time Deployment (New Service)

```bash
# 1. Choose service name (≤26 chars)
SERVICE_NAME="my-awesome-prototype"

# 2. Create service
atlas micros service create --service=$SERVICE_NAME --no-sd

# 3. Authenticate with Docker
docker login docker.atl-paas.net  # Use StaffID + API Key

# 4. Build Docker image
VERSION=1.0.1
docker buildx build --platform linux/amd64 --no-cache \
  -t docker.atl-paas.net/$SERVICE_NAME:app-${VERSION} \
  -f backend/Dockerfile . --load

# 5. Push to registry
docker push docker.atl-paas.net/$SERVICE_NAME:app-${VERSION}

# 6. Deploy
export VERSION=1.0.1
atlas micros service deploy \
  --service=$SERVICE_NAME \
  --env=pdev-west2 \
  --file=service-descriptor.yml
```

### Update Existing Deployment

```bash
# Just increment version and redeploy
VERSION=1.0.2
docker buildx build --platform linux/amd64 --no-cache \
  -t docker.atl-paas.net/<your-service-name>:app-${VERSION} \
  -f backend/Dockerfile . --load
docker push docker.atl-paas.net/<your-service-name>:app-${VERSION}
export VERSION=${VERSION}
atlas micros service deploy \
  --service=<your-service-name> \
  --env=pdev-west2 \
  --file=service-descriptor.yml
```

### Verify Deployment

```bash
# Get service URL
atlas micros service show --service=<your-service-name> --env=pdev-west2

# Test health endpoint
curl https://<your-service-name>.us-west-2.platdev.atl-paas.net/api/health

# Expected response (all values must show "SET")
{
  "status": "OK",
  "message": "Backend server is working!",
  "envCheck": {
    "AI_GATEWAY_URL": "SET",
    "AI_GATEWAY_USE_CASE_ID": "SET",
    "AI_GATEWAY_CLOUD_ID": "SET",
    "AI_GATEWAY_USER_ID": "SET",
    "ASAP_PRIVATE_KEY": "SET"
  }
}
```

---

## Path A: First-Time Deployment (New Service)

### Step 1: Choose Service Name

Pick a name ≤26 characters. Your URL will be: `https://<service-name>.us-west-2.platdev.atl-paas.net`

### Step 2: Update service-descriptor.yml

**CRITICAL:** Replace ALL instances of `YOUR-SERVICE-NAME` with your actual service name:

```yaml
compose:
  app:
    image: docker.atl-paas.net/YOUR-SERVICE-NAME # Line 11
    tag: app-${VERSION}
    environment:
      AI_GATEWAY_URL: ((ssm:/YOUR-SERVICE-NAME/AI_GATEWAY_URL)) # Lines 16-22
      # ... etc
```

Also update:

- Line 7: `email: your-email@atlassian.com`

### Step 3: Create Service

```bash
atlas micros service create --service=<your-service-name> --no-sd
```

The `--no-sd` flag skips interactive prompts. We'll use our own `service-descriptor.yml`.

### Step 4: Authenticate with Docker Registry

**First time only:**

```bash
# Login to Docker registry
docker login docker.atl-paas.net
# Username: Your StaffID (e.g., esoh - NOT your email)
# Password: API Key from https://packages.atlassian.com/

# Grant push permissions
atlas packages permission grant
```

### Step 5: Set Environment Variables

**⚠️ CRITICAL - DO NOT SKIP THIS STEP!**

You MUST set all environment variables BEFORE deploying.

```bash
ENV=pdev-west2
SERVICE_NAME=<your-service-name>

atlas micros stash set -s $SERVICE_NAME -e $ENV \
  -k AI_GATEWAY_URL \
  -v "https://ai-gateway.us-east-1.staging.atl-paas.net/v1/openai/v1/chat/completions"

atlas micros stash set -s $SERVICE_NAME -e $ENV \
  -k AI_GATEWAY_USE_CASE_ID \
  -v "your-use-case-id"

atlas micros stash set -s $SERVICE_NAME -e $ENV \
  -k AI_GATEWAY_CLOUD_ID \
  -v "internal-dummy-your-use-case-id"

# REPLACE with YOUR email
atlas micros stash set -s $SERVICE_NAME -e $ENV \
  -k AI_GATEWAY_USER_ID \
  -v "your-email@atlassian.com"

# Set ASAP credentials from your .asap-config
atlas micros stash set -s $SERVICE_NAME -e $ENV \
  -k ASAP_KID \
  -v "your-use-case-id/your-timestamp"

atlas micros stash set -s $SERVICE_NAME -e $ENV \
  -k ASAP_ISSUER \
  -v "your-use-case-id"
```

For ASAP private key (multiline key - requires special handling):

```bash
# Method 1: From .asap-config file (recommended)
# jq without -r flag preserves JSON escaping (quotes and \n)
cat > /tmp/asap_stash.json << EOF
{
  "ASAP_PRIVATE_KEY": $(cat .asap-config | jq '.privateKey')
}
EOF

atlas micros stash set -s $SERVICE_NAME -e $ENV -f /tmp/asap_stash.json
rm /tmp/asap_stash.json
```

```bash
# Method 2: From .env.local (if .asap-config not available)
source .env.local
ESCAPED_KEY=$(echo "$ASAP_PRIVATE_KEY" | awk '{printf "%s\\n", $0}' | sed 's/\\n$//')
printf '{"ASAP_PRIVATE_KEY": "%s"}' "$ESCAPED_KEY" > /tmp/asap_stash.json

atlas micros stash set -s $SERVICE_NAME -e $ENV -f /tmp/asap_stash.json
rm /tmp/asap_stash.json
```

> **Why `jq` works:** Using `jq '.privateKey'` (without `-r` flag) outputs the key with proper JSON escaping - surrounding quotes and `\n` for newlines. The server converts these back at runtime.

**Verification:** Before proceeding, verify all variables are set:

```bash
# Use 'stash list' to view all variables (there is no 'stash get' command)
atlas micros stash list -s $SERVICE_NAME -e $ENV
```

### Step 6: Build Docker Image

```bash
VERSION=1.0.1
docker buildx build --platform linux/amd64 --no-cache \
  -t docker.atl-paas.net/<your-service-name>:app-${VERSION} \
  -f backend/Dockerfile . --load
```

### Step 7: Push Docker Image

```bash
docker push docker.atl-paas.net/<your-service-name>:app-${VERSION}
```

### Step 8: Deploy

```bash
export VERSION=1.0.1
atlas micros service deploy \
  --service=<your-service-name> \
  --env=pdev-west2 \
  --file=service-descriptor.yml
```

**First deployment takes 10-15 minutes** (provisioning EC2 instance). Subsequent deployments take ~30 seconds.

### Step 9: Verify

```bash
# Get your service URL
atlas micros service show --service=<your-service-name> --env=pdev-west2

# Test health endpoint (replace with your URL)
curl https://<your-service-name>.us-west-2.platdev.atl-paas.net/api/health
```

---

## Path B: Update Existing Service

### Step 1: Increment Version & Build

```bash
VERSION=1.0.2  # Increment from previous version
docker buildx build --platform linux/amd64 --no-cache \
  -t docker.atl-paas.net/<your-service-name>:app-${VERSION} \
  -f backend/Dockerfile . --load
```

### Step 2: Push

```bash
docker push docker.atl-paas.net/<your-service-name>:app-${VERSION}
```

### Step 3: Deploy

```bash
export VERSION=1.0.2
atlas micros service deploy \
  --service=<your-service-name> \
  --env=pdev-west2 \
  --file=service-descriptor.yml
```

---

## Key Files

| File                        | Purpose                                                                     |
| --------------------------- | --------------------------------------------------------------------------- |
| `backend/Dockerfile`        | Multi-stage: builds Next.js (Node 20) → copies to Express container         |
| `backend/server.js`         | Express server: serves static files + API routes                            |
| `backend/package-lock.json` | Required for `npm ci` in Docker (generate with `cd backend && npm install`) |
| `service-descriptor.yml`    | Micros deployment config (EC2, Docker image, env vars)                      |
| `next.config.ts`            | Next.js config with conditional `output: "export"` for production           |
| `.env.local`                | Local dev credentials (ASAP keys, AI Gateway config)                        |

---

## Troubleshooting

### Build Issues

#### Build fails with TypeScript errors

To verify locally before Docker build:

```bash
pnpm run build
```

#### "npm ci" fails in Docker - missing package-lock.json

The backend folder needs a `package-lock.json` file:

```bash
cd backend && npm install && cd ..
```

#### "Node.js version >=20.9.0 required"

Update `backend/Dockerfile` to use Node 20:

```dockerfile
FROM node:20-alpine AS builder
# ... and also the runtime stage:
FROM node:20-alpine
```

#### "scripts/build-export.sh not found"

Use the updated Dockerfile that uses inline build commands instead of external scripts:

```dockerfile
RUN rm -rf app/api && \
    NEXT_OUTPUT=export pnpm run build
```

#### Turbopack still processes moved API routes

Don't use `mv app/api app/api.bak` - Turbopack will still try to process the `.bak` folder.
Use `rm -rf app/api` to completely remove the folder during build.

#### "Can't resolve @/components/..." - file casing mismatch

macOS is case-insensitive, so `Providers.tsx` and `providers.tsx` appear identical locally.
Docker runs on Linux (case-sensitive), so mismatches fail.

**Solution:** Check that file names match their imports exactly. If needed, delete and recreate the file with correct casing.

#### "Cannot find module 'express'" - pnpm symlink issue

**Symptom:** Health check fails with 400 error. Splunk logs show:

```
Error: Cannot find module 'express'
```

**Root Cause:** The `backend/package-lock.json` was generated by pnpm and contains symlinks instead of resolved packages. When you run `npm install` in a pnpm workspace, npm detects pnpm's structure and creates a lockfile with entries like:

```json
"node_modules/express": {
  "resolved": "../node_modules/.pnpm/express@4.22.1/node_modules/express",
  "link": true
}
```

When `npm ci` runs in Docker, these symlinks point to paths that don't exist because pnpm's `node_modules/.pnpm/` directory isn't copied to the container.

**Solution:** Regenerate `package-lock.json` using npm in isolation:

```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

This creates a proper npm lockfile with resolved registry URLs:

```json
"node_modules/express": {
  "version": "4.21.2",
  "resolved": "https://registry.npmjs.org/express/-/express-4.21.2.tgz",
  "integrity": "sha512-..."
}
```

**Prevention:**

- Always use `npm install` (not pnpm) when working in the `backend/` directory
- The backend is a separate npm project that runs independently in Docker
- If you see `"link": true` entries in `backend/package-lock.json`, regenerate it

### Service name too long error

Maximum 26 characters. Pick a shorter name and start over.

### "Unknown service" when setting environment variables

The service must exist first. Run:

```bash
atlas micros service create --service=<your-service-name> --no-sd
```

### Health check shows "MISSING" for environment variables

**This means environment variables weren't set before deployment.**

**Solution:**

1. Set the missing variables (see Step 5)
2. **Redeploy with a new version** (the running container won't pick up changes automatically)

### Chat returns 401 Unauthorized or "Principal not whitelisted"

ASAP authentication issue. Common fixes:

- **ASAP principal not whitelisted** - Run:
  ```bash
  atlas ml aigateway usecase auth add -i YOUR-USE-CASE-ID -e stg-east -p YOUR-USE-CASE-ID -t ASAP_ISSUER
  ```
  Then wait 5-10 minutes for changes to propagate
- **ASAP key not saved to keyserver** - Run:
  ```bash
  atlas asap key save --key YOUR-USE-CASE-ID/001 --service YOUR-USE-CASE-ID --env staging --file .asap-config
  ```

### Push Issues

#### "User is unauthorized to upload"

Docker registry authorization failure. Try these steps in order:

1. **Re-authenticate with Docker:**

   ```bash
   docker login docker.atl-paas.net
   # Username: Your StaffID (e.g., esoh - NOT your email)
   # Password: API Key from https://packages.atlassian.com/
   ```

2. **Grant permissions (if first time):**

   ```bash
   atlas packages permission grant
   ```

3. **Wait and retry:** Permission grants may take 1-2 minutes to propagate.

### Deployment fails: "Exec format error"

Wrong platform architecture. You must build for `linux/amd64`:

```bash
docker buildx build --platform linux/amd64 --no-cache \
  -t docker.atl-paas.net/<your-service-name>:app-1.0.7 \
  -f backend/Dockerfile . --load
```

### Docker push unauthorized

```bash
docker login docker.atl-paas.net  # Use StaffID + API Key
atlas packages permission grant
```

### Check logs

Splunk URL provided in deployment output, or:

```
`micros_<service-name>` env=pdev-west2 m.t=application (error OR "AI Gateway")
```

---

## Success Criteria

✅ **Deployment successful when:**

- Health check returns all "SET" values
- Chat API streams responses in curl test
- Browser shows images loading
- No errors in browser console or Splunk logs

---

## Additional Resources

- **Micros Documentation**: https://go.atlassian.com/micros
- **Troubleshooting Guide**: https://go.atlassian.com/mdt
- **Help Channel**: #help-micros on Slack
- **AI Gateway**: #help-ai-gateway on Slack
