import type { ComponentDetail } from "@/app/data/component-detail-types";

export const AGENT_SESSION_DETAIL: ComponentDetail = {
	description:
		'Local coding sessions that never became work items, rendered as dashed uncaptured-work cards. Each card reuses the shared Agent List row — hexagon agent identity, a static timestamp, a devices glyph, and the viewer machine — inside a sunken body, then hangs the shared uncaptured-work chin beneath it: a Link to <key> split button whose menu also offers Create work item and Copy resume command, plus a dismiss control. There is no hover flyout; the chin owns every action, so the row never puts a competing popup in the way. Ids listed in `capturedItemIds` swap the chin for a Captured state, and rows the host cannot resume hide the Resume control entirely rather than copying a command that would fail. Extracted from the Agent List block, which now owns only the list surface.',
	demoLayout: { previewHeight: "fit" },
	importStatement: `import { AgentSession } from "@/components/blocks/agent-session";`,
	usage: `import { AgentSession } from "@/components/blocks/agent-session";

<AgentSession
  onCreateWorkItem={(item) => console.log("create", item.id)}
  onDismiss={(item) => console.log("dismiss", item.id)}
  onLinkWorkItem={(item) => console.log("link", item.id)}
/>`,
	props: [
		{
			name: "items",
			type: "readonly AgentSessionItem[]",
			default: "built-in sample data",
			description:
				"Sessions to render. `AgentSessionItem` is the Agent List row model, so a surface that already builds those rows needs no conversion. `sessionDetails.issueKey` seeds the chin's suggested work item and `sessionDetails.worktreePath` the copied resume command; local rows (`host: \"local\"`) take `machineName` and `timeLabel` for the static stamp.",
		},
		{
			name: "capturedItemIds",
			type: "ReadonlySet<string>",
			description:
				"Ids of sessions whose chin should read Captured instead of offering Link and Create.",
		},
		{
			name: "onLinkWorkItem",
			type: "(item: AgentSessionItem) => void",
			description:
				"Links a session to the suggested work item from the chin primary action.",
		},
		{
			name: "onCreateWorkItem",
			type: "(item: AgentSessionItem) => void",
			description:
				"Creates a work item from a session via the chin split-button menu. When omitted, the menu action is exposed as unavailable.",
		},
		{
			name: "onDismiss",
			type: "(item: AgentSessionItem) => void",
			description:
				"Dismisses a session from the chin. When omitted, the dismiss control is hidden.",
		},
		{
			name: "getSuggestedWorkItemKey",
			type: "(item: AgentSessionItem) => string | undefined",
			description:
				"Suggested Jira key for the chin primary action. Defaults to `sessionDetails.issueKey`.",
		},
		{
			name: "getResumeCommand",
			type: "(item: AgentSessionItem) => string | undefined",
			description:
				"Overrides the shell command copied from the chin. Defaults to `cd <worktree> && claude --resume <id>`.",
		},
		{
			name: "isResumable",
			type: "(item: AgentSessionItem) => boolean",
			default: "() => true",
			description:
				"Whether a session can be resumed. Rows that answer false render no Resume control at all, because the chin copies the command to the clipboard before `onCopyResume` ever runs.",
		},
		{
			name: "onCopyResume",
			type: "(item: AgentSessionItem) => void",
			description:
				"Called after the chin copies the resume command, so a host can announce or restore a terminal session.",
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
