import type { PulseLooseWork, PulseWorkItem } from "../types";

/**
 * Suggested work item for an uncaptured GitHub artifact.
 *
 * Copy is the strongest signal: titles and details already name the item the
 * artifact "never attached to". When they do not, the current window's work
 * items break the tie by shared members, then by window order.
 */

const WORK_ITEM_KEY_PATTERN = /\b([A-Z][A-Z0-9]+-\d+)\b/g;

export function extractPulseWorkItemKeys(text: string): readonly string[] {
	return Array.from(text.matchAll(WORK_ITEM_KEY_PATTERN), (match) => match[1] ?? "").filter(
		(key) => key.length > 0,
	);
}

export function suggestPulseLooseWorkItemKey(
	item: PulseLooseWork,
	workItems: readonly PulseWorkItem[] = [],
): string | undefined {
	const mentioned = extractPulseWorkItemKeys(`${item.title} ${item.detail} ${item.sourceTitle}`);
	const lastMentioned = mentioned[mentioned.length - 1];
	if (lastMentioned !== undefined) {
		return lastMentioned;
	}

	let bestKey: string | undefined;
	let bestScore = Number.NEGATIVE_INFINITY;
	for (const [index, workItem] of workItems.entries()) {
		const overlap = workItem.memberIds.filter((id) => item.memberIds.includes(id)).length;
		const score = overlap * 10 + (workItems.length - index);
		if (score > bestScore) {
			bestScore = score;
			bestKey = workItem.key;
		}
	}

	return bestKey;
}
