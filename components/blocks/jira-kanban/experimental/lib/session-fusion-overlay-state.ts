/**
 * Board-side geometry and link acknowledgement for the work item linking effect.
 *
 * The reusable field, its timing and its gating live in
 * `@/components/visual/linking-effect`. What stays here is the only part that is
 * genuinely Jira's: turning a card into the shape the field grows into, and
 * deciding which drops count as the attach-to-card path this effect covers.
 * Pure, so the contract can be tested without a DOM.
 */

import type { LinkingEffectTarget } from "@/components/visual/linking-effect";

import type { JiraIssueAgentLinkFlash } from "@/components/blocks/jira-issue";
import type {
	JiraIssueAgentSessionTransferMember,
} from "@/components/blocks/jira-issue/agent-session-drag";

import {
	AGENT_BRAND_TINT_FALLBACK,
	resolveAgentBrandTintHex,
	// @ts-expect-error Node's strip-types test runner requires the explicit .ts extension here.
} from "./agent-brand-tint.ts";
import type {
	BoardAgentSessionAttachProximity,
	BoardAgentSessionDropBounds,
} from "./board-agent-session-drag";

/**
 * Matches `AGENT_ACTIVITY_SHELL_STYLE.borderRadius` on the card. The blob is
 * morphing into that exact surface, so a different radius would read as a
 * second shape sitting behind the card instead of as the card itself.
 */
export const SESSION_FUSION_SHELL_RADIUS_PX = 10;

function toTargetFromBounds(
	bounds: Readonly<BoardAgentSessionDropBounds>,
	radius: number,
): LinkingEffectTarget {
	return {
		anchor: {
			x: (bounds.left + bounds.right) / 2,
			y: (bounds.top + bounds.bottom) / 2,
		},
		height: Math.max(0, bounds.bottom - bounds.top),
		radius,
		width: Math.max(0, bounds.right - bounds.left),
	};
}

/**
 * The card's whole agent shell as a link target.
 *
 * The session is being absorbed into the card, not parked in a strip at its
 * lip, so the field grows into the entire shell — backdrop, body and chin rows.
 * Falls back to the drop-zone bounds before the shell can be measured.
 */
export function toSessionFusionTarget(
	proximity: BoardAgentSessionAttachProximity | null,
): LinkingEffectTarget | null {
	if (!proximity) {
		return null;
	}

	return toTargetFromBounds(
		proximity.dockRect ?? proximity.bounds,
		SESSION_FUSION_SHELL_RADIUS_PX,
	);
}

/** A link flash pinned to the card whose chin rows should sweep. */
export interface BoardAgentSessionLinkFlash {
	cardCode: string;
	flash: JiraIssueAgentLinkFlash;
}

export interface SessionFusionLinkFlashInput {
	members: readonly JiraIssueAgentSessionTransferMember[];
	proximity: BoardAgentSessionAttachProximity | null;
	targetCardCode: string | null;
	/** Monotonic, so dropping the same session again replays the sweep. */
	token: number;
}

/**
 * What acknowledges a drop, or `null` when this drop is not the attach-to-card
 * path this effect covers.
 *
 * The link has already committed by the time this resolves — the chin rows
 * exist. So the acknowledgement belongs on those rows rather than on something
 * travelling to reach them, and nothing here carries travel geometry.
 *
 * Requiring the proximity winner to be the drop target is what keeps unlink,
 * create-well, create-list and untracked drops on their existing treatment: a
 * jira-list row attach registers no issue zone, so it resolves no proximity and
 * therefore no flash.
 */
export function toBoardAgentSessionLinkFlash(
	input: Readonly<SessionFusionLinkFlashInput>,
): BoardAgentSessionLinkFlash | null {
	const { members, proximity, targetCardCode } = input;
	if (targetCardCode === null || !proximity || proximity.cardCode !== targetCardCode) {
		return null;
	}
	if (members.length === 0) {
		return null;
	}

	return {
		cardCode: targetCardCode,
		flash: {
			activityIds: members.map((member) => member.id),
			tint: resolveAgentBrandTintHex(members[0].tintSeed) ?? AGENT_BRAND_TINT_FALLBACK,
			token: input.token,
		},
	};
}
