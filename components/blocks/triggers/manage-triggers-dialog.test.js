const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const test = require("node:test");

const DIALOG_SOURCE = readFileSync(
	join(__dirname, "components", "manage-triggers-dialog.tsx"),
	"utf8",
);
const AGENT_SOURCE = readFileSync(
	join(__dirname, "..", "agent", "components", "agent.tsx"),
	"utf8",
);
const DEMO_SOURCE = readFileSync(
	join(__dirname, "..", "..", "website", "demos", "blocks", "triggers-demo.tsx"),
	"utf8",
);

test("ManageTriggersDialog restores the compact drag-list modal", () => {
	assert.match(DIALOG_SOURCE, /Manage trigger events/u);
	assert.match(DIALOG_SOURCE, /Any event in this list can start the same automation\./u);
	assert.match(DIALOG_SOURCE, /<TriggerPicker/u);
	assert.match(DIALOG_SOURCE, /onSelectEvent=\{onAddTrigger\}/u);
	assert.match(DIALOG_SOURCE, /<DialogClose/u);

	assert.match(DIALOG_SOURCE, /<DndContext/u);
	assert.match(DIALOG_SOURCE, /restrictToVerticalAxis/u);
	assert.match(DIALOG_SOURCE, /<SortableContext/u);
	assert.match(DIALOG_SOURCE, /useSortable\(\{ id: trigger\.id \}\)/u);
	assert.match(DIALOG_SOURCE, /onReorderTriggers\(String\(active\.id\), String\(over\.id\)\)/u);

	assert.match(DIALOG_SOURCE, /No trigger events yet\./u);
});

test("ManageTriggersDialog rows manage trigger events, not per-trigger prompts", () => {
	assert.match(DIALOG_SOURCE, /function ManageTriggerFlowVisual/u);
	assert.match(DIALOG_SOURCE, /renderAgentTriggerProviderIcon\(trigger\)/u);
	assert.match(DIALOG_SOURCE, /GenerativeIndicatorIcon/u);
	assert.match(DIALOG_SOURCE, /label="Agent instructions"/u);
	assert.match(DIALOG_SOURCE, /className="h-px w-5 bg-border"/u);
	assert.match(DIALOG_SOURCE, /getAgentTriggerReadableLabel\(trigger\)/u);
	assert.match(DIALOG_SOURCE, /function getManageTriggerSecondary/u);
	assert.match(DIALOG_SOURCE, /getTriggerProvider\(trigger\.providerId\)/u);
	assert.match(DIALOG_SOURCE, /getTriggerEvent\(provider\.id, trigger\.eventId\)/u);
	assert.match(DIALOG_SOURCE, /Requires connection/u);

	assert.doesNotMatch(DIALOG_SOURCE, /trigger\.prompt\?\.trim/u);
	assert.doesNotMatch(DIALOG_SOURCE, /No prompt set/u);

	assert.match(DIALOG_SOURCE, /isAgentTriggerEnabled\(trigger\)/u);
	assert.match(DIALOG_SOURCE, /onCheckedChange=\{\(nextEnabled\) => onToggle\(trigger\.id, nextEnabled\)\}/u);
	assert.match(DIALOG_SOURCE, /hover:bg-bg-danger-hovered hover:text-text-danger/u);
	assert.match(DIALOG_SOURCE, /onClick=\{\(\) => onDelete\(trigger\.id\)\}/u);
	assert.match(DIALOG_SOURCE, /onClick=\{\(\) => onEdit\(trigger\)\}/u);
});

test('agent config fallback wires "Manage triggers" to ManageTriggersDialog', () => {
	assert.match(AGENT_SOURCE, /import \{ ManageTriggersDialog \}/u);
	assert.match(AGENT_SOURCE, /const \[manageTriggersOpen, setManageTriggersOpen\] = useState\(false\)/u);
	assert.match(AGENT_SOURCE, /setManageTriggersOpen\(true\)/u);
	assert.match(AGENT_SOURCE, /const handleAddTriggerFromManage = useCallback\(/u);
	assert.match(AGENT_SOURCE, /const handleReorderTriggers = useCallback\(/u);
	assert.match(AGENT_SOURCE, /const handleToggleTrigger = useCallback\(/u);
	assert.match(AGENT_SOURCE, /const handleDeleteTrigger = useCallback\(/u);
	assert.match(AGENT_SOURCE, /handleEditTriggers\(config\.triggerDefinitions \?\? \[trigger\]\)/u);
	assert.match(AGENT_SOURCE, /<ManageTriggersDialog/u);
	assert.match(AGENT_SOURCE, /triggers=\{config\.triggerDefinitions \?\? \[\]\}/u);
});

test("manage demo opens the restored dialog and keeps full automation editing available", () => {
	assert.match(DEMO_SOURCE, /export function TriggersDemoManage/u);
	assert.match(DEMO_SOURCE, /<ManageTriggersDialog/u);
	assert.match(DEMO_SOURCE, /<TriggerAutomationDialog/u);
	assert.match(DEMO_SOURCE, /const \[manageOpen, setManageOpen\] = useState\(true\)/u);
	assert.match(DEMO_SOURCE, /const \[automationOpen, setAutomationOpen\] = useState\(false\)/u);
	assert.match(DEMO_SOURCE, /setAutomationOpen\(true\)/u);
	assert.match(DEMO_SOURCE, /onSave=\{setTriggers\}/u);
});
