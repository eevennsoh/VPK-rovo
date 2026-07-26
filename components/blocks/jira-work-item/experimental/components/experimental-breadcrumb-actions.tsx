"use client";

import { useState } from "react";

import { MetadataRail } from "@/components/blocks/jira-work-item/experimental/components/metadata-rail";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { usePanelLayout } from "@/components/blocks/jira-work-item/experimental/context-panel-layout";
import PanelRightIcon from "@atlaskit/icon/core/panel-right";
import ShrinkDiagonalIcon from "@atlaskit/icon/core/shrink-diagonal";

/**
 * Breadcrumb-row action cluster for the experimental Jira Work Item work item:
 * a metadata-panel toggle plus a (visual-only) collapse control that sit left of
 * the dialog's close button. The panel toggle collapses/expands the right-hand
 * metadata column via the shared `PanelLayoutProvider`.
 *
 * While the rail is collapsed, the toggle also anchors a hover-opened dropdown
 * that previews the metadata rail directly beneath the icon. Anchoring the
 * preview to the trigger (via the Base UI `Popover`, which keeps itself open as
 * the pointer travels from trigger into the popup) removes the long mouse trip
 * and the dead gap of the old right-edge peek overlay, where a slow pointer used
 * to cross empty space and trigger a premature dismiss. Clicking still commits
 * the rail to its docked version.
 */
export function ExperimentalBreadcrumbActions() {
	const { metadataCollapsed, metadataTogglePending, toggleMetadata } = usePanelLayout();
	const [metadataPreviewOpen, setMetadataPreviewOpen] = useState(false);

	const toggleButton = (
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
	);

	return (
		<>
			{/*
			 * The Popover wrapper stays mounted so the trigger element remains stable.
			 * Its open state is controlled because Base UI otherwise classifies the
			 * collapse click as a persistent click-opened popover, which deliberately
			 * ignores the hover pointer-leave close path. Only subsequent hover events
			 * may open the collapsed preview. `delay` keeps a deliberate hover from
			 * flickering; `closeDelay` gives the pointer a forgiving window to reach
			 * the popup before it closes.
			 */}
			<Popover
				open={metadataCollapsed && metadataPreviewOpen}
				onOpenChange={(open, eventDetails) => {
					if (eventDetails.reason === "trigger-press") {
						eventDetails.cancel();
						setMetadataPreviewOpen(false);
						return;
					}
					setMetadataPreviewOpen(open);
				}}
			>
				<PopoverTrigger
					closeDelay={80}
					delay={120}
					openOnHover={metadataCollapsed}
					render={toggleButton}
				/>
				{metadataCollapsed ? (
					<PopoverContent
						align="end"
						aria-label="Work item details preview"
						className="max-h-[min(32rem,var(--available-height))] w-[clamp(320px,34vw,408px)] overflow-y-auto border-0 p-0 shadow-2xl dark:shadow-2xl [[data-color-mode=dark]_&]:shadow-2xl"
						// The work-item dialog paints at z-[500]/[501]; the popover portal
						// defaults to z-[200], so without this it mounts but is painted
						// behind the dialog (visible in CSS, invisible on screen). Lift the
						// positioner above the dialog so the preview actually shows.
						positionerClassName="z-[600]"
					>
						<MetadataRail borderless />
					</PopoverContent>
				) : null}
			</Popover>
			<Button aria-label="Collapse" size="icon" variant="ghost">
				<ShrinkDiagonalIcon label="" />
			</Button>
		</>
	);
}
