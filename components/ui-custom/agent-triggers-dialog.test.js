const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const DIALOG_SOURCE = readFileSync(join(__dirname, "agent-triggers-dialog.tsx"), "utf8");
const AGENT_SOURCE = readFileSync(join(__dirname, "agent.tsx"), "utf8");
const TRIGGERS_PAGE_SOURCE = readFileSync(
	join(__dirname, "..", "blocks", "triggers", "page.tsx"),
	"utf8",
);
const AGENT_DEMO_SOURCE = readFileSync(
	join(__dirname, "..", "website", "demos", "ui-custom", "agent-demo.tsx"),
	"utf8",
);

test("AgentTriggersDialog embeds the Triggers rule builder with a controlled draft", () => {
	// Body is the shared <Triggers> block, controlled via a local draft.
	assert.match(DIALOG_SOURCE, /import Triggers, \{[^}]*AgentTriggerValue[^}]*\} from "@\/components\/blocks\/triggers\/page"/u);
	assert.match(DIALOG_SOURCE, /<Triggers\s+triggers=\{draft\}\s+onTriggersChange=\{setDraft\}/u);
	assert.match(DIALOG_SOURCE, /useState<readonly AgentTriggerValue\[\]>\(triggerDefinitions\)/u);
});

test("AgentTriggersDialog re-seeds the draft on open so Cancel discards", () => {
	assert.match(DIALOG_SOURCE, /if \(open && !wasOpen\.current\)/u);
	assert.match(DIALOG_SOURCE, /setDraft\(seedRef\.current\)/u);
});

test("AgentTriggersDialog Save commits the draft and closes; Cancel only closes", () => {
	assert.match(DIALOG_SOURCE, /onSave\(draft\)/u);
	assert.match(DIALOG_SOURCE, /onOpenChange\(false\)/u);
	// Save lives in handleSave; Cancel is a plain close handler that never calls onSave.
	assert.match(DIALOG_SOURCE, /const handleSave = useCallback\(\(\) => \{\s*onSave\(draft\);/u);
});

test("AgentTriggersDialog simulates connection against the draft, not parent config", () => {
	assert.match(DIALOG_SOURCE, /connectionState: "connecting" as const/u);
	// No parent config callback is invoked from connect.
	assert.doesNotMatch(DIALOG_SOURCE, /onConnectTrigger\?\.\(/u);
});

test("TriggerPicker is exported and accepts a custom trigger element", () => {
	assert.match(TRIGGERS_PAGE_SOURCE, /export function TriggerPicker\(/u);
	assert.match(TRIGGERS_PAGE_SOURCE, /trigger\?: ReactElement/u);
	assert.match(TRIGGERS_PAGE_SOURCE, /render=\{trigger \?\? <TriggerAddRow label=\{label\} \/>\}/u);
});

test("Trigger summary row routes empty state to the picker and non-empty to the modal", () => {
	assert.match(AGENT_SOURCE, /function AgentTriggerSummaryRow\(/u);
	// Empty: the picker seeds the modal with the freshly created trigger.
	assert.match(AGENT_SOURCE, /createAgentTriggerValue\(providerId, eventId, 1\)/u);
	assert.match(AGENT_SOURCE, /onEditTriggers\?\.\(next \? \[next\] : \[\]\)/u);
	// Non-empty: clicking the chips button opens the modal with existing defs.
	assert.match(AGENT_SOURCE, /onClick=\{\(\) => onEditTriggers\?\.\(\)\}/u);
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
