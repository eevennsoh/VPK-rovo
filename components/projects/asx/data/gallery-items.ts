import type { GalleryItem } from "@/components/blocks/gallery";

/**
 * ASX (Agent Sessions Experience) design-pattern catalog.
 *
 * Each entry is one design pattern the gallery carousel showcases. The card is a
 * labeled dock tile; selecting it reveals the pattern's design in the gallery
 * stage (see the `renderSelectedItem` prop in `../page.tsx`). Kanban shows the
 * real jira-kanban board; the others are title placeholders until their design
 * is added. Order: Card Kanban, Kanban, List, Queue, Work item, Terminal.
 */
export const ASX_GALLERY_ITEMS: readonly GalleryItem[] = [
	{
		id: "card",
		title: "Card Kanban",
		description: "A grid of agent-session cards — one tile per session at a glance.",
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
];
