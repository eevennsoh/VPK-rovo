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
		description: "A golden-path walkthrough of an agent session running on your machine.",
		size: "landscape",
	},
	{
		id: "global-session",
		title: "Global session",
		description: "A golden-path walkthrough of an agent session running in the cloud.",
		size: "landscape",
	},
];
