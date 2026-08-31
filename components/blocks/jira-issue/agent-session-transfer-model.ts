/**
 * Pure model for the agent-session transfer affordance on a Jira issue card:
 * the drag drop-zone hit test.
 *
 * Deliberately framework-free (no React, no DOM) so the suite runs under
 * `node --test` with the strip-types runner.
 */

export interface JiraIssueSessionDropZoneRect {
	bottom: number;
	left: number;
	right: number;
	top: number;
}

export interface JiraIssueSessionPointer {
	x: number;
	y: number;
}

/**
 * True when the pointer sits inside the zone rect grown by `haloPx` on every
 * side. The halo is what makes the drop edges forgiving: a release just short of
 * the well still counts. Boundaries are inclusive, and a zero halo tests the
 * bare rect.
 */
export function isWithinJiraIssueDropZoneHalo(
	pointer: JiraIssueSessionPointer,
	rect: JiraIssueSessionDropZoneRect,
	haloPx = 0,
): boolean {
	return (
		pointer.x >= rect.left - haloPx
		&& pointer.x <= rect.right + haloPx
		&& pointer.y >= rect.top - haloPx
		&& pointer.y <= rect.bottom + haloPx
	);
}
