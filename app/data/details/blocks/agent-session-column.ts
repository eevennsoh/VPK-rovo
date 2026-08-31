import type { ComponentDetail } from "@/app/data/component-detail-types";

export const AGENT_SESSION_COLUMN_DETAIL: ComponentDetail = {
	description:
		'A kanban column of agent sessions that never became work items. The board\'s status columns are unfilled — they read as regions of the board surface — so this one is filled with `surface-sunken`: the sunken plane is what says "outside the workflow" without a label having to explain it. The fill starts below the header rather than behind it, so the title and count share an inset and a baseline with the status column titles beside them and the five headers read as one row. Inside the plane the column renders the Agent Session block verbatim, so each card keeps its dashed uncaptured-work chrome, its untracked-work flyout with Link / Create / Add as a subtask, its hover Resume and Hide / Show eye, its Captured state, and its resume gating. Hide removes a session from the active list; when any are hidden a sticky Work hidden N footer opens a Hidden work view of those sessions, with a header back arrow to return, and unhiding the last one returns automatically. The list is a scrollport with top and bottom fade masks and a reserved 4px focus-ring gutter, so a focused card\'s ring is never clipped. In the experimental v2 Jira Kanban board it is pinned to the left of the horizontal scrollport rather than added to `boardColumns`, because untracked work is not a status: it has no place in the left-to-right progression the status columns describe, and it stays visible while the reader scrolls to the last column. A hover-revealed control collapses it, but not into the rotated label a status column becomes: a status is only a name, while these are live sessions, so the collapsed column is a full-height 32px rail of mini notches — visible sessions only, resting quiet in `icon-subtlest` and lighting up to `icon` with a slight scale under the pointer or keyboard focus — and hovering or focusing a notch opens the same payload-driven session flyout an Agent List row opens. Collapsing exits Hidden work so the rail never mixes the two lists; collapsed, the column loses the cards and keeps every visible session one hover away.',
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
			name: "defaultCollapsed",
			type: "boolean",
			default: "false",
			description:
				"Whether the column starts collapsed into its notch rail. The column owns the state from there — the hover-revealed shrink/grow control toggles it.",
		},
		{
			name: "onCollapsedChange",
			type: "(collapsed: boolean) => void",
			description: "Called after the viewer collapses or expands the column.",
		},
		{
			name: "capturedItemIds",
			type: "ReadonlySet<string>",
			description:
				"Ids of sessions whose chin should read Captured instead of offering Link and Create.",
		},
		{
			name: "newItemIds",
			type: "ReadonlySet<string>",
			description:
				"Ids that arrived in the last sync and have not been reviewed. Each one plays a one-shot arrival beat and carries a persistent unreviewed mark: expanded, the card steps in from above and its dashed border recolours to discovery with a dot in the corner; collapsed, the notch grows from its centre to full size while the notches below slide down to make room, then simply stays lit — `icon` and slightly scaled, exactly the state a reviewed notch reaches on hover — while the rail's head counts the unread as +N. New is the rail holding the hover gesture open for you rather than a separate mark to learn; the dash is already spent on uncaptured, so the card recolours it rather than replacing it. The mark is the load-bearing half — it survives a backgrounded tab, a collapsed column, and prefers-reduced-motion, where the beat does not.",
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
			description: "Additional classes applied to the column region that wraps the header and the session plane.",
		},
		{
			name: "listClassName",
			type: "string",
			description: "Classes applied to the inner session list.",
		},
	],
};
