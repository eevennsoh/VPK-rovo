import type { GalleryItem } from "@/components/blocks/gallery";

export const JIRA_AGENTS_GALLERY_ITEMS: readonly GalleryItem[] = [
	{
		id: "work-item",
		title: "Work Item",
		description: "A focused view of a single Jira work item and the details that move it forward.",
		size: "portrait",
	},
	{
		id: "kanban-list",
		title: "Kanban & List",
		titleLines: ["Kanban", "& List"],
		description: "Board and list perspectives for organizing work across teams and statuses.",
		size: "landscape",
	},
];
