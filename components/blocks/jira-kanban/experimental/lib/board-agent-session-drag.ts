export interface BoardAgentSessionDragPointer {
	x: number;
	y: number;
}

export interface BoardAgentSessionDropBounds {
	top: number;
	right: number;
	bottom: number;
	left: number;
}

export type BoardAgentSessionDragOrigin =
	| { kind: "attached"; sourceCardCode: string }
	| { kind: "detached"; sourceCardCode: string }
	| { kind: "untracked" };

export type BoardAgentSessionDropZone =
	| {
		bounds: BoardAgentSessionDropBounds;
		cardCode: string;
		kind: "issue" | "unlink";
	}
	| {
		bounds: BoardAgentSessionDropBounds;
		kind: "untracked";
	};

export type BoardAgentSessionDropTarget =
	| { cardCode: string; kind: "attach" }
	| { cardCode: string; kind: "unlink" }
	| { kind: "untracked" };

export interface BoardAgentSessionDragTransaction<
	TSession extends Readonly<{ id: string }> = Readonly<{ id: string }>,
> {
	origin: BoardAgentSessionDragOrigin;
	pointer: BoardAgentSessionDragPointer;
	session: TSession;
	target: BoardAgentSessionDropTarget | null;
}

export type BoardAgentSessionDropAction =
	| { kind: "none" }
	| { kind: "detach"; sessionId: string; sourceCardCode: string }
	| { kind: "move"; sessionId: string; sourceCardCode: string; targetCardCode: string }
	| { kind: "attach"; sessionId: string; targetCardCode: string };

function containsPointer(
	bounds: BoardAgentSessionDropBounds,
	pointer: BoardAgentSessionDragPointer,
): boolean {
	return pointer.x >= bounds.left
		&& pointer.x <= bounds.right
		&& pointer.y >= bounds.top
		&& pointer.y <= bounds.bottom;
}

function dropTargetKey(target: BoardAgentSessionDropTarget): string {
	switch (target.kind) {
		case "untracked":
			return "untracked";
		case "attach":
		case "unlink":
			return `${target.kind}:${target.cardCode}`;
		default: {
			const exhaustive: never = target;
			return exhaustive;
		}
	}
}

function toEligibleTarget(
	origin: BoardAgentSessionDragOrigin,
	zone: BoardAgentSessionDropZone,
): BoardAgentSessionDropTarget | null {
	switch (zone.kind) {
		case "untracked":
			return origin.kind === "attached" ? { kind: "untracked" } : null;
		case "unlink":
			return origin.kind === "attached" && zone.cardCode === origin.sourceCardCode
				? { cardCode: zone.cardCode, kind: "unlink" }
				: null;
		case "issue":
			if (origin.kind === "attached" && zone.cardCode === origin.sourceCardCode) {
				return null;
			}
			return { cardCode: zone.cardCode, kind: "attach" };
		default: {
			const exhaustive: never = zone;
			return exhaustive;
		}
	}
}

export function resolveBoardAgentSessionDropTarget(
	origin: BoardAgentSessionDragOrigin,
	pointer: BoardAgentSessionDragPointer,
	zones: readonly BoardAgentSessionDropZone[],
): BoardAgentSessionDropTarget | null {
	const targetsByKey = new Map<string, BoardAgentSessionDropTarget>();

	for (const zone of zones) {
		if (!containsPointer(zone.bounds, pointer)) {
			continue;
		}

		const target = toEligibleTarget(origin, zone);
		if (target) {
			targetsByKey.set(dropTargetKey(target), target);
		}
	}

	// The Untracked rail overlays the trailing status columns. When an attached
	// session is over both, the rail wins so "drop to Untracked" is not treated
	// as an ambiguous attach. Untracked origins ignore this zone, so drops from
	// the rail still hit issue cards underneath.
	const untracked = targetsByKey.get("untracked");
	if (untracked) {
		return untracked;
	}

	return targetsByKey.size === 1 ? [...targetsByKey.values()][0] : null;
}

export function createBoardAgentSessionDragTransaction<
	TSession extends Readonly<{ id: string }>,
>(
	session: TSession,
	origin: BoardAgentSessionDragOrigin,
	pointer: BoardAgentSessionDragPointer,
	zones: readonly BoardAgentSessionDropZone[],
): BoardAgentSessionDragTransaction<TSession> {
	return {
		origin,
		pointer,
		session,
		target: resolveBoardAgentSessionDropTarget(origin, pointer, zones),
	};
}

export function updateBoardAgentSessionDragTransaction<
	TSession extends Readonly<{ id: string }>,
>(
	transaction: BoardAgentSessionDragTransaction<TSession>,
	pointer: BoardAgentSessionDragPointer,
	zones: readonly BoardAgentSessionDropZone[],
): BoardAgentSessionDragTransaction<TSession> {
	return {
		...transaction,
		pointer,
		target: resolveBoardAgentSessionDropTarget(transaction.origin, pointer, zones),
	};
}

export function cancelBoardAgentSessionDragTransaction<
	TSession extends Readonly<{ id: string }>,
>(
	transaction: BoardAgentSessionDragTransaction<TSession>,
): BoardAgentSessionDragTransaction<TSession> {
	return transaction.target ? { ...transaction, target: null } : transaction;
}

export function resolveBoardAgentSessionDropAction(
	transaction: BoardAgentSessionDragTransaction,
): BoardAgentSessionDropAction {
	const { origin, session, target } = transaction;
	if (!target) {
		return { kind: "none" };
	}

	switch (target.kind) {
		case "untracked":
			return origin.kind === "attached"
				? { kind: "detach", sessionId: session.id, sourceCardCode: origin.sourceCardCode }
				: { kind: "none" };
		case "unlink":
			return origin.kind === "attached" && target.cardCode === origin.sourceCardCode
				? { kind: "detach", sessionId: session.id, sourceCardCode: origin.sourceCardCode }
				: { kind: "none" };
		case "attach":
			if (origin.kind === "attached") {
				return target.cardCode !== origin.sourceCardCode
					? {
						kind: "move",
						sessionId: session.id,
						sourceCardCode: origin.sourceCardCode,
						targetCardCode: target.cardCode,
					}
					: { kind: "none" };
			}
			return { kind: "attach", sessionId: session.id, targetCardCode: target.cardCode };
		default: {
			const exhaustive: never = target;
			return exhaustive;
		}
	}
}
