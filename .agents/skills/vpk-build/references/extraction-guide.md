# Extraction guide

Use this reference after selecting a route and before approving the scaffold.

## Contents

- [Plan interpretation](#plan-interpretation)
- [Backend-backed exports](#backend-backed-exports)
- [Scaffold behavior](#scaffold-behavior)
- [Verification and failures](#verification-and-failures)
- [Ports and local runtime](#ports-and-local-runtime)
- [Deployment handoff](#deployment-handoff)
- [Out of scope](#out-of-scope)

## Plan interpretation

The trace plan reports source files, npm packages, public assets, backend routes,
cross-route links, skipped dispatchers, and summary counts. The known
`demo-registry-loader.ts` skip is resolved through the `loadDemoComponent`
special case; investigate other unexpected skipped dispatchers as potential
missing graph edges.

If `backendRouteCount` is nonzero, choose explicitly:

- Stop a pure standalone extraction until the user supplies a backend or proxy
  plan.
- For an intentional Studio, chat, Rovo, wiki, realtime, or scripted-tour app,
  preserve the full source-backed runtime described below.
- Create local fake APIs only when the user asks for a mocked presentation demo.

Non-literal dynamic imports, unresolved dependencies, and cross-route navigation
also require review before scaffold approval.

## Backend-backed exports

Studio, live chat, Rovo browsing, wiki-backed memory, realtime voice, reset-demo
controls, and scripted tours depend on the VPK backend. Preserve copied app
source byte-for-byte where possible and place export behavior in the harness.

The target `pnpm run dev` must start both the extracted frontend and source VPK
backend, with a default source root such as `../vpk-rovo` and a
`VPK_ROVO_ROOT=/path/to/vpk-rovo` override. A common harness builds and serves
the static frontend on port 3001 while invoking `pnpm run dev:backend` in the
source checkout.

Proxy real routes rather than recreating them. Depending on the app, this
includes:

- `/api/rovo/*`
- `/api/wiki/*`
- `/api/agents/rfp-demo/*`
- `/api/realtime/*`

Static export removes Next API routes, so the harness must answer
`/api/realtime/ws-url` with the backend WebSocket base and proxy upgrades for
`/api/realtime/audio-conversation`.

Keep realtime model selection in the backend. The source uses
`OPENAI_REALTIME_MODEL` with its configured fallback; do not hardcode a model in
the extracted client. For deployed voice demos, keep the service stash aligned
with the source deployment.

When deploying, use the full backend rather than the minimal Micros scaffold.
If global CORS middleware is present, allow same-host production origins before
static serving. Browser font requests include `Origin` and can fail even when a
plain asset curl succeeds.

For a broken tour or voice flow, verify backend startup, the WebSocket URL,
upgrade proxy, and source parity of the Studio/sidebar-chat/realtime files
before patching application behavior.

## Scaffold behavior

The scaffold keeps repo-relative paths so `@/*` imports remain unchanged. It
copies the full `public` tree, replaces the catalog-dispatched route entry with
a direct demo import, generates layout/provider ordering, creates the Micros
files, initializes Git, and links only `vpk-setup` and `vpk-deploy`.

The generated `app/globals.css` begins from VPK's source file and filters
`@import`/`@source` directives whose packages are absent from the traced set.
It always keeps Tailwind, PostCSS, and `tw-animate-css`; the scaffold injects
`tw-animate-css` because TypeScript tracing cannot see CSS dependencies.

The generated layout loads the default Atlassian and demo font families and
mounts the client feature-flag shim. Keep font links for any family referenced
by the copied route. `next.config.ts` disables the floating Next dev indicator
for demos; remove that setting only when debugging requires it.

The linked skills use relative paths back to VPK-Rovo and will break if the
source checkout moves independently. Re-run the scaffold or repair the symlinks
after such a move.

## Verification and failures

`verify-target.sh` runs install, typecheck, and build. Diagnose failures at the
narrowest owner:

| Symptom | Likely owner |
| --- | --- |
| Install failure | Target dependency version mismatch |
| Missing `@/` import | Trace edge or copied file missing |
| Unresolved Tailwind class/build failure | `app/globals.css` import chain |
| Blank or unstyled runtime | Tailwind utilities were not emitted |
| Named fonts fall back | Generated layout lacks the font link |
| Feature-gate console warning | Client shim missing or not mounted |
| Broken logos/product icons | Full `public` tree not copied |
| API 404 or mutation 405 | Static server lacks source backend proxy |
| AI works but chat/tour fails | Realtime URL or WebSocket upgrade missing |
| Agent output diverges | Local fallback/shim or copied source drift |
| Browser font returns 500 | Same-host CORS rejects browser-shaped request |

Do not dismiss a browser-only failure as cache until a request with `Origin`,
`Referer`, `Sec-Fetch-Dest: font`, and `Sec-Fetch-Mode: cors` succeeds.

After the build, run the target and inspect its actual route, console, fonts,
assets, navigation, and stateful behavior. Backend-backed flows require live API
and WebSocket proof.

## Ports and local runtime

Extracted frontends default to port 3001 so VPK-Rovo can remain on 3000. An
`EADDRINUSE` on 3001 is a listener collision, not a build failure. Stop the
existing frontend or select another port. Backend-backed `pnpm run dev` must
start or reuse the source backend as well as the extracted frontend.

## Deployment handoff

After target verification:

```bash
cd ../vpk-<route-slug>
# invoke vpk-deploy --initial
# later: pnpm run deploy:micros
```

The minimal `references/micros` scaffold suits routes without live backend
dependencies. Replace it with the full backend implementation for API, SSE,
WebSocket, AI, or voice behavior, while preserving runtime security and static
serving.

## Out of scope

- Rewriting internal cross-route links automatically; report and rewire them.
- Extracting multiple routes into one target.
- Generating a replacement backend from detected API calls.
- Inferring provider dependency ordering beyond the scaffold's generated order;
  reorder the target layout when a real cross-provider dependency requires it.
