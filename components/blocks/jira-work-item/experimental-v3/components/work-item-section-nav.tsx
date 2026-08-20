"use client";

import { useSectionNavigation } from "@/components/blocks/jira-work-item/experimental-v3/context-section-navigation";
import { workItemSectionElementId } from "@/components/blocks/jira-work-item/experimental-v3/lib/work-item-section-tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Visual parity with the ADS `line` tab bar, written flat.
 *
 * `components/ui/tabs.tsx` expresses these states through
 * `group-data-[variant=line]/tabs-list:` and `group-data-horizontal/tabs:`
 * ancestors that only its own `Tabs`/`TabsList` emit, so the classes cannot be
 * reused without reconstructing that scaffolding. This nav is always horizontal
 * and always `line`, which collapses the variant switching away.
 */
const NAV_LIST_CLASS = "flex h-8 w-fit items-stretch justify-start border-b border-border text-text-subtle";

const NAV_LINK_CLASS = cn(
	"relative inline-flex h-full items-center justify-center gap-1.5 whitespace-nowrap rounded-sm px-3 text-sm font-medium text-text-subtle no-underline",
	"transition-[background-color,border-radius,color] duration-normal ease-out-practical motion-reduce:transition-none",
	"hover:rounded-t-md hover:bg-bg-neutral-subtle-hovered active:rounded-t-md active:bg-bg-neutral-subtle-pressed",
	"focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
	// Selected indicator — the ADS line-tab underline.
	"after:pointer-events-none after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-border-selected after:opacity-0 after:transition-opacity after:content-[''] motion-reduce:after:transition-none",
	"aria-[current=location]:text-text-selected aria-[current=location]:after:opacity-100",
);

/**
 * Section navigation for the stacked work-item page.
 *
 * Deliberately a `<nav>` of links rather than ARIA tabs. Tab semantics promise
 * exactly one visible panel referenced by `aria-controls`; here every section is
 * on screen at once and the control only moves the scroll position, so
 * `aria-current="location"` describes it truthfully. Anchors also give keyboard
 * activation, focus order, and a working no-JS fallback for free.
 */
export function WorkItemSectionNav() {
	const { activeSectionId, activityCount, sections, selectSection } = useSectionNavigation();
	if (sections.length === 0) return null;

	return (
		<nav
			aria-label="Work item sections"
			className={cn(
				// Narrow: the column chrome is `display: contents`, so this becomes a
				// direct child of the page scroller and has to pin itself. The negative
				// insets bleed the background over the scroller's `p-6` gutter and
				// absorb the column gap so it rests flush at the top.
				"sticky top-0 z-20 -mx-6 -mt-6 bg-surface-overlay px-6 pt-6 pb-2",
				// Wide: the chrome is already a fixed sibling above the scrollport.
				"@[860px]/agentlayout:static @[860px]/agentlayout:z-auto @[860px]/agentlayout:m-0 @[860px]/agentlayout:bg-transparent @[860px]/agentlayout:p-0 @[860px]/agentlayout:pt-2",
			)}
			data-work-item-section-nav
		>
			<ul className={NAV_LIST_CLASS}>
				{sections.map((section) => (
					<li className="flex" key={section.id}>
						<a
							aria-current={section.id === activeSectionId ? "location" : undefined}
							className={NAV_LINK_CLASS}
							href={`#${workItemSectionElementId(section.id)}`}
							onClick={(event) => {
								event.preventDefault();
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
	);
}
