import type { ReactNode } from "react";

export interface ContextBarPromptFlyoutItem {
	id: string;
	label: string;
	icon?: ReactNode;
	onSelect: () => void;
}

/** duration-normal — crossing a gap is shorter than this; resting outside is not. */
export const HOVER_LEAVE_MS = 150;

/** Longest label docks at the bottom; shortest stacks to the top. Ties keep source order. */
export function sortFlyoutItemsByLabelLength(
	items: ReadonlyArray<ContextBarPromptFlyoutItem>,
): ReadonlyArray<ContextBarPromptFlyoutItem> {
	return items
		.map((item, index) => ({ item, index }))
		.sort((left, right) => {
			const byLength = right.item.label.length - left.item.label.length;
			return byLength !== 0 ? byLength : left.index - right.index;
		})
		.map((entry) => entry.item);
}
