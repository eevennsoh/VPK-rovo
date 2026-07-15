import directoryAgentsData from "@/app/data/directory/agents.json";
import directorySkillsData from "@/app/data/directory/skills.json";
import type { JiraIssueAgentActivity, JiraIssueGenerativeActionRequest } from "@/components/blocks/jira-issue";
import type { QuestionCardQuestion } from "@/components/blocks/question-card/types";
import type { JiraKanbanAgentData, JiraKanbanColumnData } from "@/components/blocks/jira-kanban";
import { BOARD_AGENTS } from "@/components/projects/jira/data/board-agents";
import { BOARD_COLUMNS } from "@/components/projects/jira/data/board-data";
import { ROVO_LOGO_DATA_URI } from "@/components/ui/data/rovo-logo";
import { getDeterministicAgentAvatarSrc } from "@/lib/agent-avatars";

export const ASX_KANBAN_INTAKE_COLUMN = "RFP Intake";
export const ASX_KANBAN_DRAFTING_COLUMN = "Drafting";
export const ASX_KANBAN_REVIEW_COLUMN = "Review";
export const ASX_KANBAN_DEFAULT_AGENT_ID = "rfp-drafter";
const ASX_ROVO_AGENT_ID = "rovo-dev";

interface AsxDirectoryAgentRecord {
	id: string;
	name: string;
	avatarSrc?: string;
}

interface AsxDirectorySkillRecord {
	id: string;
	name: string;
}

const ASX_DIRECTORY_AGENTS = directoryAgentsData as readonly AsxDirectoryAgentRecord[];
const ASX_DIRECTORY_SKILLS = directorySkillsData as readonly AsxDirectorySkillRecord[];

export const ASX_KANBAN_AGENTS: readonly JiraKanbanAgentData[] = [
	{
		id: ASX_KANBAN_DEFAULT_AGENT_ID,
		name: "RFP Drafter",
		byline: "Sales agent by Atlassian",
		avatarSrc: getDeterministicAgentAvatarSrc(ASX_KANBAN_DEFAULT_AGENT_ID),
	},
	{
		id: "service-impact-agent",
		name: "Service impact agent",
		byline: "Service agent by Atlassian",
		avatarSrc: "/avatar-agent/service-agents/rca-agent.svg",
	},
	{
		id: "dependency-mapper",
		name: "Dependency mapper",
		byline: "Planning agent by Atlassian",
		avatarSrc: "/avatar-agent/teamwork-agents/work-item-planner.svg",
	},
	{
		id: "ai-insights-agent",
		name: "AI Insights Agent",
		byline: "Custom agent by Atlassian",
		avatarSrc: "/avatar-agent/product-agents/wildcard-1.svg",
	},
	...BOARD_AGENTS,
] as const;

export const ASX_RFP_QUESTION: readonly QuestionCardQuestion[] = [
	{
		id: "rfp-response-strategy",
		label: "Which response strategy should we lead with?",
		description: "Choose the narrative the RFP drafter should prioritize in the recommendation.",
		kind: "single-select",
		options: [
			{
				id: "platform-consolidation",
				label: "Platform consolidation",
				description: "Lead with lower tool sprawl and one connected system of work.",
			},
			{
				id: "service-experience",
				label: "Service experience",
				description: "Lead with faster employee support and self-service outcomes.",
			},
		],
	},
] as const;

/** ASX owns a fresh, non-persisted board. Drafting intentionally starts empty. */
export function createAsxKanbanColumns(): JiraKanbanColumnData[] {
	return BOARD_COLUMNS.map((column) => {
		const cards = column.title === ASX_KANBAN_DRAFTING_COLUMN
			? []
			: column.cards.map((card) => ({
				...card,
				tags: card.tags.map((tag) => ({ ...tag })),
			}));

		return { ...column, cards, count: cards.length };
	});
}

const AGENT_WORK_LABELS: Readonly<Record<string, readonly string[]>> = {
	[ASX_KANBAN_DEFAULT_AGENT_ID]: [
		"Reading the RFP requirements",
		"Drafting the response narrative",
		"Checking response coverage",
	],
	"service-impact-agent": [
		"Mapping service impact",
		"Checking operational outcomes",
		"Writing the service summary",
	],
	"dependency-mapper": [
		"Following linked requirements",
		"Mapping owners and dependencies",
		"Checking response handoffs",
	],
};

export function getAsxGenerativeActivityId(request: JiraIssueGenerativeActionRequest): string {
	if (request.kind === "skill") {
		const skillId = request.selectedItem?.id ?? "skill:selected-skill";
		return skillId.startsWith("skill:") ? skillId : `skill:${skillId}`;
	}

	if (request.kind === "agent") {
		return request.selectedItem?.id.replace(/^subagent:/u, "") ?? ASX_KANBAN_DEFAULT_AGENT_ID;
	}

	return ASX_ROVO_AGENT_ID;
}

export function createAsxKanbanActivity(agentId: string, awaitingInput = false): JiraIssueAgentActivity {
	if (agentId.startsWith("skill:")) {
		const skillId = agentId.replace(/^skill:/u, "");
		const skillName = ASX_DIRECTORY_SKILLS.find((skill) => skill.id === skillId)?.name ?? "selected skill";
		const labels = [
			`Running ${skillName}`,
			`Applying ${skillName} to the issue`,
			"Preparing the next update",
		];

		return {
			id: agentId,
			name: "Rovo",
			avatarSrc: ROVO_LOGO_DATA_URI,
			label: labels[0],
			labels,
			cycleIntervalMs: 2400,
			cycleIntervalJitterMs: 0,
			state: "working",
		};
	}

	const asxAgent = ASX_KANBAN_AGENTS.find((candidate) => candidate.id === agentId);
	const directoryAgent = ASX_DIRECTORY_AGENTS.find((candidate) => candidate.id === agentId);
	const labels = AGENT_WORK_LABELS[agentId] ?? ["Reviewing the RFP", "Preparing the next update"];

	return {
		id: agentId,
		name: asxAgent?.name ?? directoryAgent?.name ?? "RFP agent",
		avatarSrc: asxAgent?.avatarSrc ?? directoryAgent?.avatarSrc,
		label: awaitingInput ? "Awaiting user input" : labels[0],
		labels,
		cycleIntervalMs: 2400,
		cycleIntervalJitterMs: 0,
		state: awaitingInput ? "awaiting-input" : "working",
	};
}
