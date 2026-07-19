import type { ComponentDetail } from "@/app/data/component-detail-types";

export const JIRA_ACTIVITY_DETAIL: ComponentDetail = {
	description:
		'A chronological activity timeline that documents work done by humans and AI agents on a Jira work item, in the style of a Linear "Activity" feed. Entries share a single connector spine and come in three kinds: compact events, rich comment cards, and changed-files cards. The feed supports controlled or uncontrolled entries, per-comment actions, a replaceable bottom composer, compact in-card replies, and the shared floating Rovo prompt composer for new comments.',
	demoLayout: { previewHeight: "fit" },
	importStatement: `import { JiraActivity } from "@/components/blocks/jira-activity";`,
	usage: `import { JiraActivity } from "@/components/blocks/jira-activity";

<JiraActivity onUnsubscribe={() => console.log("unsubscribe")} />`,
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
				"The signed-in viewer. Authors new comments (bottom composer) and replies (in-card composer), and seeds the header avatar group.",
		},
		{
			name: "onUnsubscribe",
			type: "() => void",
			description: "Called when the header Unsubscribe control is activated.",
		},
		{
			name: "className",
			type: "string",
			description: "Additional classes applied to the root container.",
		},
	],
};
