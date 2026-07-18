import type {
	JiraKanbanCardSelectModifiers,
	JiraKanbanColumnData,
} from "./index";

export interface JiraKanbanSelectionState {
	lastSelectedByColumn: Readonly<Record<string, number>>;
	selectedCardCodes: Set<string>;
}

interface SelectJiraKanbanCardInput {
	cardCode: string;
	columnTitle: string;
	indexInColumn: number;
	modifiers: JiraKanbanCardSelectModifiers;
}

export function createJiraKanbanSelectionState(): JiraKanbanSelectionState {
	return {
		lastSelectedByColumn: {},
		selectedCardCodes: new Set(),
	};
}

export function selectJiraKanbanCard(
	state: JiraKanbanSelectionState,
	columns: readonly JiraKanbanColumnData[],
	input: SelectJiraKanbanCardInput,
): JiraKanbanSelectionState {
	const nextSelection = new Set(state.selectedCardCodes);
	const column = columns.find((candidate) => candidate.title === input.columnTitle);
	const previousIndex = state.lastSelectedByColumn[input.columnTitle];

	if (input.modifiers.shiftKey && column && previousIndex !== undefined) {
		const start = Math.min(previousIndex, input.indexInColumn);
		const end = Math.max(previousIndex, input.indexInColumn);
		for (const card of column.cards.slice(start, end + 1)) {
			nextSelection.add(card.code);
		}
	} else if (input.modifiers.metaOrCtrlKey) {
		if (nextSelection.has(input.cardCode)) {
			nextSelection.delete(input.cardCode);
		} else {
			nextSelection.add(input.cardCode);
		}
	} else {
		nextSelection.clear();
		nextSelection.add(input.cardCode);
	}

	return {
		lastSelectedByColumn: {
			...state.lastSelectedByColumn,
			[input.columnTitle]: input.indexInColumn,
		},
		selectedCardCodes: nextSelection,
	};
}

export function moveJiraKanbanCardsToColumn(
	columns: readonly JiraKanbanColumnData[],
	cardCodes: readonly string[],
	targetColumnTitle: string,
): JiraKanbanColumnData[] {
	const codeSet = new Set(cardCodes);
	const movingCards = columns.flatMap((column) => (
		column.title === targetColumnTitle
			? []
			: column.cards.filter((card) => codeSet.has(card.code))
	));

	if (movingCards.length === 0) {
		return [...columns];
	}
	const movingCardCodes = new Set(movingCards.map((card) => card.code));

	return columns.map((column) => {
		const remainingCards = column.cards.filter((card) => !movingCardCodes.has(card.code));
		const cards = column.title === targetColumnTitle
			? [...movingCards, ...remainingCards]
			: remainingCards;

		return {
			...column,
			cards,
			count: cards.length,
		};
	});
}

export function getCommonJiraKanbanAgentIds(
	assignedAgentIdsByCard: Readonly<Record<string, readonly string[]>>,
	selectedCardCodes: ReadonlySet<string>,
): string[] {
	const selectedCodes = [...selectedCardCodes];
	if (selectedCodes.length === 0) {
		return [];
	}

	const firstAssignments = assignedAgentIdsByCard[selectedCodes[0]] ?? [];
	return firstAssignments.filter((agentId) => selectedCodes.every((cardCode) => (
		assignedAgentIdsByCard[cardCode]?.includes(agentId) ?? false
	)));
}

export function updateJiraKanbanCardAgentAssignment(
	assignedAgentIdsByCard: Readonly<Record<string, readonly string[]>>,
	selectedCardCodes: ReadonlySet<string>,
	agentId: string,
	assigned: boolean,
): Record<string, string[]> {
	const nextAssignments = Object.fromEntries(
		Object.entries(assignedAgentIdsByCard).map(([cardCode, agentIds]) => [cardCode, [...agentIds]]),
	);

	for (const cardCode of selectedCardCodes) {
		const currentAgentIds = nextAssignments[cardCode] ?? [];
		nextAssignments[cardCode] = assigned
			? Array.from(new Set([...currentAgentIds, agentId]))
			: currentAgentIds.filter((currentAgentId) => currentAgentId !== agentId);
	}

	return nextAssignments;
}
