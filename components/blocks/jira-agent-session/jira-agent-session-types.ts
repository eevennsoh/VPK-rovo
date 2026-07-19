import type { ReactNode } from "react";

import type { TagColor } from "@/components/ui/tag";

/**
 * Lifecycle of an agent working a Jira work item. Drives the title/status
 * treatment (shimmer, animated dots, or none) and which row actions appear.
 */
export type JiraAgentSessionState = "running" | "complete" | "needs-input";

/** Pull-request status shown in the metadata row, when a PR exists. */
export type JiraAgentSessionPrStatus = "created" | "merged";

export interface JiraAgentSessionAgent {
	/** Display name, shown as the avatar label and the metadata-row label. */
	name: string;
	/** Absolute path to the agent avatar SVG under `public/`. */
	avatarSrc: string;
}

export interface JiraAgentSessionItem {
	id: string;
	title: string;
	/** Agent session state — see {@link JiraAgentSessionState}. */
	state: JiraAgentSessionState;
	/** The agent working the session; rendered as the 32px leading avatar. */
	agent: JiraAgentSessionAgent;
	/** Feature branch the agent is working on. */
	branch: string;
	/** Initial runtime shown by expanded activity cards, which tick while active. */
	elapsedSeconds?: number;
	/**
	 * Pull-request status. Omit while the agent is still working pre-PR or
	 * awaiting user input; the metadata row then shows only the branch.
	 */
	prStatus?: JiraAgentSessionPrStatus;
}

export interface JiraAgentSessionProps {
	className?: string;
	/** Session rows to render; defaults to built-in sample data. */
	items?: readonly JiraAgentSessionItem[];
	/** Called when a row body or its View action is activated. */
	onView?: (item: JiraAgentSessionItem) => void;
	/** Called when the Stop action on a running row is activated. */
	onStop?: (item: JiraAgentSessionItem) => void;
}

export interface JiraAgentSessionActivityCardProps {
	/** Session summary shown as the rich activity-card header. */
	item?: JiraAgentSessionItem;
	/** Agent name shown in the activity-card header. */
	agentName?: string;
	/** Relative activity timestamp shown beside the agent name. */
	timestamp?: string;
	/** Optional status tag shown in the activity-card header. */
	tag?: { text: string; color?: TagColor };
	/** Optional trailing header action supplied by the consuming surface. */
	action?: ReactNode;
	/** Called when the rich activity header's View button is activated. */
	onView?: (item: JiraAgentSessionItem) => void;
	/** Main agent response rendered inside the card. */
	children: ReactNode;
	/** Optional expandable supporting detail, such as a prompt or investigation. */
	details?: { label: string; children: ReactNode };
	/** Optional rendered replies shown below the agent response. */
	replies?: ReactNode;
	/** Optional reply composer shown at the bottom of the card. */
	replyComposer?: ReactNode;
	className?: string;
}
