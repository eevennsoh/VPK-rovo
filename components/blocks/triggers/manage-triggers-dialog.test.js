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

test("ManageTriggersDialog mirrors the manage-subagents list pattern", () => {
	// Header: title + "Add trigger" via the shared TriggerPicker + close.
	assert.match(DIALOG_SOURCE, /Manage triggers/u);
	assert.match(DIALOG_SOURCE, /<TriggerPicker/u);
	assert.match(DIALOG_SOURCE, /onSelectEvent=\{onAddTrigger\}/u);
	assert.match(DIALOG_SOURCE, /<DialogClose/u);

	// Drag-to-reorder via dnd-kit, restricted to the vertical axis.
	assert.match(DIALOG_SOURCE, /<DndContext/u);
	assert.match(DIALOG_SOURCE, /restrictToVerticalAxis/u);
	assert.match(DIALOG_SOURCE, /<SortableContext/u);
	assert.match(DIALOG_SOURCE, /useSortable\(\{ id: trigger\.id \}\)/u);
	assert.match(DIALOG_SOURCE, /onReorderTriggers\(String\(active\.id\), String\(over\.id\)\)/u);

	// Empty state placeholder, matching the subagents dialog.
	assert.match(DIALOG_SOURCE, /No triggers yet\./u);
});

test("ManageTriggersDialog row carries icon, toggle, delete, and edit", () => {
	// Palette-style provider front-slot icon (1p logos render bare — no tile).
	assert.match(DIALOG_SOURCE, /renderAgentTriggerProviderTileIcon\(trigger\)/u);
	// Readable label + prompt summary fallback.
	assert.match(DIALOG_SOURCE, /getAgentTriggerReadableLabel\(trigger\)/u);
	assert.match(DIALOG_SOURCE, /trigger\.prompt\?\.trim\(\) \|\| "No prompt set\."/u);
	// Enable/disable Switch driven by the enabled flag helper.
	assert.match(DIALOG_SOURCE, /isAgentTriggerEnabled\(trigger\)/u);
	assert.match(DIALOG_SOURCE, /onCheckedChange=\{\(nextEnabled\) => onToggle\(trigger\.id, nextEnabled\)\}/u);
	// Danger-hover delete button (matches the subagents row token pattern).
	assert.match(DIALOG_SOURCE, /hover:bg-bg-danger-hovered hover:text-text-danger/u);
	assert.match(DIALOG_SOURCE, /onClick=\{\(\) => onDelete\(trigger\.id\)\}/u);
	// Row click opens the detailed rule-builder for that single trigger.
	assert.match(DIALOG_SOURCE, /onClick=\{\(\) => onEdit\(trigger\)\}/u);
});

test('agent config wires "Manage triggers" to the new dialog', () => {
	assert.match(AGENT_SOURCE, /import \{ ManageTriggersDialog \}/u);
	// Footer item prefers the manage dialog, falling back to the rule-builder.
	assert.match(AGENT_SOURCE, /onClick=\{\(\) => \(onManageTriggers \?\? onEditTriggers\)\?\.\(\)\}/u);
	// Dialog hosted in AgentConfigFields, fed by config.triggerDefinitions.
	assert.match(AGENT_SOURCE, /<ManageTriggersDialog/u);
	assert.match(AGENT_SOURCE, /triggers=\{config\.triggerDefinitions \?\? \[\]\}/u);
	// Reorder / toggle / delete operate on the definitions via the change handler.
	assert.match(AGENT_SOURCE, /const handleReorderTriggers = useCallback\(/u);
	assert.match(AGENT_SOURCE, /const handleToggleTrigger = useCallback\(/u);
	assert.match(AGENT_SOURCE, /const handleDeleteTrigger = useCallback\(/u);
	// Row click reuses the rule-builder for single-trigger editing.
	assert.match(AGENT_SOURCE, /handleEditTriggers\(\[trigger\]\)/u);
});
