"use client";

import { Button } from "@/components/ui/button";
import LayoutTwoColumnsSidebarRightIcon from "@atlaskit/icon/core/layout-two-columns-sidebar-right";
import ShrinkDiagonalIcon from "@atlaskit/icon/core/shrink-diagonal";

/**
 * Breadcrumb-row action cluster for the experimental Agent Sessions work item:
 * visual-only panel-toggle + collapse controls that sit left of the dialog's
 * close button. Mirrors the standard ModalHeader icon-button styling.
 */
export function ExperimentalBreadcrumbActions() {
	return (
		<>
			<Button aria-label="Toggle side panel" size="icon" variant="outline">
				<LayoutTwoColumnsSidebarRightIcon label="" />
			</Button>
			<Button aria-label="Collapse" size="icon" variant="outline">
				<ShrinkDiagonalIcon label="" />
			</Button>
		</>
	);
}
