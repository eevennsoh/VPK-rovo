"use client";

import { Button } from "@/components/ui/button";
import { usePanelLayout } from "@/components/blocks/agent-sessions/experimental/context-panel-layout";
import PanelRightIcon from "@atlaskit/icon/core/panel-right";
import ShrinkDiagonalIcon from "@atlaskit/icon/core/shrink-diagonal";

/**
 * Breadcrumb-row action cluster for the experimental Agent Sessions work item:
 * a metadata-panel toggle plus a (visual-only) collapse control that sit left of
 * the dialog's close button. Mirrors the standard ModalHeader icon-button
 * styling. The panel toggle collapses/expands the right-hand metadata column via
 * the shared `PanelLayoutProvider`.
 */
export function ExperimentalBreadcrumbActions() {
	const { metadataCollapsed, toggleMetadata } = usePanelLayout();
	return (
		<>
			<Button
				aria-label="Toggle side panel"
				aria-pressed={!metadataCollapsed}
				size="icon"
				variant="outline"
				onClick={toggleMetadata}
			>
				<PanelRightIcon label="" />
			</Button>
			<Button aria-label="Collapse" size="icon" variant="outline">
				<ShrinkDiagonalIcon label="" />
			</Button>
		</>
	);
}
