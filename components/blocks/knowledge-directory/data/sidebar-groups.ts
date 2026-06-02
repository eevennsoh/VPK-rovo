import type { SkillCategory } from "./skills";

/** Primary (sectionless) nav rows shown above the first group heading. */
export interface KnowledgeDirectoryPrimaryItem {
	id: string;
	label: string;
}

/** Icon keys for the `Category` group tiles (resolved in the sidebar component). */
export type SkillNavIcon =
	| "timeline"
	| "settings"
	| "edit"
	| "chart-trend-up"
	| "angle-brackets";

export interface KnowledgeDirectoryFavouriteItem {
	kind: "skill";
	/** References a skill id in the directory data. */
	id: string;
}

export interface KnowledgeDirectoryCategoryItem {
	kind: "category";
	id: SkillCategory;
	label: string;
	icon: SkillNavIcon;
}

export interface KnowledgeDirectoryCompanyItem {
	kind: "company";
	id: string;
	label: string;
	logoSrc: string;
}

export type KnowledgeDirectorySidebarItem =
	| KnowledgeDirectoryFavouriteItem
	| KnowledgeDirectoryCategoryItem
	| KnowledgeDirectoryCompanyItem;

export interface KnowledgeDirectorySidebarGroup {
	title: string;
	items: readonly KnowledgeDirectorySidebarItem[];
	showAll?: boolean;
}

export const DEFAULT_SKILLS_DIRECTORY_PRIMARY_ITEMS: readonly KnowledgeDirectoryPrimaryItem[] = [
	{ id: "all-skills", label: "All skills" },
	{ id: "favorite-skills", label: "Favorite skills" },
	{ id: "your-skills", label: "Your skills" },
];

export const DEFAULT_SKILLS_DIRECTORY_SIDEBAR_GROUPS: readonly KnowledgeDirectorySidebarGroup[] = [
	{
		title: "Category",
		showAll: true,
		items: [
			{ kind: "category", id: "project-management", label: "Project management", icon: "timeline" },
			{ kind: "category", id: "administrative-tools", label: "Administrative tools", icon: "settings" },
			{ kind: "category", id: "content-communication", label: "Content & communication", icon: "edit" },
			{ kind: "category", id: "data-analytics", label: "Data & analytics", icon: "chart-trend-up" },
			{ kind: "category", id: "software-development", label: "Software development", icon: "angle-brackets" },
		],
	},
	{
		title: "By companies",
		showAll: true,
		items: [
			{ kind: "company", id: "atlassian", label: "Atlassian", logoSrc: "/1p/atlassian.svg" },
			{ kind: "company", id: "stripe", label: "Stripe", logoSrc: "/3p/stripe/24.svg" },
			{ kind: "company", id: "tempo", label: "Tempo", logoSrc: "/avatar-project/stopwatch.svg" },
			{ kind: "company", id: "google", label: "Google", logoSrc: "/3p/google-drive/24.svg" },
			{ kind: "company", id: "notion", label: "Notion", logoSrc: "/3p/notion/24.svg" },
		],
	},
];
