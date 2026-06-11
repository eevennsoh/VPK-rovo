const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const DIALOG_SOURCE = readFileSync(join(__dirname, "agent-triggers-dialog.tsx"), "utf8");
const AGENT_SOURCE = readFileSync(
	join(__dirname, "..", "blocks", "agent", "components", "agent.tsx"),
	"utf8",
);
const TRIGGERS_PAGE_SOURCE = readFileSync(
	join(__dirname, "..", "blocks", "triggers", "page.tsx"),
	"utf8",
);
const AGENT_DEMO_SOURCE = readFileSync(
	join(__dirname, "..", "website", "demos", "blocks", "agent-demo.tsx"),
	"utf8",
);

test("AgentTriggersDialog delegates to the shared automation modal", () => {
	assert.match(DIALOG_SOURCE, /TriggerAutomationDialog/u);
	assert.match(DIALOG_SOURCE, /type AgentTriggerValue/u);
	assert.match(DIALOG_SOURCE, /triggers=\{triggerDefinitions\}/u);
	assert.match(DIALOG_SOURCE, /onSave=\{onSave\}/u);
});

test("shared TriggerAutomationDialog has name, Active, trigger list, instructions, Save and Cancel", () => {
	assert.match(TRIGGERS_PAGE_SOURCE, /export function TriggerAutomationDialog/u);
	assert.match(TRIGGERS_PAGE_SOURCE, /Automation name/u);
	assert.match(TRIGGERS_PAGE_SOURCE, /<Switch checked=\{active\}/u);
	assert.match(TRIGGERS_PAGE_SOURCE, /<TriggerAutomationFlowPreview/u);
	assert.match(TRIGGERS_PAGE_SOURCE, /<TriggerConditionsPanel/u);
	assert.match(TRIGGERS_PAGE_SOURCE, /Agent Instructions/u);
	assert.match(TRIGGERS_PAGE_SOURCE, /Cancel/u);
	assert.match(TRIGGERS_PAGE_SOURCE, /\{saveLabel\}/u);
});

test("TriggerAutomationDialog re-seeds draft on open so Cancel discards", () => {
	assert.match(TRIGGERS_PAGE_SOURCE, /if \(open && !wasOpen\.current\)/u);
	assert.match(TRIGGERS_PAGE_SOURCE, /setDraftTriggers\(nextSeed\)/u);
	assert.match(TRIGGERS_PAGE_SOURCE, /setSharedPrompt\(getSharedPrompt\(nextSeed\)\)/u);
});

test("TriggerAutomationDialog Save commits the full draft and closes; Cancel only closes", () => {
	assert.match(TRIGGERS_PAGE_SOURCE, /onSave\(applySharedAutomationFields\(draftTriggers/u);
	assert.match(TRIGGERS_PAGE_SOURCE, /onOpenChange\(false\)/u);
	assert.match(TRIGGERS_PAGE_SOURCE, /<Button onClick=\{\(\) => onOpenChange\(false\)\} type="button" variant="ghost">/u);
});

test("TriggerPicker is exported and accepts a custom trigger element", () => {
	assert.match(TRIGGERS_PAGE_SOURCE, /export function TriggerPicker\(/u);
	assert.match(TRIGGERS_PAGE_SOURCE, /trigger\?: ReactElement/u);
	assert.match(TRIGGERS_PAGE_SOURCE, /render=\{trigger \?\? <TriggerAddRow label=\{label\} \/>\}/u);
});

test("Trigger summary row routes empty state to the picker and non-empty to the modal", () => {
	assert.match(AGENT_SOURCE, /function AgentTriggerSummaryRow\(/u);
	assert.match(AGENT_SOURCE, /onClick=\{\(\) => onEditTriggers\?\.\(\[\]\)\}/u);
	assert.match(AGENT_SOURCE, /onEditTriggers\?\.\(next \? \[\.\.\.existing, next\] : existing\)/u);
	assert.match(AGENT_SOURCE, /\? \(\) => onEditTriggers\(triggerDefinitions\)/u);
});

test("AgentConfigFields hosts a single trigger dialog and commits via onTriggerDefinitionsChange", () => {
	assert.match(AGENT_SOURCE, /import \{ AgentTriggersDialog \} from "@\/components\/ui-custom\/agent-triggers-dialog"/u);
	assert.match(AGENT_SOURCE, /const handleEditTriggers = useCallback\(\(seed\?: readonly AgentTriggerValue\[\]\) =>/u);
	assert.match(AGENT_SOURCE, /seed: seed \?\? config\.triggerDefinitions \?\? \[\]/u);
	assert.match(AGENT_SOURCE, /<AgentTriggersDialog/u);
	assert.match(AGENT_SOURCE, /onSave=\{handleTriggersSave\}/u);
	assert.match(AGENT_SOURCE, /onTriggerDefinitionsChange\?\.\(triggers\)/u);
});

test("Compact empty nav opens the trigger modal", () => {
	assert.match(AGENT_SOURCE, /item\.agentFieldName === "trigger"\)\s*\{\s*return \(\) => onEditTriggers\?\.\(\[\]\)/u);
});

test("Agent demo round-trips rich trigger definitions", () => {
	assert.match(AGENT_DEMO_SOURCE, /triggerDefinitions: DEFAULT_CONFIGURED_TRIGGER_VALUES/u);
	assert.match(AGENT_DEMO_SOURCE, /function handleTriggerDefinitionsChange\(triggerDefinitions: readonly AgentTriggerValue\[\]\)/u);
	assert.match(AGENT_DEMO_SOURCE, /onTriggerDefinitionsChange=\{handleTriggerDefinitionsChange\}/u);
});
