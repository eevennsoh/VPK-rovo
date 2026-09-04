import type { ApproveTarget } from "@/components/blocks/agent-session/agent-session-approve";
import type { UntrackedWorkTriage } from "@/components/blocks/agent-session/untracked-work-triage";

import type { BulkActionId, EffectiveSelection } from "./untracked-selection";

export function runBulkAction<T>(
	id: BulkActionId,
	selection: EffectiveSelection,
	deps: Readonly<{
		approveTargetById: ReadonlyMap<string, ApproveTarget<T>>;
		triage: UntrackedWorkTriage<T>;
	}>,
): void {
	if (selection.kind === "empty") {
		return;
	}

	switch (id) {
		case "approve":
			for (const item of selection.items) {
				const target = deps.approveTargetById.get(item.id);
				if (target?.kind === "work-item") {
					deps.triage.attach(item, target.target);
				}
			}
			return;
		case "create":
			for (const item of selection.items) {
				const target = deps.approveTargetById.get(item.id);
				if (target?.kind === "unavailable" && target.reason === "already-attached") {
					continue;
				}
				deps.triage.createFrom(item);
			}
			return;
		case "archive":
			for (const item of selection.items) {
				deps.triage.archive(item);
			}
			return;
		default: {
			const exhaustive: never = id;
			return exhaustive;
		}
	}
}
