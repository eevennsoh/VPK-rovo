"use client";

import { Button } from "@/components/ui/button";
import { usePanelLayout } from "@/components/blocks/agent-sessions/experimental/context-panel-layout";
import PanelRightIcon from "@atlaskit/icon/core/panel-right";
import ShrinkDiagonalIcon from "@atlaskit/icon/core/shrink-diagonal";

/**
 * Breadcrumb-row action cluster for the experimental Agent Sessions work item:
 * a metadata-panel toggle plus a (visual-only) collapse control that sit left of
 * the dialog's close button. The panel toggle collapses/expands the right-hand
 * metadata column via the shared `PanelLayoutProvider`.
 */
export function ExperimentalBreadcrumbActions() {
	const { metadataCollapsed, metadataTogglePending, toggleMetadata } = usePanelLayout();
	return (
		<>
			<Button
				aria-controls="experimental-work-item-metadata-panel"
				aria-expanded={!metadataCollapsed}
				aria-label={metadataCollapsed ? "Show metadata panel" : "Hide metadata panel"}
				className="aria-expanded:border-transparent aria-expanded:bg-transparent aria-expanded:text-text-subtle aria-expanded:hover:bg-bg-neutral-subtle-hovered aria-expanded:active:bg-bg-neutral-subtle-pressed aria-expanded:[&_svg]:text-icon-subtle"
				disabled={metadataTogglePending}
				size="icon"
				variant="ghost"
				onClick={toggleMetadata}
			>
				<PanelRightIcon label="" />
			</Button>
			<Button aria-label="Collapse" size="icon" variant="ghost">
				<ShrinkDiagonalIcon label="" />
			</Button>
		</>
	);
}
