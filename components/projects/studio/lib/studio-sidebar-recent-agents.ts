export const STUDIO_SIDEBAR_RECENT_AGENT_LIMIT = 5;

export type StudioSidebarRecentAgentKind = "agent" | "generating" | "wip";

export interface StudioSidebarRecentAgentItem {
	avatarSrc?: string;
	id: string;
	kind: StudioSidebarRecentAgentKind;
	label: string;
	lastTouchedAt: number;
	/**
	 * Only meaningful for `wip` (in-progress creation) rows: true when that
	 * thread is paused awaiting the user's clarification answers, so the sidebar
	 * row shows a persistent "waiting for your response" indicator.
	 */
	isAwaitingResponse?: boolean;
}

export interface StudioSidebarRecentAgentResult {
	items: readonly StudioSidebarRecentAgentItem[];
	overflowCount: number;
	showViewAll: boolean;
}

function compareRecentAgentItems(
	first: StudioSidebarRecentAgentItem,
	second: StudioSidebarRecentAgentItem,
): number {
	const touchedDelta = second.lastTouchedAt - first.lastTouchedAt;
	if (touchedDelta !== 0) {
		return touchedDelta;
	}

	return first.label.localeCompare(second.label, "en-US");
}

export function getStudioSidebarRecentAgents(
	items: readonly StudioSidebarRecentAgentItem[],
	limit = STUDIO_SIDEBAR_RECENT_AGENT_LIMIT,
): StudioSidebarRecentAgentResult {
	const sortedItems = [...items].sort(compareRecentAgentItems);
	const visibleItems = sortedItems.slice(0, limit);

	return {
		items: visibleItems,
		overflowCount: Math.max(0, sortedItems.length - visibleItems.length),
		showViewAll: sortedItems.length > visibleItems.length,
	};
}

// Resolves whether a single recent-agent row should render as selected.
//
// The sidebar mixes two independent selection sources: an in-progress agent
// creation thread (`wip`, keyed by `activeThreadId`) and a saved agent (`agent`,
// keyed by `selectedAgentId`). Both can be non-null at once (e.g. you start
// creating an agent while a saved agent stays selected upstream), which would
// light up two rows simultaneously. To guarantee at most one selected row we
// give the active creation thread precedence: when `activeThreadId` matches a
// WIP row in the list, saved-agent rows never report as selected.
export function getStudioSidebarRecentAgentSelected(
	item: StudioSidebarRecentAgentItem,
	items: readonly StudioSidebarRecentAgentItem[],
	activeThreadId: string | null,
	selectedAgentId?: string,
): boolean {
	const hasActiveWipThread =
		activeThreadId != null &&
		items.some((candidate) => candidate.kind === "wip" && candidate.id === activeThreadId);

	if (item.kind === "wip") {
		return item.id === activeThreadId;
	}

	// A saved agent is only selected when no creation thread is currently active.
	return !hasActiveWipThread && item.id === selectedAgentId;
}
