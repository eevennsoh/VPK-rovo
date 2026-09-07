import type { SessionCohort } from "@/components/blocks/agent-session/session-cohort";
import type {
	JiraListAgentSessionDropIntent,
	JiraListInsertion,
} from "@/components/blocks/jira-list/jira-list-types";
import {
	getInsertionFromRowZone,
	getRowZone,
} from "../../../jira-list/jira-list-row-zone.js";
import {
	distanceFromPointToRect,
	// @ts-expect-error Node's strip-types test runner requires the explicit .ts extension here.
} from "./create-work-item-exclusive-proximity.ts";
import {
	resolveLinkingEffectNearness,
	// Leaf module, not the package barrel: the barrel pulls in the React
	// component and this file is loaded raw by a node:test suite.
	// @ts-expect-error Node's strip-types test runner requires the explicit .ts extension here.
} from "../../../../visual/linking-effect/lifecycle.ts";

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
		columnTitle: string;
		kind: "create";
	}
	| {
		bounds: BoardAgentSessionDropBounds;
		cardCode: string;
		/**
		 * The card's agent shell rect in client coordinates — the surface the
		 * fusion field morphs into. Absent until the coordinator can measure the
		 * shell, so consumers must fall back to `bounds`.
		 */
		dockRect?: BoardAgentSessionDropBounds | null;
		/**
		 * The card's attach chin slot — the row the session actually lands in.
		 * Absent until the chin has opened, so consumers must fall back.
		 */
		kind: "issue";
	}
	| {
		bounds: BoardAgentSessionDropBounds;
		cardCode: string;
		kind: "unlink";
	}
	| {
		bounds: BoardAgentSessionDropBounds;
		issueKey: string;
		kind: "list-row";
		rowIndex: number;
	}
	| {
		bounds: BoardAgentSessionDropBounds;
		kind: "untracked";
	};

export type BoardAgentSessionDropTarget =
	| { cardCode: string; kind: "attach" }
	| { columnTitle: string; kind: "create" }
	| { insertion: JiraListInsertion; kind: "create-list" }
	| { cardCode: string; kind: "unlink" }
	| { kind: "untracked" };

export interface BoardAgentSessionDragTransaction<
	TSession extends Readonly<{ id: string }> = Readonly<{ id: string }>,
> {
	cohort: SessionCohort<TSession>;
	origin: BoardAgentSessionDragOrigin;
	pointer: BoardAgentSessionDragPointer;
	proximity: BoardAgentSessionAttachProximity | null;
	target: BoardAgentSessionDropTarget | null;
}

export type BoardAgentSessionDropAction =
	| { kind: "none" }
	| { kind: "create"; sessionIds: readonly [string, ...string[]]; columnTitle: string }
	| { kind: "create-list"; insertion: JiraListInsertion; sessionIds: readonly [string, ...string[]] }
	| { kind: "detach"; sessionIds: readonly [string, ...string[]]; sourceCardCode: string }
	| { kind: "move"; sessionIds: readonly [string, ...string[]]; sourceCardCode: string; targetCardCode: string }
	| { kind: "attach"; sessionIds: readonly [string, ...string[]]; targetCardCode: string };

function dropActionSessionIds<TSession extends Readonly<{ id: string }>>(
	cohort: SessionCohort<TSession>,
): readonly [string, ...string[]] {
	const [first, ...rest] = cohort.members;
	return [first.id, ...rest.map((member) => member.id)];
}

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
		case "create":
			return `create:${target.columnTitle}`;
		case "create-list":
			return `create-list:${target.insertion.insertAtIndex}`;
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
	pointer: BoardAgentSessionDragPointer,
): BoardAgentSessionDropTarget | null {
	switch (zone.kind) {
		case "create":
			return origin.kind === "untracked"
				? { columnTitle: zone.columnTitle, kind: "create" }
				: null;
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
		case "list-row": {
			const rowHeight = zone.bounds.bottom - zone.bounds.top;
			const rowZone = getRowZone(pointer.y - zone.bounds.top, rowHeight);
			if (rowZone === "drag") {
				if (origin.kind === "attached" && zone.issueKey === origin.sourceCardCode) {
					return null;
				}
				return { cardCode: zone.issueKey, kind: "attach" };
			}
			if (origin.kind !== "untracked") {
				return null;
			}
			const insertion = getInsertionFromRowZone(rowZone, {
				issueKey: zone.issueKey,
				rowIndex: zone.rowIndex,
			});
			return insertion ? { insertion, kind: "create-list" } : null;
		}
		default: {
			const exhaustive: never = zone;
			return exhaustive;
		}
	}
}

export function parseListRowDropZone(
	issueKey: string | undefined,
	rowIndexRaw: string | undefined,
	bounds: BoardAgentSessionDropBounds,
): Extract<BoardAgentSessionDropZone, { kind: "list-row" }> | null {
	if (!issueKey || rowIndexRaw === undefined || rowIndexRaw === "") {
		return null;
	}

	const rowIndex = Number(rowIndexRaw);
	if (!Number.isInteger(rowIndex) || rowIndex < 0) {
		return null;
	}

	return {
		bounds,
		issueKey,
		kind: "list-row",
		rowIndex,
	};
}

export function toListSessionDropIntent(
	target: BoardAgentSessionDropTarget | null,
): JiraListAgentSessionDropIntent {
	if (!target) {
		return { kind: "none" };
	}

	switch (target.kind) {
		case "attach":
			return { kind: "attach", issueKey: target.cardCode };
		case "create-list":
			return { kind: "create", insertion: target.insertion };
		case "create":
		case "unlink":
		case "untracked":
			return { kind: "none" };
		default: {
			const exhaustive: never = target;
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

		const target = toEligibleTarget(origin, zone, pointer);
		if (target) {
			targetsByKey.set(dropTargetKey(target), target);
		}
	}

	// The footer target can overlap the final issue because the card list reveals
	// overflow during a session drag. The explicit create well wins that overlap;
	// two create wells would still be ambiguous rather than choosing by DOM order.
	const createTargets = [...targetsByKey.values()].filter(
		(target): target is Extract<BoardAgentSessionDropTarget, { kind: "create" }> => (
			target.kind === "create"
		),
	);
	if (createTargets.length > 0) {
		return createTargets.length === 1 ? createTargets[0] : null;
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

/** Distance at which an issue card starts reacting to an approaching session. */
export const SESSION_ATTACH_PROXIMITY_RANGE_PX = 120;

export interface BoardAgentSessionAttachProximity {
	bounds: BoardAgentSessionDropBounds;
	cardCode: string;
	/** Euclidean px from the pointer to the issue rect; exactly 0 when inside. */
	distance: number;
	/** The card's agent shell rect, or null when it is not measured. */
	dockRect: BoardAgentSessionDropBounds | null;
	/** The attach chin slot the session lands in, or null before it opens. */
	/** Smoothstep ramp: 1 at distance 0, 0 at or beyond the range. */
	nearness: number;
}

function attachNearnessFromDistance(distance: number): number {
	return resolveLinkingEffectNearness(distance, SESSION_ATTACH_PROXIMITY_RANGE_PX);
}

/**
 * Whether a zone that outranks every issue card already owns this pointer.
 *
 * `resolveBoardAgentSessionDropTarget` short-circuits on eligible `create` and
 * `untracked` zones because both deliberately overlap issue cards — the create
 * well overlaps the final card in its column, and the Untracked rail overlays
 * the trailing status columns. Proximity has to honour the same precedence or a
 * card that cannot receive the drop still arms its full attach affordance.
 */
function hasOutrankingDropZone(
	origin: BoardAgentSessionDragOrigin,
	pointer: BoardAgentSessionDragPointer,
	zones: readonly BoardAgentSessionDropZone[],
): boolean {
	for (const zone of zones) {
		if (zone.kind !== "create" && zone.kind !== "untracked") {
			continue;
		}
		if (!containsPointer(zone.bounds, pointer)) {
			continue;
		}
		if (toEligibleTarget(origin, zone, pointer)) {
			return true;
		}
	}
	return false;
}

/**
 * Continuous companion to `resolveBoardAgentSessionDropTarget`: the nearest
 * eligible issue card and how close the pointer is to it, so the board can
 * respond before the pointer is actually inside a rect.
 *
 * Advisory only in one direction. It never reports ambiguity — two cards under
 * the pointer resolve to one winner, ties preferring the leftmost card and then
 * the first registered zone, matching how `resolveExclusiveProximityWinner`
 * breaks its own ties. It does honour the discrete resolver's cross-zone
 * precedence, so a card underneath the Untracked rail or a create well never
 * advertises an attach the drop will not perform, and the card a session is
 * being dragged off never lights up.
 */
export function resolveBoardAgentSessionAttachProximity(
	origin: BoardAgentSessionDragOrigin,
	pointer: BoardAgentSessionDragPointer,
	zones: readonly BoardAgentSessionDropZone[],
): BoardAgentSessionAttachProximity | null {
	if (hasOutrankingDropZone(origin, pointer, zones)) {
		return null;
	}

	let winner: BoardAgentSessionAttachProximity | null = null;

	for (const zone of zones) {
		if (zone.kind !== "issue") {
			continue;
		}
		if (origin.kind === "attached" && zone.cardCode === origin.sourceCardCode) {
			continue;
		}

		const distance = distanceFromPointToRect(pointer, zone.bounds);
		if (distance >= SESSION_ATTACH_PROXIMITY_RANGE_PX) {
			continue;
		}

		const isCloser = winner === null || distance < winner.distance;
		const isTiePreferLeft = winner !== null
			&& distance === winner.distance
			&& zone.bounds.left < winner.bounds.left;
		if (isCloser || isTiePreferLeft) {
			winner = {
				bounds: zone.bounds,
				cardCode: zone.cardCode,
				distance,
				dockRect: zone.dockRect ?? null,
				nearness: attachNearnessFromDistance(distance),
			};
		}
	}

	return winner;
}

export function createBoardAgentSessionDragTransaction<
	TSession extends Readonly<{ id: string }>,
>(
	cohort: SessionCohort<TSession>,
	origin: BoardAgentSessionDragOrigin,
	pointer: BoardAgentSessionDragPointer,
	zones: readonly BoardAgentSessionDropZone[],
): BoardAgentSessionDragTransaction<TSession> {
	return {
		cohort,
		origin,
		pointer,
		proximity: resolveBoardAgentSessionAttachProximity(origin, pointer, zones),
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
		proximity: resolveBoardAgentSessionAttachProximity(transaction.origin, pointer, zones),
		target: resolveBoardAgentSessionDropTarget(transaction.origin, pointer, zones),
	};
}

export function cancelBoardAgentSessionDragTransaction<
	TSession extends Readonly<{ id: string }>,
>(
	transaction: BoardAgentSessionDragTransaction<TSession>,
): BoardAgentSessionDragTransaction<TSession> {
	// Proximity has to clear alongside the target, otherwise cancelling an
	// approach that never armed a target leaves the card's backdrop lit.
	return transaction.target || transaction.proximity
		? { ...transaction, proximity: null, target: null }
		: transaction;
}

export function resolveBoardAgentSessionDropAction(
	transaction: BoardAgentSessionDragTransaction,
): BoardAgentSessionDropAction {
	const { cohort, origin, target } = transaction;
	if (!target) {
		return { kind: "none" };
	}

	const sessionIds = dropActionSessionIds(cohort);

	switch (target.kind) {
		case "create":
			return origin.kind === "untracked"
				? { columnTitle: target.columnTitle, kind: "create", sessionIds }
				: { kind: "none" };
		case "untracked":
			return origin.kind === "attached"
				? { kind: "detach", sessionIds, sourceCardCode: origin.sourceCardCode }
				: { kind: "none" };
		case "unlink":
			return origin.kind === "attached" && target.cardCode === origin.sourceCardCode
				? { kind: "detach", sessionIds, sourceCardCode: origin.sourceCardCode }
				: { kind: "none" };
		case "attach":
			if (origin.kind === "attached") {
				return target.cardCode !== origin.sourceCardCode
					? {
						kind: "move",
						sessionIds,
						sourceCardCode: origin.sourceCardCode,
						targetCardCode: target.cardCode,
					}
					: { kind: "none" };
			}
			return { kind: "attach", sessionIds, targetCardCode: target.cardCode };
		case "create-list":
			return origin.kind === "untracked"
				? { kind: "create-list", insertion: target.insertion, sessionIds }
				: { kind: "none" };
		default: {
			const exhaustive: never = target;
			return exhaustive;
		}
	}
}
