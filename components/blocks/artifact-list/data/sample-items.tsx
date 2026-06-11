import ChartBarIcon from "@atlaskit/icon/core/chart-bar";
import PageIcon from "@atlaskit/icon/core/page";
import ProjectIcon from "@atlaskit/icon/core/project";

import type { ArtifactListItem } from "@/components/blocks/artifact-list";

// Mirrors the Figma node "Search — Smart link / Card view mini". The third row
// demonstrates the logo variant; the repo ships no `google-sheets` 3P asset, so
// it uses the available `google-drive` mark.
export const SAMPLE_ARTIFACT_ITEMS: readonly ArtifactListItem[] = [
	{
		id: "audience-engagement-report",
		title: "Audience Engagement Report",
		source: "Confluence page",
		owner: "Vitafleet Team",
		icon: <PageIcon label="" />,
	},
	{
		id: "engagement-data",
		title: "Engagement data",
		source: "Analytics",
		owner: "Vitafleet Team",
		icon: <ChartBarIcon label="" />,
	},
	{
		id: "content-variation-analysis",
		title: "Content Variation Analysis",
		source: "Google Spreadsheet",
		owner: "Vitafleet Team",
		logoSrc: "/3p/google-drive/16.svg",
	},
	{
		id: "improve-lead-conversion",
		title: "Improve lead conversion rate by 15%",
		source: "Projects",
		owner: "Vitafleet Team",
		icon: <ProjectIcon label="" />,
	},
];
