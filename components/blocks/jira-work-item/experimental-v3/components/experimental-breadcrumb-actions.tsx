import { ExperimentalHeaderOverflowMenu } from "@/components/blocks/jira-work-item/experimental-v3/components/experimental-header-overflow-menu";
import { Button } from "@/components/ui/button";
import ShrinkDiagonalIcon from "@atlaskit/icon/core/shrink-diagonal";

/**
 * Breadcrumb-row action for the experimental v3 work item. The metadata rail is
 * intentionally persistent in this variant. Restriction, watcher, and share now
 * live inside the overflow menu, leaving the row with the overflow control, the
 * visual collapse control, and the dialog close button.
 */
export function ExperimentalBreadcrumbActions() {
	return (
		<>
			<ExperimentalHeaderOverflowMenu />
			<Button aria-label="Collapse" size="icon" variant="ghost">
				<ShrinkDiagonalIcon label="" />
			</Button>
		</>
	);
}
