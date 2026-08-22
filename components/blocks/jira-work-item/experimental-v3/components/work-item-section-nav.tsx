"use client";

import type { ReactNode } from "react";

import { useSectionNavigation } from "@/components/blocks/jira-work-item/experimental-v3/context-section-navigation";
import { Badge } from "@/components/ui/badge";
import {
	tabsLineIndicatorClass,
	tabsLineListOverflowClass,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const NAV_LIST_CLASS = "flex h-8 w-fit items-stretch justify-start text-text-subtle";

export const NAV_LINK_CLASS = cn(
	"relative inline-flex h-full items-center justify-center gap-1.5 whitespace-nowrap rounded-sm px-3 text-sm font-medium text-text-subtle no-underline",
	"transition-[background-color,border-radius,color] duration-normal ease-out-practical motion-reduce:transition-none",
	"hover:rounded-t-md hover:bg-bg-neutral-subtle-hovered active:rounded-t-md active:bg-bg-neutral-subtle-pressed",
	"focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
	"after:pointer-events-none after:absolute after:opacity-0 after:transition-opacity after:content-[''] motion-reduce:after:transition-none",
	tabsLineIndicatorClass,
	"aria-[current=location]:text-text-selected aria-[current=location]:after:opacity-100",
);

interface WorkItemSectionNavProps {
	/**
	 * A non-navigation control that sits immediately after the section links.
	 * It is never inserted into the nav list or given link/tab semantics.
	 */
	endControl?: ReactNode;
	onSectionSelect?: () => void;
}

/**
 * Section navigation for the stacked work-item page.
 *
 * Deliberately a `<nav>` of links rather than ARIA tabs. Tab semantics promise
 * exactly one visible panel referenced by `aria-controls`; here every section is
 * on screen at once and the control only moves the scroll position, so
 * `aria-current="location"` describes it truthfully. Anchors also give keyboard
 * activation, focus order, and a working no-JS fallback for free.
 *
 * The dialog `auto` row pins this row. An optional `endControl` sits beside the
 * landmark, never inside it, in the same row as the section links.
 */
export function WorkItemSectionNav({
	endControl,
	onSectionSelect,
}: Readonly<WorkItemSectionNavProps>) {
	const { activeSectionId, activityCount, sectionElementId, sections, selectSection } = useSectionNavigation();
	if (sections.length === 0 && endControl == null) return null;

	return (
		<div
			className="@container/resource-row border-b border-border"
			data-work-item-header-navigation
		>
			<div className="flex items-center px-6">
				{sections.length > 0 ? (
					<nav
						aria-label="Work item sections"
						className={cn("min-w-0", tabsLineListOverflowClass)}
						data-work-item-section-nav
					>
						<ul className={NAV_LIST_CLASS}>
							{sections.map((section) => (
								<li className="flex" key={section.id}>
									<a
										aria-current={section.id === activeSectionId ? "location" : undefined}
										className={NAV_LINK_CLASS}
										href={`#${sectionElementId(section.id)}`}
										onClick={(event) => {
											event.preventDefault();
											onSectionSelect?.();
											selectSection(section.id);
										}}
									>
										<span>{section.label}</span>
										{section.id === "activity" && activityCount != null ? (
											<Badge>{activityCount}</Badge>
										) : null}
										{section.diff ? (
											<span className="inline-flex items-center gap-1 tabular-nums">
												<span className="text-text-success">+{section.diff.additions}</span>
												<span className="text-text-danger">-{section.diff.deletions}</span>
											</span>
										) : null}
									</a>
								</li>
							))}
						</ul>
					</nav>
				) : null}
				{endControl != null ? (
					<div
						className={cn("flex h-8 shrink-0", tabsLineListOverflowClass)}
						data-work-item-navigation-end-control
					>
						{endControl}
					</div>
				) : null}
			</div>
		</div>
	);
}
