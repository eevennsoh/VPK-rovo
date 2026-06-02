const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const HOOK_SOURCE = fs.readFileSync(path.join(__dirname, "use-agent-url-sync.ts"), "utf8");
const SHELL_SOURCE = fs.readFileSync(
	path.join(__dirname, "..", "components", "projects", "studio", "components", "rovo-app-shell.tsx"),
	"utf8",
);

// Regression: restoring an agent from `?agent=` on load/back-forward must let the
// surface restore its per-agent view (the studio config pane). Without this the
// deep-linked / reloaded agent only re-selects for chat and the studio falls
// through to a full-screen chat surface with no config pane / AgentHeader.
test("useAgentUrlSync accepts and forwards an onAgentRestored callback", () => {
	assert.match(HOOK_SOURCE, /onAgentRestored\?:\s*\(agentId:\s*string\s*\|\s*null\)\s*=>\s*void/u);
	assert.match(HOOK_SOURCE, /const onAgentRestoredRef = useRef\(onAgentRestored\);/u);
	assert.match(HOOK_SOURCE, /onAgentRestoredRef\.current = onAgentRestored;/u);
});

test("useAgentUrlSync notifies onAgentRestored from the mount seed", () => {
	// The seed-apply effect must call back once the named agent resolves.
	assert.match(
		HOOK_SOURCE,
		/if \(selectableAgents\.some\(\(agent\) => agent\.id === seedAgentId\)\) \{[\s\S]*onAgentRestoredRef\.current\?\.\(seedAgentId\);/u,
	);
});

test("useAgentUrlSync notifies onAgentRestored from popstate (agent and default)", () => {
	assert.match(HOOK_SOURCE, /onAgentRestoredRef\.current\?\.\(nextAgentId\);/u);
	assert.match(HOOK_SOURCE, /onAgentRestoredRef\.current\?\.\(null\);/u);
});

test("studio shell opens the config pane for the URL-restored agent", () => {
	// Handler maps a restored agent id to activeAgentConfig (and clears it for null).
	assert.match(
		SHELL_SOURCE,
		/const handleAgentRestoredFromUrl = useCallback\(\(agentId: string \| null\) => \{[\s\S]*setActiveAgentConfig\(agentId \? \{ profileId: agentId, sourceMessageId: null \} : null\);/u,
	);
	// Handler is wired into the URL sync hook.
	assert.match(SHELL_SOURCE, /useAgentUrlSync\(\{ enabled: !embedded, onAgentRestored: handleAgentRestoredFromUrl \}\)/u);
});
