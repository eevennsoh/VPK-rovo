import type { GalleryItem } from "@/components/blocks/gallery";

/**
 * JGP (Jira Golden Paths) gallery cards.
 *
 * Two cards — "Local session" and "Global session". Selecting a card reveals a
 * presenter-paced walkthrough of that session's screens in the gallery stage,
 * navigated left/right from the top bar (see `renderSelectedItem` in
 * `../page.tsx`, `SessionScreenControls`, and the `useScreenNavigator` hook). The
 * screen sets live in `./session-screens.ts`.
 */
export const JGP_GALLERY_ITEMS: readonly GalleryItem[] = [
	{
		id: "local-session",
		title: "Local session",
		description: "Carl starts JGP-247 with TwG and Claude Code, reviews the result in Jira, then merges it locally.",
		size: "landscape",
	},
	{
		id: "global-session",
		title: "Global session",
		description: "Sarah delegates five Jira tasks to Cursor, unblocks and reviews work in Rovo, then follows up in Jira.",
		size: "landscape",
	},
];
