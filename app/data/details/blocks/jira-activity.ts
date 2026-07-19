import type { ComponentDetail } from "@/app/data/component-detail-types";

export const JIRA_ACTIVITY_DETAIL: ComponentDetail = {
	description:
		'A chronological activity timeline that documents work done by humans and AI agents on a Jira work item, in the style of a Linear "Activity" feed. Entries share a single connector spine and come in three kinds: compact events (an actor plus an action line with inline code, link, colored-label, and tag chips), rich comment cards (a header, a body, an optional collapsible detail section, replies, and a reply composer), and changed-files cards (a summary, description, and branch/PR tag). Leading nodes render a person photo, an agent hexagon, an app brand mark, or a neutral event glyph. A header shows the participants, and a bottom composer plus in-card reply composers append comments and replies to the feed (submit on Enter).',
	demoLayout: { previewHeight: "fit" },
	importStatement: `import { JiraActivity } from "@/components/blocks/jira-activity";`,
	usage: `import { JiraActivity } from "@/components/blocks/jira-activity";

<JiraActivity onUnsubscribe={() => console.log("unsubscribe")} />`,
	props: [
		{
			name: "entries",
			type: "readonly JiraActivityEntry[]",
			default: "built-in sample data",
			description:
				'Timeline entries, oldest first. Each entry\'s `kind` ("event" | "comment" | "changed-files") selects its renderer.',
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
