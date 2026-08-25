export interface SourcesPreviewPage {
	id: string;
	title: string;
	href: string;
	updatedAt: Date;
	owner: string;
	snippet: string;
}

export const SOURCES_PREVIEW_PAGES: readonly SourcesPreviewPage[] = [
	{
		id: "about-ust",
		title: "About UST",
		href: "https://hello.atlassian.net/wiki/spaces/UST/pages/5483563868",
		updatedAt: new Date(2025, 5, 26),
		owner: "Amy Glancey",
		snippet:
			"Owner: @Amy Glancey | Last refresh June 2025 | Part of https://hello.atlassian.net/wiki/spaces/UST/pages/5483563868…",
	},
	{
		id: "unified-string-theory",
		title: "Unified String Theory (UST)",
		href: "https://hello.atlassian.net/wiki/spaces/UST/pages/5483563869",
		updatedAt: new Date(2025, 9, 31),
		owner: "Mike Cannon-Brookes",
		snippet:
			"“We will open the book. Its pages are blank. We are going to put words on them ourselves. The book is called Opportunity and its…",
	},
	{
		id: "fy23-archive",
		title: "FY23 Archive | About UST",
		href: "https://hello.atlassian.net/wiki/spaces/UST/pages/5483563870",
		updatedAt: new Date(2024, 5, 27),
		owner: "Amy Glancey",
		snippet:
			"This is an archived version of the UST. For the most up to date version visit go/ust Unified String Theory (UST) is a simple…",
	},
	{
		id: "fy24-archive",
		title: "FY24 Archive | About UST",
		href: "https://hello.atlassian.net/wiki/x/k4sV6",
		updatedAt: new Date(2025, 5, 26),
		owner: "Amy Glancey",
		snippet:
			"Owner @Amy Glancey | Last refresh JULY 2022 | Part of https://hello.atlassian.net/wiki/x/k4sV6 Unified String Theory (US…",
	},
];

const SOURCE_DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
	dateStyle: "medium",
});

export function formatSourcesPreviewDate(date: Date): string {
	return SOURCE_DATE_FORMAT.format(date);
}

export function isConfluenceWikiHref(href: string): boolean {
	try {
		const url = new URL(href);
		return url.hostname.endsWith("atlassian.net") && url.pathname.includes("/wiki");
	} catch {
		return href.includes("/wiki/");
	}
}

/** Matches Smart Link Confluence pages: IconTile `blue` (information tone). */
export function getSourcesPreviewIconTileVariant(
	href: string,
): "blue" | "gray" {
	return isConfluenceWikiHref(href) ? "blue" : "gray";
}
