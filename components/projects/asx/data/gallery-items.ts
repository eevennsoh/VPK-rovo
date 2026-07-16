import type { GalleryItem } from "@/components/blocks/gallery";

/**
 * ASX (Agent Sessions Experience) design-pattern catalog.
 *
 * Each entry is one design pattern the gallery carousel showcases. The card is a
 * labeled dock tile; selecting it reveals the pattern's design in the gallery
 * stage (see the `renderSelectedItem` prop in `../page.tsx`). Card Kanban shows a
 * single jira-issue card transitioning across agent activity states, while
 * Kanban and List show their full Jira blocks. Rovo reuses the `sidebar-chat`
 * project verbatim as an in-stage sidebar chat panel. The others (including For
 * you) are title placeholders until their design is added. Order: Card Kanban,
 * Kanban, List, Queue, Work item, Terminal, Rovo, For you.
 */
export const ASX_GALLERY_ITEMS: readonly GalleryItem[] = [
	{
		id: "card",
		title: "Card Kanban",
		description: "A single work-item card that transitions across agent activity states.",
		size: "portrait",
	},
	{
		id: "kanban",
		title: "Kanban",
		description: "A board of agent-session work items grouped into status columns.",
		size: "landscape",
	},
	{
		id: "list",
		title: "List",
		description: "A single-column list view of agent-session work items.",
		size: "1x1",
	},
	{
		id: "queue",
		title: "Queue",
		description: "A prioritized queue of agent sessions waiting to run.",
		size: "portrait",
	},
	{
		id: "work-item",
		title: "Work item",
		description: "A single agent-session work item opened in detail.",
		size: "1x1",
	},
	{
		id: "terminal",
		title: "Terminal",
		description: "A terminal-style view of agent sessions driven from the command line.",
		size: "landscape",
	},
	{
		id: "rovo",
		title: "Rovo",
		description: "A sidebar chat panel for conversing with Rovo agents.",
		size: "portrait",
	},
	{
		id: "for-you",
		title: "For you",
		description: "A personalized feed of agent-session updates and suggestions.",
		size: "1x1",
	},
];
