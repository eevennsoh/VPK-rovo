import type { ChatSurface } from "@/app/contexts/context-rovo-chat";
import type { JiraSidebarSessionItem } from "@/components/blocks/product-sidebar/variants/jira";
import type { ThirdPartyLogoName } from "@/components/ui/data/logo-third-party-data";

/**
 * Lifecycle of an agent working a Jira work item. Drives the title/status
 * treatment (shimmer, animated dots, or none) and which row actions appear.
 */
export type AgentListState = "running" | "complete" | "needs-input";

/** Pull-request status shown in the metadata row, when a PR exists. */
export type AgentListPrStatus = "created" | "merged";

/** Visual density for Jira agent-session rows. */
export type AgentListVariant = "default" | "compact";

/**
 * Which hover/focus flyout a session row opens.
 *
 * - `session` (default) — the shared Jira agent-session flyout, the same rich
 *   work item / agent / development summary the live Jira sidebar renders. Read
 *   only, and shared across the whole list via one payload handle.
 * - `composer` — the per-row Agent States card, which adds a prompt composer so
 *   the viewer can reply to the agent without leaving the list.
 */
export type AgentListFlyout = "session" | "composer";

export interface AgentListAgent {
	/** Canonical directory identity used by agent-state flyouts and all agent surfaces. */
	id?: string;
	/** Display name, shown as the avatar label and the metadata-row label. */
	name: string;
	/** Absolute path to the agent avatar SVG under `public/`. */
	avatarSrc?: string;
	/** Canonical VPK product mark used for platform-owned runners such as Rovo. */
	vpkLogo?: "rovo";
	/** Third-party brand mark rendered inside the shared hexagonal agent avatar. */
	brandName?: ThirdPartyLogoName;
}

/** Person who started the session (prompt author), shown as `by <avatar>` in metadata. */
export interface AgentListInvoker {
	name: string;
	/** Absolute path to a human face avatar under `public/`. */
	avatarSrc?: string;
}

/**
 * Flyout-only session metadata that a session row cannot derive from itself —
 * work item, repository, pull request, checks, and worktree details. Identity
 * (`id`, `title`, agent, lifecycle `status`) is always owned by the row and is
 * therefore not overridable here; see `toAgentSessionFlyoutItem`.
 */
export type AgentListSessionDetails = Partial<
	Omit<
		JiraSidebarSessionItem,
		"agentAvatarSrc" | "agentName" | "id" | "status" | "title"
	>
>;

export interface AgentListItem {
	id: string;
	title: string;
	/** Agent session state — see {@link AgentListState}. */
	state: AgentListState;
	/** The agent working the session; rendered in the leading avatar. */
	agent: AgentListAgent;
	/** Feature branch the agent is working on. */
	branch: string;
	/** Human (or upstream actor) who invoked the session via the opening prompt. */
	invokedBy?: AgentListInvoker;
	/** Initial runtime shown by expanded activity cards, which tick while active. */
	elapsedSeconds?: number;
	/** Stable start time for live runtimes when supplied by real session data. */
	startedAtMs?: number;
	/** Completion/message time used once the session stops progressing. */
	completedAtMs?: number;
	/** Demo-friendly completion age that continues advancing after mount. */
	completedSecondsAgo?: number;
	/**
	 * Pull-request status. Omit while the agent is still working pre-PR or
	 * waiting for input; the metadata row still identifies the agent.
	 */
	prStatus?: AgentListPrStatus;
	/**
	 * Extra work-item and development metadata surfaced by the hover flyout.
	 * Anything omitted is derived from the row — see `toAgentSessionFlyoutItem`.
	 */
	sessionDetails?: AgentListSessionDetails;
}

export interface AgentListProps {
	className?: string;
	/** Chat surface opened after an Agent States composer submission. */
	composerChatSurface?: ChatSurface;
	/** Which flyout a row opens on hover or keyboard focus. Defaults to `session`. */
	flyout?: AgentListFlyout;
	/** Session rows to render; defaults to built-in sample data. */
	items?: readonly AgentListItem[];
	/** Id of the session currently selected by the consuming surface. */
	selectedItemId?: string;
	/** Row density; compact uses a 24px avatar and 12px title. */
	variant?: AgentListVariant;
	/** Called when a row body or its View action is activated. */
	onView?: (item: AgentListItem) => void;
	/** Overrides the default chat destination for Agent States composer submissions. */
	onSubmitPrompt?: (item: AgentListItem, prompt: string) => Promise<void> | void;
}
