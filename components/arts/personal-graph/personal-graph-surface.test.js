const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const SURFACE_SOURCE = fs.readFileSync(
	path.join(__dirname, "personal-graph-surface.tsx"),
	"utf8",
);
const GRAPH_SOURCE_HOOK_SOURCE = fs.readFileSync(
	path.join(__dirname, "hooks", "use-graph-source.ts"),
	"utf8",
);

test("Personal Graph keeps source actions visible when settings are unavailable", () => {
	assert.match(SURFACE_SOURCE, /error: vaultSettingsError,/);
	assert.match(SURFACE_SOURCE, /error: graphSourceError,/);
	assert.match(
		SURFACE_SOURCE,
		/vaultSettings === null \|\|\s+Boolean\(vaultSettingsError\) \|\|\s+vaultSettings\.status === "unconfigured"/,
	);
	assert.match(SURFACE_SOURCE, /const sourcePickerError = shouldShowSourcePicker \? \(vaultSettingsError \?\? graphSourceError\) : null;/);
	assert.match(SURFACE_SOURCE, /<PersonalGraphSourcePicker/);
	assert.match(SURFACE_SOURCE, /role="alert"/);
	assert.match(SURFACE_SOURCE, /\{sourcePickerError\.message\}/);
});

test("Personal Graph refresh surfaces TWG auth failures from source refreshes", () => {
	assert.match(GRAPH_SOURCE_HOOK_SOURCE, /isRefreshingTwg: boolean;/);
	assert.match(GRAPH_SOURCE_HOOK_SOURCE, /const \[isRefreshingTwg, setIsRefreshingTwg\] = useState\(false\);/);
	assert.match(
		GRAPH_SOURCE_HOOK_SOURCE,
		/setIsRefreshingTwg\(true\);[\s\S]*const explorer = await refreshTwg\(\{ since: options\.since \}\);[\s\S]*finally \{[\s\S]*setIsRefreshingTwg\(false\);[\s\S]*\}/,
	);
	assert.match(SURFACE_SOURCE, /function isTwgAuthRequiredError\(error: Error \| null\): boolean/);
	assert.match(SURFACE_SOURCE, /const isTwgAuthError = isTwgMode && isTwgAuthRequiredError\(error\);/);
	assert.match(SURFACE_SOURCE, /const isTwgRefreshAuthError = isTwgMode && isTwgAuthRequiredError\(graphSourceError\);/);
	assert.match(SURFACE_SOURCE, /const shouldShowTwgAuthError = isTwgAuthError \|\| isTwgRefreshAuthError;/);
	assert.match(
		SURFACE_SOURCE,
		/const isTwgReady = isTwgMode && Boolean\(twgGeneratedAt\) && !isTwgConnecting && !isTwgAuthError;/,
	);
	assert.match(SURFACE_SOURCE, /!shouldShowTwgAuthError &&/);
	assert.match(
		SURFACE_SOURCE,
		/const visibleError = shouldShowVaultOnboarding \|\| shouldShowSourcePicker \|\| shouldShowTwgAuthError \? null : error;/,
	);
	assert.match(SURFACE_SOURCE, /\{shouldShowTwgAuthError \? \(/);
	assert.match(SURFACE_SOURCE, /<PersonalGraphTwgAuthError isRetrying=\{isLoading \|\| isRefreshingTwg\} onRetry=\{handleRetryTwg\} \/>/);
	assert.match(SURFACE_SOURCE, /disabled=\{isLoading \|\| isRefreshingTwg\}/);
	assert.match(SURFACE_SOURCE, /isLoading=\{isLoading \|\| isRefreshingTwg\}/);
});
