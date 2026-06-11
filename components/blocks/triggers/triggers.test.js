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
const TRIGGER_BYLINES = require(
	join(__dirname, "..", "..", "..", "app", "data", "directory", "trigger-bylines.json"),
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
	assert.match(CATALOG_SOURCE, /export function isAgentTriggerEnabled/u);
	assert.match(CATALOG_SOURCE, /enabled\?: boolean;/u);
	assert.match(CATALOG_SOURCE, /export function serializeAgentTriggerLabels/u);
	assert.match(CATALOG_SOURCE, /DEFAULT_CONFIGURED_TRIGGER_VALUES/u);
	assert.match(CATALOG_SOURCE, /DEFAULT_NEEDS_CONNECTION_TRIGGER_VALUES/u);
});

test("every trigger provider has byline mock copy in the directory data layer", () => {
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
		const byline = TRIGGER_BYLINES[providerId];
		assert.equal(typeof byline, "string", `missing byline for ${providerId}`);
		assert.ok(byline.trim().length > 0, `empty byline for ${providerId}`);
	}
});

test("provider rows render an animated byline matching the command-menu reveal", () => {
	// Byline copy is sourced from the shared directory data layer, not inlined.
	assert.match(
		TRIGGERS_SOURCE,
		/import \{ getTriggerByline \} from "@\/app\/data\/directory\/trigger-bylines";/u,
	);
	// Reveal is driven by interaction + submenu-open state.
	assert.match(TRIGGERS_SOURCE, /const isActive = isInteractionActive \|\| isSubmenuOpen;/u);
	assert.match(TRIGGERS_SOURCE, /<DropdownMenuSub onOpenChange=\{setIsSubmenuOpen\}>/u);
	// Motion variants mirror the editor-palette nested command label/description.
	assert.match(TRIGGERS_SOURCE, /triggerProviderLabelVariants/u);
	assert.match(TRIGGERS_SOURCE, /triggerProviderBylineVariants/u);
	assert.match(TRIGGERS_SOURCE, /animate=\{isActive \? "active" : "idle"\}/u);
	// Reuses the shared command-menu reveal layout classes.
	assert.match(TRIGGERS_SOURCE, /rich-text-command-menu-nested-copy-revealable/u);
});

test("Triggers supports empty, picker, configured, remove, params, and connection states", () => {
	assert.match(TRIGGERS_SOURCE, /triggers\?: readonly AgentTriggerValue\[\];/u);
	assert.match(TRIGGERS_SOURCE, /defaultTriggers\?: readonly AgentTriggerValue\[\];/u);
	assert.match(TRIGGERS_SOURCE, /defaultPickerOpen\?: boolean;/u);
	assert.match(TRIGGERS_SOURCE, /onTriggersChange\?: \(triggers: readonly AgentTriggerValue\[\]\) => void;/u);
	assert.match(TRIGGERS_SOURCE, /onConnectTrigger\?: \(trigger: AgentTriggerValue\) => void;/u);
	assert.match(TRIGGERS_SOURCE, /<DropdownMenuSub onOpenChange=\{setIsSubmenuOpen\}>/u);
	assert.match(TRIGGERS_SOURCE, /placeholder="Search triggers"/u);
	assert.match(TRIGGERS_SOURCE, /No triggers found/u);
	assert.match(TRIGGERS_SOURCE, /aria-label="Delete trigger"/u);
	assert.match(TRIGGERS_SOURCE, /Requires connection/u);
	assert.match(TRIGGERS_SOURCE, /Connection failed/u);
	assert.match(TRIGGERS_SOURCE, /disabled=\{disabled\}/u);
	assert.match(TRIGGERS_SOURCE, /onSelectEvent\(provider\.id, event\.id\)/u);
	assert.match(TRIGGERS_SOURCE, /<TriggerAutomationDialog/u);
	assert.match(TRIGGERS_SOURCE, /getAgentTriggerReadableLabel\(nextTrigger\)/u);
});

test("trigger automation modal uses one shared prompt, name, and active state", () => {
	// Prompt remains in the trigger value model as the legacy shared field.
	assert.match(CATALOG_SOURCE, /\/\*\* Legacy shared automation prompt[^*]*\*\/\s*prompt\?: string;/u);
	assert.match(CATALOG_SOURCE, /automationName\?: string;/u);
	assert.match(CATALOG_SOURCE, /prompt: "",/u);
	// The modal owns one shared Agent Instructions textarea using the shared VPK
	// Textarea primitive, not per-trigger textareas.
	assert.match(TRIGGERS_SOURCE, /import \{ Textarea \} from "@\/components\/ui\/textarea";/u);
	assert.match(TRIGGERS_SOURCE, /aria-label="Agent Instructions"/u);
	assert.match(TRIGGERS_SOURCE, /value=\{sharedPrompt\}/u);
	assert.doesNotMatch(TRIGGERS_SOURCE, /aria-label="Trigger prompt"/u);
	assert.doesNotMatch(TRIGGERS_SOURCE, /const handlePromptChange = useCallback\(/u);
	// Save mirrors shared fields across every persisted trigger value.
	assert.match(TRIGGERS_SOURCE, /function applySharedAutomationFields/u);
	assert.match(TRIGGERS_SOURCE, /automationName: automationName\.trim\(\)/u);
	assert.match(TRIGGERS_SOURCE, /enabled,/u);
	assert.match(TRIGGERS_SOURCE, /prompt,/u);
	assert.match(TRIGGERS_SOURCE, /Automation name/u);
	assert.match(TRIGGERS_SOURCE, /<Switch checked=\{active\}/u);
	assert.match(TRIGGERS_SOURCE, /GenerativeIndicatorIcon/u);
	assert.match(TRIGGERS_SOURCE, /function TriggerAutomationFlowPreview/u);
	assert.match(TRIGGERS_SOURCE, /const visibleTriggers = triggers\.slice\(0, 5\);/u);
	assert.match(TRIGGERS_SOURCE, /className="h-px w-8 shrink-0 bg-border"/u);
	assert.match(TRIGGERS_SOURCE, /label="Agent instructions"/u);
});

test("Triggers demos and block docs export the required state variations", () => {
	for (const exportName of [
		"TriggersDemoEmpty",
		"TriggersDemoPicker",
		"TriggersDemoConfigured",
		"TriggersDemoMultiple",
		"TriggersDemoNeedsConnection",
		"TriggersDemoManage",
	]) {
		assert.match(DEMO_SOURCE, new RegExp(`export function ${exportName}`, "u"));
	}

	for (const demoSlug of [
		"triggers-demo-empty",
		"triggers-demo-picker",
		"triggers-demo-configured",
		"triggers-demo-multiple",
		"triggers-demo-needs-connection",
		"triggers-demo-manage",
	]) {
		assert.match(REGISTRY_SOURCE, new RegExp(`"${demoSlug}"`, "u"));
		assert.match(BLOCK_DETAILS_SOURCE, new RegExp(`demoSlug: "${demoSlug}"`, "u"));
	}

	assert.doesNotMatch(DEMO_SOURCE, /<Triggers defaultPickerOpen \/>/u);
});
