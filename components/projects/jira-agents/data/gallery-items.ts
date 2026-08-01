import type { GalleryItem } from "@/components/blocks/gallery";

export const JIRA_AGENTS_GALLERY_ITEMS: readonly GalleryItem[] = [
	{
		id: "for-you",
		title: "Jira For You",
		description: "A personalized view of Jira work that brings relevant updates and next steps into focus.",
		size: "1x1",
	},
	{
		id: "kanban-list",
		title: "Kanban & List",
		description: "Board and list perspectives for organizing work across teams and statuses.",
		size: "landscape",
	},
	{
		id: "work-item",
		title: "Work Item",
		description: "A focused view of a single Jira work item and the details that move it forward.",
		size: "portrait",
	},
];
