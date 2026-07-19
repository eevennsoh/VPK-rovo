/**
 * Agent Sessions (experimental) — pure state model.
 *
 * This is the deterministic, side-effect-free foundation for the experimental
 * Agent Sessions block. It owns two INDEPENDENT dimensions:
 *   1. context  — derived `empty | filled` (see `selectContextStatus`)
 *   2. session  — per-session `running | waiting | completed`
 *
 * The model is deterministic and side-effect-free: the reducer never touches the
 * clock or randomness (IDs come from `nextIdCounter`, time from `elapsedMs`, and
 * the timer engine `advanceSessions` takes an injected `deltaMs`). The React layer
 * (see `../experimental/use-agent-sessions-controller.ts`) is only a metronome.
 * Seed content lives in `./session-fixtures` and the scripted timelines in
 * `./session-scripts`; behavioral tests load this module via the esbuild CJS
 * loader (see `../agent-sessions.test.js`), which bundles those deps.
 *
 * This prototype model is intentionally SEPARATE from the persisted Jira RFP
 * backend lifecycle (`components/projects/jira/lib/rfp-demo-state.ts`); it follows
 * that lifecycle's status vocabulary only where the concepts line up
 * (`running`/`completed`), and adds `waiting` for the waiting-for-input state that
 * the backend does not model.
 */

import type { WorkItemAttachment, WorkItemChildItem, WorkItemData } from "@/app/contexts/context-work-item-modal";
import type {
	JiraActivityEventIcon,
	JiraActivitySegment,
} from "@/components/blocks/jira-activity";
import type { TagColor } from "@/components/ui/tag";
import {
	advanceAgentPlanner,
	createAgentPlannerState,
	isPlannerProcessing,
	prefillAgentPlannerProposal,
	reduceAgentPlanner,
	seedEmptyMetadataDraft,
	seedMetadataDraft,
	settleAgentPlanner,
	type AgentPlannerAction,
	type AgentPlannerMetadata,
	type AgentPlannerState,
} from "@/components/blocks/agent-sessions/data/planner-state";
import {
	LAUNCH_SCRIPT_ROTATION,
	SESSION_SCRIPTS,
	type AgentSessionScript,
} from "@/components/blocks/agent-sessions/data/session-scripts";
import {
	FILLED_COMMENTS,
	FILLED_STATIC_EVENTS,
	PRESET_AGENTS,
	SESSION_EPOCH_MS,
	emptyContextResources,
	filledContextResources,
	reseedGeneratedNextSteps,
	reseedGeneratedTldr,
} from "@/components/blocks/agent-sessions/data/session-fixtures";

export { countPendingPlannerFields } from "@/components/blocks/agent-sessions/data/planner-state";

export const AGENT_SESSIONS_STATE_VERSION = 1 as const;
/** Metronome cadence used by the React controller and the default timing math. */
export const AGENT_SESSIONS_TICK_MS = 400;

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
	metadata: AgentPlannerMetadata;
	planner: AgentPlannerState;
	comments: AgentSessionComment[];
	sessions: AgentSession[];
	/** Seeded, non-interactive timeline scaffolding (event + changed-files rows). */
	staticEvents: StaticTimelineEvent[];
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

/** Who performed a seeded, static timeline event (person, agent, or connected app). */
export interface StaticTimelineActor {
	id: string;
	name: string;
	kind: "person" | "agent" | "app";
	/** Person photo or 1P agent art under `public/`. */
	avatarSrc?: string;
	/** Third-party brand name for `app` actors (e.g. "github"). */
	brandName?: string;
}

/**
 * A seeded, non-interactive timeline row. These scaffold the filled preset's
 * Activity with the same event and changed-files states the standalone Jira
 * Activity block shows, and flow through `selectActivityEvents` alongside the
 * derived human comments and agent sessions.
 */
export interface StaticEventActivityEvent {
	id: string;
	kind: "event";
	actor: StaticTimelineActor;
	/** Leading event glyph; when omitted the actor avatar is shown instead. */
	icon?: JiraActivityEventIcon;
	segments: readonly JiraActivitySegment[];
	createdAtMs: number;
}

export interface StaticChangedFilesActivityEvent {
	id: string;
	kind: "changed-files";
	actor: StaticTimelineActor;
	summary: string;
	description: string;
	branch?: string;
	tag?: { text: string; color?: TagColor };
	createdAtMs: number;
}

export type StaticTimelineEvent = StaticEventActivityEvent | StaticChangedFilesActivityEvent;

export type ActivityEvent =
	| HumanActivityEvent
	| AgentActivityEvent
	| StaticEventActivityEvent
	| StaticChangedFilesActivityEvent;

export type AddContextResourceAction =
	| { type: "add-context-resource"; kind: "attachment"; item: WorkItemAttachment }
	| { type: "add-context-resource"; kind: "subtask"; item: WorkItemChildItem }
	| { type: "add-context-resource"; kind: "link"; item: ContextLinkedItem };

export type AgentSessionsAction =
	| { type: "hydrate-preset"; preset: AgentSessionsPreset; workItem: WorkItemData }
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
	| { type: "reset"; workItem: WorkItemData }
	| AgentPlannerAction;

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
			return hydratePreset(action.preset, action.workItem);
		case "reset":
			return hydratePreset(state.preset, action.workItem);
		case "tick": {
			const advanced = advanceSessions(state, action.deltaMs);
			const planner = advanceAgentPlanner(advanced.planner, action.deltaMs);
			const next = { ...advanced, planner };
			return isPlannerProcessing(state.planner) && !isPlannerProcessing(planner)
				? prefillAgentPlannerProposal(next)
				: next;
		}
		case "settle-running": {
			const settled = settleRunningSessions(state);
			const planner = settleAgentPlanner(settled.planner);
			const next = { ...settled, planner };
			return isPlannerProcessing(state.planner) && !isPlannerProcessing(planner)
				? prefillAgentPlannerProposal(next)
				: next;
		}
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
		case "accept-planner-field":
		case "dismiss-planner-field":
		case "apply-planner-proposal":
		case "reject-planner-proposal":
		case "refine-planner-proposal":
		case "edit-metadata":
			return reduceAgentPlanner(state, action);
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
	return [...state.staticEvents, ...humanEvents, ...agentEvents].sort((a, b) => a.createdAtMs - b.createdAtMs);
}


// ────────────────────────────────────────────────────────────────────────────
// Presets
// ────────────────────────────────────────────────────────────────────────────

export function createEmptyPresetState(workItem: Readonly<WorkItemData>): AgentSessionsState {
	const contextResources = emptyContextResources();
	return {
		version: AGENT_SESSIONS_STATE_VERSION,
		preset: "empty",
		contextResources: { ...contextResources, title: workItem.title },
		metadata: seedEmptyMetadataDraft(workItem),
		planner: createAgentPlannerState("empty", workItem),
		comments: [],
		sessions: [],
		staticEvents: [],
		activeSessionId: null,
		composerPrefill: null,
		elapsedMs: 0,
		nextOrder: 0,
		nextIdCounter: 1,
	};
}

export function createFilledPresetState(workItem: Readonly<WorkItemData>): AgentSessionsState {
	const completed = instantiateSession({
		id: "preset-session-done",
		order: 0,
		agent: PRESET_AGENTS.meeting,
		scriptId: "risk-review",
		status: "completed",
		cursor: 3,
		startedAtMs: SESSION_EPOCH_MS - 1_800_000,
	});
	const contextResources = filledContextResources();
	return {
		version: AGENT_SESSIONS_STATE_VERSION,
		preset: "filled",
		contextResources: { ...contextResources, title: workItem.title },
		metadata: seedMetadataDraft(workItem),
		planner: createAgentPlannerState("filled", workItem),
		comments: FILLED_COMMENTS.map((comment) => ({ ...comment })),
		sessions: [completed],
		staticEvents: FILLED_STATIC_EVENTS.map((event) => ({ ...event })),
		activeSessionId: null,
		composerPrefill: null,
		elapsedMs: 0,
		nextOrder: 1,
		nextIdCounter: 10,
	};
}

export function createRunningPresetState(workItem: Readonly<WorkItemData>): AgentSessionsState {
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
	const contextResources = filledContextResources();
	return {
		version: AGENT_SESSIONS_STATE_VERSION,
		preset: "running",
		contextResources: { ...contextResources, title: workItem.title },
		metadata: seedMetadataDraft(workItem),
		planner: createAgentPlannerState("running", workItem),
		comments: FILLED_COMMENTS.map((comment) => ({ ...comment })),
		sessions,
		staticEvents: [],
		activeSessionId: null,
		composerPrefill: null,
		elapsedMs: 0,
		nextOrder: 4,
		nextIdCounter: 20,
	};
}

export function hydratePreset(
	preset: AgentSessionsPreset,
	workItem: Readonly<WorkItemData>,
): AgentSessionsState {
	switch (preset) {
		case "empty":
			return createEmptyPresetState(workItem);
		case "filled":
			return createFilledPresetState(workItem);
		case "running":
			return createRunningPresetState(workItem);
		default: {
			const _exhaustive: never = preset;
			return _exhaustive ? createEmptyPresetState(workItem) : createEmptyPresetState(workItem);
		}
	}
}

/** Alias kept for the presets/tests wiring naming used in the plan. */
export const createInitialExperimentalState = hydratePreset;
