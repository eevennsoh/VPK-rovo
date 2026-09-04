"use client";

import { useCallback, useMemo, useReducer } from "react";

import { resolveApproveTarget } from "@/components/blocks/agent-session/agent-session-approve";
import type { ApproveTarget } from "@/components/blocks/agent-session/agent-session-approve";
import { selectDragCohort } from "@/components/blocks/agent-session/session-cohort";
import type {
	AgentSessionItem,
	AgentSessionTriageRow,
} from "@/components/blocks/agent-session/agent-session-types";
import type { UntrackedWorkTriage } from "@/components/blocks/agent-session/untracked-work-triage";

import { runBulkAction } from "./untracked-selection-actions";
import {
	buildUntrackedHeaderModel,
	NO_SELECTION_MARKS,
	reduceSelectionMarks,
	selectEffectiveSelection,
	type SelectionActionId,
	type UntrackedHeaderModel,
} from "./untracked-selection";

export interface UntrackedSelection {
	readonly header: UntrackedHeaderModel;
	readonly rows: ReadonlyMap<string, AgentSessionTriageRow>;
	readonly onHeaderAction: (id: SelectionActionId) => void;
}

export function useUntrackedSelection<T>(
	input: Readonly<{
		capturedItemIds?: ReadonlySet<string>;
		count: number;
		getSuggestedWorkItemKey?: (item: AgentSessionItem) => string | undefined;
		getSuggestedWorkItemKeys?: (item: AgentSessionItem) => readonly string[] | undefined;
		title: string;
		triage?: UntrackedWorkTriage<T>;
		visibleItems: readonly AgentSessionItem[];
	}>,
): UntrackedSelection {
	const [marks, dispatch] = useReducer(reduceSelectionMarks, NO_SELECTION_MARKS);
	const triage = input.triage;

	const approveTargetById = useMemo(() => {
		const next = new Map<string, ApproveTarget<T>>();
		if (triage === undefined) {
			return next;
		}

		for (const item of input.visibleItems) {
			next.set(item.id, resolveApproveTarget(item, {
				capturedItemIds: input.capturedItemIds,
				getSuggestedWorkItemKey: input.getSuggestedWorkItemKey,
				getSuggestedWorkItemKeys: input.getSuggestedWorkItemKeys,
				locateTarget: (session: AgentSessionItem, workItemKey: string) => (
					triage.locateTarget(session, workItemKey)
				),
			}));
		}

		return next;
	}, [
		input.capturedItemIds,
		input.getSuggestedWorkItemKey,
		input.getSuggestedWorkItemKeys,
		input.visibleItems,
		triage,
	]);

	const selection = useMemo(
		() => selectEffectiveSelection(marks, input.visibleItems),
		[input.visibleItems, marks],
	);

	const header = useMemo(
		() => buildUntrackedHeaderModel({
			approveTargetById,
			count: input.count,
			selection,
			title: input.title,
		}),
		[approveTargetById, input.count, input.title, selection],
	);

	const rows = useMemo(() => {
		const next = new Map<string, AgentSessionTriageRow>();
		if (triage === undefined) {
			return next;
		}

		for (const item of input.visibleItems) {
			const target = approveTargetById.get(item.id);
			if (target === undefined) {
				continue;
			}

			next.set(item.id, {
				approve: {
					onApprove: () => {
						if (target.kind === "work-item") {
							triage.attach(item, target.target);
						}
					},
					target,
				},
				drag: {
					cohort: () => selectDragCohort(item.id, marks, input.visibleItems),
				},
				mark: {
					isMarked: marks.markedIds.has(item.id),
					onToggle: () => {
						dispatch({ id: item.id, type: "toggle" });
					},
				},
			});
		}

		return next;
	}, [approveTargetById, input.visibleItems, marks, triage]);

	const onHeaderAction = useCallback((id: SelectionActionId) => {
		if (id === "clear") {
			dispatch({ type: "clear" });
			return;
		}

		if (triage === undefined) {
			return;
		}

		runBulkAction(id, selection, { approveTargetById, triage });
		dispatch({ type: "clear" });
	}, [approveTargetById, selection, triage]);

	return {
		header,
		onHeaderAction,
		rows,
	};
}
