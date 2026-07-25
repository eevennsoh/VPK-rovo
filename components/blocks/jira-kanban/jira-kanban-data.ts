import type { JiraKanbanColumnData } from "./index";

export function createJiraKanbanColumns(
	columns: readonly JiraKanbanColumnData[],
): JiraKanbanColumnData[] {
	return columns.map((column) => ({
		...column,
		cards: column.cards.map((card) => ({
			...card,
			assignee: card.assignee ? { ...card.assignee } : undefined,
			tags: card.tags.map((tag) => ({ ...tag })),
			agentActivities: card.agentActivities?.map((activity) => ({
				...activity,
				question: activity.question
					? {
						...activity.question,
						options: activity.question.options.map((option) => ({ ...option })),
					}
					: undefined,
			})),
			agentDoneRuns: card.agentDoneRuns?.map((run) => ({ ...run })),
		})),
	}));
}
