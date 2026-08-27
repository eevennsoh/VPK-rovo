const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

function readProjectFile(filePath) {
	return fs.readFileSync(path.join(process.cwd(), filePath), "utf8");
}

test("Agent Assignment exposes a reusable controlled block contract", () => {
	const source = readProjectFile("components/blocks/agent-assignment/components/agent-assignment.tsx");
	const index = readProjectFile("components/blocks/agent-assignment/index.ts");
	const page = readProjectFile("components/blocks/agent-assignment/page.tsx");

	assert.match(source, /export interface AgentAssignmentAgent extends AgentSelectorAgent/u);
	assert.match(source, /status\?: ReactNode;/u);
	assert.match(source, /export interface AgentAssignmentProps/u);
	assert.match(source, /agents: readonly AgentSelectorAgent\[\];/u);
	assert.match(source, /assignedAgents: readonly AgentAssignmentAgent\[\];/u);
	assert.match(source, /onAssignedAgentIdsChange: \(agentIds: readonly string\[\]\) => void;/u);
	assert.match(source, /onAgentAssign\?: \(agent: AgentSelectorAgent\) => void;/u);
	assert.match(source, /onAssignedAgentSelect: \(agent: AgentAssignmentAgent\) => void;/u);
	assert.match(source, /onContinueExistingSession\?: \(agent: AgentSelectorAgent\) => void;/u);
	assert.match(source, /onStartNewSession\?: \(agent: AgentSelectorAgent\) => void;/u);
	assert.match(source, /usedAgentIds\?: readonly string\[\];/u);
	assert.match(index, /export \{ AgentAssignment \}/u);
	assert.match(index, /AgentAssignmentAgent, AgentAssignmentProps/u);
	assert.match(page, /import \{ CyclingByline \} from "@\/components\/ui-custom\/chain-of-thought";/u);
	assert.match(page, /<CyclingByline className="menu-row-title text-text-subtlest">[\s\S]*\{activities\[index % activities\.length\]\}[\s\S]*<\/CyclingByline>/u);
	assert.doesNotMatch(page, /return <span className="menu-row-title text-text-subtlest">/u);
});

test("Agent Assignment preserves the work-item trigger and two-stage menu behavior", () => {
	const source = readProjectFile("components/blocks/agent-assignment/components/agent-assignment.tsx");
	const menu = readProjectFile("components/blocks/agent-assignment/components/assigned-agents-menu.tsx");
	const suggestionMenu = readProjectFile("components/ui-custom/rich-text-editor/suggestion-menu.tsx");
	const suggestionMenuCss = readProjectFile("components/ui-custom/rich-text-editor/suggestion-menu-actions.css");

	assert.match(source, /openMode\?: "click" \| "hover";/u);
	assert.match(source, /trigger\?: ReactElement<\{ "aria-expanded"\?: boolean \}>;/u);
	assert.match(source, /onOpenChange\?: \(open: boolean\) => void;/u);
	assert.match(source, /openMode === "hover"/u);
	assert.match(source, /<HoverCard onOpenChange=\{handleOpenChange\} open=\{open\}>/u);
	assert.match(source, /delay=\{120\}/u);
	assert.match(source, /closeDelay=\{80\}/u);
	assert.match(source, /cloneElement\(trigger, \{ "aria-expanded": open \}\)/u);
	assert.match(source, /import \{ token \} from "@\/lib\/tokens";/u);
	assert.match(source, /<PopoverContent[\s\S]*style=\{\{ boxShadow: token\("elevation\.shadow\.overlay"\) \}\}/u);
	assert.match(source, /className="absolute inset-0 z-0 rounded-md outline-none"/u);
	assert.match(
		source,
		/const showSessionView = view === "session" && pendingSessionAgent !== null;[\s\S]*const effectiveView = showSessionView[\s\S]*assignedAgents\.length === 0 \|\| view === "session"[\s\S]*"selector"/u,
	);
	assert.match(source, /<AssignedAgentsMenu[\s\S]*onAddAgent=\{\(\) => setView\("selector"\)\}/u);
	assert.match(source, /if \(usedAgentIds\.includes\(agentId\)\) \{\s*setPendingSessionAgent\(agent\);\s*setView\("session"\);/u);
	assert.match(source, /<AgentSessionTargetMenu[\s\S]*onChoose=\{\(choice\) => handleSessionChoice\(pendingSessionAgent, choice\)\}/u);
	assert.match(source, /<AgentSelector[\s\S]*searchVariant="palette"[\s\S]*selectionMode="single"/u);
	assert.match(source, /onBrowseAgents=\{onBrowseAgents \? \(\) => handleFooterAction\(onBrowseAgents\) : undefined\}/u);
	assert.match(source, /onCreateAgent=\{onCreateAgent \? \(\) => handleFooterAction\(onCreateAgent\) : undefined\}/u);
	assert.match(source, /onAssignedAgentIdsChange\(nextAssignedAgentIds\);/u);
	assert.match(source, /if \(!assignedAgentIds\.includes\(agentId\)\) \{\s*onAgentAssign\?\.\(agent\);\s*\}/u);

	assert.doesNotMatch(menu, /AgentList/u);
	assert.match(menu, /<RichTextSuggestionMenu[\s\S]*title="Assigned agents"/u);
	assert.match(menu, /inlineMetadata: toAssignedAgentStatus\(row\.status\),/u);
	assert.match(
		menu,
		/function toAssignedAgentStatus\([\s\S]*typeof status === "string"[\s\S]*<CyclingByline className="menu-row-title text-text-subtlest">[\s\S]*\{status\}[\s\S]*<\/CyclingByline>/u,
	);
	assert.match(menu, /hoverActions: \{[\s\S]*primaryLabel: "View"[\s\S]*secondaryLabel: "Archive"/u);
	assert.match(suggestionMenu, /hoverActions\?: RichTextSuggestionMenuHoverActions;/u);
	assert.match(suggestionMenu, /import "\.\/suggestion-menu-actions\.css";/u);
	assert.match(suggestionMenu, /data-suggestion-action-buttons=""/u);
	assert.match(suggestionMenu, /className="pointer-events-none flex w-0 items-center gap-1 overflow-hidden opacity-0"/u);
	assert.doesNotMatch(suggestionMenu, /className="hidden items-center gap-1/u);
	assert.match(suggestionMenuCss, /\.rich-text-command-menu:not\(:has\(\[data-suggestion-actions\] :focus-visible\)\)[\s\S]*\[data-suggestion-actions\]:hover/u);
	assert.match(suggestionMenuCss, /\[data-suggestion-actions\]:has\(:focus-visible\) > \[data-suggestion-action-buttons\]/u);
	assert.match(suggestionMenu, /className="group\/suggestion-option grid grid-cols-\[minmax\(0,1fr\)_auto\] items-center rounded-lg"/u);
	assert.match(
		suggestionMenu,
		/item\.inlineMetadata \? \([\s\S]*className="menu-row-title shrink-0"[\s\S]*className="menu-row-title min-w-0 flex-1 text-text-subtlest"/u,
	);
	assert.doesNotMatch(
		suggestionMenu,
		/<span className="min-w-0 flex-1">\s*\{item\.inlineMetadata\}/u,
	);
	assert.doesNotMatch(suggestionMenu, /absolute inset-y-0 right-2/u);
	assert.doesNotMatch(suggestionMenuCss, /padding-right: 104px/u);
	assert.match(menu, /className="rich-text-command-menu-embedded w-full!"/u);
	assert.match(
		menu,
		/className="sticky bottom-0 z-10 mx-1 flex shrink-0 flex-col border-t border-border bg-popover p-0 pt-1(?: pb-1)?"/u,
	);
	assert.doesNotMatch(menu, /className="(?:px-1 )?pb-1"/u);
	assert.match(menu, /containerRef\.current\?\.focus\(\);/u);
	assert.doesNotMatch(menu, /firstOption\?\.focus\(\);/u);
	assert.match(menu, /selectedIndex === -1\s*\? \(step > 0 \? 0 : items\.length - 1\)/u);
	assert.match(
		menu,
		/<Button[\s\S]*className="h-8 min-h-8 w-full justify-start gap-3 pl-2 pr-3 py-0 text-left text-sm font-normal"[\s\S]*onClick=\{onAddAgent\}[\s\S]*variant="ghost"[\s\S]*<span className="grid size-6 shrink-0 place-items-center text-icon-subtle">[\s\S]*<AiAgentAddIcon label="" \/>[\s\S]*<span className="text-text-subtle">Assign agent<\/span>/u,
	);
	assert.doesNotMatch(menu, /disabled:/u);

	const sessionMenu = readProjectFile("components/blocks/agent-assignment/components/agent-session-target-menu.tsx");
	assert.match(sessionMenu, /title="Choose agent session"/u);
	assert.match(sessionMenu, /label: "Continue in existing session"/u);
	assert.match(sessionMenu, /label: "Start a new session"/u);
	assert.match(sessionMenu, /onBack=\{onBack\}/u);
});

test("the Jira work-item Agents field adapts its session model to Agent Assignment", () => {
	const source = readProjectFile("components/blocks/jira-work-item/experimental-v3/components/detail-field-editors.tsx");

	assert.match(source, /import \{ AgentAssignment, type AgentAssignmentAgent \} from "@\/components\/blocks\/agent-assignment";/u);
	assert.match(source, /const assignedAgents = assignedRows\.map/u);
	assert.match(source, /<AgentAssignment[\s\S]*assignedAgents=\{assignedAgents\}[\s\S]*onAssignedAgentIdsChange=\{handleAssignedAgentIdsChange\}/u);
	assert.match(source, /onAgentAssign=\{handleAgentAssign\}/u);
	assert.match(source, /onAssignedAgentSelect=\{handleOpenAgentSession\}/u);
	assert.match(source, /onContinueExistingSession=\{handleContinueExistingSession\}/u);
	assert.match(source, /onStartNewSession=\{handleAgentAssign\}/u);
	assert.match(source, /usedAgentIds=\{resolveUsedAgentIds\(sessions\)\}/u);
	assert.match(source, /actions\.invokeAgent\(agent, "context-pill", `@\$\{agent\.name\}`\);/u);
	assert.doesNotMatch(source, /WorkItemAssignedAgentsMenu/u);
});

test("Agent Assignment is registered with a catalog demo and documentation", () => {
	const page = readProjectFile("components/blocks/agent-assignment/page.tsx");
	const demo = readProjectFile("components/website/demos/blocks/agent-assignment-demo.tsx");
	const details = readProjectFile("app/data/details/blocks/agent-assignment.ts");
	const components = readProjectFile("app/data/components.ts");
	const manifest = readProjectFile("app/data/component-manifest.ts");
	const registry = readProjectFile("components/website/registry/blocks.ts");

	assert.match(page, /<AgentAssignment/u);
	assert.match(demo, /AgentAssignmentPage/u);
	assert.match(details, /importStatement: `import \{ AgentAssignment \} from "@\/components\/blocks\/agent-assignment";`/u);
	assert.match(components, /blockComponent\("agent-assignment", "Agent Assignment"\)/u);
	assert.match(manifest, /blockComponent\("agent-assignment", "Agent Assignment"\)/u);
	assert.match(registry, /"agent-assignment": dynamic/u);
});
