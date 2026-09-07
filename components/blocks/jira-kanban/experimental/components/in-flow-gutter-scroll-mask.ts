/**
 * Board and List scrollports that can slide content under the Untracked gutter.
 * Query these from the in-flow column's parent rather than listening on window.
 */
export const IN_FLOW_GUTTER_SCROLLPORT_SELECTOR =
	"[data-jira-kanban-scrollport], [data-testid='jira-list-table-scroll']";

/** Opaque gutter paint is for underlap only — rest (`scrollLeft === 0`) stays clear. */
export function isInFlowGutterScrollMaskActive(scrollLeft: number): boolean {
	return scrollLeft > 0;
}
