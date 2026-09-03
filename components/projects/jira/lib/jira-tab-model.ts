/**
 * Selection model for Jira's space tab bar.
 *
 * Kept free of icon/React imports so the resolution rules below can be unit
 * tested directly — `../data/tabs.ts` layers the ADS icons on top.
 *
 * The tab bar is design-variation dependent: "Team EU" splits the work items
 * destination into sibling `Board` and `List` tabs, while "2000 years later"
 * collapses them into one `Work items` tab and lets the board header's own
 * switcher pick the view. Those are the only labels that differ, so selection
 * is tracked by label and reconciled through `resolveJiraTab` whenever the
 * reader flips variations mid-session.
 */

export type JiraWorkItemView = "board" | "list";

/** Every work item view, for routes that render both surfaces. */
export const ALL_JIRA_WORK_ITEM_VIEWS: readonly JiraWorkItemView[] = ["board", "list"];

export interface JiraTabSelection {
	label: string;
	/** Whether the tab renders the work items surface rather than a placeholder. */
	hasContent: boolean;
	/**
	 * Set only when the tab *is* the view — Team EU's `Board` and `List`. Its
	 * presence is what tells a route the tab bar owns the board/list switch.
	 */
	view?: JiraWorkItemView;
}

/**
 * Drop the view tabs a route cannot render. Only Team EU splits the views, so
 * a board-only route shows `Board` there and `Work items` under 2000 years
 * later — never a `List` tab it would leave empty.
 */
export function selectJiraTabs<Tab extends JiraTabSelection>(
	tabs: readonly Tab[],
	supportedViews: readonly JiraWorkItemView[],
): readonly Tab[] {
	return tabs.filter((tab) => tab.view === undefined || supportedViews.includes(tab.view));
}

/**
 * Resolve the tab a reader is on against the current variation's tab set.
 *
 * Falls through label → matching work item view → first content tab, so a
 * variation flip carries the reader's board/list choice with them in both
 * directions: `List` becomes `Work items` showing the list, and `Work items`
 * showing the list becomes `List`.
 */
export function resolveJiraTab<Tab extends JiraTabSelection>(
	tabs: readonly Tab[],
	label: string,
	workItemView: JiraWorkItemView,
): Tab | undefined {
	return tabs.find((tab) => tab.label === label)
		?? tabs.find((tab) => tab.view === workItemView)
		?? tabs.find((tab) => tab.hasContent);
}

/**
 * The label a route should land on when it opens straight into work items —
 * `Board` under Team EU, `Work items` under 2000 years later.
 */
export function getJiraWorkItemsTabLabel(tabs: readonly JiraTabSelection[]): string {
	return (tabs.find((tab) => tab.hasContent) ?? tabs[0])?.label ?? "";
}
