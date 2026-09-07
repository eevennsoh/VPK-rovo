import type { AgentSessionItem } from "@/components/blocks/agent-session";

import type { BoardCardInsertion } from "./board-agent-session-drag";

/**
 * Which edge of one board card the active insertion line belongs to, or
 * `undefined` when the insertion names some other card, some other column, or
 * nothing at all.
 *
 * Keyed on `(columnTitle, insertAtIndex)` rather than on the insertion's own
 * `relativeToCardCode` / `position`. A card's after-gap and the next card's
 * before-gap describe the same insertion and therefore share a drop-target key,
 * so which of the two survives the resolver's dedupe depends on DOM iteration
 * order. The index is the stable fact: gap `i` is the leading edge of card `i`,
 * and the tail gap at `cardCount` is the trailing edge of the last card.
 */
export function resolveBoardCardInsertionPosition(
	insertion: BoardCardInsertion | null | undefined,
	card: Readonly<{ cardCount: number; cardIndex: number; columnTitle: string }>,
): BoardCardInsertion["position"] | undefined {
	if (!insertion || insertion.columnTitle !== card.columnTitle) {
		return undefined;
	}
	if (insertion.insertAtIndex === card.cardIndex) {
		return "before";
	}
	return insertion.insertAtIndex === card.cardCount && card.cardIndex === card.cardCount - 1
		? "after"
		: undefined;
}

/**
 * Places a whole cohort at one board gap, in drag order. Cohort-at-a-time
 * rather than session-at-a-time because the gap names a neighbour card as well
 * as an index: re-resolving that neighbour per session would land every member
 * in the same slot and reverse the cohort.
 */
export type BoardGapCreateHandler = (
	sessions: readonly [AgentSessionItem, ...AgentSessionItem[]],
	insertion: BoardCardInsertion,
) => void;

/**
 * The board's gap-create port, or `undefined` when the host supplies no create
 * capability.
 *
 * Returning `undefined` rather than a no-op is what keeps the affordance honest:
 * the drag hook only emits card-gap drop zones when this port exists, so a host
 * without `onBoardAgentSessionCreate` never draws an insertion line it cannot
 * honour.
 *
 * `capture` runs first and unconditionally for every member of the cohort,
 * because minting the cards and releasing the sessions from the Untracked rail
 * are one transition — the same pairing the list twin performs before calling
 * `onListAgentSessionCreate`.
 */
export function toBoardGapCreatePort(
	capture: (session: Readonly<{ id: string }>) => void,
	onCreate?: BoardGapCreateHandler,
): BoardGapCreateHandler | undefined {
	if (!onCreate) {
		return undefined;
	}
	return (sessions, insertion) => {
		for (const session of sessions) {
			capture(session);
		}
		onCreate(sessions, insertion);
	};
}
