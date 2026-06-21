import AiChatIcon from "@atlaskit/icon/core/ai-chat";

import type { AgentBrowserAgent, AgentBrowserSidebarGroup } from "@/components/blocks/agent-browser";
import type { AgentSelectorAgent } from "@/components/blocks/agent-selector";
import { ROVO_LOGO_DATA_URI } from "@/components/ui/data/rovo-logo";
import type { RovoSuggestion } from "@/lib/rovo-suggestions";

import agentsData from "./agents.json";
import subagentsData from "./subagents.json";
import type { DirectoryVisual } from "./types";
import { avatarVisualFromSrc } from "./visual";

/**
 * Unified agents data layer — the single source of truth for every agent surface
 * in the app (Rovo chat selector, the Agent Directory, and the editor
 * palette's `/` subagent references). It merges the two former catalogs:
 *
 *   - `components/projects/{studio,rovo}/data/agent-profiles.ts`
 *     (`ROVO_AGENT_PROFILES` — the larger, richer catalog + its derivations)
 *   - `components/blocks/agent-browser/data/demo-agents.ts`
 *     (`DEMO_AGENT_BROWSER_AGENTS` + `DEMO_AGENT_BROWSER_SIDEBAR_GROUPS`)
 *
 * MERGE RULE: unified by agent `id`. Where an id existed in both sources, the
 * Studio (`ROVO_AGENT_PROFILES`) display fields win (name, byline, avatarSrc,
 * description); the agent-browser entry only contributes the fields Studio
 * lacks — `attributionKind` and `favorite`. All 11 agent-browser ids exist in
 * Studio (no browser-only agents), so the unified catalog is the 21 Studio
 * agents, in Studio source order (order is parity-critical for the selector and
 * directory derivations below).
 *
 * MERGED FIELD SET (`agents.json`):
 *   - id            — stable identifier, unique across the catalog
 *   - name          — display name (Studio value)
 *   - byline        — attribution line (Studio value)
 *   - avatarSrc?    — avatar image path, or the `__ROVO_LOGO_DATA_URI__` sentinel
 *                     for Rovo Dev (rehydrated to the real data URI on load)
 *   - logoName?     — ADS brand logo name; renders instead of `avatarSrc`
 *   - description?  — one-line description (Studio value)
 *   - attributionKind? — "company" | "team" | "person" (from agent-browser)
 *   - favorite?     — directory favourite flag (from agent-browser)
 *   - starters?     — explicit starter overrides; absent means "derive defaults"
 *                     (Rovo Dev = none; AI Insights Agent = custom list)
 */

export const ROVO_AGENT_ID = "rovo-dev";
export const AI_INSIGHTS_AGENT_ID = "ai-insights-agent";

/** Sentinel stored in JSON for Rovo Dev's avatar, swapped for the real data URI. */
const ROVO_LOGO_SENTINEL = "__ROVO_LOGO_DATA_URI__";

/**
 * A starter as authored in `agents.json` — the JSON cannot hold the live
 * `icon` React component, so starters store `id`/`label`/optional `prompt`
 * only; {@link createStarter} rehydrates them into runtime {@link RovoSuggestion}s.
 */
interface AgentStarterSeed {
	id: string;
	label: string;
	prompt?: string;
	description?: string;
}

/**
 * JSON-serializable shape of a unified agent record (`agents.json`). The runtime
 * {@link RovoAgentProfile} is derived from this via {@link createProfile}.
 */
interface UnifiedAgentRecord {
	id: string;
	name: string;
	byline: string;
	avatarSrc?: string;
	logoName?: AgentSelectorAgent["logoName"];
	brandName?: AgentSelectorAgent["brandName"];
	description?: string;
	attributionKind?: AgentBrowserAgent["attributionKind"];
	favorite?: boolean;
	rating?: number;
	feedbackCount?: number;
	chatCount?: number;
	verified?: boolean;
	starters?: readonly AgentStarterSeed[];
}

/** A subagent reference (`subagents.json`) — a curated pointer into the catalog. */
interface SubagentRecord {
	agentId: string;
}

const UNIFIED_AGENTS = agentsData as readonly UnifiedAgentRecord[];
const SUBAGENTS = subagentsData as readonly SubagentRecord[];

export interface RovoAgentProfile extends AgentSelectorAgent {
	description?: string;
	starters: readonly RovoSuggestion[];
	contextDescription?: string;
	/** Salvaged from the agent-browser directory; used for verification/badging. */
	attributionKind?: AgentBrowserAgent["attributionKind"];
	/** Salvaged from the agent-browser directory; surfaced as a directory favourite. */
	favorite?: boolean;
	rating?: number;
	feedbackCount?: number;
	chatCount?: number;
	verified?: boolean;
}

const EMPTY_STARTERS: readonly RovoSuggestion[] = [];

// --- Re-homed VERBATIM from agent-profiles.ts (runtime derivation helpers) ---

function createStarter(id: string, label: string, prompt = label, description?: string): RovoSuggestion {
	return {
		id,
		label,
		description,
		prompt,
		icon: AiChatIcon,
		type: "skill",
	};
}

function createDefaultStarters(agentId: string, agentName: string): readonly RovoSuggestion[] {
	return [
		createStarter(`${agentId}-overview`, `Ask ${agentName} for an overview`, undefined, `Get a quick summary of what ${agentName} can do`),
		createStarter(`${agentId}-summary`, `Summarize this with ${agentName}`, undefined, `Have ${agentName} condense the current context`),
		createStarter(`${agentId}-next-steps`, `Get ${agentName}'s recommended next steps`, undefined, `Ask ${agentName} what to do next`),
	];
}

function createAgentContext(params: {
	byline: string;
	description?: string;
	name: string;
}): string {
	return [
		"[Selected custom agent]",
		`Agent: ${params.name}`,
		`Byline: ${params.byline}`,
		params.description ? `Description: ${params.description}` : null,
		"Answer as this selected agent while using the existing Rovo chat capabilities and available context.",
		"[End selected custom agent]",
	]
		.filter((line): line is string => Boolean(line))
		.join("\n");
}

function createProfile(params: Omit<RovoAgentProfile, "contextDescription" | "starters"> & {
	contextDescription?: string;
	starters?: readonly RovoSuggestion[];
}): RovoAgentProfile {
	const starters = params.starters ?? createDefaultStarters(params.id, params.name);
	const contextDescription = params.id === ROVO_AGENT_ID
		? undefined
		: params.contextDescription ?? createAgentContext({
				byline: params.byline,
				description: params.description,
				name: params.name,
			});

	return {
		...params,
		contextDescription,
		starters,
	};
}

// --- Catalog construction from the unified JSON ---

/** Rehydrates a JSON agent record's `avatarSrc` sentinel + starter seeds. */
function toAgentProfile(record: UnifiedAgentRecord): RovoAgentProfile {
	const avatarSrc = record.avatarSrc === ROVO_LOGO_SENTINEL
		? ROVO_LOGO_DATA_URI
		: record.avatarSrc;

	// A record with no `starters` key derives the default starters; an explicit
	// `[]` (Rovo Dev) stays empty; a custom list is rehydrated as-is.
	const starters = record.starters === undefined
		? undefined
		: record.starters.length === 0
			? EMPTY_STARTERS
			: record.starters.map((starter) =>
					createStarter(starter.id, starter.label, starter.prompt ?? starter.label, starter.description),
				);

	return createProfile({
		id: record.id,
		name: record.name,
		byline: record.byline,
		avatarSrc,
		logoName: record.logoName,
		brandName: record.brandName,
		description: record.description,
		attributionKind: record.attributionKind,
		favorite: record.favorite,
		rating: record.rating,
		feedbackCount: record.feedbackCount,
		chatCount: record.chatCount,
		verified: record.verified,
		starters,
	});
}

/**
 * The complete unified agent catalog. Mirrors the former
 * `ROVO_AGENT_PROFILES` — same shape, same order — now sourced from
 * `agents.json` as the single source of truth.
 */
export const ROVO_AGENT_PROFILES: readonly RovoAgentProfile[] =
	UNIFIED_AGENTS.map(toAgentProfile);

export const ROVO_AGENT_PROFILE_BY_ID = new Map(
	ROVO_AGENT_PROFILES.map((agent) => [agent.id, agent]),
);

// The Agent Directory lists addable agents only. Rovo Dev is the
// built-in platform default (not a custom agent you add), so it is excluded
// here while remaining in ROVO_AGENT_PROFILES for default-agent lookups.
export const ROVO_DIRECTORY_AGENT_PROFILES: readonly RovoAgentProfile[] = ROVO_AGENT_PROFILES
	.filter((agent) => agent.id !== ROVO_AGENT_ID);

export const ROVO_AGENT_SELECTOR_AGENTS: readonly AgentSelectorAgent[] = ROVO_AGENT_PROFILES
	.filter((agent) => agent.id !== ROVO_AGENT_ID)
	.map((agent) => ({
		id: agent.id,
		name: agent.name,
		byline: agent.byline,
		avatarSrc: agent.avatarSrc,
		brandName: agent.brandName,
	}));

export const ROVO_CUSTOM_AGENT_SELECTOR_AGENTS: readonly AgentSelectorAgent[] = ROVO_AGENT_SELECTOR_AGENTS;

export function getRovoAgentProfile(agentId: string): RovoAgentProfile {
	const fallbackAgent = ROVO_AGENT_PROFILE_BY_ID.get(ROVO_AGENT_ID);
	if (!fallbackAgent) {
		throw new Error("Missing default Rovo agent profile.");
	}

	return ROVO_AGENT_PROFILE_BY_ID.get(agentId) ?? fallbackAgent;
}

export function isRovoAgentProfile(agent: Pick<RovoAgentProfile, "id"> | null | undefined): boolean {
	return agent?.id === ROVO_AGENT_ID;
}

export function getRovoAgentPromptContext(agent: RovoAgentProfile): string | undefined {
	return isRovoAgentProfile(agent) ? undefined : agent.contextDescription;
}

// --- agent-browser directory shape ---

/**
 * Projects a unified agent profile onto the {@link AgentBrowserAgent} shape used
 * by the Agent Directory and the editor palette's subagent references.
 */
function toAgentBrowserAgent(agent: RovoAgentProfile): AgentBrowserAgent {
	return {
		id: agent.id,
		name: agent.name,
		byline: agent.byline,
		attributionKind: agent.attributionKind,
		avatarSrc: agent.avatarSrc,
		logoName: agent.logoName,
		brandName: agent.brandName,
		description: agent.description,
		favorite: agent.favorite,
		rating: agent.rating,
		feedbackCount: agent.feedbackCount,
		chatCount: agent.chatCount,
		verified: agent.verified,
	};
}

/**
 * The agent-browser directory catalog. Replaces the former
 * `DEMO_AGENT_BROWSER_AGENTS`; sourced from the unified catalog and ordered to
 * match the curated subagent selection (which preserved the original directory
 * order) followed by any remaining directory agents.
 */
export const DEMO_AGENT_BROWSER_AGENTS: readonly AgentBrowserAgent[] = (() => {
	const ordered: AgentBrowserAgent[] = [];
	const seen = new Set<string>();

	for (const { agentId } of SUBAGENTS) {
		const agent = ROVO_AGENT_PROFILE_BY_ID.get(agentId);
		if (agent && !seen.has(agent.id)) {
			ordered.push(toAgentBrowserAgent(agent));
			seen.add(agent.id);
		}
	}

	return ordered;
})();

/**
 * Sidebar groups for the Agent Directory. SALVAGED VERBATIM from the
 * former `components/blocks/agent-browser/data/demo-agents.ts` — this curated
 * grouping (teams + companies) has no equivalent in the agent profiles and would
 * be lost in the unification otherwise.
 */
export const DEMO_AGENT_BROWSER_SIDEBAR_GROUPS: readonly AgentBrowserSidebarGroup[] = [
	{
		title: "By teams",
		showAll: true,
		items: [
			{
				id: "product-experience",
				label: "Product Experience",
				avatarSrc: "/avatar-project/compass.svg",
			},
			{
				id: "platform-engineering",
				label: "Platform Engineering",
				avatarSrc: "/avatar-project/code.svg",
			},
			{
				id: "customer-success",
				label: "Customer Success",
				avatarSrc: "/avatar-project/service-bell.svg",
			},
			{
				id: "revenue-operations",
				label: "Revenue Operations",
				avatarSrc: "/avatar-project/graph.svg",
			},
		],
	},
	{
		title: "By companies",
		showAll: true,
		agentIds: ["google-drive", "github-copilot", "slack", "notion"],
	},
];

/**
 * The curated subagent catalog surfaced by the editor palette's `/` subagent
 * reference category. Subagents are conceptually identical to agents here, so
 * this resolves the `subagents.json` id references against the unified catalog
 * rather than holding a second copy of agent data.
 */
export const DIRECTORY_SUBAGENTS: readonly AgentBrowserAgent[] = DEMO_AGENT_BROWSER_AGENTS;

// --- Directory mention visual ---

/**
 * Derives the JSON-serializable mention-token visual for an agent. Mirrors
 * `getAgentVisual` in `components/blocks/editor-palette/data/mention-sources.ts`:
 * a `logoName` renders the ADS brand logo; an `/avatar-agent/` path renders a
 * hexagon avatar; a `/avatar-project/` path renders a square avatar; any other
 * path renders a square image. Returns `undefined` when the agent has neither a
 * logo nor an avatar.
 */
export function getAgentDirectoryVisual(
	agent: Pick<AgentBrowserAgent, "avatarSrc" | "logoName" | "brandName">,
): DirectoryVisual | undefined {
	return avatarVisualFromSrc(agent.logoName, agent.avatarSrc, agent.brandName);
}
