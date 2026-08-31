import type { ComponentDetail } from "@/app/data/component-detail-types";

export const AGENT_SESSION_DETAIL: ComponentDetail = {
	description:
		'Local coding sessions that never became work items, available in three footprints. Large is the default dashed uncaptured-work card: it reuses the shared Agent List row — hexagon agent identity, a static timestamp, a devices icon, and the viewer machine — on a single surface, with Resume and Hide or Show actions on hover. Work-item capture lives on the shared untracked-work session flyout (the same surface as Agent Session Flyout): hover a card to Link, Create, or add as a subtask. Medium condenses the agent, participant, and add affordance into the Jira Agents row, while Small becomes the collapsed Agent Session Column notch. Ids listed in `capturedItemIds` swap the dashed frame for a solid captured border, and rows the host cannot resume hide the Resume control entirely rather than copying a command that would fail.',
	demoLayout: { previewHeight: "fit" },
	examples: [
		{
			title: "Medium",
			description:
				"A compact 276px session row for denser surfaces, retaining the agent identity, participant, and add affordance from the Jira Agents design.",
			demoSlug: "agent-session-demo-medium",
		},
		{
			title: "Small",
			description:
				"The shared 12×2px session mark from the collapsed Agent Session Column rail.",
			demoSlug: "agent-session-demo-small",
		},
	],
	importStatement: `import { AgentSession } from "@/components/blocks/agent-session";`,
	usage: `import { AgentSession } from "@/components/blocks/agent-session";

<AgentSession
  onCreateWorkItem={(item) => console.log("create", item.id)}
  onLinkWorkItem={(item) => console.log("link", item.id)}
/>`,
	props: [
		{
			name: "variant",
			type: '"large" | "medium" | "small"',
			default: '"large"',
			description:
				"Visual footprint for each session. Large is the full uncaptured-work card, Medium is the compact participant row, and Small is the collapsed-column notch.",
		},
		{
			name: "items",
			type: "readonly AgentSessionItem[]",
			default: "built-in sample data",
			description:
				"Sessions to render. `AgentSessionItem` is the Agent List row model, so a surface that already builds those rows needs no conversion. `sessionDetails.issueKey` seeds the untracked-work flyout suggestion and `sessionDetails.worktreePath` the copied resume command; local rows (`host: \"local\"`) take `machineName` and `timeLabel` for the static stamp.",
		},
		{
			name: "capturedItemIds",
			type: "ReadonlySet<string>",
			description:
				"Ids of sessions whose dashed uncaptured frame should become a solid captured border.",
		},
		{
			name: "onLinkWorkItem",
			type: "(item: AgentSessionItem, workItemKey?: string) => void",
			description:
				"Links a session to a suggested work item from the untracked-work flyout. Receives the flyout's offered key.",
		},
		{
			name: "onCreateWorkItem",
			type: "(item: AgentSessionItem) => void",
			description:
				"Creates a work item from a session via the untracked-work flyout. When omitted, the action is exposed as unavailable.",
		},
		{
			name: "onSubtasks",
			type: "(item: AgentSessionItem) => void",
			description:
				"Add-as-subtask action behind the untracked-work flyout menu. Omit to expose the menu option as unavailable.",
		},
		{
			name: "getSuggestedWorkItemKeys",
			type: "(item: AgentSessionItem) => readonly string[] | undefined",
			description:
				"Several candidate keys for a session. The untracked-work flyout offers the first key, taking precedence over `getSuggestedWorkItemKey`.",
		},
		{
			name: "getSuggestedWorkItemKey",
			type: "(item: AgentSessionItem) => string | undefined",
			description:
				"Suggested Jira key for the untracked-work flyout. Defaults to `sessionDetails.issueKey`.",
		},
		{
			name: "getResumeCommand",
			type: "(item: AgentSessionItem) => string | undefined",
			description:
				"Overrides the shell command the hover Resume control copies. Defaults to `cd <worktree> && claude --resume <id>`.",
		},
		{
			name: "isResumable",
			type: "(item: AgentSessionItem) => boolean",
			default: "() => true",
			description:
				"Whether a session can be resumed. Rows that answer false render no Resume control at all, because the button copies the command to the clipboard before `onCopyResume` ever runs.",
		},
		{
			name: "onCopyResume",
			type: "(item: AgentSessionItem) => void",
			description:
				"Called after the hover Resume control copies the resume command, so a host can announce or restore a terminal session.",
		},
		{
			name: "onToggleVisibility",
			type: "(item: AgentSessionItem) => void",
			description:
				"Hide / Show toggle behind the hover eye control. The button always renders; omit this on a bare list to leave the eye a no-op. Agent Session Column supplies it so Hide removes the card and Show restores it.",
		},
		{
			name: "visibilityLabel",
			type: "string",
			default: '"Hide"',
			description:
				"Tooltip and accessible name for the hover eye. The column passes Show when the list is the hidden-work view.",
		},
		{
			name: "onView",
			type: "(item: AgentSessionItem) => void",
			description:
				"Called when a card body is activated. Coding-agent rows stay activatable regardless of `canViewItem`.",
		},
		{
			name: "canViewItem",
			type: "(item: AgentSessionItem) => boolean",
			description:
				"When `onView` is set, non-coding rows for which this returns false omit the body action.",
		},
		{
			name: "className",
			type: "string",
			description: "Additional classes applied to the list element.",
		},
	],
};
