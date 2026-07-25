import { getRovoAgentProfile } from "@/app/data/directory/agents";

import type {
	JiraAgentSessionAgent,
	JiraAgentSessionItem,
} from "./jira-agent-session-types";

function createSessionAgent(agentId: string): JiraAgentSessionAgent {
	const profile = getRovoAgentProfile(agentId);
	return {
		avatarSrc: profile.avatarSrc,
		brandName: profile.brandName,
		id: profile.id,
		name: profile.name,
	};
}

export const JIRA_AGENT_SESSION_ITEMS: readonly JiraAgentSessionItem[] = [
	{
		id: "performance-benchmarking",
		title: "Conduct performance benchmarking",
		state: "running",
		agent: createSessionAgent("progress-tracker"),
		branch: "rovo/perf-27-benchmarks",
		elapsedSeconds: 360,
		prStatus: "created",
	},
	{
		id: "vitafleet-presentation",
		title: "Create presentation on Vitafleet vision",
		state: "needs-input",
		agent: createSessionAgent("readiness-checker"),
		branch: "rovo/vita-142-vision-deck",
		elapsedSeconds: 482,
	},
	{
		id: "refactor-readability",
		title: "Refactor code for better readability",
		state: "complete",
		agent: createSessionAgent("code-planner"),
		branch: "rovo/web-461-readability",
		elapsedSeconds: 754,
		completedSecondsAgo: 68 * 60,
		prStatus: "merged",
	},
];
