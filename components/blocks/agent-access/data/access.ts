import type { ComponentType, ReactNode } from "react";

import {
	ConfluenceIcon,
	JiraIcon,
	JiraServiceManagementIcon,
} from "@/components/ui/logo";

/**
 * Which permissions an agent uses when calling tools / reading knowledge.
 * - `requesting-user`: acts on behalf of the triggering user (least privilege).
 * - `agent-account`: uses its own app access configured in Atlassian admin.
 */
export type AgentAccessMode = "requesting-user" | "agent-account";

export interface AgentAccessOption {
	value: AgentAccessMode;
	title: string;
	description: string;
}

export const AGENT_ACCESS_OPTIONS: readonly AgentAccessOption[] = [
	{
		value: "requesting-user",
		title: "Requesting user",
		description:
			"The agent acts on behalf of the user who triggered it. The agent can only access what the requesting user has access to and the agent will ask for permission before using tools in Rovo Chat.",
	},
	{
		value: "agent-account",
		title: "Agent account",
		description:
			"The agent will use its own app access and permissions which is configured in Atlassian Administration.",
	},
] as const;

export type AtlassianAppAccessState = "granted" | "denied";

export interface AtlassianAppAccess {
	id: string;
	name: string;
	/** Product icon, rendered at `size="small"`. */
	icon: ComponentType<{ label?: string; size?: "small" }>;
	access: AtlassianAppAccessState;
}

export const DEFAULT_ATLASSIAN_APP_ACCESS: readonly AtlassianAppAccess[] = [
	{ id: "confluence", name: "Confluence", icon: ConfluenceIcon, access: "granted" },
] as const;

export const SAMPLE_ATLASSIAN_APP_ACCESS: readonly AtlassianAppAccess[] = [
	{ id: "confluence", name: "Confluence", icon: ConfluenceIcon, access: "granted" },
	{ id: "jira", name: "Jira", icon: JiraIcon, access: "granted" },
	{
		id: "jsm",
		name: "Jira Service Management",
		icon: JiraServiceManagementIcon,
		access: "denied",
	},
] as const;

export interface ConnectedApp {
	id: string;
	name: string;
	icon?: ReactNode;
}
