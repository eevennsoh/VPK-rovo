/**
 * Deterministic "Crew" roster for the experimental Agent Sessions metadata rail.
 *
 * Presentation-only fixture (NOT reducer state) for the Crew multi-select, which
 * mixes humans and agents on one work item. People come from the shared
 * assignee/reporter roster (rendered as circle avatars); agents are the
 * `BOARD_AGENTS` that ship an avatar image (rendered as hexagon avatars).
 * Deterministic order, no clock / randomness.
 */

import { METADATA_PEOPLE } from "@/components/blocks/agent-sessions/data/metadata-people";
import { BOARD_AGENTS } from "@/components/projects/jira/data/board-agents";

export interface CrewMember {
	id: string;
	name: string;
	kind: "person" | "agent";
	avatarUrl?: string;
}

/** People (circle avatars) followed by avatar-bearing board agents (hexagon avatars). */
export const CREW_ROSTER: readonly CrewMember[] = [
	...METADATA_PEOPLE.map((person): CrewMember => ({
		id: person.name,
		name: person.name,
		kind: "person",
		avatarUrl: person.avatarUrl,
	})),
	...BOARD_AGENTS.filter((agent) => Boolean(agent.avatarSrc)).map((agent): CrewMember => ({
		id: agent.id,
		name: agent.name,
		kind: "agent",
		avatarUrl: agent.avatarSrc,
	})),
];
