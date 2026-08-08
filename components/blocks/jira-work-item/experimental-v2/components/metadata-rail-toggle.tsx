"use client";

import type { ReactNode } from "react";

import {
	JiraActivityViewControl,
} from "@/components/blocks/jira-activity";
import { PullRequestSortControl } from "@/components/blocks/jira-work-item/experimental-v2/components/pull-request-sort-control";
import { useMetadataRail } from "@/components/blocks/jira-work-item/experimental-v2/context-metadata-rail";
import type { MetadataRailView } from "@/components/blocks/jira-work-item/experimental-v2/lib/metadata-rail-view";
import { usePanelLayout } from "@/components/blocks/jira-work-item/experimental-v2/context-panel-layout";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { cn } from "@/lib/utils";

/**
 * Outer ButtonGroup segment chrome. `data-slot="button"` + `aria-pressed` keep
 * connected seams / selected edge overlays; the label + optional sort chevron
 * sit inside so the chevron can be an inset ghost control.
 *
 * Focus only recolors the shell’s existing border (`border-ring`) — never an
 * outer ring halo. Trailing segments restore `border-l` while focused so the
 * collapsed join edge turns blue too.
 */
const PANEL_SEGMENT_SHELL_CLASS =
	// `rounded-md` seeds left corners on the first segment; ButtonGroup strips
	// inner / trailing edges and restores `rounded-r-md` on the last child.
	"flex min-w-0 flex-1 items-center rounded-md border border-border bg-transparent text-[0.8rem] hover:bg-bg-neutral-hovered active:bg-bg-neutral-pressed aria-pressed:border-border-selected aria-pressed:bg-bg-selected aria-pressed:text-text-selected aria-pressed:hover:bg-bg-selected-hovered aria-pressed:active:bg-bg-selected-pressed has-[[data-jira-work-item-metadata-rail-panel-label]:focus-visible]:relative has-[[data-jira-work-item-metadata-rail-panel-label]:focus-visible]:z-10 has-[[data-jira-work-item-metadata-rail-panel-label]:focus-visible]:border-ring has-[[data-jira-work-item-metadata-rail-sort-trigger]:focus-visible]:relative has-[[data-jira-work-item-metadata-rail-sort-trigger]:focus-visible]:z-10 has-[[data-jira-work-item-metadata-rail-sort-trigger]:focus-visible]:border-ring";

/**
 * ButtonGroup sets `border-l-0` on trailing segments. While a label/chevron
 * inside is focused, force the left border back so `border-ring` paints all
 * four sides of the existing border (no outer ring, no :before stroke).
 */
const PANEL_SEGMENT_FOCUS_LEFT_BORDER_CLASS =
	"has-[[data-jira-work-item-metadata-rail-panel-label]:focus-visible]:border-l! has-[[data-jira-work-item-metadata-rail-sort-trigger]:focus-visible]:border-l!";

/**
 * Ghost label; selected + focus chrome stay on the shell. Default h-8 matches
 * left chrome. Details fills the shell (`flex-1`); Activity/PR stay
 * content-sized beside the inset chevron (`pe-0` so `gap-1.5` is the full 6px
 * text→icon gap). Kill the Button focus halo — shell owns focus chrome.
 */
const PANEL_SEGMENT_LABEL_CLASS =
	"min-w-0 rounded-none border-0 bg-transparent text-[0.8rem] shadow-none hover:bg-transparent active:bg-transparent focus-visible:border-transparent focus-visible:ring-0! focus-visible:ring-offset-0! aria-pressed:border-transparent aria-pressed:bg-transparent aria-pressed:text-inherit aria-pressed:hover:bg-transparent aria-pressed:active:bg-transparent";

function MetadataRailPanelSegment({
	pressed,
	label,
	onSelect,
	sortControl,
}: Readonly<{
	pressed: boolean;
	label: ReactNode;
	onSelect: () => void;
	sortControl?: ReactNode;
}>) {
	const hasSortControl = sortControl != null;

	return (
		<div
			aria-pressed={pressed || undefined}
			className={cn(
				PANEL_SEGMENT_SHELL_CLASS,
				// Activity / Pull requests: center the packed label+chevron unit;
				// restore collapsed left border while label/chevron is focused.
				hasSortControl ? cn("justify-center", PANEL_SEGMENT_FOCUS_LEFT_BORDER_CLASS) : null,
			)}
			data-slot="button"
		>
			{hasSortControl ? (
				<div className="flex min-w-0 items-center gap-1.5">
					<Button
						aria-pressed={pressed || undefined}
						className={cn(PANEL_SEGMENT_LABEL_CLASS, "pe-0")}
						data-jira-work-item-metadata-rail-panel-label=""
						size="default"
						type="button"
						variant="ghost"
						onClick={onSelect}
					>
						{label}
					</Button>
					{sortControl}
				</div>
			) : (
				// Details: fill the equal-width shell; Button's justify-center
				// keeps the label centered in the cell.
				<Button
					aria-pressed={pressed || undefined}
					className={cn(PANEL_SEGMENT_LABEL_CLASS, "flex-1")}
					data-jira-work-item-metadata-rail-panel-label=""
					size="default"
					type="button"
					variant="ghost"
					onClick={onSelect}
				>
					{label}
				</Button>
			)}
		</div>
	);
}

/**
 * Details / Activity / Pull requests control for the metadata column.
 *
 * Sticky column chrome inside the rail body scrollport, matching left
 * ContextResources. Horizontal `px-3` matches ArtifactPane /
 * Activity rail content. Remains opacity-hidden until the rail body is
 * hovered, or until this control itself is hovered / keyboard-focused
 * (`:focus-visible`) — matching the description-scope reveal pattern without
 * `display: none`, so keyboard users can Tab to it. Body `:focus-within` is
 * intentionally omitted so click-focus in Status/Assignee (and similar) does
 * not leave the toggle stuck visible after pointer leave.
 *
 * Sorting lives in the segmented control: Activity and Pull requests each have
 * a chevron that opens that view’s sort menu (and selects the panel). The tab
 * label still only switches panels. Details has no sort chevron.
 */
export function MetadataRailToggle({
	className,
}: Readonly<{
	className?: string;
}>) {
	const { metadataCollapsed } = usePanelLayout();
	const {
		activePanelView,
		activityChrome,
		pullRequestCount,
		pullRequestSortMode,
		setPanelView,
		setPullRequestSortMode,
	} = useMetadataRail();

	if (metadataCollapsed) {
		return null;
	}

	const selectPanel = (view: MetadataRailView) => {
		setPanelView(view);
	};

	return (
		<div
			className={cn(
				// Shared with left resources chrome: wide pb-7 separates chrome
				// from the first body row (description ↔ Status).
				"shrink-0 @[860px]/agentlayout:pb-7",
				// Hover-reveal only on wide layouts. Narrow / stacked chrome stays
				// fully visible so touch users can still switch panels.
				"transition-opacity duration-normal ease-out @[860px]/agentlayout:opacity-0",
				// Sort menus portal away, so hover drops — keep chrome up while a
				// chevron trigger inside this tree reports aria-expanded.
				"@[860px]/agentlayout:hover:opacity-100 @[860px]/agentlayout:has-[:focus-visible]:opacity-100 @[860px]/agentlayout:has-[[aria-expanded=true]]:opacity-100",
				"@[860px]/agentlayout:group-has-[[data-jira-work-item-metadata-rail-body]:hover]/metadata-rail:opacity-100",
				"motion-reduce:transition-none",
				className,
			)}
			data-jira-work-item-column-chrome-fill="overlay"
			data-jira-work-item-metadata-rail-toggle
		>
			<div
				className="flex w-full items-center px-3"
				data-jira-work-item-metadata-rail-toggle-content
			>
				<ButtonGroup aria-label="Work item panel" className="w-full">
					<MetadataRailPanelSegment
						label="Details"
						pressed={activePanelView === "details"}
						onSelect={() => {
							selectPanel("details");
						}}
					/>
					<MetadataRailPanelSegment
						label="Activity"
						pressed={activePanelView === "activity"}
						sortControl={
							activityChrome != null ? (
								<JiraActivityViewControl
									filter={activityChrome.filter}
									menuAlign="start"
									sortOrder={activityChrome.sortOrder}
									trigger="chevron"
									onFilterChange={activityChrome.onFilterChange}
									onOpenChange={(open) => {
										if (open) {
											selectPanel("activity");
										}
									}}
									onSortOrderChange={activityChrome.onSortOrderChange}
								/>
							) : null
						}
						onSelect={() => {
							selectPanel("activity");
						}}
					/>
					{pullRequestCount > 0 ? (
						<MetadataRailPanelSegment
							label="Pull requests"
							pressed={activePanelView === "pull-requests"}
							sortControl={
								<PullRequestSortControl
									menuAlign="start"
									sortMode={pullRequestSortMode}
									trigger="chevron"
									onOpenChange={(open) => {
										if (open) {
											selectPanel("pull-requests");
										}
									}}
									onSortModeChange={setPullRequestSortMode}
								/>
							}
							onSelect={() => {
								selectPanel("pull-requests");
							}}
						/>
					) : null}
				</ButtonGroup>
			</div>
		</div>
	);
}
