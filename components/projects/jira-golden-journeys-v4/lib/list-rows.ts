import type { JiraIssueAgentActivity } from "@/components/blocks/jira-issue";
import type {
	JiraKanbanAgentData,
	JiraKanbanCardData,
	JiraKanbanColumnData,
} from "@/components/blocks/jira-kanban";
import type { BoardCardInsertion } from "@/components/blocks/jira-kanban/experimental/lib/board-agent-session-drag";
import type {
	JiraListAssignedAgent,
	JiraListInsertion,
	JiraListPerson,
	JiraListRowData,
	JiraListStatusOption,
} from "@/components/blocks/jira-list";

export const JIRA_GOLDEN_JOURNEYS_V4_LIST_STATUS_OPTIONS: readonly JiraListStatusOption[] = [
	{ status: "To do", statusVariant: "neutral" },
	{ status: "In progress", statusVariant: "information" },
	{ status: "In review", statusVariant: "warning" },
	{ status: "Done", statusVariant: "success" },
];

const STATUS_VARIANTS: Readonly<Record<string, JiraListRowData["statusVariant"]>> = {
	"To do": "neutral",
	"In progress": "information",
	"In review": "warning",
	Done: "success",
};

const JIRA_AGENT_AUTO_PROGRESS_SOURCES = new Set(["To do", "Done"]);
const JIRA_AGENT_ACTIVE_COLUMN = "In progress";

export function progressJiraGoldenJourneysV4WorkItemOnStart(
	columns: readonly JiraKanbanColumnData[],
	issueKey: string,
): JiraKanbanColumnData[] {
	const sourceColumn = columns.find((column) => (
		column.cards.some((card) => card.code === issueKey)
	));
	const activeColumn = columns.find((column) => column.title === JIRA_AGENT_ACTIVE_COLUMN);

	if (!sourceColumn || !activeColumn || !JIRA_AGENT_AUTO_PROGRESS_SOURCES.has(sourceColumn.title)) {
		return [...columns];
	}

	const card = sourceColumn.cards.find((candidate) => candidate.code === issueKey);
	if (!card) {
		return [...columns];
	}

	return columns.map((column) => {
		const cards = column.title === sourceColumn.title
			? column.cards.filter((candidate) => candidate.code !== issueKey)
			: column.title === JIRA_AGENT_ACTIVE_COLUMN
				? [card, ...column.cards]
				: column.cards;
		return cards === column.cards ? column : { ...column, cards, count: cards.length };
	});
}

function slugAgentName(name: string): string {
	return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function resolveCatalogAgentId(
	name: string,
	idHint: string | undefined,
	catalog: readonly JiraKanbanAgentData[],
): string {
	if (idHint) {
		if (catalog.some((agent) => agent.id === idHint)) {
			return idHint;
		}
		const suffix = idHint.includes(":") ? idHint.slice(idHint.lastIndexOf(":") + 1) : "";
		if (suffix && catalog.some((agent) => agent.id === suffix)) {
			return suffix;
		}
	}

	const byName = catalog.find((agent) => agent.name === name);
	if (byName) {
		return byName.id;
	}

	return idHint && idHint.length > 0 ? idHint : slugAgentName(name);
}

function assignedStatusFromActivityState(
	state: string | undefined,
	fallback: JiraListAssignedAgent["statusKind"],
): Pick<JiraListAssignedAgent, "statusKind" | "statusLabel"> {
	switch (state) {
		case "working":
		case "in-progress":
			return { statusKind: "working", statusLabel: "Working" };
		case "awaiting-input":
		case "needs-input":
			return { statusKind: "needs-input", statusLabel: "Needs input" };
		case "completed":
		case "finished":
		case "done":
		case "failed":
		case "review":
			return { statusKind: "finished", statusLabel: "Finished" };
		case undefined:
			return fallback === "finished"
				? { statusKind: "finished", statusLabel: "Finished" }
				: { statusKind: "working", statusLabel: "Working" };
		default:
			return { statusKind: "idle", statusLabel: "Assigned" };
	}
}

function toAssignedAgent(
	input: Readonly<{
		avatarSrc?: string;
		brandName?: JiraListAssignedAgent["brandName"];
		catalog: readonly JiraKanbanAgentData[];
		fallbackStatusKind: JiraListAssignedAgent["statusKind"];
		idHint?: string;
		name: string;
		state?: string;
	}>,
): JiraListAssignedAgent {
	const id = resolveCatalogAgentId(input.name, input.idHint, input.catalog);
	const catalogAgent = input.catalog.find((agent) => agent.id === id);
	const status = assignedStatusFromActivityState(input.state, input.fallbackStatusKind);

	return {
		id,
		name: catalogAgent?.name ?? input.name,
		...(catalogAgent?.byline ? { byline: catalogAgent.byline } : {}),
		...((catalogAgent?.avatarSrc ?? input.avatarSrc)
			? { avatarSrc: catalogAgent?.avatarSrc ?? input.avatarSrc }
			: {}),
		...((catalogAgent?.brandName ?? input.brandName)
			? { brandName: catalogAgent?.brandName ?? input.brandName }
			: {}),
		statusKind: status.statusKind,
		statusLabel: status.statusLabel,
	};
}

export function assignedAgentsFromCard(
	card: Pick<JiraKanbanCardData, "agentActivities" | "agentDoneRuns">,
	catalog: readonly JiraKanbanAgentData[],
): JiraListAssignedAgent[] {
	const assigned: JiraListAssignedAgent[] = [];
	const seenIds = new Set<string>();

	for (const activity of card.agentActivities ?? []) {
		const agent = toAssignedAgent({
			avatarSrc: activity.avatarSrc,
			brandName: activity.agentBrandName,
			catalog,
			fallbackStatusKind: "working",
			idHint: activity.id,
			name: activity.name,
			state: activity.state,
		});
		if (seenIds.has(agent.id)) {
			continue;
		}
		seenIds.add(agent.id);
		assigned.push(agent);
	}

	for (const run of card.agentDoneRuns ?? []) {
		const agent = toAssignedAgent({
			avatarSrc: run.agentAvatarSrc,
			brandName: run.agentBrandName,
			catalog,
			fallbackStatusKind: "finished",
			idHint: run.id,
			name: run.agentName,
			state: run.state,
		});
		if (seenIds.has(agent.id)) {
			continue;
		}
		seenIds.add(agent.id);
		assigned.push(agent);
	}

	return assigned;
}

function createAssignedActivity(
	card: JiraKanbanCardData,
	agent: JiraKanbanAgentData,
): JiraIssueAgentActivity {
	return {
		id: `${card.code}:${agent.id}`,
		name: agent.name,
		avatarSrc: agent.avatarSrc,
		agentBrandName: agent.brandName,
		label: `Assigned to ${card.title}`,
		message: `${agent.name} is working and will post the next result to the Jira work item.`,
		startedAtMs: Date.now(),
		startupSequence: "jira-work-item-start",
		state: "working",
	};
}

export function applyAssignedAgentIdsToCard(
	card: JiraKanbanCardData,
	agentIds: readonly string[],
	catalog: readonly JiraKanbanAgentData[],
): JiraKanbanCardData {
	const nextIds = new Set(agentIds);
	const activities = (card.agentActivities ?? []).filter((activity) => (
		nextIds.has(resolveCatalogAgentId(activity.name, activity.id, catalog))
	));
	const doneRuns = (card.agentDoneRuns ?? []).filter((run) => (
		nextIds.has(resolveCatalogAgentId(run.agentName, run.id, catalog))
	));
	const presentIds = new Set([
		...activities.map((activity) => resolveCatalogAgentId(activity.name, activity.id, catalog)),
		...doneRuns.map((run) => resolveCatalogAgentId(run.agentName, run.id, catalog)),
	]);
	const addedActivities = agentIds.flatMap((agentId) => {
		if (presentIds.has(agentId)) {
			return [];
		}
		const agent = catalog.find((candidate) => candidate.id === agentId);
		return agent ? [createAssignedActivity(card, agent)] : [];
	});
	const nextActivities = [...activities, ...addedActivities];

	return {
		...card,
		agentActivities: nextActivities.length > 0 ? nextActivities : undefined,
		agentDoneRuns: doneRuns.length > 0 ? doneRuns : undefined,
	};
}

export function applyAssignedAgentIdsToColumns(
	columns: readonly JiraKanbanColumnData[],
	issueKey: string,
	agentIds: readonly string[],
	catalog: readonly JiraKanbanAgentData[],
): JiraKanbanColumnData[] {
	let started = false;
	const nextColumns = columns.map((column) => {
		const cards = column.cards.map((card) => {
			if (card.code !== issueKey) {
				return card;
			}

			const nextCard = applyAssignedAgentIdsToCard(card, agentIds, catalog);
			const previousActivityIds = new Set(card.agentActivities?.map((activity) => activity.id) ?? []);
			started = nextCard.agentActivities?.some((activity) => (
				activity.state === "working" && !previousActivityIds.has(activity.id)
			)) ?? false;
			return nextCard;
		});
		return {
			...column,
			cards,
			count: cards.length,
		};
	});

	return started
		? progressJiraGoldenJourneysV4WorkItemOnStart(nextColumns, issueKey)
		: nextColumns;
}

export function createListRows(
	columns: readonly JiraKanbanColumnData[],
	catalog: readonly JiraKanbanAgentData[],
): JiraListRowData[] {
	return columns.flatMap((column) => column.cards.map((card) => ({
		issueKey: card.code,
		summary: card.title,
		issueType: card.issueType ?? "task",
		priority: card.priority,
		status: column.title,
		statusVariant: STATUS_VARIANTS[column.title],
		assignee: card.assignee,
		agentSessions: assignedAgentsFromCard(card, catalog),
		labels: card.tags,
		dueDate: card.dueDate,
		contributors: card.assignee ? [card.assignee] : [],
	})));
}

export function applyListOrder(
	rows: readonly JiraListRowData[],
	order: readonly string[],
): JiraListRowData[] {
	if (order.length === 0) {
		return [...rows];
	}

	const byKey = new Map(rows.map((row) => [row.issueKey, row]));
	const next: JiraListRowData[] = [];
	for (const key of order) {
		const row = byKey.get(key);
		if (row) {
			next.push(row);
			byKey.delete(key);
		}
	}
	for (const row of rows) {
		if (byKey.has(row.issueKey)) {
			next.push(row);
		}
	}
	return next;
}

export function moveListOrder(
	order: readonly string[],
	visibleKeys: readonly string[],
	issueKey: string,
	targetIndex: number,
): string[] {
	const visibleKeySet = new Set(visibleKeys);
	const baseOrder = (order.length === 0 ? visibleKeys : order)
		.filter((key, index, keys) => keys.indexOf(key) === index);
	const nextOrder = [
		...baseOrder,
		...visibleKeys.filter((key) => !baseOrder.includes(key)),
	];
	const visibleInOrder = nextOrder.filter((key) => visibleKeySet.has(key));
	const sourceVisibleIndex = visibleInOrder.indexOf(issueKey);
	if (sourceVisibleIndex < 0) {
		return nextOrder;
	}

	const boundedTargetIndex = Math.min(Math.max(targetIndex, 0), visibleInOrder.length - 1);
	if (sourceVisibleIndex === boundedTargetIndex) {
		return nextOrder;
	}

	const reorderedVisible = [...visibleInOrder];
	const [movedKey] = reorderedVisible.splice(sourceVisibleIndex, 1);
	if (!movedKey) {
		return nextOrder;
	}
	reorderedVisible.splice(boundedTargetIndex, 0, movedKey);

	let visibleCursor = 0;
	return nextOrder.map((key) => (
		visibleKeySet.has(key) ? reorderedVisible[visibleCursor++] ?? key : key
	));
}

export function insertListOrderKey(
	order: readonly string[],
	visibleKeys: readonly string[],
	issueKey: string,
	insertAtIndex: number | null,
): string[] {
	const baseOrder = (order.length === 0 ? visibleKeys : order)
		.filter((key) => key !== issueKey);
	if (insertAtIndex === null) {
		return [...baseOrder, issueKey];
	}

	const visibleOrder = baseOrder.filter((key) => visibleKeys.includes(key));
	const boundedIndex = Math.min(Math.max(insertAtIndex, 0), visibleOrder.length);
	const keyAtIndex = visibleOrder[boundedIndex];
	if (!keyAtIndex) {
		return [...baseOrder, issueKey];
	}

	const fullIndex = baseOrder.indexOf(keyAtIndex);
	return [
		...baseOrder.slice(0, fullIndex),
		issueKey,
		...baseOrder.slice(fullIndex),
	];
}

export function getNextPayIssueKey(columns: readonly JiraKanbanColumnData[]): string {
	const highestIssueNumber = columns.flatMap((column) => column.cards).reduce((maxIssueNumber, card) => {
		const parsedIssueNumber = Number.parseInt(card.code.split("-")[1] ?? "0", 10);
		return Number.isNaN(parsedIssueNumber) ? maxIssueNumber : Math.max(maxIssueNumber, parsedIssueNumber);
	}, 0);

	return `PAY-${highestIssueNumber + 1}`;
}

function withCardAtIndex(
	cards: readonly JiraKanbanCardData[],
	card: JiraKanbanCardData,
	insertAtIndex: number | undefined,
): JiraKanbanCardData[] {
	if (insertAtIndex === undefined) {
		return [...cards, card];
	}

	const boundedIndex = Math.min(Math.max(insertAtIndex, 0), cards.length);
	const nextCards = [...cards];
	nextCards.splice(boundedIndex, 0, card);
	return nextCards;
}

/**
 * Adds a card to the named status column. Omit `insertAtIndex` to append, which
 * is what the create editor and the list-view session create both want. Pass an
 * index — clamped to the column's own bounds — when the gesture named a gap in
 * the card stack, as a board drop does.
 */
export function insertWorkItemCard(
	columns: readonly JiraKanbanColumnData[],
	card: JiraKanbanCardData,
	columnTitle: string,
	insertAtIndex?: number,
): JiraKanbanColumnData[] {
	const targetTitle = columns.some((column) => column.title === columnTitle)
		? columnTitle
		: columns[0]?.title;
	if (!targetTitle) {
		return [...columns];
	}

	return columns.map((column) => {
		if (column.title !== targetTitle) {
			return column;
		}

		const cards = withCardAtIndex(column.cards, card, insertAtIndex);
		return {
			...column,
			cards,
			count: cards.length,
		};
	});
}

export function toKanbanCardFromDraft(input: Readonly<{
	assignee?: JiraListPerson;
	dueDate?: string;
	issueKey: string;
	issueType?: JiraKanbanCardData["issueType"];
	summary: string;
}>): JiraKanbanCardData {
	return {
		assignee: input.assignee
			? {
				id: input.assignee.id,
				name: input.assignee.name,
				avatarSrc: input.assignee.avatarSrc ?? "",
			}
			: undefined,
		code: input.issueKey,
		dueDate: input.dueDate,
		issueType: input.issueType ?? "task",
		priority: "medium",
		tags: [],
		title: input.summary,
	};
}

export interface CreateListWorkItemFromSessionInput {
	activity: JiraIssueAgentActivity;
	columns: readonly JiraKanbanColumnData[];
	insertion: JiraListInsertion;
	linkSession: (
		columns: readonly JiraKanbanColumnData[],
		issueKey: string,
		activity: JiraIssueAgentActivity,
	) => readonly JiraKanbanColumnData[];
	listOrder: readonly string[];
	session: Readonly<{ id: string; title: string }>;
	visibleKeys: readonly string[];
}

export type CreateWorkItemFromSessionResult =
	| {
		kind: "created";
		columns: readonly JiraKanbanColumnData[];
		issueKey: string;
		listOrder: readonly string[];
	}
	| {
		kind: "already-attached";
		columns: readonly JiraKanbanColumnData[];
		issueKey: string;
		listOrder: readonly string[];
	};

function findCardWithActivity(
	columns: readonly JiraKanbanColumnData[],
	activityId: string,
): JiraKanbanCardData | undefined {
	return columns
		.flatMap((column) => column.cards)
		.find((card) => card.agentActivities?.some((activity) => activity.id === activityId));
}

export function createListWorkItemFromSession(
	input: CreateListWorkItemFromSessionInput,
): CreateWorkItemFromSessionResult {
	const attachedCard = findCardWithActivity(input.columns, input.activity.id);
	if (attachedCard) {
		return {
			kind: "already-attached",
			columns: input.columns,
			issueKey: attachedCard.code,
			listOrder: input.listOrder,
		};
	}

	const issueKey = getNextPayIssueKey(input.columns);
	const card = toKanbanCardFromDraft({
		issueKey,
		issueType: "task",
		summary: input.session.title,
	});
	const columnsWithCard = insertWorkItemCard(input.columns, card, "To do");
	const columns = input.linkSession(columnsWithCard, issueKey, input.activity);
	const listOrder = insertListOrderKey(
		input.listOrder,
		input.visibleKeys,
		issueKey,
		input.insertion.insertAtIndex,
	);

	return {
		kind: "created",
		columns,
		issueKey,
		listOrder,
	};
}

export interface BoardWorkItemSessionEntry {
	activity: JiraIssueAgentActivity;
	session: Readonly<{ id: string; title: string }>;
}

export interface CreateBoardWorkItemsFromSessionsInput {
	columns: readonly JiraKanbanColumnData[];
	/** The dragged cohort, in drag order. */
	entries: readonly BoardWorkItemSessionEntry[];
	insertion: BoardCardInsertion;
	linkSession: (
		columns: readonly JiraKanbanColumnData[],
		issueKey: string,
		activity: JiraIssueAgentActivity,
	) => readonly JiraKanbanColumnData[];
	listOrder: readonly string[];
	visibleKeys: readonly string[];
}

export interface CreateBoardWorkItemsFromSessionsResult {
	columns: readonly JiraKanbanColumnData[];
	/** Keys minted by this drop, in drag order; empty when every session was already attached. */
	issueKeys: readonly string[];
	listOrder: readonly string[];
}

/**
 * The gesture measured a gap in the column the viewer can see, which the
 * assignee filter may have thinned. Re-find the named neighbour in the real
 * column so the card lands beside the same card the insertion line drew
 * against, and only fall back to the raw index when there is no neighbour to
 * anchor to — an empty column, or a neighbour that has since moved away.
 *
 * Resolved once per drop, never once per session: re-resolving after each
 * insert would return the same slot every time and stack a cohort in reverse.
 */
function resolveBoardInsertIndex(
	cards: readonly JiraKanbanCardData[],
	insertion: BoardCardInsertion,
): number {
	if (insertion.relativeToCardCode === null) {
		return insertion.insertAtIndex;
	}

	const neighbourIndex = cards.findIndex((card) => card.code === insertion.relativeToCardCode);
	if (neighbourIndex < 0) {
		return insertion.insertAtIndex;
	}

	return insertion.position === "after" ? neighbourIndex + 1 : neighbourIndex;
}

/**
 * The board twin of `createListWorkItemFromSession`: sessions dragged from the
 * Untracked rail into a gap in a column's card stack mint work items there,
 * already linked, in drag order.
 *
 * Cohort-at-a-time on purpose. The anchor is resolved once against the column
 * as it stood when the gesture ended, and each member lands one slot past the
 * last, so the visible order matches the order they were picked up in.
 *
 * The list keeps its own ordering array, so a board-origin create appends the
 * new keys rather than placing them — the board's column position is the source
 * of truth for the board, and appending keeps `listOrder` complete for the next
 * list reorder instead of leaving a hole the trailing pass has to patch. An
 * empty `listOrder` means "follow board order", so it is left empty: writing
 * one here would freeze today's row order against every later board change.
 */
export function createBoardWorkItemsFromSessions(
	input: CreateBoardWorkItemsFromSessionsInput,
): CreateBoardWorkItemsFromSessionsResult {
	const targetColumn = input.columns.find((column) => column.title === input.insertion.columnTitle);
	const anchorIndex = targetColumn
		? resolveBoardInsertIndex(targetColumn.cards, input.insertion)
		: undefined;

	let columns = input.columns;
	let listOrder = input.listOrder;
	const issueKeys: string[] = [];

	for (const entry of input.entries) {
		if (findCardWithActivity(columns, entry.activity.id)) {
			continue;
		}

		const issueKey = getNextPayIssueKey(columns);
		const card = toKanbanCardFromDraft({
			issueKey,
			issueType: "task",
			summary: entry.session.title,
		});
		columns = input.linkSession(
			insertWorkItemCard(
				columns,
				card,
				input.insertion.columnTitle,
				anchorIndex === undefined ? undefined : anchorIndex + issueKeys.length,
			),
			issueKey,
			entry.activity,
		);
		listOrder = listOrder.length === 0
			? listOrder
			: insertListOrderKey(listOrder, input.visibleKeys, issueKey, null);
		issueKeys.push(issueKey);
	}

	return { columns, issueKeys, listOrder };
}
