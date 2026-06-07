import teamsData from "./teams.json";
import type { DirectoryVisual } from "./types";

/**
 * Teams directory data layer. This module owns the canonical `DirectoryTeam`
 * interface and sources its catalog from `teams.json` as the single source of
 * truth, matching the loader pattern used by `skills.ts` and `people.ts`.
 */

export interface DirectoryTeam {
	id: string;
	name: string;
	description: string;
	/** Square project-avatar asset under `/public/avatar-project/`. */
	avatarSrc: string;
	memberCount: number;
}

/**
 * The complete teams directory catalog, sourced from `teams.json` as the single
 * source of truth. The JSON is structurally a `DirectoryTeam[]`; we assert the
 * type here so callers get full typing without the loader re-declaring the data
 * inline.
 */
export const DEMO_TEAMS: readonly DirectoryTeam[] =
	teamsData as readonly DirectoryTeam[];

/** Convenience lookup for sidebar references. */
export function getTeamById(
	teams: readonly DirectoryTeam[],
	id: string,
): DirectoryTeam | undefined {
	return teams.find((team) => team.id === id);
}

/**
 * Derives the JSON-serializable mention-token visual for a team. Teams render as
 * square avatars (matching the company-logo convention) so composer/editor
 * surfaces can rehydrate them via `resolveDirectoryVisual`.
 */
export function getTeamDirectoryVisual(team: DirectoryTeam): DirectoryVisual {
	return {
		kind: "avatar",
		shape: "square",
		src: team.avatarSrc,
	};
}
