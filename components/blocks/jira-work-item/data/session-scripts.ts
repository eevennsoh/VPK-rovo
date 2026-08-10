/**
 * Deterministic script timelines the tick engine plays for the experimental
 * Jira Work Item block. Self-contained data with no imports from the state model,
 * so it stays trivially bundleable and has no dependency cycle.
 */

interface ScriptStepDef {
	id: string;
	label: string;
	durationMs: number;
	/** Optional agent message appended when this step completes. */
	agentMessage?: string;
}

interface ScriptQuestionOption {
	id: string;
	label: string;
	description?: string;
}

export interface ScriptWaitingQuestion {
	id: string;
	label: string;
	description?: string;
	kind: "single-select" | "multi-select" | "text";
	options: readonly ScriptQuestionOption[];
	placeholder?: string;
}

export interface AgentSessionScript {
	id: string;
	title: string;
	defaultCommand: string;
	runningPreview: string;
	steps: ScriptStepDef[];
	/** After completing this step index, the agent pauses in `waiting`. */
	waitAfterIndex?: number;
	/** Structured question shown in floating chat when this script pauses. */
	waitingQuestion?: ScriptWaitingQuestion;
	waitingPrompt: string;
	waitingPreview: string;
	resumeMessage: string;
	completionMessage: string;
	completionPreview: string;
}

export const SESSION_SCRIPTS: Record<string, AgentSessionScript> = {
	"shop-4821-improve-description": {
		id: "shop-4821-improve-description",
		title: "Improve description",
		defaultCommand: "/Improve description",
		runningPreview: "Reviewing the work item and drafting a clearer implementation-ready description…",
		steps: [
			{ id: "review", label: "Review the current work item", durationMs: 900 },
			{ id: "draft", label: "Draft the improved description", durationMs: 1200 },
		],
		waitAfterIndex: 1,
		waitingQuestion: {
			id: "apply-improved-description",
			label: "Would you like me to add this suggested output to the work item description?",
			description: "The work item will not change until you confirm.",
			kind: "single-select",
			options: [
				{
					id: "apply-description",
					label: "Add suggested description",
					description: "Replace the current description with the improved version.",
				},
				{
					id: "keep-description",
					label: "Keep current description",
					description: "Leave the work item unchanged.",
				},
			],
		},
		waitingPrompt: "The suggested description is ready. Would you like me to add it to the work item?",
		waitingPreview: "Waiting for confirmation before updating the work item description.",
		resumeMessage: "Thanks — I’ll apply your choice now.",
		completionMessage: "The description suggestion has been resolved.",
		completionPreview: "Description suggestion resolved.",
	},
	"compliance-matrix": {
		id: "compliance-matrix",
		title: "Map Acmecorp’s compliance requirements",
		defaultCommand: "Build the Acmecorp requirement compliance matrix",
		runningPreview: "Mapping mandatory RFP requirements to Atlassian capabilities…",
		steps: [
			{ id: "read", label: "Read RFP intake notes and requirements", durationMs: 1600, agentMessage: "Parsed 42 mandatory requirements from the Acmecorp RFP intake notes." },
			{ id: "map", label: "Map requirements to Atlassian capabilities", durationMs: 2000, agentMessage: "Matched 38 requirements to native capabilities; 4 need partner or roadmap positioning." },
			{ id: "owners", label: "Assign response owners", durationMs: 1600 },
			{ id: "draft", label: "Draft the compliance matrix", durationMs: 2000, agentMessage: "Drafted the compliance matrix with owners and confidence flags." },
		],
		waitingPrompt: "4 requirements need partner or roadmap positioning. Do you want me to flag them as gaps or draft mitigation language?",
		waitingPreview: "Waiting: how should I handle the 4 partner/roadmap requirements?",
		resumeMessage: "Understood — I'll continue with that approach.",
		completionMessage: "The compliance matrix is ready with every mandatory requirement mapped and owned.",
		completionPreview: "Compliance matrix complete — 42 requirements mapped and owned.",
	},
	"risk-review": {
		id: "risk-review",
		title: "Review Acmecorp’s bid risks",
		defaultCommand: "Review the Acmecorp bid risks",
		runningPreview: "Assessing bid/no-bid risks across security, CMDB, and timeline…",
		steps: [
			{ id: "scan", label: "Scan requirements for risk signals", durationMs: 1600, agentMessage: "Flagged security-ops depth, CMDB scale, and the short demo window as top risks." },
			{ id: "weigh", label: "Weigh mitigation options", durationMs: 2000 },
			{ id: "summary", label: "Summarize mitigations", durationMs: 1600, agentMessage: "Summarized each risk as a concrete mitigation action for leadership." },
		],
		waitingPrompt: "Should I escalate the CMDB scale risk to the product team before finalizing?",
		waitingPreview: "Waiting: escalate the CMDB scale risk?",
		resumeMessage: "Got it — proceeding on that basis.",
		completionMessage: "Risk review complete — four risks with mitigation actions ready for the bid decision.",
		completionPreview: "Risk review complete — 4 mitigations ready.",
	},
	"pricing-draft": {
		id: "pricing-draft",
		title: "Model pricing options for Acmecorp",
		defaultCommand: "Draft the Acmecorp pricing posture",
		runningPreview: "Modeling licensing assumptions for a multi-thousand-user deployment…",
		steps: [
			{ id: "assumptions", label: "Gather licensing assumptions", durationMs: 1600, agentMessage: "Collected seat bands, product mix, and phased rollout assumptions." },
			{ id: "model", label: "Model total cost of ownership", durationMs: 2000 },
			{ id: "guardrails", label: "Apply discount guardrails", durationMs: 1600, agentMessage: "Applied deal-desk discount guardrails and flagged approvals." },
		],
		waitAfterIndex: 0,
		waitingQuestion: {
			id: "pricing-seat-band",
			label: "Which seat band should I use for the pricing model?",
			description: "Choose a planning assumption so I can finish the TCO scenarios.",
			kind: "single-select",
			options: [
				{
					id: "assume-5000-seats",
					label: "Assume 5,000 seats",
					description: "Continue now with a 5,000-seat planning assumption.",
				},
				{
					id: "model-seat-range",
					label: "Model a 5,000–10,000-seat range",
					description: "Compare both seat bands so qualification can choose later.",
				},
			],
		},
		waitingPrompt: "I need a target seat band to model pricing. Should I use 5,000 seats as the base case or compare a 5,000–10,000-seat range?",
		waitingPreview: "Waiting: which seat band should I model?",
		resumeMessage: "Thanks — updating the pricing model with that assumption now.",
		completionMessage: "Pricing draft ready with TCO scenarios and approval flags for deal desk.",
		completionPreview: "Pricing draft complete — TCO scenarios ready.",
	},
	"general-assist": {
		id: "general-assist",
		title: "Recommend next steps for this work item",
		defaultCommand: "Help me move this work item forward",
		runningPreview: "Reviewing the work item and suggesting next steps…",
		steps: [
			{ id: "review", label: "Review the work item", durationMs: 1600, agentMessage: "Reviewed the work item details and current status." },
			{ id: "suggest", label: "Suggest next steps", durationMs: 1600, agentMessage: "Here are a few next steps you can take to move this forward." },
		],
		waitingPrompt: "Want me to start on any of these, or add the required context first?",
		waitingPreview: "Waiting: which next step should I start?",
		resumeMessage: "On it.",
		completionMessage: "Done — I've outlined the next steps for this work item.",
		completionPreview: "Suggested next steps for this work item.",
	},
};

export const LAUNCH_SCRIPT_ROTATION = ["compliance-matrix", "risk-review", "pricing-draft"] as const;
