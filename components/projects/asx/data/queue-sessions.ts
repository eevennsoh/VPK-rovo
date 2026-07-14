import { getRovoAgentProfile, type RovoAgentProfile } from "@/app/data/directory/agents";
import { STARRED_PROJECTS } from "@/components/blocks/product-sidebar/data/jira-navigation";
import type { RovoUIMessage } from "@/lib/rovo-ui-messages";

export type AsxQueueSessionStatus = "queued" | "running" | "needs-input";

export interface AsxQueueSession {
	agentId: string;
	id: string;
	messages: RovoUIMessage[];
	spaceId: string;
	status: AsxQueueSessionStatus;
	title: string;
}

function message(id: string, role: "assistant" | "user", text: string): RovoUIMessage {
	return {
		id,
		role,
		parts: [{ type: "text", text, state: "done" }],
	};
}

export const ASX_QUEUE_SPACES = STARRED_PROJECTS;

export const ASX_QUEUE_SESSION_SEEDS: readonly AsxQueueSession[] = [
	{
		id: "acme-qualification",
		spaceId: "enterprise-rfp-qualification",
		agentId: "readiness-checker",
		title: "Qualify Acme procurement questionnaire",
		status: "needs-input",
		messages: [
			message("acme-user-1", "user", "Review the Acme procurement questionnaire and flag anything that blocks qualification."),
			message("acme-agent-1", "assistant", "I reviewed the packet and verified the commercial and security sections. I need the target go-live date before I can complete the readiness score."),
		],
	},
	{
		id: "northstar-summary",
		spaceId: "enterprise-rfp-qualification",
		agentId: "release-notes-drafter",
		title: "Draft Northstar executive summary",
		status: "running",
		messages: [
			message("northstar-user-1", "user", "Turn the Northstar discovery notes into a concise executive response summary."),
			message("northstar-agent-1", "assistant", "I’m consolidating the decision criteria, value themes, and proof points into a first-pass summary."),
		],
	},
	{
		id: "security-review",
		spaceId: "enterprise-rfp-pipeline",
		agentId: "code-reviewer",
		title: "Review security response requirements",
		status: "queued",
		messages: [
			message("security-user-1", "user", "Review SEC-14 through SEC-32 and identify responses that need engineering evidence."),
			message("security-agent-1", "assistant", "The review is queued behind the active deployment evidence check. I’ll start with the highest-risk controls."),
		],
	},
	{
		id: "deployment-evidence",
		spaceId: "enterprise-rfp-pipeline",
		agentId: "pipeline-troubleshooter",
		title: "Collect deployment evidence",
		status: "running",
		messages: [
			message("deployment-user-1", "user", "Collect the latest deployment and rollback evidence for the reliability section."),
			message("deployment-agent-1", "assistant", "I’m checking the release pipeline, rollback drill, and production change records now."),
		],
	},
	{
		id: "pursuit-decisions",
		spaceId: "rfp-pursuit-team",
		agentId: "meeting-insights-reporter",
		title: "Capture pursuit team decisions",
		status: "needs-input",
		messages: [
			message("pursuit-user-1", "user", "Summarize the pursuit team decisions and assign each open response section."),
			message("pursuit-agent-1", "assistant", "I captured the owners and decisions. Should the pricing exception be assigned to Finance or the account executive?"),
		],
	},
	{
		id: "proposal-gaps",
		spaceId: "rfp-pursuit-team",
		agentId: "feedback-analyzer",
		title: "Identify proposal coverage gaps",
		status: "running",
		messages: [
			message("gaps-user-1", "user", "Compare reviewer feedback with the current proposal and identify missing proof points."),
			message("gaps-agent-1", "assistant", "I’m clustering the feedback by evaluation criterion and matching each gap to the current response."),
		],
	},
];

export function getAsxQueueAgent(agentId: string): RovoAgentProfile {
	return getRovoAgentProfile(agentId);
}
