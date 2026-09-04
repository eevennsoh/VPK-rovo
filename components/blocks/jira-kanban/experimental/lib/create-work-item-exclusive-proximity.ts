/** Padding around the resting well that still counts as near. */
export const CREATE_WORK_ITEM_PROXIMITY_HOVER_AREA_PX = 120;

function isWithinHoverArea(
	pointer: Readonly<ExclusiveProximityPointer>,
	rect: Readonly<ExclusiveProximityRect>,
	hoverArea: number,
): boolean {
	return pointer.x >= rect.left - hoverArea
		&& pointer.x <= rect.right + hoverArea
		&& pointer.y >= rect.top - hoverArea
		&& pointer.y <= rect.bottom + hoverArea;
}

export interface ExclusiveProximityPointer {
	x: number;
	y: number;
}

export interface ExclusiveProximityRect {
	bottom: number;
	left: number;
	right: number;
	top: number;
}

export interface ExclusiveProximityWell {
	id: string;
	rect: ExclusiveProximityRect;
}

export function distanceFromPointToRect(
	pointer: Readonly<ExclusiveProximityPointer>,
	rect: Readonly<ExclusiveProximityRect>,
): number {
	const dx = pointer.x < rect.left
		? rect.left - pointer.x
		: pointer.x > rect.right
			? pointer.x - rect.right
			: 0;
	const dy = pointer.y < rect.top
		? rect.top - pointer.y
		: pointer.y > rect.bottom
			? pointer.y - rect.bottom
			: 0;
	return Math.hypot(dx, dy);
}

/**
 * Among wells whose magnetic relation is not `outside`, pick the closest
 * actual rect. Equal distance prefers the leftmost well, then first registered.
 */
export function resolveExclusiveProximityWinner(
	pointer: Readonly<ExclusiveProximityPointer>,
	wells: readonly ExclusiveProximityWell[],
	hoverArea: number = CREATE_WORK_ITEM_PROXIMITY_HOVER_AREA_PX,
): string | null {
	let winnerId: string | null = null;
	let winnerDistance = Number.POSITIVE_INFINITY;
	let winnerLeft = Number.POSITIVE_INFINITY;

	for (const well of wells) {
		if (!isWithinHoverArea(pointer, well.rect, hoverArea)) continue;

		const distance = distanceFromPointToRect(pointer, well.rect);
		const isCloser = distance < winnerDistance;
		const isTiePreferLeft = distance === winnerDistance && well.rect.left < winnerLeft;
		if (winnerId === null || isCloser || isTiePreferLeft) {
			winnerId = well.id;
			winnerDistance = distance;
			winnerLeft = well.rect.left;
		}
	}

	return winnerId;
}
