import type { JiraActivityActor, JiraActivityEntry } from "./jira-activity-types";

// Cast: two humans, two AI agents, and one connected app (GitHub) — so the feed
// documents work done chronologically by both people and agents.
const ANTHONY: JiraActivityActor = {
	id: "anthony",
	name: "Anthony Chen",
	kind: "person",
	avatarSrc: "/avatar-human/anthony-chen.png",
};

const ANDREA: JiraActivityActor = {
	id: "andrea",
	name: "Andrea Wilson",
	kind: "person",
	avatarSrc: "/avatar-human/andrea-wilson.png",
};

const TRIAGE_AGENT: JiraActivityActor = {
	id: "triage",
	name: "Triage assistant",
	kind: "agent",
	avatarSrc: "/avatar-agent/teamwork-agents/bug-report-assistant.svg",
};

const ROVO_DEV: JiraActivityActor = {
	id: "rovo-dev",
	name: "Rovo Dev",
	kind: "agent",
	avatarSrc: "/avatar-agent/teamwork-agents/jira-theme-analyzer.svg",
};

const GITHUB: JiraActivityActor = {
	id: "github",
	name: "GitHub",
	kind: "app",
	brandName: "github",
};

/** The signed-in viewer — powers the header avatar group and both composers. */
export const JIRA_ACTIVITY_CURRENT_USER: JiraActivityActor = {
	id: "priya",
	name: "Priya Hansra",
	kind: "person",
	avatarSrc: "/avatar-human/priya-hansra.png",
};

const AUTOMATION_TAG = { text: "Automation" } as const;

export const JIRA_ACTIVITY_ENTRIES: readonly JiraActivityEntry[] = [
	{
		id: "created",
		kind: "event",
		actor: ANTHONY,
		timestamp: "15min ago",
		segments: [{ type: "text", text: "created the issue" }],
	},
	{
		id: "labelled",
		kind: "event",
		actor: TRIAGE_AGENT,
		icon: "label",
		timestamp: "14min ago",
		segments: [
			{ type: "text", text: "added " },
			{ type: "label", text: "Bug", color: "red" },
			{ type: "text", text: " and " },
			{ type: "label", text: "UI polish", color: "green" },
		],
	},
	{
		id: "sla",
		kind: "event",
		actor: ROVO_DEV,
		icon: "sla",
		timestamp: "14min ago",
		segments: [
			{ type: "text", text: "set the SLA to 1w " },
			{ type: "tag", ...AUTOMATION_TAG },
		],
	},
	{
		id: "moved-todo",
		kind: "event",
		actor: ANDREA,
		icon: "status",
		timestamp: "11min ago",
		segments: [{ type: "text", text: "moved from Triage to Todo" }],
	},
	{
		id: "assigned",
		kind: "event",
		actor: ANDREA,
		timestamp: "11min ago",
		segments: [
			{ type: "text", text: "self-assigned the issue and set priority to Medium" },
		],
	},
	{
		id: "root-cause",
		kind: "comment",
		actor: ROVO_DEV,
		timestamp: "6min ago",
		tag: AUTOMATION_TAG,
		body: [
			{ type: "text", text: "Likely root cause is the unconditional " },
			{ type: "code", text: "isLast" },
			{ type: "text", text: " calculation in " },
			{ type: "link", text: "ThreadedComments.tsx" },
			{
				type: "text",
				text: ": the final visible reply receives the card's 8px bottom radius even when ",
			},
			{ type: "code", text: "ThreadedCommentsReplyInput" },
			{ type: "text", text: " continues below it. Because " },
			{ type: "link", text: "useHighlightStyle.ts" },
			{
				type: "text",
				text: " draws the selection as an inset box-shadow, that radius produces the free-floating rounded blue corners shown in the screenshot.",
			},
		],
		collapsible: {
			label: "Investigation",
			content: [
				{
					type: "text",
					text: "Reproduced on the Todo board with a two-reply thread. Toggling ",
				},
				{ type: "code", text: "isLast" },
				{
					type: "text",
					text: " to account for a trailing reply input removes the stray corners; verified against ",
				},
				{ type: "link", text: "useHighlightStyle.ts" },
				{ type: "text", text: " in light and dark themes." },
			],
		},
		replies: [],
	},
	{
		id: "delegated",
		kind: "event",
		actor: ROVO_DEV,
		icon: "delegated",
		timestamp: "6min ago",
		segments: [
			{ type: "text", text: "self-delegated the issue " },
			{ type: "tag", ...AUTOMATION_TAG },
		],
	},
	{
		id: "changed-files",
		kind: "changed-files",
		actor: ROVO_DEV,
		timestamp: "6min",
		summary: "Changed 2 files",
		description:
			"Adjusted the threaded comment radius logic so the final visible reply only rounds its bottom corners when no reply input follows.",
		branch: "#78672",
	},
	{
		id: "moved-progress",
		kind: "event",
		actor: ROVO_DEV,
		icon: "in-progress",
		timestamp: "6min ago",
		segments: [
			{ type: "text", text: "moved from Todo to In Progress " },
			{ type: "tag", ...AUTOMATION_TAG },
		],
	},
	{
		id: "linked",
		kind: "event",
		actor: GITHUB,
		icon: "linked",
		timestamp: "2min ago",
		segments: [
			{ type: "text", text: "linked Fix threaded comment highlight bottom corners" },
		],
	},
];
