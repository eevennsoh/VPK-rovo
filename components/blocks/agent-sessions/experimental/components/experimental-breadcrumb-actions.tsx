"use client";

import { MetadataRail } from "@/components/blocks/agent-sessions/experimental/components/metadata-rail";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { usePanelLayout } from "@/components/blocks/agent-sessions/experimental/context-panel-layout";
import PanelRightIcon from "@atlaskit/icon/core/panel-right";
import ShrinkDiagonalIcon from "@atlaskit/icon/core/shrink-diagonal";

/**
 * Breadcrumb-row action cluster for the experimental Agent Sessions work item:
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
			 * The Popover wrapper is always mounted so the trigger element is stable:
			 * collapsing the rail while the pointer already rests on the toggle must
			 * not remount it, otherwise Base UI never sees a `pointerenter` and the
			 * hover preview silently fails to open. `openOnHover` is simply gated to
			 * the collapsed state — expanded, the toggle is a plain click-to-dock
			 * button with no preview. `delay` keeps a deliberate hover from
			 * flickering; `closeDelay` gives the pointer a forgiving window to reach
			 * the popup before it closes.
			 */}
			<Popover>
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
						className="max-h-[min(32rem,var(--available-height))] w-[clamp(320px,34vw,408px)] overflow-y-auto p-0"
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
