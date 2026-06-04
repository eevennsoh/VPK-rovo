const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const test = require("node:test");

const TRIGGERS_SOURCE = readFileSync(join(__dirname, "page.tsx"), "utf8");
const CATALOG_SOURCE = readFileSync(join(__dirname, "data", "trigger-catalog.ts"), "utf8");
const DEMO_SOURCE = readFileSync(
	join(__dirname, "..", "..", "website", "demos", "blocks", "triggers-demo.tsx"),
	"utf8",
);
const REGISTRY_SOURCE = readFileSync(
	join(__dirname, "..", "..", "website", "registry.ts"),
	"utf8",
);
const BLOCK_DETAILS_SOURCE = readFileSync(
	join(__dirname, "..", "..", "..", "app", "data", "details", "blocks.ts"),
	"utf8",
);

test("trigger catalog defines expected automation providers and events", () => {
	for (const providerId of [
		"scheduled",
		"jira",
		"confluence",
		"github-gitlab",
		"slack",
		"microsoft-teams",
		"sentry",
		"linear",
		"webhook",
		"pagerduty",
	]) {
		assert.match(CATALOG_SOURCE, new RegExp(`id: "${providerId}"`, "u"));
	}

	for (const eventId of [
		"every-hour",
		"incoming-webhook",
		"work-item-created",
		"work-item-updated",
		"comment-added",
		"status-changed",
		"draft-opened",
		"pull-request-opened",
		"push-to-branch",
		"checks-completed",
		"scheduled-page-review",
		"incident-triggered",
	]) {
		assert.match(CATALOG_SOURCE, new RegExp(`id: "${eventId}"`, "u"));
	}

	assert.match(CATALOG_SOURCE, /export function createAgentTriggerValue/u);
	assert.match(CATALOG_SOURCE, /export function getAgentTriggerReadableLabel/u);
	assert.match(CATALOG_SOURCE, /export function serializeAgentTriggerLabels/u);
	assert.match(CATALOG_SOURCE, /DEFAULT_CONFIGURED_TRIGGER_VALUES/u);
	assert.match(CATALOG_SOURCE, /DEFAULT_NEEDS_CONNECTION_TRIGGER_VALUES/u);
});

test("Triggers supports empty, picker, configured, remove, params, and connection states", () => {
	assert.match(TRIGGERS_SOURCE, /triggers\?: readonly AgentTriggerValue\[\];/u);
	assert.match(TRIGGERS_SOURCE, /defaultTriggers\?: readonly AgentTriggerValue\[\];/u);
	assert.match(TRIGGERS_SOURCE, /defaultPickerOpen\?: boolean;/u);
	assert.match(TRIGGERS_SOURCE, /onTriggersChange\?: \(triggers: readonly AgentTriggerValue\[\]\) => void;/u);
	assert.match(TRIGGERS_SOURCE, /onConnectTrigger\?: \(trigger: AgentTriggerValue\) => void;/u);
	assert.match(TRIGGERS_SOURCE, /<DropdownMenuSub>/u);
	assert.match(TRIGGERS_SOURCE, /placeholder="Search Triggers\.\.\."/u);
	assert.match(TRIGGERS_SOURCE, /No triggers found/u);
	assert.match(TRIGGERS_SOURCE, /aria-label="Delete trigger"/u);
	assert.match(TRIGGERS_SOURCE, /Requires connection/u);
	assert.match(TRIGGERS_SOURCE, /Connection failed/u);
	assert.match(TRIGGERS_SOURCE, /disabled=\{disabled\}/u);
	assert.match(TRIGGERS_SOURCE, /onSelectEvent\(provider\.id, event\.id\)/u);
	assert.match(TRIGGERS_SOURCE, /commitTriggers\(currentTriggers\.filter/u);
	assert.match(TRIGGERS_SOURCE, /getAgentTriggerReadableLabel\(nextTrigger\)/u);
});

test("Triggers demos and block docs export the required state variations", () => {
	for (const exportName of [
		"TriggersDemoEmpty",
		"TriggersDemoPicker",
		"TriggersDemoConfigured",
		"TriggersDemoMultiple",
		"TriggersDemoNeedsConnection",
	]) {
		assert.match(DEMO_SOURCE, new RegExp(`export function ${exportName}`, "u"));
	}

	for (const demoSlug of [
		"triggers-demo-empty",
		"triggers-demo-picker",
		"triggers-demo-configured",
		"triggers-demo-multiple",
		"triggers-demo-needs-connection",
	]) {
		assert.match(REGISTRY_SOURCE, new RegExp(`"${demoSlug}"`, "u"));
		assert.match(BLOCK_DETAILS_SOURCE, new RegExp(`demoSlug: "${demoSlug}"`, "u"));
	}
});
