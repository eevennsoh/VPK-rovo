# Prototype improvement plan

This plan consolidates the useful product, reliability, performance, and maintainability improvements identified in the original review. It is ordered so correctness fixes land before broader refactors.

## Wave 1: Runtime correctness

### 1. Preserve active Rovo pool leases

- Add a monotonic generation to each pool entry.
- Capture the generation before an asynchronous health check begins.
- Apply a health result only when the entry is still in the same generation and eligible state.
- Increment the generation on acquisition, release, quarantine, and shutdown transitions.
- Keep the current pool size, timeout, discovery, and public handle behavior unchanged.

**Outcome:** a late health result cannot make an actively leased port available to another request.

### 2. Serialize file-backed thread mutations

- Give the thread manager a per-thread mutation queue.
- Route create, update, delete, message, run-state, and Hermes-context writes through that queue.
- Keep independent thread IDs concurrent.
- Replace `thread.json` through a temporary file and same-directory rename.
- Clean queue entries and temporary files after success or failure.

**Outcome:** overlapping updates to one thread cannot lose fields or leave partially written JSON.

### 3. Make the latest thread navigation authoritative

- Add a monotonic navigation identity to the Rovo thread lifecycle owner.
- Carry that identity through hydration, document loading, subscription changes, fallback handling, errors, and loading cleanup.
- Ignore every state commit from superseded navigation.
- Abort obsolete requests where the existing request helpers support cancellation.

**Outcome:** rapid A → B navigation always finishes on B, regardless of response order.

### 4. Coordinate compact-chat transitions

- Extract a focused transition coordinator for reset, thread selection, deletion, and agent changes.
- Issue monotonic operation tokens and track cancellation ownership.
- Guard state clearing, refreshes, queue changes, and final cleanup with the current token.
- Keep transition logic separate from the larger provider so ownership remains easy to follow.

**Outcome:** a late reset or selection cannot erase newer chat state or release cancellation too early.

### 5. Stop ambiguous mutation replay

- Derive retry behavior from the HTTP method at the backend-candidate boundary.
- Automatically retry connection failures only for read-only methods.
- Preserve fallback when a candidate explicitly reports that the route does not exist.
- Return a clear unavailable response when a mutation result is unknown.
- Allow mutation replay only when a caller has an explicit idempotency contract.

**Outcome:** a dropped response cannot silently duplicate a document or other state-changing action.

## Wave 2: Cost and performance

### 6. Remove AI work triggered by card mounting

- Replace mount-time summary generation with persisted metadata or a deterministic formatter.
- Remove the client request helper and unbounded caches when no explicit caller remains.
- Remove the summary endpoint and backend helper when they become unused.
- Keep card descriptions concise, stable, and readable without network work.

**Outcome:** reopening history does not trigger one paid AI request per card.

### 7. Scope the heavy chat runtime to chat-capable routes

- Inventory routes as always-chat, optional-chat, or no-chat.
- Keep only lightweight launcher or selected-agent state global when continuity requires it.
- Move transport, messages, threads, media, retries, and queues behind route-level provider boundaries.
- Lazy-load the heavy runtime from chat-capable route groups.
- Preserve intentional continuity when navigating between chat surfaces.

**Outcome:** routes without chat do not initialize or load the full AI chat runtime.

### 8. Cache memory-explorer graph construction

- Debounce free-text filters and cancel superseded requests.
- Split unfiltered corpus snapshot construction from cheap in-memory filtering.
- Cache snapshots by wiki root, corpus revision, and linked-knowledge mode.
- Invalidate the revision at each known memory mutation owner.
- Replace quadratic tag/topic cliques with bounded hub-style relationships.

**Outcome:** typing produces one current request, unchanged corpora are built once, and large topic groups avoid quadratic edge growth.

## Wave 3: Ownership and product clarity

### 9. Consolidate Skill Config and Trigger Config editors

- Build a small behavior matrix of shared and intentionally different sections.
- Move duplicated constants, labels, normalization, row derivation, and update helpers into `agent-config-core`.
- Extract shared compact navigation, profile editing, reference selection, and common section rendering.
- Use typed composition slots for Skill-only and Trigger-only behavior.
- Leave shallow wrappers and delete superseded local owners.
- Keep each new owner focused and below the repository's decomposition threshold.

**Outcome:** shared editor behavior has one owner while each wrapper expresses only genuine product differences.

### 10. Make Agent the sole canonical block

- Confirm that Agent and Agent 2 currently resolve to equivalent behavior.
- Move canonical implementation ownership into `components/blocks/agent/`.
- Migrate internal imports, demos, details metadata, catalog entries, and generated references.
- Remove the duplicate Agent 2 demo, catalog surface, and implementation directory.
- Keep an old documentation redirect only if it is useful and does not preserve a duplicate component.

**Outcome:** the repository exposes one Agent component, import path, implementation, and catalog entry.

### 11. Define a coherent Rovo administration cluster

- Specify the administrator decisions supported by settings, MCP connectivity, and usage insights.
- Define deterministic local fixture models for configured, empty, loading, and degraded states.
- Reuse existing admin primitives and keep simulated behavior clearly labeled.
- Implement at most three focused views when the available product semantics are clear.
- Leave unrelated placeholders untouched.

**Outcome:** the existing Rovo settings prototype becomes a coherent settings–connectivity–insights experience without expanding into a full administration platform.

## Recommended order

1. Rovo pool lease correctness
2. Thread mutation serialization
3. Latest-wins thread navigation
4. Compact-chat transition coordination
5. Mutation retry semantics
6. Card summary cost removal
7. Chat runtime scoping
8. Memory explorer caching
9. Config editor consolidation
10. Canonical Agent migration
11. Rovo administration cluster

Items 1, 5, 6, and 8 have mostly independent ownership and can be developed in parallel. Items 3 and 4 should precede chat runtime scoping. Config editor consolidation should precede the canonical Agent directory migration so shared model imports move only once.
