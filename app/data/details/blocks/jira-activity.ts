import type { ComponentDetail } from "@/app/data/component-detail-types";

export const JIRA_ACTIVITY_DETAIL: ComponentDetail = {
	description:
		'A chronological activity timeline that documents work done by humans and AI agents on a Jira work item, in the style of a Linear "Activity" feed. Entries share a single connector spine and come in three kinds: compact events, rich comment cards, and changed-files cards. The header can sort all activity or show only comments authored by agents.',
	demoLayout: { previewHeight: "fit" },
	importStatement: `import { JiraActivity } from "@/components/blocks/jira-activity";`,
	usage: `import { JiraActivity } from "@/components/blocks/jira-activity";

<JiraActivity defaultSortOrder="ascending" />`,
	props: [
		{
			name: "entries",
			type: "readonly JiraActivityEntry[]",
			default: "undefined (uncontrolled)",
			description:
				'Controlled timeline entries, oldest first. Each entry\'s `kind` selects its renderer.',
		},
		{
			name: "defaultEntries",
			type: "readonly JiraActivityEntry[]",
			default: "built-in sample data",
			description: "Initial entries for an uncontrolled timeline.",
		},
		{
			name: "onEntriesChange",
			type: "(entries: readonly JiraActivityEntry[]) => void",
			description: "Called with the complete next timeline after a comment or reply is submitted.",
		},
		{
			name: "composer",
			type: "ReactNode | null",
			default: "shared JiraActivityComposer",
			description: "Overrides the bottom composer. Pass null to suppress it.",
		},
		{
			name: "renderCommentAction",
			type: "(entry: JiraActivityCommentEntry) => ReactNode",
			description: "Renders an optional trailing action in each comment card header.",
		},
		{
			name: "currentUser",
			type: "JiraActivityActor",
			default: "built-in sample user",
			description:
				"The signed-in viewer. Authors new comments (bottom composer) and replies (in-card composer).",
		},
		{
			name: "sortOrder",
			type: '"ascending" | "descending"',
			default: "undefined (uncontrolled)",
			description: "Controlled timeline ordering. `ascending` shows oldest first.",
		},
		{
			name: "defaultSortOrder",
			type: '"ascending" | "descending"',
			default: '"ascending"',
			description: "Initial ordering when the sort control is uncontrolled.",
		},
		{
			name: "onSortOrderChange",
			type: '(next: "ascending" | "descending") => void',
			description: "Called when the header sort control changes the ordering.",
		},
		{
			name: "filter",
			type: '"all" | "agents-only"',
			default: "undefined (uncontrolled)",
			description: "Controlled timeline filter. `agents-only` displays only agent-authored comments.",
		},
		{
			name: "defaultFilter",
			type: '"all" | "agents-only"',
			default: '"all"',
			description: "Initial filter when the header view control is uncontrolled.",
		},
		{
			name: "onFilterChange",
			type: '(next: "all" | "agents-only") => void',
			description: "Called when the header view control changes the activity filter.",
		},
		{
			name: "className",
			type: "string",
			description: "Additional classes applied to the root container.",
		},
	],
};
