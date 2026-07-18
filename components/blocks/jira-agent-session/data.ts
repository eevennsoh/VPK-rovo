import type { JiraAgentSessionItem } from "./jira-agent-session-types";

export const JIRA_AGENT_SESSION_ITEMS: readonly JiraAgentSessionItem[] = [
	{
		id: "performance-benchmarking",
		title: "Conduct performance benchmarking",
		state: "running",
		agent: {
			name: "Progress tracker",
			avatarSrc: "/avatar-agent/teamwork-agents/progress-tracker.svg",
		},
		branch: "rovo/perf-27-benchmarks",
		prStatus: "created",
	},
	{
		id: "vitafleet-presentation",
		title: "Create presentation on Vitafleet vision",
		state: "needs-input",
		agent: {
			name: "Readiness checker",
			avatarSrc: "/avatar-agent/teamwork-agents/readiness-checker.svg",
		},
		branch: "rovo/vita-142-vision-deck",
	},
	{
		id: "refactor-readability",
		title: "Refactor code for better readability",
		state: "complete",
		agent: {
			name: "Code planner",
			avatarSrc: "/avatar-agent/dev-agents/code-planner.svg",
		},
		branch: "rovo/web-461-readability",
		prStatus: "merged",
	},
];
