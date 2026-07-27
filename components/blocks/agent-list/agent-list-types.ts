import type { ChatSurface } from "@/app/contexts/context-rovo-chat";
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

export interface AgentListItem {
	id: string;
	title: string;
	/** Agent session state — see {@link AgentListState}. */
	state: AgentListState;
	/** The agent working the session; rendered in the leading avatar. */
	agent: AgentListAgent;
	/** Feature branch the agent is working on. */
	branch: string;
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
}

export interface AgentListProps {
	className?: string;
	/** Chat surface opened after an Agent States composer submission. */
	composerChatSurface?: ChatSurface;
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
