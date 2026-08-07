import { getRovoAgentProfile } from "@/app/data/directory/agents";

import type {
	AgentListAgent,
	AgentListItem,
} from "./agent-list-types";

function createSessionAgent(agentId: string): AgentListAgent {
	const profile = getRovoAgentProfile(agentId);
	return {
		avatarSrc: profile.avatarSrc,
		brandName: profile.brandName,
		id: profile.id,
		name: profile.name,
	};
}

const DEMO_INVOKER = {
	name: "Jordan Lee",
	avatarSrc: "/avatar-user/andrew-park/color/asow-dev-lime.png",
} as const;

export const AGENT_LIST_ITEMS: readonly AgentListItem[] = [
	{
		id: "performance-benchmarking",
		title: "Conduct performance benchmarking",
		state: "running",
		agent: createSessionAgent("progress-tracker"),
		branch: "rovo/perf-27-benchmarks",
		invokedBy: DEMO_INVOKER,
		elapsedSeconds: 360,
		prStatus: "created",
	},
	{
		id: "vitafleet-presentation",
		title: "Create presentation on Vitafleet vision",
		state: "needs-input",
		agent: createSessionAgent("readiness-checker"),
		branch: "rovo/vita-142-vision-deck",
		invokedBy: DEMO_INVOKER,
		elapsedSeconds: 482,
	},
	{
		id: "refactor-readability",
		title: "Refactor code for better readability",
		state: "complete",
		agent: createSessionAgent("code-planner"),
		branch: "rovo/web-461-readability",
		invokedBy: DEMO_INVOKER,
		elapsedSeconds: 754,
		completedSecondsAgo: 68 * 60,
		prStatus: "merged",
	},
];
