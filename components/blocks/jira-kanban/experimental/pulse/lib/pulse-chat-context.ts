import type { ChatContextBarDescriptor } from "@/components/projects/shared/lib/chat-context-bar";
import type { PulseScope } from "@/components/blocks/jira-kanban/experimental/pulse/types";

/**
 * Document flag the viewport Rovo overlay watches. Insights owns an embedded
 * chat in the work rail, so the floating launcher and floating panel stay off
 * while this subtree is mounted — the same contract as `data-jira-work-item-open`.
 */
export const PULSE_OPEN_DATASET_KEY = "jiraPulseOpen";

export function toPulseChatContextBar(
	scope: PulseScope | null,
	projectLabel: string,
): ChatContextBarDescriptor {
	if (scope === null) {
		return {
			iconName: "board",
			label: projectLabel,
			showDismissPlaceholder: false,
			signature: "pulse-week",
		};
	}

	return {
		iconName: "work-item",
		label: `${scope.key}: ${scope.name}`,
		showDismissPlaceholder: false,
		signature: `pulse-scope:${scope.id}`,
	};
}
