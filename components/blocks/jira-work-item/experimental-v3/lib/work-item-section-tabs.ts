/**
 * Section tabs for the work-item surface.
 *
 * One tab bar serves both modes. Description and Activity are always present —
 * a pull request's overview section is the same thing as the work item's
 * description, and its review conversation is the same thing as the work item's
 * activity, so they share tabs rather than coexisting as separate controls.
 * Guide and Files are extras that only a guided review can supply.
 */

export type WorkItemSectionId = "description" | "activity" | "guide" | "files";

export interface WorkItemSectionDiffStat {
	additions: number;
	deletions: number;
}

export interface WorkItemSectionTab {
	/** Rendered after the label as `+a −d`. */
	diff?: WorkItemSectionDiffStat;
	id: WorkItemSectionId;
	label: string;
}

export interface BuildWorkItemSectionTabsInput {
	/**
	 * Null for the work item, and also for a pull request without a guided
	 * review — such a PR still gets Description and Activity, it just has no
	 * chapters to guide through and no reviewable file set.
	 */
	guidedReview: (WorkItemSectionDiffStat & { fileCount: number }) | null;
}

/**
 * The Activity count is not a field here: it is owned by whichever activity
 * panel is mounted and published separately, so the tab list stays a pure
 * function of the mode and does not churn every time a comment lands.
 */
export function buildWorkItemSectionTabs({
	guidedReview,
}: BuildWorkItemSectionTabsInput): readonly WorkItemSectionTab[] {
	const tabs: WorkItemSectionTab[] = [
		{ id: "description", label: "Description" },
		{ id: "activity", label: "Activity" },
	];
	if (!guidedReview) return tabs;
	tabs.push({ id: "guide", label: "Guide" });
	tabs.push({
		diff: { additions: guidedReview.additions, deletions: guidedReview.deletions },
		id: "files",
		label: `${guidedReview.fileCount} ${guidedReview.fileCount === 1 ? "File" : "Files"}`,
	});
	return tabs;
}

/**
 * Value equality, so a body can publish its tab list on every render without
 * the provider re-rendering on a fresh-but-identical array.
 */
export function areSectionTabsEqual(
	a: readonly WorkItemSectionTab[],
	b: readonly WorkItemSectionTab[],
): boolean {
	if (a.length !== b.length) return false;
	return a.every((tab, index) => {
		const other = b[index];
		return other !== undefined
			&& tab.id === other.id
			&& tab.label === other.label
			&& tab.diff?.additions === other.diff?.additions
			&& tab.diff?.deletions === other.diff?.deletions;
	});
}

/** Stable DOM id so the nav can anchor to a section with a real `href`. */
export function workItemSectionElementId(sectionId: WorkItemSectionId): string {
	return `work-item-section-${sectionId}`;
}

export function workItemSectionHeadingId(sectionId: WorkItemSectionId): string {
	return `work-item-section-heading-${sectionId}`;
}
