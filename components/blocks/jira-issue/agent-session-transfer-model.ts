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

/**
 * The host resets to idle in the same commit as pointer-up. A drop is that
 * idle transition while a zone was armed — not a later hover, and never a
 * cancelled gesture.
 */
export function shouldCommitJiraIssueSessionTransferDrop({
	armed,
	cancelled,
	dragging,
}: {
	armed: boolean;
	cancelled: boolean;
	dragging: boolean;
}): boolean {
	return !dragging && !cancelled && armed;
}

/**
 * The attach chin/backdrop is a live-gesture preview only. A leftover
 * `source: "detached"` after release must not keep an empty grey slab open.
 */
export function isJiraIssueSessionAttachPreview(
	dragging: boolean,
	source: "chin" | "detached",
): boolean {
	return dragging && source === "detached";
}
