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
