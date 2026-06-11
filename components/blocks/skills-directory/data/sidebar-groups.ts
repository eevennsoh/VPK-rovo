import type { SkillCategory } from "@/app/data/directory/skills";
import type { AtlassianLogoName } from "@/components/ui/logo";

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
	| "angle-brackets"
	| "support"
	| "branch"
	| "shield"
	| "people-group"
	| "cart";

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
	logoSrc?: string;
	/** When set, renders the ADS brand logo instead of a `logoSrc` image. */
	logoName?: AtlassianLogoName;
	/**
	 * When true, wrap the logo in a bordered VPK tile. Use for bare marks that
	 * lack their own tile/background (e.g. the Atlassian brand mark, Tempo).
	 */
	needsTile?: boolean;
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
	{ id: "favorite-skills", label: "Favourite skills" },
	{ id: "your-skills", label: "Your skills" },
];

export const DEFAULT_SKILLS_DIRECTORY_SIDEBAR_GROUPS: readonly SkillsDirectorySidebarGroup[] = [
	{
		title: "By companies",
		items: [
			{ kind: "company", id: "atlassian", label: "Atlassian", logoName: "atlassian", needsTile: true },
			{ kind: "company", id: "stripe", label: "Stripe", logoSrc: "/3p/stripe/24.svg" },
			{ kind: "company", id: "tempo", label: "Tempo", logoSrc: "/2p/tempo-software.png", needsTile: true },
			{ kind: "company", id: "google", label: "Google", logoSrc: "/3p/google-drive/24.svg" },
			{ kind: "company", id: "notion", label: "Notion", logoSrc: "/3p/notion/24.svg" },
			{ kind: "company", id: "slack", label: "Slack", logoSrc: "/3p/slack/24.svg" },
			{ kind: "company", id: "figma", label: "Figma", logoSrc: "/3p/figma/24.svg" },
			{ kind: "company", id: "github", label: "GitHub", logoSrc: "/3p/github/24.svg" },
			{ kind: "company", id: "salesforce", label: "Salesforce", logoSrc: "/3p/salesforce/24.svg" },
			{ kind: "company", id: "zoom", label: "Zoom", logoSrc: "/3p/zoom/24.svg" },
			{ kind: "company", id: "asana", label: "Asana", logoSrc: "/3p/asana/24.svg" },
			{ kind: "company", id: "miro", label: "Miro", logoSrc: "/3p/miro/24.svg" },
			{ kind: "company", id: "dropbox", label: "Dropbox", logoSrc: "/3p/dropbox/24.svg" },
			{ kind: "company", id: "gitkraken", label: "GitKraken", logoSrc: "/2p/gitkraken.png", needsTile: true },
			{ kind: "company", id: "appfire", label: "Appfire", logoSrc: "/2p/appfire.png", needsTile: true },
		],
	},
];
