import { ContextHeaderActions } from "@/components/blocks/jira-work-item/experimental-v2/components/context-title-actions";
import { Button } from "@/components/ui/button";
import ShrinkDiagonalIcon from "@atlaskit/icon/core/shrink-diagonal";

/**
 * Breadcrumb-row action for the experimental v2 work item. The metadata rail is
 * intentionally persistent in this variant. Lock, watch, and share sit beside
 * the visual collapse control and the dialog close button.
 */
export function ExperimentalBreadcrumbActions() {
	return (
		<>
			<ContextHeaderActions />
			<Button aria-label="Collapse" size="icon" variant="ghost">
				<ShrinkDiagonalIcon label="" />
			</Button>
		</>
	);
}
