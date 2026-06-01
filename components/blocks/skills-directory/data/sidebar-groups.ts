import type { SkillCategory } from "./skills";

/** Primary (sectionless) nav rows shown above the first group heading. */
export interface SkillsDirectoryPrimaryItem {
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

export interface SkillsDirectoryFavouriteItem {
	kind: "skill";
	/** References a skill id in the directory data. */
	id: string;
}

export interface SkillsDirectoryCategoryItem {
	kind: "category";
	id: SkillCategory;
	label: string;
	icon: SkillNavIcon;
}

export interface SkillsDirectoryCompanyItem {
	kind: "company";
	id: string;
	label: string;
	logoSrc: string;
}

export type SkillsDirectorySidebarItem =
	| SkillsDirectoryFavouriteItem
	| SkillsDirectoryCategoryItem
	| SkillsDirectoryCompanyItem;

export interface SkillsDirectorySidebarGroup {
	title: string;
	items: readonly SkillsDirectorySidebarItem[];
	showAll?: boolean;
}

export const DEFAULT_SKILLS_DIRECTORY_PRIMARY_ITEMS: readonly SkillsDirectoryPrimaryItem[] = [
	{ id: "all-skills", label: "All skills" },
	{ id: "favorite-skills", label: "Favorite skills" },
	{ id: "your-skills", label: "Your skills" },
];

export const DEFAULT_SKILLS_DIRECTORY_SIDEBAR_GROUPS: readonly SkillsDirectorySidebarGroup[] = [
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
