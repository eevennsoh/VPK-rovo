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

test("AgentTriggersDialog delegates to the trigger-config automation modal", () => {
	// The shared wrapper now hosts the new trigger-config surface inside the modal.
	assert.match(DIALOG_SOURCE, /TriggerConfigAutomationDialog/u);
	assert.match(DIALOG_SOURCE, /type AgentAutomationRule/u);
	assert.match(DIALOG_SOURCE, /automationRule=\{automationRule\}/u);
	assert.match(DIALOG_SOURCE, /onSave=\{onSave\}/u);
});

test("TriggerConfigAutomationDialog hosts AgentConfigFields with Active, Save and Cancel", () => {
	assert.match(TRIGGERS_PAGE_SOURCE, /export function TriggerConfigAutomationDialog/u);
	assert.match(TRIGGERS_PAGE_SOURCE, /<Switch checked=\{active\}/u);
	assert.match(TRIGGERS_PAGE_SOURCE, /<AgentConfigFields/u);
	assert.match(TRIGGERS_PAGE_SOURCE, /onAutomationRulesChange=\{handleAutomationRulesChange\}/u);
	assert.match(TRIGGERS_PAGE_SOURCE, /onTextChange=\{handleConfigTextChange\}/u);
	assert.match(TRIGGERS_PAGE_SOURCE, /Cancel/u);
	assert.match(TRIGGERS_PAGE_SOURCE, /\{saveLabel\}/u);
});

test("TriggerConfigAutomationDialog re-seeds draft on open so Cancel discards", () => {
	assert.match(TRIGGERS_PAGE_SOURCE, /if \(open && !wasOpen\.current\)/u);
	assert.match(TRIGGERS_PAGE_SOURCE, /setDraftRule\(nextSeed\)/u);
});

test("TriggerConfigAutomationDialog Save commits the automation rule and closes; Cancel only closes", () => {
	assert.match(TRIGGERS_PAGE_SOURCE, /onSave\(createAgentAutomationRule\(\{/u);
	assert.match(TRIGGERS_PAGE_SOURCE, /disabled=\{draftRule\.triggers\.length === 0\}/u);
	assert.match(TRIGGERS_PAGE_SOURCE, /onOpenChange\(false\)/u);
	assert.match(TRIGGERS_PAGE_SOURCE, /<Button onClick=\{\(\) => onOpenChange\(false\)\} type="button" variant="ghost">/u);
});

test("TriggerPicker is exported and accepts a custom trigger element", () => {
	assert.match(TRIGGERS_PAGE_SOURCE, /export function TriggerPicker\(/u);
	assert.match(TRIGGERS_PAGE_SOURCE, /trigger\?: ReactElement/u);
	assert.match(TRIGGERS_PAGE_SOURCE, /render=\{trigger \?\? <TriggerAddRow label=\{label\} \/>\}/u);
});

test("Trigger summary row routes add-event selections to a new automation draft", () => {
	assert.match(AGENT_SOURCE, /function AgentTriggerSummaryRow\(/u);
	assert.match(AGENT_SOURCE, /onClick=\{\(\) => onEditTriggers\?\.\(\)\}/u);
	assert.match(AGENT_SOURCE, /const next = createAutomationRuleFromEvent\(providerId, eventId, automationRules\);/u);
	assert.match(AGENT_SOURCE, /onEditTriggers\?\.\(next \?\? undefined\)/u);
	assert.match(AGENT_SOURCE, /onEditTriggers[\s\S]*\? \(\) => onEditTriggers\(rule\)[\s\S]*: undefined/u);
	assert.doesNotMatch(AGENT_SOURCE, /onEditTriggers\?\.\(next \? \[\.\.\.existing, next\] : existing\)/u);
});

test("AgentConfigFields hosts a single automation dialog and commits via onAutomationRulesChange", () => {
	assert.match(AGENT_SOURCE, /import \{ AgentTriggersDialog \} from "@\/components\/ui-custom\/agent-triggers-dialog"/u);
	assert.match(AGENT_SOURCE, /const handleEditTriggers = useCallback\(\(seed\?: AgentAutomationRule\) =>/u);
	assert.match(AGENT_SOURCE, /seed: seed \?\? createAgentAutomationRule\(\{/u);
	assert.match(AGENT_SOURCE, /<AgentTriggersDialog/u);
	assert.match(AGENT_SOURCE, /automationRule=\{triggersEditor\.seed\}/u);
	assert.match(AGENT_SOURCE, /onSave=\{handleTriggersSave\}/u);
	assert.match(AGENT_SOURCE, /onAutomationRulesChange\?\.\(/u);
	assert.match(AGENT_SOURCE, /existingIndex >= 0[\s\S]*current\.map\([\s\S]*: \[\.\.\.current, automationRule\]/u);
});

test("Compact empty nav opens the automation modal", () => {
	assert.match(AGENT_SOURCE, /item\.agentFieldName === "trigger"\)\s*\{\s*return \(\) => onEditTriggers\?\.\(\);/u);
});

test("Agent demo round-trips rich automation rules", () => {
	assert.match(AGENT_DEMO_SOURCE, /automationRules: DEFAULT_CONFIGURED_AUTOMATION_RULES/u);
	assert.match(AGENT_DEMO_SOURCE, /function handleAutomationRulesChange\(automationRules: readonly AgentAutomationRule\[\]\)/u);
	assert.match(AGENT_DEMO_SOURCE, /onAutomationRulesChange=\{handleAutomationRulesChange\}/u);
});
