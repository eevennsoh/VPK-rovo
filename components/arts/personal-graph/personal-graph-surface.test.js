const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const SURFACE_SOURCE = fs.readFileSync(
	path.join(__dirname, "personal-graph-surface.tsx"),
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
