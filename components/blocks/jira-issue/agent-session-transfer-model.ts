/**
 * Pure model for the agent-session transfer affordances on a Jira issue card:
 * the "Move work item" search menu and the drag drop-zone hit test.
 *
 * Deliberately framework-free (no React, no DOM) so the suite runs under
 * `node --test` with the strip-types runner.
 */

export interface JiraIssueMoveWorkItem {
	key: string;
	summary: string;
	type: string;
}

/**
 * Row shape consumed by the rich-text suggestion menu. `headingLabel` is only
 * present on the first row, where the menu renders it as a standalone group
 * heading above the list.
 */
export interface JiraIssueMoveMenuRow {
	description: string;
	headingLabel?: string;
	id: string;
	label: string;
}

export type JiraIssueSessionDropZone = "unlink" | "move";

export interface JiraIssueSessionDropZoneRect {
	bottom: number;
	left: number;
	right: number;
	top: number;
}

export interface JiraIssueSessionDropZoneTarget {
	id: JiraIssueSessionDropZone;
	rect: JiraIssueSessionDropZoneRect;
}

export interface JiraIssueSessionPointer {
	x: number;
	y: number;
}

/**
 * Case-insensitive substring match over `${key} ${summary}`. An empty or
 * whitespace-only query returns every item unfiltered.
 */
export function filterJiraIssueMoveWorkItems(
	items: readonly JiraIssueMoveWorkItem[],
	query: string,
): readonly JiraIssueMoveWorkItem[] {
	const normalizedQuery = query.trim().toLowerCase();

	if (normalizedQuery.length === 0) {
		return items;
	}

	return items.filter((item) => `${item.key} ${item.summary}`.toLowerCase().includes(normalizedQuery));
}

/**
 * Builds the menu rows for the filtered work items. The heading is attached to
 * the first row only; an empty result set produces no heading at all.
 *
 * `id` is the work item key so callers can resolve the original item (and its
 * `type` glyph) from the selected row.
 */
export function getJiraIssueMoveMenuRows(
	items: readonly JiraIssueMoveWorkItem[],
	query: string,
	headingLabel: string,
): readonly JiraIssueMoveMenuRow[] {
	return filterJiraIssueMoveWorkItems(items, query).map((item, index) =>
		index === 0
			? { description: item.key, headingLabel, id: item.key, label: item.summary }
			: { description: item.key, id: item.key, label: item.summary },
	);
}

function getCenterDistance(pointer: JiraIssueSessionPointer, rect: JiraIssueSessionDropZoneRect): number {
	const centerX = (rect.left + rect.right) / 2;
	const centerY = (rect.top + rect.bottom) / 2;

	return Math.hypot(pointer.x - centerX, pointer.y - centerY);
}

function isWithinHalo(
	pointer: JiraIssueSessionPointer,
	rect: JiraIssueSessionDropZoneRect,
	haloPx: number,
): boolean {
	return (
		pointer.x >= rect.left - haloPx
		&& pointer.x <= rect.right + haloPx
		&& pointer.y >= rect.top - haloPx
		&& pointer.y <= rect.bottom + haloPx
	);
}

/**
 * Returns the drop zone whose halo-expanded rect contains the pointer. When
 * several halos overlap the pointer, the zone with the smallest centre distance
 * wins; exact ties resolve to the earlier zone in the array. Returns `null` when
 * the pointer sits outside every halo.
 */
export function resolveNearestDropZone(
	pointer: JiraIssueSessionPointer,
	zones: readonly JiraIssueSessionDropZoneTarget[],
	haloPx = 0,
): JiraIssueSessionDropZone | null {
	let nearestId: JiraIssueSessionDropZone | null = null;
	let nearestDistance = Number.POSITIVE_INFINITY;

	for (const zone of zones) {
		if (!isWithinHalo(pointer, zone.rect, haloPx)) {
			continue;
		}

		const distance = getCenterDistance(pointer, zone.rect);

		if (distance < nearestDistance) {
			nearestDistance = distance;
			nearestId = zone.id;
		}
	}

	return nearestId;
}
