/**
 * Deterministic AI Planner state for the experimental Agent Sessions block.
 *
 * The planner enriches an already-created work item. Key, title, and workflow
 * status are committed inputs; every other context/details field is staged and
 * must be accepted or dismissed explicitly.
 */

import type {
	WorkItemData,
	WorkItemPerson,
} from "@/app/contexts/context-work-item-modal";
import type { CrewMember } from "@/components/blocks/agent-sessions/data/metadata-crew";
import { LABEL_OPTIONS, PROJECT_OPTIONS } from "@/components/blocks/agent-sessions/data/metadata-fixtures";
import { METADATA_PEOPLE } from "@/components/blocks/agent-sessions/data/metadata-people";
import { filledContextResources } from "@/components/blocks/agent-sessions/data/session-fixtures";
import type {
	AgentSessionsContextResources,
	AgentSessionsPreset,
} from "@/components/blocks/agent-sessions/data/session-state";

export type AgentPlannerStatus = "inactive" | "searching" | "ready" | "refining" | "applied";
export type AgentPlannerField =
	| "description"
	| "attachments"
	| "subtasks"
	| "linkedItems"
	| "atlassianProject"
	| "assignee"
	| "reporter"
	| "priority"
	| "startDate"
	| "dueDate"
	| "parent"
	| "labels";
export type AgentPlannerFieldDecision = "pending" | "accepted" | "dismissed";
export type AgentPlannerSource = "jira" | "twg" | "confluence" | "google-drive";
export type AgentPlannerPriority = NonNullable<WorkItemData["priority"]>;

export interface AgentPlannerMetadata {
	status: string;
	priority: AgentPlannerPriority | null;
	assignee: WorkItemPerson | null;
	reporter: WorkItemPerson | null;
	startDate?: Date;
	dueDate?: Date;
	parent: string | null;
	labels: string[];
	atlassianProject: string | null;
	crew: CrewMember[];
}

export interface AgentPlannerProposal {
	context: AgentSessionsContextResources;
	metadata: AgentPlannerMetadata;
}

export interface AgentPlannerSearchPhase {
	description: string;
	sources: readonly AgentPlannerSource[];
}

export interface AgentPlannerState {
	status: AgentPlannerStatus;
	elapsedMs: number;
	phaseIndex: number;
	proposal: AgentPlannerProposal | null;
	decisions: Record<AgentPlannerField, AgentPlannerFieldDecision>;
	lastPrompt: string | null;
	appliedCount: number;
}

export interface AgentPlannerHostState {
	contextResources: AgentSessionsContextResources;
	metadata: AgentPlannerMetadata;
	planner: AgentPlannerState;
}

export type AgentPlannerAction =
	| { type: "accept-planner-field"; field: AgentPlannerField }
	| { type: "dismiss-planner-field"; field: AgentPlannerField }
	| { type: "apply-planner-proposal" }
	| { type: "reject-planner-proposal" }
	| { type: "refine-planner-proposal"; prompt: string }
	| { type: "edit-metadata"; patch: Partial<AgentPlannerMetadata> };

export const AGENT_PLANNER_FIELDS: readonly AgentPlannerField[] = [
	"description",
	"attachments",
	"subtasks",
	"linkedItems",
	"atlassianProject",
	"assignee",
	"reporter",
	"priority",
	"startDate",
	"dueDate",
	"parent",
	"labels",
];

export const AGENT_PLANNER_SEARCH_PHASE_MS = 1_200;
export const AGENT_PLANNER_REFINEMENT_MS = 1_200;
export const AGENT_PLANNER_SEARCH_PHASES: readonly AgentPlannerSearchPhase[] = [
	{
		description: "Reviewing RFP-101 and intake history",
		sources: ["jira"],
	},
	{
		description: "Searching Acmecorp account memory",
		sources: ["twg", "jira"],
	},
	{
		description: "Comparing related RFPs and reusable response assets",
		sources: ["twg", "jira", "confluence", "google-drive"],
	},
];

function parseSeedDate(value?: string): Date | undefined {
	if (!value) return undefined;
	const parsed = new Date(value);
	return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function cloneMetadata(metadata: Readonly<AgentPlannerMetadata>): AgentPlannerMetadata {
	return {
		...metadata,
		startDate: metadata.startDate ? new Date(metadata.startDate) : undefined,
		dueDate: metadata.dueDate ? new Date(metadata.dueDate) : undefined,
		labels: [...metadata.labels],
		crew: [...metadata.crew],
	};
}

function cloneContext(context: Readonly<AgentSessionsContextResources>): AgentSessionsContextResources {
	return {
		...context,
		tldr: [...context.tldr],
		nextSteps: context.nextSteps.map((step) => ({ ...step })),
		attachments: context.attachments.map((attachment) => ({ ...attachment })),
		subtasks: context.subtasks.map((subtask) => ({ ...subtask })),
		linkedItems: context.linkedItems.map((item) => ({ ...item })),
	};
}

export function seedMetadataDraft(workItem: Readonly<WorkItemData>): AgentPlannerMetadata {
	return {
		status: workItem.status ?? "RFP Intake",
		priority: workItem.priority ?? "Medium",
		assignee: workItem.assignee ?? null,
		reporter: workItem.reporter ?? null,
		startDate: parseSeedDate(workItem.startDate),
		dueDate: parseSeedDate(workItem.dueDate),
		parent: workItem.parent?.code ?? null,
		labels: workItem.labels ? [...workItem.labels] : [],
		atlassianProject: null,
		crew: [],
	};
}

export function seedEmptyMetadataDraft(workItem: Readonly<WorkItemData>): AgentPlannerMetadata {
	return {
		status: workItem.status ?? "RFP Intake",
		priority: null,
		assignee: null,
		reporter: null,
		startDate: undefined,
		dueDate: undefined,
		parent: null,
		labels: [],
		atlassianProject: null,
		crew: [],
	};
}

function buildProposal(workItem: Readonly<WorkItemData>): AgentPlannerProposal {
	const context = filledContextResources();
	const metadata = seedMetadataDraft(workItem);
	return {
		context: { ...context, title: workItem.title },
		metadata: { ...metadata, atlassianProject: "esm-rfp-response" },
	};
}

function createDecisions(decision: AgentPlannerFieldDecision): Record<AgentPlannerField, AgentPlannerFieldDecision> {
	return Object.fromEntries(AGENT_PLANNER_FIELDS.map((field) => [field, decision])) as Record<
		AgentPlannerField,
		AgentPlannerFieldDecision
	>;
}

export function createAgentPlannerState(
	preset: AgentSessionsPreset,
	workItem: Readonly<WorkItemData>,
): AgentPlannerState {
	if (preset !== "empty") {
		return {
			status: "inactive",
			elapsedMs: 0,
			phaseIndex: 0,
			proposal: null,
			decisions: createDecisions("accepted"),
			lastPrompt: null,
			appliedCount: 0,
		};
	}
	return {
		status: "searching",
		elapsedMs: 0,
		phaseIndex: 0,
		proposal: buildProposal(workItem),
		decisions: createDecisions("pending"),
		lastPrompt: null,
		appliedCount: 0,
	};
}

export function isPlannerProcessing(planner: Readonly<AgentPlannerState>): boolean {
	return planner.status === "searching" || planner.status === "refining";
}

export function isPlannerFieldPending(
	planner: Readonly<AgentPlannerState>,
	field: AgentPlannerField,
): boolean {
	return (
		(planner.status === "ready" || planner.status === "refining") &&
		planner.decisions[field] === "pending" &&
		planner.proposal !== null
	);
}

export function countPendingPlannerFields(planner: Readonly<AgentPlannerState>): number {
	return AGENT_PLANNER_FIELDS.filter((field) => planner.decisions[field] === "pending").length;
}

export function advanceAgentPlanner(
	planner: Readonly<AgentPlannerState>,
	deltaMs: number,
): AgentPlannerState {
	if (!Number.isFinite(deltaMs) || deltaMs <= 0 || !isPlannerProcessing(planner)) {
		return planner as AgentPlannerState;
	}
	const elapsedMs = planner.elapsedMs + deltaMs;
	if (planner.status === "refining") {
		return elapsedMs >= AGENT_PLANNER_REFINEMENT_MS
			? {
				...planner,
				status: countPendingPlannerFields(planner) === 0 ? "applied" : "ready",
				elapsedMs: 0,
			}
			: { ...planner, elapsedMs };
	}
	const totalMs = AGENT_PLANNER_SEARCH_PHASES.length * AGENT_PLANNER_SEARCH_PHASE_MS;
	if (elapsedMs >= totalMs) {
		return {
			...planner,
			status: "ready",
			elapsedMs: 0,
			phaseIndex: AGENT_PLANNER_SEARCH_PHASES.length - 1,
		};
	}
	return {
		...planner,
		elapsedMs,
		phaseIndex: Math.min(
			AGENT_PLANNER_SEARCH_PHASES.length - 1,
			Math.floor(elapsedMs / AGENT_PLANNER_SEARCH_PHASE_MS),
		),
	};
}

export function settleAgentPlanner(planner: Readonly<AgentPlannerState>): AgentPlannerState {
	if (!isPlannerProcessing(planner)) return planner as AgentPlannerState;
	return {
		...planner,
		status: planner.status === "refining" && countPendingPlannerFields(planner) === 0 ? "applied" : "ready",
		elapsedMs: 0,
		phaseIndex: AGENT_PLANNER_SEARCH_PHASES.length - 1,
	};
}

function commitPlannerField<T extends AgentPlannerHostState>(
	state: Readonly<T>,
	field: AgentPlannerField,
): T {
	const proposal = state.planner.proposal;
	if (!proposal) return state as T;
	if (field === "description" || field === "attachments" || field === "subtasks" || field === "linkedItems") {
		return {
			...state,
			contextResources: {
				...state.contextResources,
				[field]: cloneContext(proposal.context)[field],
			},
		} as T;
	}
	return {
		...state,
		metadata: {
			...state.metadata,
			[field]: cloneMetadata(proposal.metadata)[field],
		},
	} as T;
}

/** Populate the host's ordinary editable fields without resolving the proposal. */
export function prefillAgentPlannerProposal<T extends AgentPlannerHostState>(state: Readonly<T>): T {
	if (!state.planner.proposal) return state as T;
	let prefilled = state as T;
	for (const field of AGENT_PLANNER_FIELDS) {
		prefilled = commitPlannerField<T>(prefilled, field);
	}
	return prefilled;
}

function finishIfResolved(planner: AgentPlannerState): AgentPlannerState {
	return countPendingPlannerFields(planner) === 0 ? { ...planner, status: "applied" } : planner;
}

function decidePlannerField<T extends AgentPlannerHostState>(
	state: Readonly<T>,
	field: AgentPlannerField,
	decision: Exclude<AgentPlannerFieldDecision, "pending">,
): T {
	if (!isPlannerFieldPending(state.planner, field)) return state as T;
	const committed = decision === "accepted" ? commitPlannerField(state, field) : (state as T);
	const decisions = { ...committed.planner.decisions, [field]: decision };
	const appliedCount = AGENT_PLANNER_FIELDS.filter((candidate) => decisions[candidate] === "accepted").length;
	return {
		...committed,
		planner: finishIfResolved({ ...committed.planner, decisions, appliedCount }),
	};
}

function applyAllPlannerFields<T extends AgentPlannerHostState>(state: Readonly<T>): T {
	if (state.planner.status !== "ready" || !state.planner.proposal) return state as T;
	let committed = state as T;
	for (const field of AGENT_PLANNER_FIELDS) {
		if (state.planner.decisions[field] === "pending") {
			committed = commitPlannerField<T>(committed, field);
		}
	}
	const decisions = { ...committed.planner.decisions };
	for (const field of AGENT_PLANNER_FIELDS) {
		if (decisions[field] === "pending") decisions[field] = "accepted";
	}
	const appliedCount = AGENT_PLANNER_FIELDS.filter((field) => decisions[field] === "accepted").length;
	return {
		...committed,
		planner: { ...committed.planner, status: "applied", decisions, appliedCount },
	};
}

function rejectPlannerProposal<T extends AgentPlannerHostState>(state: Readonly<T>): T {
	const title = state.contextResources.title;
	return {
		...state,
		contextResources: {
			title,
			description: "",
			tldr: [],
			nextSteps: [],
			attachments: [],
			subtasks: [],
			linkedItems: [],
		},
		metadata: {
			status: state.metadata.status,
			priority: null,
			assignee: null,
			reporter: null,
			startDate: undefined,
			dueDate: undefined,
			parent: null,
			labels: [],
			atlassianProject: null,
			crew: [],
		},
		planner: {
			...state.planner,
			status: "inactive",
			proposal: null,
			decisions: createDecisions("dismissed"),
			appliedCount: 0,
		},
	} as T;
}

function changedPlannerFields(
	before: Readonly<AgentPlannerProposal>,
	after: Readonly<AgentPlannerProposal>,
): AgentPlannerField[] {
	return AGENT_PLANNER_FIELDS.filter((field) => {
		if (field === "description" || field === "attachments" || field === "subtasks" || field === "linkedItems") {
			return JSON.stringify(before.context[field]) !== JSON.stringify(after.context[field]);
		}
		return JSON.stringify(before.metadata[field]) !== JSON.stringify(after.metadata[field]);
	});
}

function refineProposal(
	proposal: Readonly<AgentPlannerProposal>,
	prompt: string,
): AgentPlannerProposal {
	const next = {
		context: cloneContext(proposal.context),
		metadata: cloneMetadata(proposal.metadata),
	};
	const normalized = prompt.toLocaleLowerCase("en-US");
	let matched = false;
	const person = METADATA_PEOPLE.find((candidate) => normalized.includes(candidate.name.toLocaleLowerCase("en-US")));
	if (person) {
		next.metadata.assignee = person;
		matched = true;
	}
	const project = PROJECT_OPTIONS.find((candidate) => normalized.includes(candidate.name.toLocaleLowerCase("en-US")));
	if (project) {
		next.metadata.atlassianProject = project.id;
		matched = true;
	}
	const labels = LABEL_OPTIONS.filter((label) => {
		const normalizedLabel = label.toLocaleLowerCase("en-US").replaceAll("-", " ");
		return normalized.includes(label.toLocaleLowerCase("en-US")) || normalized.includes(normalizedLabel);
	});
	if (labels.length > 0) {
		next.metadata.labels = [...new Set([...next.metadata.labels, ...labels])];
		matched = true;
	}
	if (/security|compliance|legal/u.test(normalized)) {
		next.metadata.priority = "Highest";
		if (!next.metadata.labels.includes("security-review")) {
			next.metadata.labels = [...next.metadata.labels, "security-review"];
		}
		next.context.nextSteps = [
			{
				id: "next-refined-security",
				label: "Prioritize security, compliance, and legal review",
				command: "Validate the security, compliance, and legal response with the named review owners.",
			},
			...next.context.nextSteps.filter((step) => step.id !== "next-refined-security"),
		];
		matched = true;
	}
	if (!matched) {
		next.context.description = `${next.context.description}\n\nAdditional direction: ${prompt}`.trim();
		next.context.nextSteps = [
			{
				id: "next-refined-direction",
				label: prompt,
				command: `Update the work item plan using this direction: ${prompt}`,
			},
			...next.context.nextSteps.filter((step) => step.id !== "next-refined-direction"),
		];
	}
	return next;
}

function beginPlannerRefinement<T extends AgentPlannerHostState>(
	state: Readonly<T>,
	prompt: string,
): T {
	const trimmed = prompt.trim();
	if (!trimmed || state.planner.status === "searching" || state.planner.status === "refining") {
		return state as T;
	}
	const base = {
		context: cloneContext(state.contextResources),
		metadata: cloneMetadata(state.metadata),
	};
	const proposal = refineProposal(base, trimmed);
	const changed = changedPlannerFields(base, proposal);
	const decisions = { ...state.planner.decisions };
	for (const field of changed) decisions[field] = "pending";
	return {
		...state,
		planner: {
			...state.planner,
			status: "refining",
			elapsedMs: 0,
			proposal,
			decisions,
			lastPrompt: trimmed,
		},
	};
}

export function reduceAgentPlanner<T extends AgentPlannerHostState>(
	state: Readonly<T>,
	action: Readonly<AgentPlannerAction>,
): T {
	switch (action.type) {
		case "accept-planner-field":
			return decidePlannerField(state, action.field, "accepted");
		case "dismiss-planner-field":
			return decidePlannerField(state, action.field, "dismissed");
		case "apply-planner-proposal":
			return applyAllPlannerFields(state);
		case "reject-planner-proposal":
			return rejectPlannerProposal(state);
		case "refine-planner-proposal":
			return beginPlannerRefinement(state, action.prompt);
		case "edit-metadata":
			return { ...state, metadata: { ...state.metadata, ...action.patch } } as T;
		default: {
			const _exhaustive: never = action;
			return _exhaustive;
		}
	}
}
