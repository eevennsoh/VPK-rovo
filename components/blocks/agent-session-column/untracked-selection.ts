import type { ApproveTarget } from "@/components/blocks/agent-session/agent-session-approve";
import type { AgentSessionItem } from "@/components/blocks/agent-session/agent-session-types";

export interface SelectionMarks {
	readonly markedIds: ReadonlySet<string>;
}

export const NO_SELECTION_MARKS: SelectionMarks = {
	markedIds: new Set(),
};

export type SelectionEvent =
	| { readonly type: "toggle"; readonly id: string }
	| { readonly type: "clear" };

export function reduceSelectionMarks(
	marks: SelectionMarks,
	event: SelectionEvent,
): SelectionMarks {
	switch (event.type) {
		case "toggle": {
			const next = new Set(marks.markedIds);
			if (next.has(event.id)) {
				next.delete(event.id);
				return next.size === 0 ? NO_SELECTION_MARKS : { markedIds: next };
			}

			next.add(event.id);
			return { markedIds: next };
		}
		case "clear":
			return marks.markedIds.size === 0 ? marks : NO_SELECTION_MARKS;
		default: {
			const exhaustive: never = event;
			return exhaustive;
		}
	}
}

export type EffectiveSelection =
	| { readonly kind: "empty" }
	| { readonly kind: "active"; readonly items: readonly [AgentSessionItem, ...AgentSessionItem[]] };

export function selectEffectiveSelection(
	marks: SelectionMarks,
	visibleItems: readonly AgentSessionItem[],
): EffectiveSelection {
	if (marks.markedIds.size === 0) {
		return { kind: "empty" };
	}

	const selected = visibleItems.filter((item: AgentSessionItem) => marks.markedIds.has(item.id));
	const [first, ...rest] = selected;
	if (first === undefined) {
		return { kind: "empty" };
	}

	return { kind: "active", items: [first, ...rest] };
}

export type SelectionActionId = "approve" | "create" | "archive" | "clear";

export type BulkActionId = Exclude<SelectionActionId, "clear">;

export type SelectionActionHint =
	| { readonly kind: "available"; readonly text: string }
	| { readonly kind: "unavailable"; readonly text: string };

export const SELECTION_ACTION_AVAILABLE_COPY: Readonly<
	Record<SelectionActionId, (selectedCount: number) => string>
> = {
	approve: () => "Link agent sessions",
	archive: (selectedCount: number) => (
		selectedCount === 1
			? `Archive ${selectedCount} agent session`
			: `Archive ${selectedCount} agent sessions`
	),
	clear: () => "Clear",
	create: (selectedCount: number) => (
		selectedCount === 1
			? `Create ${selectedCount} work item`
			: `Create ${selectedCount} work items`
	),
};

export const SELECTION_ACTION_UNAVAILABLE_COPY: Readonly<
	Partial<Record<SelectionActionId, string>>
> = {
	approve: "No selected sessions have a work item to link",
	create: "No selected sessions can create a work item",
};

export function describeSelectionAction(
	id: SelectionActionId,
	counts: Readonly<{ eligibleCount: number; selectedCount: number }>,
): SelectionActionHint {
	const unavailable = SELECTION_ACTION_UNAVAILABLE_COPY[id];
	if (counts.eligibleCount === 0 && unavailable !== undefined) {
		return { kind: "unavailable", text: unavailable };
	}

	return {
		kind: "available",
		text: SELECTION_ACTION_AVAILABLE_COPY[id](counts.selectedCount),
	};
}

export interface SelectionActionModel {
	readonly eligibleCount: number;
	readonly hint: SelectionActionHint;
	readonly id: SelectionActionId;
}

export type UntrackedHeaderModel =
	| {
		readonly kind: "browsing";
		readonly title: string;
		readonly count: number;
	}
	| {
		readonly kind: "selecting";
		readonly count: number;
		readonly actions: readonly SelectionActionModel[];
	};

function canCreateFromTarget<T>(target: ApproveTarget<T> | undefined): boolean {
	if (target === undefined) {
		return true;
	}

	return target.kind === "work-item" || target.reason !== "already-attached";
}

export function buildUntrackedHeaderModel<T>(
	input: Readonly<{
		approveTargetById: ReadonlyMap<string, ApproveTarget<T>>;
		count: number;
		selection: EffectiveSelection;
		title: string;
	}>,
): UntrackedHeaderModel {
	if (input.selection.kind === "empty") {
		return {
			kind: "browsing",
			title: input.title,
			count: input.count,
		};
	}

	let approveCount = 0;
	let createCount = 0;
	for (const item of input.selection.items) {
		const target = input.approveTargetById.get(item.id);
		if (target?.kind === "work-item") {
			approveCount += 1;
		}
		if (canCreateFromTarget(target)) {
			createCount += 1;
		}
	}

	const selectedCount = input.selection.items.length;

	return {
		kind: "selecting",
		count: selectedCount,
		actions: [
			{
				id: "approve",
				eligibleCount: approveCount,
				hint: describeSelectionAction("approve", { eligibleCount: approveCount, selectedCount }),
			},
			{
				id: "create",
				eligibleCount: createCount,
				hint: describeSelectionAction("create", { eligibleCount: createCount, selectedCount }),
			},
			{
				id: "archive",
				eligibleCount: selectedCount,
				hint: describeSelectionAction("archive", { eligibleCount: selectedCount, selectedCount }),
			},
			{
				id: "clear",
				eligibleCount: selectedCount,
				hint: describeSelectionAction("clear", { eligibleCount: selectedCount, selectedCount }),
			},
		],
	};
}
