interface SuggestionRankingItem {
	label: string;
	description?: string;
}

export function getSuggestionMatchRank(item: SuggestionRankingItem, query: string): number {
	const normalizedQuery = query.trim().toLowerCase();
	if (!normalizedQuery) return Number.POSITIVE_INFINITY;

	const normalizedLabel = item.label.trim().toLowerCase();
	if (normalizedLabel === normalizedQuery) return 0;
	if (normalizedLabel.startsWith(normalizedQuery)) return 1;
	if (normalizedLabel.split(/\s+/u).some((word) => word.startsWith(normalizedQuery))) return 2;
	if (normalizedLabel.includes(normalizedQuery)) return 3;
	if (item.description?.toLowerCase().includes(normalizedQuery)) return 4;
	return Number.POSITIVE_INFINITY;
}

export function rankSuggestionsByMatch<T extends SuggestionRankingItem>(
	items: readonly T[],
	query: string,
): T[] {
	return items
		.map((item, index) => ({ index, item, rank: getSuggestionMatchRank(item, query) }))
		.sort((left, right) => left.rank - right.rank || left.index - right.index)
		.map(({ item }) => item);
}

export function getPreferredSuggestionIndex<T extends SuggestionRankingItem>(
	items: readonly T[],
	query: string,
	isSelectable: (item: T) => boolean,
): number {
	let preferredIndex = -1;
	let preferredRank = Number.POSITIVE_INFINITY;

	for (let index = 0; index < items.length; index += 1) {
		const item = items[index];
		if (!isSelectable(item)) continue;
		const rank = getSuggestionMatchRank(item, query);
		if (rank < preferredRank) {
			preferredIndex = index;
			preferredRank = rank;
		}
	}

	return preferredIndex;
}
