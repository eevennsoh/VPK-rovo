/**
 * Deterministic Agents roster for the experimental Jira Work Item metadata rail.
 *
 * Presentation-only fixture (NOT reducer state) for the Agents multi-select.
 * Agents come from `BOARD_AGENTS` and render as hexagon avatars. The legacy
 * person entries remain in the shared roster type for persisted-state compatibility.
 * Deterministic order, no clock / randomness.
 */

import { METADATA_PEOPLE } from "@/components/blocks/jira-work-item/data/metadata-people";
import { BOARD_AGENTS } from "@/components/projects/jira/data/board-agents";
import type { ThirdPartyLogoName } from "@/components/ui/data/logo-third-party-data";

export interface CrewMember {
	id: string;
	name: string;
	kind: "person" | "agent";
	avatarUrl?: string;
	brandName?: ThirdPartyLogoName;
}

/** People (circle avatars) followed by avatar-bearing board agents (hexagon avatars). */
export const CREW_ROSTER: readonly CrewMember[] = [
	...METADATA_PEOPLE.map((person): CrewMember => ({
		id: person.name,
		name: person.name,
		kind: "person",
		avatarUrl: person.avatarUrl,
	})),
	...BOARD_AGENTS.filter((agent) => Boolean(agent.avatarSrc || agent.brandName)).map((agent): CrewMember => ({
		id: agent.id,
		name: agent.name,
		kind: "agent",
		avatarUrl: agent.avatarSrc,
		brandName: agent.brandName,
	})),
];
