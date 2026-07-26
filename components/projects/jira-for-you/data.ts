import { getRovoAgentProfile } from "@/app/data/directory/agents";

import type {
	JiraForYouAgent,
	JiraForYouSection,
	JiraForYouTab,
} from "./jira-for-you-types";

function createJiraForYouAgent(agentId: string): JiraForYouAgent {
	const profile = getRovoAgentProfile(agentId);
	if (profile.id !== agentId || !profile.avatarSrc) {
		throw new Error(`Jira For You agent "${agentId}" needs a canonical directory avatar.`);
	}

	return {
		id: profile.id,
		name: profile.name,
		avatarSrc: profile.avatarSrc,
	};
}

const READINESS_AGENT = createJiraForYouAgent("readiness-checker");
const PROGRESS_AGENT = createJiraForYouAgent("progress-tracker");
const REVIEWER_AGENT = createJiraForYouAgent("code-reviewer");
const PLANNER_AGENT = createJiraForYouAgent("code-planner");
const FEEDBACK_AGENT = createJiraForYouAgent("feedback-analyzer");

export const JIRA_FOR_YOU_TABS: readonly JiraForYouTab[] = [
	{ id: "all", label: "All" },
	{ id: "assigned", label: "Assigned to me", count: 25 },
	{ id: "worked-on", label: "Worked on" },
	{ id: "viewed", label: "Viewed" },
];

export const JIRA_FOR_YOU_SECTIONS: readonly JiraForYouSection[] = [
	{
		id: "needs-input",
		label: "Review",
		items: [
			{
				id: "vitafleet-presentation",
				title: "Create presentation on Vitafleet vision",
				issueType: "task",
				issueKey: "VITA-142",
				spaceName: "Vitafleet",
				jiraStatus: "Review",
				tabs: ["assigned", "worked-on"],
				agents: [READINESS_AGENT],
				status: "Waiting for input",
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
				jiraStatus: "In progress",
				tabs: ["assigned", "worked-on", "viewed"],
				agents: [READINESS_AGENT, REVIEWER_AGENT, FEEDBACK_AGENT],
				status: "1 Waiting for input, 2 In progress",
			},
			{
				id: "performance-benchmarking",
				title: "Conduct performance benchmarking",
				issueType: "task",
				issueKey: "PERF-27",
				spaceName: "Data platform",
				jiraStatus: "In progress",
				tabs: ["assigned", "worked-on"],
				agents: [PROGRESS_AGENT],
				status: "In progress",
				elapsedSeconds: 300,
			},
			{
				id: "refactor-readability",
				title: "Refactor code for better readability",
				issueType: "bug",
				issueKey: "WEB-461",
				spaceName: "Web app",
				jiraStatus: "In review",
				tabs: ["worked-on", "viewed"],
				agents: [PLANNER_AGENT],
				status: "In review",
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
				jiraStatus: "To do",
				tabs: ["assigned"],
			},
			{
				id: "onboarding-e2e-coverage",
				title: "Add end-to-end coverage for the onboarding flow",
				issueType: "subtask",
				issueKey: "GROW-204",
				spaceName: "Growth",
				jiraStatus: "To do",
				tabs: ["assigned", "viewed"],
			},
			{
				id: "critical-component-testing",
				title: "Set up automated testing for critical components",
				issueType: "task",
				issueKey: "QA-56",
				spaceName: "Quality",
				jiraStatus: "To do",
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
				jiraStatus: "Done",
				tabs: ["viewed"],
			},
			{
				id: "enhance-accessibility",
				title: "Enhance user interface for better accessibility",
				issueType: "story",
				issueKey: "DS-73",
				spaceName: "Design system",
				jiraStatus: "Done",
				tabs: ["assigned", "worked-on", "viewed"],
			},
			{
				id: "third-party-apis",
				title: "Integrate third-party APIs for additional features",
				issueType: "story",
				issueKey: "INT-119",
				spaceName: "Integrations",
				jiraStatus: "Done",
				tabs: ["viewed"],
			},
		],
	},
];
