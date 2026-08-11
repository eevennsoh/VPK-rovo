/**
 * Seed guided-review progress when opening a PR.
 * Unapproved: nothing checked. Approved: every chapter (restore completed review).
 */
export function resolveInitialReviewedChapterIds(
	review: { readonly chapters: readonly { readonly id: string }[] } | null | undefined,
	approvalState?: "available" | "approved",
): ReadonlySet<string> {
	if (!review) return new Set();
	if (approvalState !== "approved") return new Set();
	return new Set(review.chapters.map((chapter) => chapter.id));
}
