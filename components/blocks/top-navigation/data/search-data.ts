/**
 * Search suggestions data for the navigation search panel
 */

export interface RecentItem {
	title: string;
	metadata: string;
	timestamp: string;
}

export const RECENT_SEARCHES = [
	"2026 OKR planning",
	"Boysenberry",
	"JSM AI Control Tower",
] as const;

export const RECENT_ITEMS: RecentItem[] = [
	{
		title: "DAC1: At T'25, combine Search and Chat into Home",
		metadata: "Page • Platform Apps",
		timestamp: "You viewed 19 hours ago",
	},
	{
		title: "KG x DH 1:1 notes",
		metadata: "Page • David Hoang",
		timestamp: "You viewed 19 hours ago",
	},
	{
		title: "Global - Flex Wallet: Powering your lifestyle",
		metadata: "Page • G'day.",
		timestamp: "You viewed 20 hours ago",
	},
	{
		title: "Personal Development - Learning Budget - A little guidance",
		metadata: "Page • Employee Resource Groups",
		timestamp: "You viewed 20 hours ago",
	},
	{
		title: "Fireside Chat with David & Siva",
		metadata: "Page • Design",
		timestamp: "You viewed 1 day ago",
	},
];

export interface FilterButton {
	icon?: string;
	label: string;
	type: "space" | "contributor" | "external";
}

export const FILTER_BUTTONS = {
	left: [
		{ label: "Space", type: "space" as const },
		{ label: "Contributor", type: "contributor" as const },
	],
	right: [
		{ label: "Google Drive", type: "external" as const },
		{ label: "Slack", type: "external" as const },
	],
} as const;
