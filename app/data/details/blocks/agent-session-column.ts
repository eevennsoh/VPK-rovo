import type { ComponentDetail } from "@/app/data/component-detail-types";

export const AGENT_SESSION_COLUMN_DETAIL: ComponentDetail = {
	description:
		'A kanban column of agent sessions that never became work items. The board\'s status columns are unfilled — they read as regions of the board surface — so this one is filled with `surface-sunken`: the sunken plane is what says "outside the workflow" without a label having to explain it. Below a header of title plus count, the column renders the Agent Session block verbatim, so each card keeps its dashed uncaptured-work chrome, its Link to <key> chin with Create work item behind it, its hover Resume and visibility controls, its Captured state, and its resume gating. The list is a scrollport with top and bottom fade masks and a reserved 4px focus-ring gutter, so a focused card\'s ring is never clipped. In the experimental v2 Jira Kanban board it is pinned to the left of the horizontal scrollport rather than added to `boardColumns`, because untracked work is not a status: it has no place in the left-to-right progression the status columns describe, and it stays visible while the reader scrolls to the last column.',
	demoLayout: { previewHeight: "fit" },
	importStatement: `import { AgentSessionColumn } from "@/components/blocks/agent-session-column";`,
	usage: `import { AgentSessionColumn } from "@/components/blocks/agent-session-column";

<AgentSessionColumn
  title="Untracked work"
  onCreateWorkItem={(item) => console.log("create", item.id)}
  onLinkWorkItem={(item) => console.log("link", item.id)}
/>`,
	props: [
		{
			name: "title",
			type: "string",
			default: '"Untracked work"',
			description:
				"Header label. Also seeds the column's accessible name and its `data-agent-session-column` attribute.",
		},
		{
			name: "items",
			type: "readonly AgentSessionItem[]",
			default: "built-in sample data",
			description:
				"Sessions to render. `AgentSessionItem` is the Agent List row model, so a surface that already builds those rows needs no conversion.",
		},
		{
			name: "count",
			type: "number",
			default: "items.length",
			description:
				"Header count. Override when the column shows a filtered slice of a larger backlog.",
		},
		{
			name: "emptyLabel",
			type: "string",
			default: '"No untracked sessions"',
			description: "Copy shown in place of the list when there are no sessions.",
		},
		{
			name: "capturedItemIds",
			type: "ReadonlySet<string>",
			description:
				"Ids of sessions whose chin should read Captured instead of offering Link and Create.",
		},
		{
			name: "onLinkWorkItem",
			type: "(item: AgentSessionItem, workItemKey?: string) => void",
			description:
				"Links a session to a suggested work item from the chin. Receives the row's key when several are offered.",
		},
		{
			name: "onCreateWorkItem",
			type: "(item: AgentSessionItem) => void",
			description:
				"Creates a work item from a session. When omitted, the action is exposed as unavailable.",
		},
		{
			name: "isResumable",
			type: "(item: AgentSessionItem) => boolean",
			default: "() => true",
			description:
				"Whether a session can be resumed. Rows that answer false render no Resume control at all, because the control copies the command before `onCopyResume` runs.",
		},
		{
			name: "onCopyResume",
			type: "(item: AgentSessionItem) => void",
			description: "Called after the hover Resume control copies the resume command.",
		},
		{
			name: "onView",
			type: "(item: AgentSessionItem) => void",
			description: "Called when a card body is activated.",
		},
		{
			name: "className",
			type: "string",
			description: "Additional classes applied to the sunken column surface.",
		},
		{
			name: "listClassName",
			type: "string",
			description: "Classes applied to the inner session list.",
		},
	],
};
