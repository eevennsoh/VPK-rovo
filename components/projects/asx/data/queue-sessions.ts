import { getRovoAgentProfile, type RovoAgentProfile } from "@/app/data/directory/agents";
import { STARRED_PROJECTS } from "@/components/blocks/product-sidebar/data/jira-navigation";
import type { QuestionCardQuestion } from "@/components/blocks/question-card/types";
import type { RovoUIMessage } from "@/lib/rovo-ui-messages";

export type AsxQueueSessionStatus =
	| "awaiting-input"
	| "running"
	| "pr-open"
	| "merged"
	| "stopped";

export type AsxQueueSessionHost = "cloud" | "local";

export type AsxQueueJiraColumn = "To do" | "In progress" | "In review" | "Done";

export type AsxQueueLayoutMode = "by-project" | "one-list";

export type AsxQueueSortMode = "priority" | "last-updated" | "manual";

export interface AsxQueueFileChanges {
	additions: number;
	deletions: number;
	files: readonly string[];
	isDismissed: boolean;
}

export interface AsxQueueQuestion {
	prompt: string;
	questions: readonly QuestionCardQuestion[];
}

export interface AsxQueueSession {
	agentId: string;
	branch?: string;
	checks?: string;
	commit?: string;
	fileChanges?: AsxQueueFileChanges;
	host: AsxQueueSessionHost;
	id: string;
	isPinned: boolean;
	issueKey: string;
	issueSummary: string;
	jiraColumn: AsxQueueJiraColumn;
	manualRank: number;
	messages: RovoUIMessage[];
	priorityRank: number;
	pullRequestNumber?: number;
	pullRequestTitle?: string;
	question?: AsxQueueQuestion;
	repository?: string;
	spaceId: string;
	status: AsxQueueSessionStatus;
	title: string;
	updatedRank: number;
	worktreePath?: string;
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
		host: "cloud",
		issueKey: "RFP-101",
		issueSummary: "Acme procurement questionnaire",
		title: "Confirm Acme rollout plan",
		status: "awaiting-input",
		isPinned: false,
		jiraColumn: "In progress",
		manualRank: 1,
		priorityRank: 1,
		updatedRank: 2,
		repository: "acme-corp/rfp-response-platform",
		question: {
			prompt: "What target go-live date should I use for the readiness assessment?",
			questions: [
				{
					id: "target-go-live-date",
					kind: "single-select",
					label: "What is the target go-live date?",
					description: "I need the customer-approved date to finish the delivery risk score.",
					options: [
						{
							id: "october-15",
							label: "15 October 2026",
							description: "Use the launch date requested in the customer timeline.",
						},
						{
							id: "november-1",
							label: "1 November 2026",
							description: "Add a two-week buffer for security and deployment readiness.",
						},
						{
							id: "not-confirmed",
							label: "Date not confirmed",
							description: "Finish the assessment with the schedule risk clearly flagged.",
						},
					],
					placeholder: "Enter another date or add context",
				},
			],
		},
		messages: [
			message(
				"acme-user-1",
				"user",
				"Can you review the Acme procurement questionnaire, validate every response owner, and flag anything that blocks qualification?",
			),
			message(
				"acme-agent-1",
				"assistant",
				[
					"I completed the qualification review across all 78 response items and reconciled them against the approved answer library, evidence register, and owner matrix.",
					"",
					"**Qualification summary**",
					"- **Commercial:** All 24 responses are complete. The non-standard pricing exception is assigned to Priya Shah in Finance and is within the approved discount threshold.",
					"- **Security:** All 18 mandatory controls have current evidence for SOC 2, ISO 27001, encryption, incident response, access management, and business continuity.",
					"- **Privacy and residency:** The Australian data residency response is supported by the latest APAC hosting letter. Subprocessor and retention statements match the signed DPA.",
					"- **Implementation:** The delivery approach, migration responsibilities, and support model are ready. Every response section has a named accountable owner.",
					"",
					"**Items needing attention**",
					"- The DPA counter-signature is still pending, but it can remain a tracked follow-up and does not block qualification.",
					"- The rollout plan says ‘Q4 2026’ without a customer-approved go-live date. This is the only remaining input that changes the implementation risk score.",
					"",
					"**Recommendation**",
					"Proceed as conditionally qualified. Once you confirm the target date below, I can finalize the readiness score, update the implementation response, and close the remaining qualification action.",
				].join("\n"),
			),
		],
	},
	{
		id: "northstar-evidence-pr",
		spaceId: "enterprise-rfp-qualification",
		agentId: "pipeline-troubleshooter",
		host: "local",
		issueKey: "RFP-102",
		issueSummary: "Northstar security evidence automation",
		title: "Automate Northstar security evidence",
		status: "pr-open",
		isPinned: false,
		jiraColumn: "Done",
		manualRank: 2,
		priorityRank: 2,
		updatedRank: 1,
		repository: "acme-corp/rfp-response-platform",
		branch: "rovo/rfp-102-evidence-sync",
		worktreePath: "~/src/rfp-response-platform/.worktrees/rfp-102",
		pullRequestNumber: 1847,
		pullRequestTitle: "RFP-102 Automate Northstar security evidence",
		commit: "7d3a91c",
		checks: "4 checks passing",
		fileChanges: {
			additions: 148,
			deletions: 37,
			files: [
				"src/evidence/collect-security-controls.ts",
				"src/evidence/map-control-owners.ts",
				"src/evidence/__tests__/collect-security-controls.test.ts",
				"docs/rfp/northstar-security-evidence.md",
			],
			isDismissed: false,
		},
		messages: [
			message(
				"northstar-user-1",
				"user",
				"Can you automate the Northstar security evidence collection so reviewers can refresh control owners and proof links before submission?",
			),
			message(
				"northstar-agent-1",
				"assistant",
				[
					"I implemented the evidence refresh workflow on branch **rovo/rfp-102-evidence-sync** and opened pull request **#1847**.",
					"",
					"**What changed**",
					"- Added a collector for the 37 in-scope SOC 2 and ISO 27001 controls. It normalizes control IDs before matching them to questionnaire responses.",
					"- Added owner resolution that preserves manual overrides while filling missing owners from the security responsibility matrix.",
					"- Added proof-link validation for missing, expired, and superseded evidence, with a clear reason attached to every rejected link.",
					"- Added a no-write dry-run mode that reports proposed owner and evidence changes before anything is updated.",
					"- Added reviewer documentation covering the refresh command, expected summary, manual override behavior, and rollback steps.",
					"",
					"**Validation**",
					"- Regression coverage includes duplicate control IDs, missing owners, expired links, manual overrides, and dry-run output.",
					"- Lint, unit tests, and typecheck pass locally.",
					"- All four pull-request checks are green.",
					"",
					"**Delivery status**",
					"PR #1847 contains four changed files with **148 additions** and **37 deletions**. It is ready for review; the Jira transition is set to **Done** by default and can be changed from the context bar below.",
				].join("\n"),
			),
		],
	},
	{
		id: "security-evidence-merged",
		spaceId: "enterprise-rfp-qualification",
		agentId: "code-reviewer",
		host: "local",
		issueKey: "RFP-103",
		issueSummary: "Security response validation",
		title: "Validate security response evidence",
		status: "merged",
		isPinned: false,
		jiraColumn: "Done",
		manualRank: 3,
		priorityRank: 3,
		updatedRank: 3,
		repository: "acme-corp/rfp-response-platform",
		branch: "rovo/rfp-103-response-validation",
		worktreePath: "~/src/rfp-response-platform/.worktrees/rfp-103",
		pullRequestNumber: 1842,
		pullRequestTitle: "RFP-103 Validate security response evidence",
		commit: "2f6bc84",
		checks: "6 checks passing",
		fileChanges: {
			additions: 92,
			deletions: 18,
			files: [
				"src/validation/security-response.ts",
				"src/validation/__tests__/security-response.test.ts",
				"docs/rfp/security-response-evidence.md",
			],
			isDismissed: false,
		},
		messages: [
			message(
				"security-user-1",
				"user",
				"Can you add validation for missing security evidence and make every finding actionable for the response owners?",
			),
			message(
				"security-agent-1",
				"assistant",
				[
					"I completed the validator update and merged pull request **#1842** after Security Engineering approval.",
					"",
					"**What the audit found**",
					"- Nine mandatory responses were missing an evidence citation.",
					"- Four responses referenced superseded policy or certification documents.",
					"- Three findings had no accountable owner in the response matrix.",
					"- Duplicate citations made two response sections appear complete even though they pointed to the same proof document.",
					"",
					"**What changed**",
					"- Findings are grouped by accountable owner and response section instead of appearing as one flat error list.",
					"- Missing mandatory evidence blocks submission; optional evidence remains visible as a warning.",
					"- Every finding includes a direct link to the affected response and explains the action required to clear it.",
					"- Owner fallback uses the security responsibility matrix when a response-specific owner is absent.",
					"- The sample report separates blockers from warnings so pursuit leads can assess submission readiness immediately.",
					"",
					"**Validation and delivery**",
					"Six focused regression tests cover missing evidence, optional warnings, duplicate citations, stale versions, owner fallback, and deep links. The full suite and all six PR checks passed. The merged change updates three files with **92 additions** and **18 deletions**, and the response-owner guide now documents how to resolve each finding.",
				].join("\n"),
			),
		],
	},
];

export function getAsxQueueAgent(agentId: string): RovoAgentProfile {
	return getRovoAgentProfile(agentId);
}
