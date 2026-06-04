/**
 * Types and sample data for the agent Users screen — manage who has access to a
 * Rovo agent and the role that determines their permissions.
 */

export type AgentUserRole = "manager" | "editor" | "user";

export interface AgentRoleOption {
	value: AgentUserRole;
	label: string;
	description: string;
}

export interface AgentPerson {
	id: string;
	name: string;
	avatarSrc?: string;
	/** Owner is surfaced as a lozenge next to the name and can't be removed. */
	isOwner?: boolean;
	role: AgentUserRole;
}

/** Roles a person can hold on an agent, in descending order of permission. */
export const AGENT_ROLE_OPTIONS: readonly AgentRoleOption[] = [
	{
		value: "manager",
		label: "Manager",
		description: "Permission to edit or delete the agent and invite collaborators.",
	},
	{
		value: "editor",
		label: "Editor",
		description: "Permission to edit the agent's configuration but not delete it.",
	},
	{
		value: "user",
		label: "User",
		description: "Permission to use the agent but not change its configuration.",
	},
] as const;

export const DEFAULT_AGENT_ROLE: AgentUserRole = "manager";

export function getRoleOption(role: AgentUserRole): AgentRoleOption {
	return AGENT_ROLE_OPTIONS.find((option) => option.value === role) ?? AGENT_ROLE_OPTIONS[0];
}

const SAMPLE_AVATAR_SRC =
	"https://api.dicebear.com/9.x/glass/svg?seed=Ee%20Venn%20Soh";

/** A single owner/manager — mirrors the default state of a freshly created agent. */
export const SAMPLE_AGENT_PEOPLE: readonly AgentPerson[] = [
	{
		id: "u-owner",
		name: "Ee Venn Soh",
		avatarSrc: SAMPLE_AVATAR_SRC,
		isOwner: true,
		role: "manager",
	},
] as const;

export const SAMPLE_AGENT_OWNER: AgentPerson = SAMPLE_AGENT_PEOPLE[0];
