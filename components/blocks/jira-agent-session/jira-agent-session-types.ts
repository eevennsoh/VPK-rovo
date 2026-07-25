import type { ThirdPartyLogoName } from "@/components/ui/data/logo-third-party-data";

/**
 * Lifecycle of an agent working a Jira work item. Drives the title/status
 * treatment (shimmer, animated dots, or none) and which row actions appear.
 */
export type JiraAgentSessionState = "running" | "complete" | "needs-input";

/** Pull-request status shown in the metadata row, when a PR exists. */
export type JiraAgentSessionPrStatus = "created" | "merged";

/** Visual density for Jira agent-session rows. */
export type JiraAgentSessionVariant = "default" | "compact";

export interface JiraAgentSessionAgent {
	/** Canonical directory identity used by profile previews and all agent surfaces. */
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

export interface JiraAgentSessionItem {
	id: string;
	title: string;
	/** Agent session state — see {@link JiraAgentSessionState}. */
	state: JiraAgentSessionState;
	/** The agent working the session; rendered in the leading avatar. */
	agent: JiraAgentSessionAgent;
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
	prStatus?: JiraAgentSessionPrStatus;
}

export interface JiraAgentSessionProps {
	className?: string;
	/** Session rows to render; defaults to built-in sample data. */
	items?: readonly JiraAgentSessionItem[];
	/** Id of the session currently selected by the consuming surface. */
	selectedItemId?: string;
	/** Row density; compact uses a 24px avatar and 12px title. */
	variant?: JiraAgentSessionVariant;
	/** Called when a row body or its View action is activated. */
	onView?: (item: JiraAgentSessionItem) => void;
}
