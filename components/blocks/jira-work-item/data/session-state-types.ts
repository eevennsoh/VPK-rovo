/**
 * Jira Work Item (experimental) — state model types.
 *
 * The type surface for the pure state model in `./session-state`: session and
 * activity shapes, the reducer's action union, and the supporting unions they
 * are built from. Split out so the engine module (reducer, timer, selectors,
 * preset builders) stays scannable; `./session-state` re-exports everything
 * here, so importers keep using that single entry point.
 */

import type { WorkItemAttachment, WorkItemChildItem, WorkItemData } from "@/app/contexts/context-work-item-modal";
import type {
	JiraActivityEventEntry,
	JiraActivityEventIcon,
	JiraActivitySegment,
} from "@/components/blocks/jira-activity";
import type { AgentListItem } from "@/components/blocks/agent-list";
import type { ArtifactListItem } from "@/components/ui-custom/artifact-list";
import type { ThirdPartyLogoName } from "@/components/ui/data/logo-third-party-data";
import type { TagColor } from "@/components/ui/tag";
import type {
	AgentPlannerAction,
	AgentPlannerMetadata,
	AgentPlannerState,
} from "@/components/blocks/jira-work-item/data/planner-state";

export type AgentSessionStatus = "running" | "waiting" | "completed";
export type JiraWorkItemContextStatus = "empty" | "filled";
export type JiraWorkItemPreset = "blank" | "empty" | "filled" | "running";
export type JiraWorkItemComposerDelivery = "comment" | "broadcast-active-agents";
export type AgentSessionEventRole = "human" | "agent";
export type AgentSessionStepStatus = "complete" | "active" | "pending";
export type AgentSessionInvocationSource = "context-pill" | "prompt";
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
	description?: string;
	type: LinkedWorkItemType;
	relationship: RelationshipOption;
	assignee?: string;
	assigneeAvatarUrl?: string;
	priority?: WorkItemChildItem["priority"];
	status?: WorkItemChildItem["status"];
}

export interface AgentSessionAgent {
	id: string;
	name: string;
	avatarSrc?: string;
	brandName?: ThirdPartyLogoName;
}

export type AgentSessionWaitingOn =
	| { kind: "user" }
	| {
		kind: "agent";
		agentId: string;
		agentName: string;
		agentAvatarSrc?: string;
	};

export interface AgentSessionThreadReply {
	id: string;
	/** Present when the reply was derived from a concrete agent session event. */
	sessionId?: string;
	agentId: string;
	agentName: string;
	agentAvatarSrc?: string;
	agentBrandName?: ThirdPartyLogoName;
	content: string;
	createdAtMs: number;
}

export interface AgentSessionReaction {
	emoji: string;
	actorIds: readonly string[];
}

export interface AgentSessionProgressItem {
	id: string;
	label: string;
	completed: boolean;
}

export interface AgentSessionImageAttachment {
	src: string;
	alt: string;
	filename: string;
	href?: string;
}

export interface HumanActivityThreadReply {
	id: string;
	authorName: string;
	authorAvatarSrc?: string;
	content: string;
	createdAtMs: number;
}

export interface AgentSession {
	id: string;
	agentId: string;
	agentName: string;
	agentAvatarSrc?: string;
	agentBrandName?: ThirdPartyLogoName;
	/** Activity-card title for explicitly invoked sessions. Presets use the script title. */
	title?: string;
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
	/** Optional owner of a waiting checkpoint. Older fixtures default to the user. */
	waitingOn?: AgentSessionWaitingOn;
	/** Authored agent-to-agent handoffs rendered as replies beneath the activity card. */
	threadReplies?: readonly AgentSessionThreadReply[];
	/** Scripted progress that an agent updates in place on its lead activity comment. */
	progressChecklist?: readonly AgentSessionProgressItem[];
	/** Optional visual proof attached to the agent's lead activity comment. */
	imageAttachment?: AgentSessionImageAttachment;
}

export interface AgentSessionComment {
	id: string;
	authorName: string;
	authorAvatarSrc?: string;
	content: string;
	createdAtMs: number;
	/** Seeded reactions, typically active agents acknowledging a channel prompt. */
	reactions?: readonly AgentSessionReaction[];
	/** Authored colleague replies rendered beneath the channel comment. */
	threadReplies?: readonly HumanActivityThreadReply[];
}

export interface JiraWorkItemContextResources {
	title: string;
	description: string;
	tldr: string[];
	nextSteps: NextStep[];
	attachments: WorkItemAttachment[];
	subtasks: WorkItemChildItem[];
	linkedItems: ContextLinkedItem[];
}

export interface JiraWorkItemState {
	version: 1;
	preset: JiraWorkItemPreset;
	contextResources: JiraWorkItemContextResources;
	metadata: AgentPlannerMetadata;
	planner: AgentPlannerState;
	comments: AgentSessionComment[];
	sessions: AgentSession[];
	/** Stored timeline rows: preset scaffolding plus accepted planner suggestions. */
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
	reactions?: readonly AgentSessionReaction[];
	threadReplies?: readonly HumanActivityThreadReply[];
}

export interface AgentActivityEvent {
	id: string;
	kind: "agent";
	sessionId: string;
	agentId: string;
	agentName: string;
	agentAvatarSrc?: string;
	agentBrandName?: ThirdPartyLogoName;
	status: AgentSessionStatus;
	title: string;
	branch: string;
	elapsedSeconds: number;
	commandPreview: string;
	responsePreview?: string;
	createdAtMs: number;
	/**
	 * Opening prompt author from `session.messages` (`role: "human"`).
	 * Activity cards render this as `by <avatar>` after the relative timestamp.
	 */
	invokedBy?: {
		name: string;
		avatarSrc?: string;
	};
	waitingOn?: AgentSessionWaitingOn;
	threadReplies?: readonly AgentSessionThreadReply[];
	progressChecklist?: readonly AgentSessionProgressItem[];
	imageAttachment?: AgentSessionImageAttachment;
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
 * A stored, non-interactive timeline row. Presets use these to scaffold the
 * same event and changed-files states the standalone Jira Activity block shows;
 * planner actions also append accepted suggestion events. They flow through
 * `selectActivityEvents` alongside derived human comments and agent sessions.
 */
export interface StaticEventActivityEvent {
	id: string;
	kind: "event";
	actor: StaticTimelineActor;
	/** Leading event glyph; when omitted the actor avatar is shown instead. */
	icon?: JiraActivityEventIcon;
	/** Hide the leading actor name for event content represented by its own tags. */
	showActor?: boolean;
	/** Hide the relative timestamp for event content that is intentionally self-contained. */
	showTimestamp?: boolean;
	segments: readonly JiraActivitySegment[];
	/** Optional compact pull-request metadata shown in place of the action line (mirrors the Jira Activity design). */
	pullRequest?: JiraActivityEventEntry["pullRequest"];
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
	sessionItem?: AgentListItem;
	outputs?: readonly ArtifactListItem[];
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

export type JiraWorkItemAction =
	| { type: "hydrate-preset"; preset: JiraWorkItemPreset; workItem: WorkItemData }
	| { type: "hydrate-state"; state: JiraWorkItemState }
	| { type: "launch-session"; agentId: string; agentName: string; agentAvatarSrc?: string; agentBrandName?: ThirdPartyLogoName; command?: string; title?: string }
	| {
		type: "invoke-agent";
		source: AgentSessionInvocationSource;
		agentId: string;
		agentName: string;
		agentAvatarSrc?: string;
		agentBrandName?: ThirdPartyLogoName;
		command?: string;
	}
	| { type: "tick"; deltaMs: number }
	| { type: "settle-running" }
	| { type: "reply-session"; sessionId: string; text: string }
	| { type: "add-comment"; text: string; authorName?: string; authorAvatarSrc?: string }
	| { type: "broadcast-comment"; text: string; authorName?: string; authorAvatarSrc?: string }
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
