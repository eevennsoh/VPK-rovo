/**
 * Agent Sessions (experimental) — pure state model.
 *
 * This is the deterministic, side-effect-free foundation for the experimental
 * Agent Sessions block. It owns two INDEPENDENT dimensions:
 *   1. context  — derived `empty | filled` (see `selectContextStatus`)
 *   2. session  — per-session `running | waiting | completed`
 *
 * Everything here is pure and uses **type-only** imports so the module can be
 * required directly by `node --test` (Node 24 strip-types) without resolving the
 * `@/` alias or pulling a runtime graph. The reducer never touches the clock or
 * randomness: IDs come from `nextIdCounter`, time comes from `elapsedMs`, and the
 * timer engine (`advanceSessions`) takes an injected `deltaMs`. The React layer
 * (see `../experimental/use-agent-sessions-controller.ts`) is only a metronome.
 *
 * This prototype model is intentionally SEPARATE from the persisted Jira RFP
 * backend lifecycle (`components/projects/jira/lib/rfp-demo-state.ts`); it follows
 * that lifecycle's status vocabulary only where the concepts line up
 * (`running`/`completed`), and adds `waiting` for the waiting-for-input state that
 * the backend does not model.
 */

import type { WorkItemAttachment, WorkItemChildItem } from "@/app/contexts/context-work-item-modal";

export const AGENT_SESSIONS_STATE_VERSION = 1 as const;
/** Metronome cadence used by the React controller and the default timing math. */
export const AGENT_SESSIONS_TICK_MS = 400;
/**
 * Fixed base epoch for deterministic display timestamps. Never derive time from
 * `Date.now()` / `new Date()` (breaks reproducibility + SSR hydration). All
 * `createdAtMs` values are `SESSION_EPOCH_MS + <deterministic offset>`.
 */
const SESSION_EPOCH_MS = Date.UTC(2026, 5, 8, 16, 0, 0); // Jun 8 2026, 16:00 UTC

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────

export type AgentSessionStatus = "running" | "waiting" | "completed";
export type AgentSessionsContextStatus = "empty" | "filled";
export type AgentSessionsPreset = "empty" | "filled" | "running";
export type AgentSessionEventRole = "human" | "agent";
export type AgentSessionStepStatus = "complete" | "active" | "pending";
export type RelationshipOption =
	| "blocks"
	| "is blocked by"
	| "relates to"
	| "duplicates"
	| "clones";
export type LinkedWorkItemType = "Task" | "Story" | "Bug" | "Epic";

export interface AgentSessionStep {
	id: string;
	label: string;
	status: AgentSessionStepStatus;
}

export interface AgentSessionMessage {
	id: string;
	role: AgentSessionEventRole;
	authorName: string;
	authorAvatarSrc?: string;
	content: string;
	createdAtMs: number;
}

export interface NextStep {
	id: string;
	label: string;
	command: string;
}

export interface ContextLinkedItem {
	id: string;
	key: string;
	summary: string;
	type: LinkedWorkItemType;
	relationship: RelationshipOption;
}

export interface AgentSessionAgent {
	id: string;
	name: string;
	avatarSrc?: string;
}

export interface AgentSession {
	id: string;
	agentId: string;
	agentName: string;
	agentAvatarSrc?: string;
	status: AgentSessionStatus;
	command: string;
	previewText: string;
	steps: AgentSessionStep[];
	progress: number; // 0..1
	messages: AgentSessionMessage[];
	startedAtMs: number;
	scriptId: string;
	scriptCursor: number; // index of the current (active) step
	/** Internal: elapsed ms accumulated within the current step. */
	stepElapsedMs: number;
	/** Internal: whether the scripted wait checkpoint has already been resumed. */
	resumedFromWait: boolean;
	order: number;
}

export interface AgentSessionComment {
	id: string;
	authorName: string;
	authorAvatarSrc?: string;
	content: string;
	createdAtMs: number;
}

export interface AgentSessionsContextResources {
	title: string;
	description: string;
	tldr: string[];
	nextSteps: NextStep[];
	attachments: WorkItemAttachment[];
	subtasks: WorkItemChildItem[];
	linkedItems: ContextLinkedItem[];
}

export interface AgentSessionsState {
	version: 1;
	preset: AgentSessionsPreset;
	contextResources: AgentSessionsContextResources;
	comments: AgentSessionComment[];
	sessions: AgentSession[];
	activeSessionId: string | null;
	/** Draft text to pre-populate the floating session composer (e.g. from a next step). */
	composerPrefill: string | null;
	elapsedMs: number;
	nextOrder: number;
	nextIdCounter: number;
}

// Activity events (agent events are DERIVED from sessions; human events are comments).
export interface HumanActivityEvent {
	id: string;
	kind: "human";
	author: { name: string; avatarUrl?: string };
	content: string;
	createdAtMs: number;
}

export interface AgentActivityEvent {
	id: string;
	kind: "agent";
	sessionId: string;
	agentId: string;
	agentName: string;
	agentAvatarSrc?: string;
	status: AgentSessionStatus;
	commandPreview: string;
	responsePreview?: string;
	createdAtMs: number;
}

export type ActivityEvent = HumanActivityEvent | AgentActivityEvent;

export type AddContextResourceAction =
	| { type: "add-context-resource"; kind: "attachment"; item: WorkItemAttachment }
	| { type: "add-context-resource"; kind: "subtask"; item: WorkItemChildItem }
	| { type: "add-context-resource"; kind: "link"; item: ContextLinkedItem };

export type AgentSessionsAction =
	| { type: "hydrate-preset"; preset: AgentSessionsPreset }
	| { type: "launch-session"; agentId: string; agentName: string; agentAvatarSrc?: string; command?: string }
	| { type: "tick"; deltaMs: number }
	| { type: "settle-running" }
	| { type: "reply-session"; sessionId: string; text: string }
	| { type: "add-comment"; text: string; authorName?: string; authorAvatarSrc?: string }
	| { type: "set-active-session"; sessionId: string | null }
	| { type: "open-general-session" }
	| { type: "open-latest-or-general" }
	| { type: "set-composer-prefill"; text: string }
	| { type: "clear-composer-prefill" }
	| AddContextResourceAction
	| { type: "remove-context-resource"; kind: "attachment" | "subtask" | "link"; id: string }
	| { type: "edit-context-text"; field: "title" | "description"; value: string }
	| { type: "refresh-generated-context" }
	| { type: "reset" };

// ────────────────────────────────────────────────────────────────────────────
// Deterministic display helpers
// ────────────────────────────────────────────────────────────────────────────

const SESSION_TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
	hour: "numeric",
	minute: "2-digit",
	timeZone: "UTC",
});

/** Deterministic, locale-stable time-of-day label for a `createdAtMs` value. */
export function formatSessionTimestamp(createdAtMs: number): string {
	return SESSION_TIME_FORMATTER.format(new Date(createdAtMs));
}

// ────────────────────────────────────────────────────────────────────────────
// Scripts — deterministic timelines the tick engine plays
// ────────────────────────────────────────────────────────────────────────────

interface ScriptStepDef {
	id: string;
	label: string;
	durationMs: number;
	/** Optional agent message appended when this step completes. */
	agentMessage?: string;
}

export interface AgentSessionScript {
	id: string;
	title: string;
	defaultCommand: string;
	runningPreview: string;
	steps: ScriptStepDef[];
	/** After completing this step index, the agent pauses in `waiting`. */
	waitAfterIndex?: number;
	waitingPrompt: string;
	waitingPreview: string;
	resumeMessage: string;
	completionMessage: string;
	completionPreview: string;
}

export const SESSION_SCRIPTS: Record<string, AgentSessionScript> = {
	"compliance-matrix": {
		id: "compliance-matrix",
		title: "Compliance matrix",
		defaultCommand: "Build the Acmecorp requirement compliance matrix",
		runningPreview: "Mapping mandatory RFP requirements to Atlassian capabilities…",
		steps: [
			{ id: "read", label: "Read RFP intake notes and requirements", durationMs: 1600, agentMessage: "Parsed 42 mandatory requirements from the Acmecorp RFP intake notes." },
			{ id: "map", label: "Map requirements to Atlassian capabilities", durationMs: 2000, agentMessage: "Matched 38 requirements to native capabilities; 4 need partner or roadmap positioning." },
			{ id: "owners", label: "Assign response owners", durationMs: 1600 },
			{ id: "draft", label: "Draft the compliance matrix", durationMs: 2000, agentMessage: "Drafted the compliance matrix with owners and confidence flags." },
		],
		waitAfterIndex: 1,
		waitingPrompt: "4 requirements need partner or roadmap positioning. Do you want me to flag them as gaps or draft mitigation language?",
		waitingPreview: "Waiting: how should I handle the 4 partner/roadmap requirements?",
		resumeMessage: "Understood — I'll continue with that approach.",
		completionMessage: "The compliance matrix is ready with every mandatory requirement mapped and owned.",
		completionPreview: "Compliance matrix complete — 42 requirements mapped and owned.",
	},
	"risk-review": {
		id: "risk-review",
		title: "Risk review",
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
		title: "Pricing draft",
		defaultCommand: "Draft the Acmecorp pricing posture",
		runningPreview: "Modeling licensing assumptions for a multi-thousand-user deployment…",
		steps: [
			{ id: "assumptions", label: "Gather licensing assumptions", durationMs: 1600, agentMessage: "Collected seat bands, product mix, and phased rollout assumptions." },
			{ id: "model", label: "Model total cost of ownership", durationMs: 2000 },
			{ id: "guardrails", label: "Apply discount guardrails", durationMs: 1600, agentMessage: "Applied deal-desk discount guardrails and flagged approvals." },
		],
		waitAfterIndex: 0,
		waitingPrompt: "I need a target seat band to model pricing. Should I assume 5,000 seats or wait for qualification?",
		waitingPreview: "Waiting: which seat band should I model?",
		resumeMessage: "Thanks — modeling against that seat band now.",
		completionMessage: "Pricing draft ready with TCO scenarios and approval flags for deal desk.",
		completionPreview: "Pricing draft complete — TCO scenarios ready.",
	},
	"general-assist": {
		id: "general-assist",
		title: "Work item assistant",
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

const LAUNCH_SCRIPT_ROTATION = ["compliance-matrix", "risk-review", "pricing-draft"] as const;
const GENERAL_AGENT: AgentSessionAgent = { id: "rovo", name: "Rovo", avatarSrc: "/1p/rovo.svg" };

// ────────────────────────────────────────────────────────────────────────────
// Session construction (pure)
// ────────────────────────────────────────────────────────────────────────────

function buildDisplaySteps(script: AgentSessionScript): AgentSessionStep[] {
	return script.steps.map((step) => ({ id: step.id, label: step.label, status: "pending" as const }));
}

/**
 * Instantiate a session from a script at a given lifecycle position. Used both by
 * the presets (to seed sessions mid-flight) and by `launch-session` (fresh).
 */
function instantiateSession(params: {
	id: string;
	order: number;
	agent: AgentSessionAgent;
	scriptId: string;
	command?: string;
	status: AgentSessionStatus;
	cursor: number;
	startedAtMs: number;
	resumedFromWait?: boolean;
	includeMessagesThroughCursor?: boolean;
}): AgentSession {
	const script = SESSION_SCRIPTS[params.scriptId] ?? SESSION_SCRIPTS["general-assist"];
	const steps = buildDisplaySteps(script);
	const messages: AgentSessionMessage[] = [];
	const command = params.command ?? script.defaultCommand;
	const totalSteps = steps.length;
	const cursor = Math.min(params.cursor, totalSteps);

	// Mark step statuses to match the cursor + status.
	for (let index = 0; index < totalSteps; index += 1) {
		if (index < cursor) {
			steps[index].status = "complete";
		} else if (index === cursor && params.status === "running") {
			steps[index].status = "active";
		} else {
			steps[index].status = "pending";
		}
	}
	if (params.status === "completed") {
		for (const step of steps) step.status = "complete";
	}

	// Seed the transcript with the initiating command + any messages already
	// produced up to the cursor, so preset sessions look alive immediately.
	messages.push({
		id: `${params.id}-m0`,
		role: "human",
		authorName: "You",
		content: command,
		createdAtMs: params.startedAtMs,
	});
	let stamp = params.startedAtMs;
	if (params.includeMessagesThroughCursor ?? true) {
		const throughIndex = params.status === "completed" ? totalSteps : cursor;
		for (let index = 0; index < throughIndex; index += 1) {
			const stepMessage = script.steps[index]?.agentMessage;
			stamp += script.steps[index]?.durationMs ?? 1000;
			if (stepMessage) {
				messages.push({
					id: `${params.id}-m${index + 1}`,
					role: "agent",
					authorName: params.agent.name,
					authorAvatarSrc: params.agent.avatarSrc,
					content: stepMessage,
					createdAtMs: stamp,
				});
			}
		}
	}

	let previewText = script.runningPreview;
	if (params.status === "waiting") {
		previewText = script.waitingPreview;
		messages.push({
			id: `${params.id}-mwait`,
			role: "agent",
			authorName: params.agent.name,
			authorAvatarSrc: params.agent.avatarSrc,
			content: script.waitingPrompt,
			createdAtMs: stamp + 400,
		});
	} else if (params.status === "completed") {
		previewText = script.completionPreview;
		messages.push({
			id: `${params.id}-mdone`,
			role: "agent",
			authorName: params.agent.name,
			authorAvatarSrc: params.agent.avatarSrc,
			content: script.completionMessage,
			createdAtMs: stamp + 400,
		});
	}

	const completeCount = steps.filter((step) => step.status === "complete").length;

	return {
		id: params.id,
		agentId: params.agent.id,
		agentName: params.agent.name,
		agentAvatarSrc: params.agent.avatarSrc,
		status: params.status,
		command,
		previewText,
		steps,
		progress: totalSteps === 0 ? 1 : completeCount / totalSteps,
		messages,
		startedAtMs: params.startedAtMs,
		scriptId: script.id,
		scriptCursor: cursor,
		stepElapsedMs: 0,
		resumedFromWait: params.resumedFromWait ?? false,
		order: params.order,
	};
}

// ────────────────────────────────────────────────────────────────────────────
// Timer engine (pure) — the React layer only supplies deltaMs
// ────────────────────────────────────────────────────────────────────────────

function recomputeProgress(session: AgentSession, script: AgentSessionScript): number {
	const total = script.steps.length;
	if (total === 0) return 1;
	const completed = session.scriptCursor;
	const current = script.steps[session.scriptCursor];
	const fraction = current && session.status === "running"
		? Math.min(session.stepElapsedMs / current.durationMs, 1)
		: 0;
	return Math.min((completed + fraction) / total, 1);
}

/** Advance one running session by `deltaMs`, returning a new session object. */
function advanceRunningSession(session: AgentSession, deltaMs: number): AgentSession {
	const script = SESSION_SCRIPTS[session.scriptId] ?? SESSION_SCRIPTS["general-assist"];
	let cursor = session.scriptCursor;
	let stepElapsed = session.stepElapsedMs + deltaMs;
	const steps = session.steps.map((step) => ({ ...step }));
	const messages = session.messages.slice();
	let status: AgentSessionStatus = "running";
	let previewText = session.previewText;
	let stamp = session.startedAtMs + cursorStartOffset(script, cursor) + session.stepElapsedMs;
	let guard = 0;

	while (guard < 64) {
		guard += 1;
		const current = script.steps[cursor];
		if (!current) {
			status = "completed";
			break;
		}
		if (stepElapsed < current.durationMs) {
			steps[cursor].status = "active";
			break;
		}
		// Complete the current step.
		steps[cursor].status = "complete";
		stamp += current.durationMs;
		if (current.agentMessage) {
			messages.push({
				id: `${session.id}-adv${cursor}`,
				role: "agent",
				authorName: session.agentName,
				authorAvatarSrc: session.agentAvatarSrc,
				content: current.agentMessage,
				createdAtMs: stamp,
			});
		}
		stepElapsed -= current.durationMs;
		cursor += 1;

		// Wait checkpoint: pause after the configured step unless already resumed.
		if (script.waitAfterIndex !== undefined && cursor === script.waitAfterIndex + 1 && !session.resumedFromWait) {
			status = "waiting";
			previewText = script.waitingPreview;
			messages.push({
				id: `${session.id}-wait`,
				role: "agent",
				authorName: session.agentName,
				authorAvatarSrc: session.agentAvatarSrc,
				content: script.waitingPrompt,
				createdAtMs: stamp + 200,
			});
			stepElapsed = 0;
			break;
		}
		if (cursor >= script.steps.length) {
			status = "completed";
			break;
		}
		steps[cursor].status = "active";
	}

	if (status === "completed") {
		for (const step of steps) step.status = "complete";
		if (!messages.some((message) => message.id === `${session.id}-done`)) {
			messages.push({
				id: `${session.id}-done`,
				role: "agent",
				authorName: session.agentName,
				authorAvatarSrc: session.agentAvatarSrc,
				content: script.completionMessage,
				createdAtMs: stamp + 200,
			});
		}
		previewText = script.completionPreview;
		stepElapsed = 0;
	}

	const next: AgentSession = {
		...session,
		steps,
		messages,
		status,
		previewText,
		scriptCursor: cursor,
		stepElapsedMs: stepElapsed,
	};
	next.progress = status === "completed" ? 1 : recomputeProgress(next, script);
	return next;
}

function cursorStartOffset(script: AgentSessionScript, cursor: number): number {
	let offset = 0;
	for (let index = 0; index < cursor && index < script.steps.length; index += 1) {
		offset += script.steps[index].durationMs;
	}
	return offset;
}

/** Pure timer engine: advance every running session by `deltaMs`. */
export function advanceSessions(state: Readonly<AgentSessionsState>, deltaMs: number): AgentSessionsState {
	if (deltaMs <= 0) return state as AgentSessionsState;
	let changed = false;
	const sessions = state.sessions.map((session) => {
		if (session.status !== "running") return session;
		changed = true;
		return advanceRunningSession(session, deltaMs);
	});
	if (!changed) {
		return { ...state, elapsedMs: state.elapsedMs + deltaMs };
	}
	return { ...state, sessions, elapsedMs: state.elapsedMs + deltaMs };
}

/**
 * Reduced-motion instant path: fast-forward every running session to its next
 * stable checkpoint (waiting or completed) without continuous animation. State
 * changes still carry information; only the smooth progress is skipped.
 */
export function settleRunningSessions(state: Readonly<AgentSessionsState>): AgentSessionsState {
	let working = state as AgentSessionsState;
	let guard = 0;
	while (hasRunningSession(working) && guard < 64) {
		guard += 1;
		working = advanceSessions(working, 4000);
	}
	return working;
}

// ────────────────────────────────────────────────────────────────────────────
// Reducer (pure)
// ────────────────────────────────────────────────────────────────────────────

export function agentSessionsReducer(
	state: Readonly<AgentSessionsState>,
	action: Readonly<AgentSessionsAction>,
): AgentSessionsState {
	switch (action.type) {
		case "hydrate-preset":
			return hydratePreset(action.preset);
		case "reset":
			return hydratePreset(state.preset);
		case "tick":
			return advanceSessions(state, action.deltaMs);
		case "settle-running":
			return settleRunningSessions(state);
		case "launch-session": {
			const scriptId = LAUNCH_SCRIPT_ROTATION[state.nextOrder % LAUNCH_SCRIPT_ROTATION.length];
			const id = `session-${state.nextIdCounter}`;
			const session = instantiateSession({
				id,
				order: state.nextOrder,
				agent: { id: action.agentId, name: action.agentName, avatarSrc: action.agentAvatarSrc },
				scriptId,
				command: action.command,
				status: "running",
				cursor: 0,
				startedAtMs: SESSION_EPOCH_MS + state.elapsedMs,
			});
			return {
				...state,
				sessions: [...state.sessions, session],
				nextOrder: state.nextOrder + 1,
				nextIdCounter: state.nextIdCounter + 1,
			};
		}
		case "open-general-session": {
			const existing = state.sessions.find((session) => session.agentId === GENERAL_AGENT.id && session.status !== "completed");
			if (existing) {
				return { ...state, activeSessionId: existing.id };
			}
			const id = `session-${state.nextIdCounter}`;
			const session = instantiateSession({
				id,
				order: state.nextOrder,
				agent: GENERAL_AGENT,
				scriptId: "general-assist",
				status: "running",
				cursor: 0,
				startedAtMs: SESSION_EPOCH_MS + state.elapsedMs,
			});
			return {
				...state,
				sessions: [...state.sessions, session],
				activeSessionId: id,
				nextOrder: state.nextOrder + 1,
				nextIdCounter: state.nextIdCounter + 1,
			};
		}
		case "set-active-session":
			return { ...state, activeSessionId: action.sessionId };
		case "open-latest-or-general": {
			const latest = selectLatestSession(state);
			if (latest) {
				return { ...state, activeSessionId: latest.id };
			}
			return agentSessionsReducer(state, { type: "open-general-session" });
		}
		case "set-composer-prefill":
			return { ...state, composerPrefill: action.text };
		case "clear-composer-prefill":
			return state.composerPrefill === null ? (state as AgentSessionsState) : { ...state, composerPrefill: null };
		case "reply-session": {
			let counter = state.nextIdCounter;
			const sessions = state.sessions.map((session) => {
				if (session.id !== action.sessionId) return session;
				const script = SESSION_SCRIPTS[session.scriptId] ?? SESSION_SCRIPTS["general-assist"];
				const stamp = SESSION_EPOCH_MS + state.elapsedMs;
				const messages = [
					...session.messages,
					{
						id: `${session.id}-r${counter}`,
						role: "human" as const,
						authorName: "You",
						content: action.text,
						createdAtMs: stamp,
					},
				];
				counter += 1;
				// A reply resumes a waiting session and re-arms the metronome.
				if (session.status === "waiting") {
					messages.push({
						id: `${session.id}-r${counter}`,
						role: "agent" as const,
						authorName: session.agentName,
						authorAvatarSrc: session.agentAvatarSrc,
						content: script.resumeMessage,
						createdAtMs: stamp + 200,
					});
					counter += 1;
					const steps = session.steps.map((step, index) =>
						index === session.scriptCursor ? { ...step, status: "active" as const } : step,
					);
					return {
						...session,
						status: "running" as const,
						resumedFromWait: true,
						stepElapsedMs: 0,
						previewText: script.runningPreview,
						steps,
						messages,
					};
				}
				return { ...session, messages };
			});
			return { ...state, sessions, activeSessionId: action.sessionId, nextIdCounter: counter };
		}
		case "add-comment": {
			const comment: AgentSessionComment = {
				id: `comment-${state.nextIdCounter}`,
				authorName: action.authorName ?? "You",
				authorAvatarSrc: action.authorAvatarSrc,
				content: action.text,
				createdAtMs: SESSION_EPOCH_MS + state.elapsedMs,
			};
			return { ...state, comments: [...state.comments, comment], nextIdCounter: state.nextIdCounter + 1 };
		}
		case "add-context-resource":
			return addContextResource(state, action);
		case "remove-context-resource":
			return removeContextResource(state, action.kind, action.id);
		case "edit-context-text":
			return {
				...state,
				contextResources: { ...state.contextResources, [action.field]: action.value },
			};
		case "refresh-generated-context":
			return {
				...state,
				contextResources: {
					...state.contextResources,
					tldr: reseedGeneratedTldr(state.contextResources),
					nextSteps: reseedGeneratedNextSteps(state.contextResources),
				},
			};
		default: {
			// Exhaustiveness guard: adding an action without handling it is a type error.
			const _exhaustive: never = action;
			return _exhaustive ? state : state;
		}
	}
}

function addContextResource(
	state: Readonly<AgentSessionsState>,
	action: Readonly<AddContextResourceAction>,
): AgentSessionsState {
	const resources = state.contextResources;
	if (action.kind === "attachment") {
		return { ...state, contextResources: { ...resources, attachments: [...resources.attachments, action.item] } };
	}
	if (action.kind === "subtask") {
		return { ...state, contextResources: { ...resources, subtasks: [...resources.subtasks, action.item] } };
	}
	return { ...state, contextResources: { ...resources, linkedItems: [...resources.linkedItems, action.item] } };
}

function removeContextResource(
	state: Readonly<AgentSessionsState>,
	kind: "attachment" | "subtask" | "link",
	id: string,
): AgentSessionsState {
	const resources = state.contextResources;
	if (kind === "attachment") {
		return {
			...state,
			contextResources: { ...resources, attachments: resources.attachments.filter((item) => (item.id ?? item.name) !== id) },
		};
	}
	if (kind === "subtask") {
		return {
			...state,
			contextResources: { ...resources, subtasks: resources.subtasks.filter((item) => item.key !== id) },
		};
	}
	return {
		...state,
		contextResources: { ...resources, linkedItems: resources.linkedItems.filter((item) => item.id !== id) },
	};
}

// ────────────────────────────────────────────────────────────────────────────
// Selectors (derived, never stored)
// ────────────────────────────────────────────────────────────────────────────

export function isContextFilled(context: Readonly<AgentSessionsContextResources>): boolean {
	return (
		context.description.trim().length > 0 ||
		context.attachments.length > 0 ||
		context.subtasks.length > 0 ||
		context.linkedItems.length > 0 ||
		context.tldr.length > 0 ||
		context.nextSteps.length > 0
	);
}

export function selectContextStatus(state: Readonly<AgentSessionsState>): AgentSessionsContextStatus {
	return isContextFilled(state.contextResources) ? "filled" : "empty";
}

export function selectActiveSession(state: Readonly<AgentSessionsState>): AgentSession | null {
	if (state.activeSessionId === null) return null;
	return state.sessions.find((session) => session.id === state.activeSessionId) ?? null;
}

function isWorkingStatus(status: AgentSessionStatus): boolean {
	return status === "running" || status === "waiting";
}

export function selectOrderedSessions(state: Readonly<AgentSessionsState>): AgentSession[] {
	const working = state.sessions.filter((session) => isWorkingStatus(session.status));
	const completed = state.sessions.filter((session) => session.status === "completed");
	const byOrder = (a: AgentSession, b: AgentSession) => a.order - b.order;
	return [...working.sort(byOrder), ...completed.sort(byOrder)];
}

export function selectWorkingCount(state: Readonly<AgentSessionsState>): number {
	return state.sessions.reduce((count, session) => (isWorkingStatus(session.status) ? count + 1 : count), 0);
}

export function hasRunningSession(state: Readonly<AgentSessionsState>): boolean {
	return state.sessions.some((session) => session.status === "running");
}

export function selectLatestSession(state: Readonly<AgentSessionsState>): AgentSession | null {
	if (state.sessions.length === 0) return null;
	return state.sessions.reduce((latest, session) => (session.order > latest.order ? session : latest));
}

export function selectActivityEvents(state: Readonly<AgentSessionsState>): ActivityEvent[] {
	const humanEvents: ActivityEvent[] = state.comments.map((comment) => ({
		id: comment.id,
		kind: "human",
		author: { name: comment.authorName, avatarUrl: comment.authorAvatarSrc },
		content: comment.content,
		createdAtMs: comment.createdAtMs,
	}));
	const agentEvents: ActivityEvent[] = state.sessions.map((session) => {
		const lastAgentMessage = [...session.messages].reverse().find((message) => message.role === "agent");
		return {
			id: `activity-${session.id}`,
			kind: "agent",
			sessionId: session.id,
			agentId: session.agentId,
			agentName: session.agentName,
			agentAvatarSrc: session.agentAvatarSrc,
			status: session.status,
			commandPreview: session.command,
			responsePreview: lastAgentMessage?.content ?? session.previewText,
			createdAtMs: session.startedAtMs,
		};
	});
	return [...humanEvents, ...agentEvents].sort((a, b) => a.createdAtMs - b.createdAtMs);
}

// ────────────────────────────────────────────────────────────────────────────
// Seeded context content (deterministic)
// ────────────────────────────────────────────────────────────────────────────

const FILLED_TITLE = "Acmecorp: Prepare for bid recommendation for ESM RFP";
const FILLED_DESCRIPTION =
	"Acmecorp is evaluating Atlassian as a replacement for its current service-management and work-management stack.\n\n• Consolidate regional IT, asset, knowledge, reporting, and business workflows.\n• Clarify CMDB and procurement requirements into must-haves, differentiators, and owners.\n• Map requirements to Atlassian strengths and flag product, legal, security, deal desk, or partner reviews.";

const FILLED_TLDR = [
	"Acmecorp wants to consolidate fragmented regional tools into one enterprise service-management operating model.",
	"The response hinges on Assets/CMDB depth, a credible AI story via Rovo, and security/compliance readiness.",
	"Deal size is multi-thousand users; budget qualification is still pending before a full bid.",
];

const FILLED_NEXT_STEPS: NextStep[] = [
	{ id: "next-compliance", label: "Finish the requirement compliance matrix", command: "Build the Acmecorp requirement compliance matrix and mark every mandatory owner." },
	{ id: "next-qualify", label: "Confirm budget and stakeholder access", command: "Assess whether Acmecorp budget, stakeholder access, and campaign fit justify a full response." },
	{ id: "next-validate", label: "Validate Assets, CMDB, and security answers", command: "Validate Acmecorp Assets, CMDB, HAM/SAM, GRC, and data residency responses with product and legal owners." },
	{ id: "next-recommend", label: "Draft the bid/no-bid recommendation", command: "Prepare a concise Acmecorp bid/no-bid recommendation with strengths, gaps, and follow-up questions." },
];

const FILLED_ATTACHMENTS: WorkItemAttachment[] = [
	{
		id: "att-intake-notes",
		name: "rfp-intake-notes",
		displayName: "RFP intake notes",
		ext: "page",
		date: "12 May 2026, 09:12 AM",
		thumbnailKind: "document",
		sourceLabel: "Confluence page",
		sourceProduct: "confluence",
	},
	{
		id: "att-requirements",
		name: "acmecorp-requirements",
		displayName: "Acmecorp requirements export",
		ext: "xlsx",
		date: "12 May 2026, 09:40 AM",
		thumbnailKind: "document",
		sourceLabel: "Spreadsheet",
	},
];

const FILLED_SUBTASKS: WorkItemChildItem[] = [
	{ type: "Subtask", key: "RFP-111", summary: "Confirm Acmecorp mandatory response sections", priority: "high", assignee: "Maya Chen", assigneeAvatarUrl: "/avatar-user/andrea-wilson/color/asow-service-yellow.png", status: "inprogress" },
	{ type: "Subtask", key: "RFP-112", summary: "Map Acmecorp reviewers and decision owners", priority: "medium", assignee: "Jordan Lee", assigneeAvatarUrl: "/avatar-user/andrew-park/color/asow-dev-lime.png", status: "todo" },
];

const FILLED_LINKED_ITEMS: ContextLinkedItem[] = [
	{ id: "link-rfp-100", key: "RFP-100", summary: "Enterprise RFP Response", type: "Epic", relationship: "relates to" },
	{ id: "link-rfp-102", key: "RFP-102", summary: "Northstar Bank supplier packet review", type: "Task", relationship: "relates to" },
];

const FILLED_COMMENTS: AgentSessionComment[] = [
	{
		id: "comment-seed-1",
		authorName: "Jordan Lee",
		authorAvatarSrc: "/avatar-user/andrew-park/color/asow-dev-lime.png",
		content: "Flagging that Acmecorp budget qualification is still open — let's confirm before committing to a full response.",
		createdAtMs: SESSION_EPOCH_MS - 3_600_000,
	},
];

/** Reseed the generated TL;DR from the current context (deterministic rotation). */
function reseedGeneratedTldr(context: Readonly<AgentSessionsContextResources>): string[] {
	if (context.tldr.length === 0) return FILLED_TLDR.slice(0, 2);
	const [first, ...rest] = context.tldr;
	return [...rest, first];
}

function reseedGeneratedNextSteps(context: Readonly<AgentSessionsContextResources>): NextStep[] {
	if (context.nextSteps.length === 0) return FILLED_NEXT_STEPS.slice(0, 3);
	const [first, ...rest] = context.nextSteps;
	return [...rest, first];
}

function emptyContextResources(): AgentSessionsContextResources {
	return {
		title: FILLED_TITLE,
		description: "",
		tldr: [],
		nextSteps: [],
		attachments: [],
		subtasks: [],
		linkedItems: [],
	};
}

function filledContextResources(): AgentSessionsContextResources {
	return {
		title: FILLED_TITLE,
		description: FILLED_DESCRIPTION,
		tldr: [...FILLED_TLDR],
		nextSteps: FILLED_NEXT_STEPS.map((step) => ({ ...step })),
		attachments: FILLED_ATTACHMENTS.map((item) => ({ ...item })),
		subtasks: FILLED_SUBTASKS.map((item) => ({ ...item })),
		linkedItems: FILLED_LINKED_ITEMS.map((item) => ({ ...item })),
	};
}

// Seeded agents for preset sessions (kept inline so this module stays pure).
const PRESET_AGENTS: Record<string, AgentSessionAgent> = {
	readiness: { id: "readiness-checker", name: "Readiness Checker", avatarSrc: "/avatar-agent/teamwork-agents/readiness-checker.svg" },
	requirements: { id: "product-requirements-guide", name: "Product Requirements Guide", avatarSrc: "/avatar-agent/teamwork-agents/product-requirements-guide.svg" },
	feedback: { id: "feedback-analyzer", name: "Feedback Analyzer", avatarSrc: "/avatar-agent/product-agents/feedback-analyzer.svg" },
	meeting: { id: "meeting-insights-reporter", name: "Meeting Insights Reporter", avatarSrc: "/avatar-agent/teamwork-agents/meeting-insights-reporter.svg" },
};

// ────────────────────────────────────────────────────────────────────────────
// Presets
// ────────────────────────────────────────────────────────────────────────────

export function createEmptyPresetState(): AgentSessionsState {
	return {
		version: AGENT_SESSIONS_STATE_VERSION,
		preset: "empty",
		contextResources: emptyContextResources(),
		comments: [],
		sessions: [],
		activeSessionId: null,
		composerPrefill: null,
		elapsedMs: 0,
		nextOrder: 0,
		nextIdCounter: 1,
	};
}

export function createFilledPresetState(): AgentSessionsState {
	const completed = instantiateSession({
		id: "preset-session-done",
		order: 0,
		agent: PRESET_AGENTS.meeting,
		scriptId: "risk-review",
		status: "completed",
		cursor: 3,
		startedAtMs: SESSION_EPOCH_MS - 1_800_000,
	});
	return {
		version: AGENT_SESSIONS_STATE_VERSION,
		preset: "filled",
		contextResources: filledContextResources(),
		comments: FILLED_COMMENTS.map((comment) => ({ ...comment })),
		sessions: [completed],
		activeSessionId: null,
		composerPrefill: null,
		elapsedMs: 0,
		nextOrder: 1,
		nextIdCounter: 10,
	};
}

export function createRunningPresetState(): AgentSessionsState {
	const sessions: AgentSession[] = [
		instantiateSession({
			id: "preset-session-1",
			order: 0,
			agent: PRESET_AGENTS.readiness,
			scriptId: "compliance-matrix",
			status: "running",
			cursor: 1,
			startedAtMs: SESSION_EPOCH_MS - 120_000,
		}),
		instantiateSession({
			id: "preset-session-2",
			order: 1,
			agent: PRESET_AGENTS.requirements,
			scriptId: "risk-review",
			status: "running",
			cursor: 0,
			startedAtMs: SESSION_EPOCH_MS - 60_000,
		}),
		instantiateSession({
			id: "preset-session-3",
			order: 2,
			agent: PRESET_AGENTS.feedback,
			scriptId: "pricing-draft",
			status: "waiting",
			cursor: 1,
			startedAtMs: SESSION_EPOCH_MS - 90_000,
		}),
		instantiateSession({
			id: "preset-session-4",
			order: 3,
			agent: PRESET_AGENTS.meeting,
			scriptId: "general-assist",
			status: "completed",
			cursor: 2,
			startedAtMs: SESSION_EPOCH_MS - 300_000,
		}),
	];
	return {
		version: AGENT_SESSIONS_STATE_VERSION,
		preset: "running",
		contextResources: filledContextResources(),
		comments: FILLED_COMMENTS.map((comment) => ({ ...comment })),
		sessions,
		activeSessionId: null,
		composerPrefill: null,
		elapsedMs: 0,
		nextOrder: 4,
		nextIdCounter: 20,
	};
}

export function hydratePreset(preset: AgentSessionsPreset): AgentSessionsState {
	switch (preset) {
		case "empty":
			return createEmptyPresetState();
		case "filled":
			return createFilledPresetState();
		case "running":
			return createRunningPresetState();
		default: {
			const _exhaustive: never = preset;
			return _exhaustive ? createEmptyPresetState() : createEmptyPresetState();
		}
	}
}

/** Alias kept for the presets/tests wiring naming used in the plan. */
export const createInitialExperimentalState = hydratePreset;
