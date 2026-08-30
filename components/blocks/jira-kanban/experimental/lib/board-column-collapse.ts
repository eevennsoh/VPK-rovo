/**
 * Collapse state for experimental board columns.
 *
 * Columns are identified by title (the same key `assignedAgentIdsByColumn` and
 * the drag/drop handlers already use), so collapse survives re-renders and
 * re-orders, and a column that leaves and returns keeps the state the user set.
 */
export type CollapsedBoardColumns = ReadonlySet<string>;

export const EMPTY_COLLAPSED_BOARD_COLUMNS: CollapsedBoardColumns = new Set<string>();

/** Board column width in px, excluding the 2px transparent drop-target border. */
export const BOARD_COLUMN_WIDTH_PX = 276;

/** Collapsed pill width in px, excluding the 2px transparent drop-target border. */
export const BOARD_COLUMN_COLLAPSED_WIDTH_PX = 32;

/** Outer width in px, including the 2px transparent drop-target border on both edges. */
export function getBoardColumnOuterWidthPx(isCollapsed: boolean): number {
	return (isCollapsed ? BOARD_COLUMN_COLLAPSED_WIDTH_PX : BOARD_COLUMN_WIDTH_PX) + 4;
}

export function isBoardColumnCollapsed(
	collapsedColumns: CollapsedBoardColumns,
	columnTitle: string,
): boolean {
	return collapsedColumns.has(columnTitle);
}

export function toggleCollapsedBoardColumn(
	collapsedColumns: CollapsedBoardColumns,
	columnTitle: string,
): CollapsedBoardColumns {
	const nextCollapsedColumns = new Set(collapsedColumns);
	if (!nextCollapsedColumns.delete(columnTitle)) {
		nextCollapsedColumns.add(columnTitle);
	}
	return nextCollapsedColumns;
}
