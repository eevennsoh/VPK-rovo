import type { WorkItemData } from "@/app/contexts/context-work-item-modal";
import { BOARD_COLUMNS } from "@/components/projects/jira/data/board-data";
import type { LozengeProps } from "@/components/ui/lozenge";
import type { RichTextSuggestionMenuItem } from "@/components/ui-custom/rich-text-editor";

export type PriorityValue = NonNullable<WorkItemData["priority"]>;
type LozengeVariant = NonNullable<LozengeProps["variant"]>;

export const STATUS_PHASES: readonly string[] = BOARD_COLUMNS.map((column) => column.title);
export const PRIORITY_OPTIONS: readonly PriorityValue[] = ["Highest", "High", "Medium", "Low", "Lowest"];

export function statusVariant(status: string): LozengeVariant {
	const index = STATUS_PHASES.indexOf(status);
	if (index >= 0 && index === STATUS_PHASES.length - 1) {
		return "success";
	}
	if (index <= 0) {
		return "neutral";
	}
	return "information";
}

export function filterMetadataSearchItems(
	items: readonly RichTextSuggestionMenuItem[],
	query: string,
): readonly RichTextSuggestionMenuItem[] {
	const normalizedQuery = query.trim().toLowerCase();
	if (!normalizedQuery) {
		return items;
	}

	return items.filter((item) => {
		const haystack = `${item.label} ${item.description ?? ""}`.toLowerCase();
		return haystack.includes(normalizedQuery);
	});
}
