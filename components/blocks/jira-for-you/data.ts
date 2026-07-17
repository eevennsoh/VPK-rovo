import type {
	JiraForYouAgent,
	JiraForYouSection,
	JiraForYouTab,
} from "./jira-for-you-types";

const READINESS_AGENT: JiraForYouAgent = {
	name: "Readiness checker",
	avatarSrc: "/avatar-agent/teamwork-agents/readiness-checker.svg",
};
const PROGRESS_AGENT: JiraForYouAgent = {
	name: "Progress tracker",
	avatarSrc: "/avatar-agent/teamwork-agents/progress-tracker.svg",
};
const REVIEWER_AGENT: JiraForYouAgent = {
	name: "Code reviewer",
	avatarSrc: "/avatar-agent/dev-agents/code-reviewer.svg",
};
const PLANNER_AGENT: JiraForYouAgent = {
	name: "Code planner",
	avatarSrc: "/avatar-agent/dev-agents/code-planner.svg",
};
const FEEDBACK_AGENT: JiraForYouAgent = {
	name: "Feedback analyzer",
	avatarSrc: "/avatar-agent/product-agents/feedback-analyzer.svg",
};

export const JIRA_FOR_YOU_TABS: readonly JiraForYouTab[] = [
	{ id: "all", label: "All" },
	{ id: "assigned", label: "Assigned to me", count: 25 },
	{ id: "worked-on", label: "Worked on" },
	{ id: "viewed", label: "Viewed" },
];

export const JIRA_FOR_YOU_SECTIONS: readonly JiraForYouSection[] = [
	{
		id: "needs-input",
		label: "Needs input",
		items: [
			{
				id: "vitafleet-presentation",
				title: "Create presentation on Vitafleet vision",
				issueType: "task",
				issueKey: "VITA-142",
				spaceName: "Vitafleet",
				tabs: ["assigned", "worked-on"],
				agents: [READINESS_AGENT],
				status: "Awaiting user response",
			},
		],
	},
	{
		id: "in-progress",
		label: "In progress",
		collapsible: true,
		items: [
			{
				id: "crm-analytics-dashboard",
				title: "CRM Analytics Dashboard",
				issueType: "task",
				issueKey: "CRM-318",
				spaceName: "Revenue platform",
				tabs: ["assigned", "worked-on", "viewed"],
				agents: [
					{ ...READINESS_AGENT, status: "Awaiting user response" },
					{ ...REVIEWER_AGENT, status: "In progress" },
					{ ...FEEDBACK_AGENT, status: "In progress" },
				],
				status: "Awaiting user response",
				isRunning: true,
			},
			{
				id: "performance-benchmarking",
				title: "Conduct performance benchmarking",
				issueType: "task",
				issueKey: "PERF-27",
				spaceName: "Data platform",
				tabs: ["assigned", "worked-on"],
				agents: [PROGRESS_AGENT],
				status: "In progress",
				isRunning: true,
			},
			{
				id: "refactor-readability",
				title: "Refactor code for better readability",
				issueType: "bug",
				issueKey: "WEB-461",
				spaceName: "Web app",
				tabs: ["worked-on", "viewed"],
				agents: [PLANNER_AGENT],
				status: "In review",
				isRunning: true,
			},
		],
	},
	{
		id: "to-do",
		label: "To do",
		collapsible: true,
		items: [
			{
				id: "payment-suite-failures",
				title: "Resolve intermittent payment suite failures",
				issueType: "bug",
				issueKey: "PAY-88",
				spaceName: "Payments",
				tabs: ["assigned"],
			},
			{
				id: "onboarding-e2e-coverage",
				title: "Add end-to-end coverage for the onboarding flow",
				issueType: "subtask",
				issueKey: "GROW-204",
				spaceName: "Growth",
				tabs: ["assigned", "viewed"],
			},
			{
				id: "critical-component-testing",
				title: "Set up automated testing for critical components",
				issueType: "task",
				issueKey: "QA-56",
				spaceName: "Quality",
				tabs: ["worked-on"],
			},
		],
	},
	{
		id: "done",
		label: "Done",
		collapsible: true,
		items: [
			{
				id: "ci-pipeline",
				title: "Establish the continuous integration pipeline",
				issueType: "epic",
				issueKey: "PLAT-12",
				spaceName: "Platform",
				tabs: ["viewed"],
			},
			{
				id: "enhance-accessibility",
				title: "Enhance user interface for better accessibility",
				issueType: "story",
				issueKey: "DS-73",
				spaceName: "Design system",
				tabs: ["assigned", "worked-on", "viewed"],
			},
			{
				id: "third-party-apis",
				title: "Integrate third-party APIs for additional features",
				issueType: "story",
				issueKey: "INT-119",
				spaceName: "Integrations",
				tabs: ["viewed"],
			},
		],
	},
];
