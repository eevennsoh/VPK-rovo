# Cursor Cloud Environment Setup

Provider-specific setup for running this repo in Cursor Cloud VMs. Everything here supplements `AGENTS.md`, which stays the canonical context.

## Required secrets

| Secret | Purpose |
|--------|---------|
| `ATLASSIAN_NPM_TOKEN` | Auth for `@atlassian/logo-third-party` from the private registry — **required for `pnpm install`** |
| `ROVO_SESSION_TOKEN` | Backend → Rovo Serve auth (only needed for Rovo chat flows) |
| `ASAP_PRIVATE_KEY` | AI Gateway ASAP auth |
| `ASAP_KID` | AI Gateway ASAP key ID |
| `ASAP_ISSUER` | AI Gateway ASAP issuer |
| `AI_GATEWAY_URL` | AI Gateway endpoint |
| `AI_GATEWAY_USE_CASE_ID` | AI Gateway use case |

## Update script (paste into the Update Script box)

```
{
  echo "registry=https://registry.npmjs.org/"
  echo "@atlaskit:registry=https://registry.npmjs.org/"
  echo "@atlassian:registry=https://packages.atlassian.com/artifactory/api/npm/atlassian-npm/"
  echo "//packages.atlassian.com/artifactory/api/npm/atlassian-npm/:_authToken=\${ATLASSIAN_NPM_TOKEN}"
  echo "//packages.atlassian.com/api/npm/atlassian-npm/:_authToken=\${ATLASSIAN_NPM_TOKEN}"
} > "$HOME/.npmrc"
test -f .env.local || cp .env.local.example .env.local
pnpm install
```

## Services overview

| Service | Command | Default Port | Required? |
|---------|---------|-------------|-----------|
| Next.js Frontend | `pnpm run dev:frontend` | 3000 | Yes |
| Express Backend | `pnpm run dev:backend` | 8080 | Yes |
| Rovo Serve | `pnpm run dev:rovo` | 8000 | Only for Rovo-selected chat/tool flows |

Start frontend + backend together: `pnpm run dev`. Start all three (including Rovo): `pnpm run rovo` (requires the `rovo` CLI on PATH).

## Running checks

- Lint: `pnpm run lint`
- Typecheck: `pnpm run typecheck`
- Build: `pnpm run build`
- No single `pnpm test`; run targeted `node --test` against specific `.test.js`/`.test.ts` files

## Non-obvious caveats

- `ATLASSIAN_NPM_TOKEN` must be configured as a secret and written to `~/.npmrc` before `pnpm install` will succeed (the CI workflow `.github/workflows/ci.yml` shows the exact pattern). Without it, the private `@atlassian/logo-third-party` package fails to resolve.
- The backend reads secrets from `process.env` directly (with `.env.local` as dotenv fallback), so injected env vars work without writing them to `.env.local`. `.env.local` is still useful for `next dev`; create it from `.env.local.example` if missing.
- Backend port is written to `.dev-backend-port`, frontend to `.dev-frontend-port` at startup.
- `pnpm run dev` starts both services via `concurrently`; do not run `pnpm run rovo` at the same time or you'll get port conflicts.
- The `pnpm install` warning about ignored build scripts (better-sqlite3, node-llama-cpp) is expected and harmless.
- Health endpoint: `curl http://localhost:<backend-port>/api/health` — returns JSON with service status and auth config summary.
- The `rovo` CLI (Rovo Serve) is not available in cloud VMs — use `pnpm run dev` instead. AI Gateway-backed routes still work when credentials and egress are available.
- AI Gateway endpoints need outbound HTTPS to `ai-gateway.us-east-1.staging.atl-paas.net`; with restricted egress, gateway-backed features return errors gracefully.
- `ASAP_PRIVATE_KEY` formatting: see the Gotchas section of `AGENTS.md` (the value already includes quotes and literal `\n` escapes).
