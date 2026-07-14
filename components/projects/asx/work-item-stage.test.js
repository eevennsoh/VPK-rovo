const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const PAGE_SOURCE = readFileSync(join(__dirname, "page.tsx"), "utf8");
const STAGE_SOURCE = readFileSync(join(__dirname, "components/work-item-stage.tsx"), "utf8");
const DIALOG_SOURCE = readFileSync(
	join(__dirname, "../../blocks/agent-sessions/experimental/components/experimental-work-item-dialog.tsx"),
	"utf8",
);
const COMPOSITION_SOURCE = readFileSync(
	join(__dirname, "../../blocks/agent-sessions/experimental/experimental-agent-sessions.tsx"),
	"utf8",
);
const FLOATING_SURFACE_SOURCE = readFileSync(
	join(__dirname, "../../blocks/agent-sessions/experimental/components/floating-session-surface.tsx"),
	"utf8",
);
const CONTROLLER_SOURCE = readFileSync(
	join(__dirname, "../../blocks/agent-sessions/experimental/use-agent-sessions-controller.ts"),
	"utf8",
);

test("ASX Work item opens the experimental Agent Sessions design from its state buttons", () => {
	assert.match(PAGE_SOURCE, /item\.id === "work-item"[\s\S]*<WorkItemStage controller=\{workItemController\} \/>/u);
	assert.match(PAGE_SOURCE, /<WorkItemControls controller=\{workItemController\} \/>/u);
	assert.match(PAGE_SOURCE, /topBarCenter=\{topBarCenter\}/u);
	assert.match(STAGE_SOURCE, /<ExperimentalAgentSessions/u);
	assert.match(STAGE_SOURCE, /const selectPreset = useCallback[\s\S]*setPreset\(nextPreset\);/u);
	assert.match(STAGE_SOURCE, /setLaunchId\(\(currentLaunchId\) => currentLaunchId \+ 1\);/u);
	assert.match(STAGE_SOURCE, /<ExperimentalAgentSessions[\s\S]*key=\{controller\.launchId\}/u);
	assert.match(STAGE_SOURCE, /presentation="inline"/u);
	assert.doesNotMatch(STAGE_SOURCE, /isOpen|setIsOpen|onClose=/u);
	assert.match(STAGE_SOURCE, /aria-label="Open a work item state"/u);
	assert.match(STAGE_SOURCE, /<ButtonGroup[\s\S]*variant="connected"/u);
	assert.match(STAGE_SOURCE, /size="compact"/u);
	assert.match(STAGE_SOURCE, /useState<AgentSessionsExperimentalPreset>\("empty"\)/u);
	assert.match(STAGE_SOURCE, /aria-pressed=\{controller\.preset === option\.value\}/u);
	assert.match(STAGE_SOURCE, /aria-pressed:z-10/u);
	assert.match(STAGE_SOURCE, /border-l!/u);
	assert.doesNotMatch(STAGE_SOURCE, /<button/u);
	assert.doesNotMatch(STAGE_SOURCE, /Open work item/u);
});

test("ASX Work item renders the dialog surface inline without a blanket", () => {
	const inlineIndex = DIALOG_SOURCE.indexOf('if (presentation === "inline")');
	const backdropIndex = DIALOG_SOURCE.indexOf("<Dialog.Backdrop");

	assert.ok(inlineIndex >= 0 && inlineIndex < backdropIndex);
	assert.match(DIALOG_SOURCE, /<section[\s\S]*aria-label=\{workItemTitle\}/u);
	assert.match(DIALOG_SOURCE, /<ModalHeader showClose=\{presentation !== "inline"\} \/>/u);
});

test("ASX Work item portals its local Rovo surface to viewport coordinates", () => {
	assert.match(COMPOSITION_SOURCE, /<FloatingSessionSurface portalToViewport=\{presentation === "inline"\} \/>/u);
	assert.match(FLOATING_SURFACE_SOURCE, /createPortal\(surface, portalRoot\)/u);
	assert.match(FLOATING_SURFACE_SOURCE, /portalToViewport \? document\.body : null/u);
});

test("ASX Work item can jump between all requested presets", () => {
	assert.match(STAGE_SOURCE, /label: "Empty", value: "empty"/u);
	assert.match(STAGE_SOURCE, /label: "Filled", value: "filled"/u);
	assert.match(STAGE_SOURCE, /label: "Agents running", value: "running"/u);
	assert.doesNotMatch(STAGE_SOURCE, /controls=/u);
	assert.doesNotMatch(CONTROLLER_SOURCE, /hydrate-preset", preset: initialPreset/u);
});
