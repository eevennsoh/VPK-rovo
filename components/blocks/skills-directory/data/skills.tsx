import { type ReactElement } from "react";
import AngleBracketsIcon from "@atlaskit/icon/core/angle-brackets";
import CalendarIcon from "@atlaskit/icon/core/calendar";
import ChartTrendUpIcon from "@atlaskit/icon/core/chart-trend-up";
import CommentIcon from "@atlaskit/icon/core/comment";
import CurlyBracketsIcon from "@atlaskit/icon/core/curly-brackets";
import EditIcon from "@atlaskit/icon/core/edit";
import LinkIcon from "@atlaskit/icon/core/link";
import PageIcon from "@atlaskit/icon/core/page";
import SearchIcon from "@atlaskit/icon/core/search";
import VideoIcon from "@atlaskit/icon/core/video";

/** Stable category ids, mirrored by the `Category` sidebar group. */
export type SkillCategory =
	| "project-management"
	| "administrative-tools"
	| "content-communication"
	| "data-analytics"
	| "software-development";

export type SkillIconKey =
	| "page"
	| "comment"
	| "curly-brackets"
	| "video"
	| "edit"
	| "chart-trend-up"
	| "angle-brackets"
	| "link"
	| "calendar"
	| "search";

export interface SkillsDirectorySkill {
	id: string;
	name: string;
	description: string;
	icon: SkillIconKey;
	/** Decorative Tailwind text-color class applied to the leading icon. */
	iconColor: string;
	publisher: string;
	/** Small publisher logo shown beside the publisher name in the card footer. */
	publisherLogoSrc: string;
	starCount: number;
	viewCount: number;
	category: SkillCategory;
}

/** Resolves a skill icon key to a raw Atlaskit icon element (color inherits from the parent). */
export function getSkillIcon(icon: SkillIconKey): ReactElement {
	switch (icon) {
		case "comment":
			return <CommentIcon label="" color="currentColor" />;
		case "curly-brackets":
			return <CurlyBracketsIcon label="" color="currentColor" />;
		case "video":
			return <VideoIcon label="" color="currentColor" />;
		case "edit":
			return <EditIcon label="" color="currentColor" />;
		case "chart-trend-up":
			return <ChartTrendUpIcon label="" color="currentColor" />;
		case "angle-brackets":
			return <AngleBracketsIcon label="" color="currentColor" />;
		case "link":
			return <LinkIcon label="" color="currentColor" />;
		case "calendar":
			return <CalendarIcon label="" color="currentColor" />;
		case "search":
			return <SearchIcon label="" color="currentColor" />;
		case "page":
		default:
			return <PageIcon label="" color="currentColor" />;
	}
}

const ATLASSIAN_LOGO = "/1p/atlassian.svg";
const GOOGLE_LOGO = "/3p/google-drive/16.svg";
const MICROSOFT_LOGO = "/3p/microsoft-teams/16.svg";
const NOTION_LOGO = "/3p/notion/16.svg";
const SLACK_LOGO = "/3p/slack/16.svg";

export const DEFAULT_SKILLS: readonly SkillsDirectorySkill[] = [
	{
		id: "create-page",
		name: "Create page",
		description: "Create a new formatted, rich text document or page in Confluence.",
		icon: "page",
		iconColor: "text-blue-500",
		publisher: "Atlassian",
		publisherLogoSrc: ATLASSIAN_LOGO,
		starCount: 38,
		viewCount: 6273,
		category: "content-communication",
	},
	{
		id: "create-channel",
		name: "Create channel",
		description: "Create a new channel in Microsoft Teams.",
		icon: "comment",
		iconColor: "text-purple-500",
		publisher: "Microsoft",
		publisherLogoSrc: MICROSOFT_LOGO,
		starCount: 38,
		viewCount: 6273,
		category: "content-communication",
	},
	{
		id: "create-doc",
		name: "Create doc",
		description: "Create and share documents with your team in Google Docs.",
		icon: "page",
		iconColor: "text-green-500",
		publisher: "Google",
		publisherLogoSrc: GOOGLE_LOGO,
		starCount: 38,
		viewCount: 6273,
		category: "content-communication",
	},
	{
		id: "edit-page",
		name: "Edit page",
		description: "Modify an existing document or page to update information or formatting.",
		icon: "edit",
		iconColor: "text-blue-500",
		publisher: "Atlassian",
		publisherLogoSrc: ATLASSIAN_LOGO,
		starCount: 42,
		viewCount: 6274,
		category: "content-communication",
	},
	{
		id: "view-page",
		name: "View page",
		description: "Access and read the content of a document or page shared in Confluence.",
		icon: "page",
		iconColor: "text-blue-500",
		publisher: "Atlassian",
		publisherLogoSrc: ATLASSIAN_LOGO,
		starCount: 45,
		viewCount: 6275,
		category: "content-communication",
	},
	{
		id: "share-code",
		name: "Share code",
		description: "Send a link to the repo or code to collaborators via email or messaging.",
		icon: "curly-brackets",
		iconColor: "text-green-500",
		publisher: "Atlassian",
		publisherLogoSrc: ATLASSIAN_LOGO,
		starCount: 30,
		viewCount: 6276,
		category: "software-development",
	},
	{
		id: "delete-page",
		name: "Delete page",
		description: "Remove a document or page permanently from Confluence.",
		icon: "page",
		iconColor: "text-red-500",
		publisher: "Atlassian",
		publisherLogoSrc: ATLASSIAN_LOGO,
		starCount: 25,
		viewCount: 6277,
		category: "content-communication",
	},
	{
		id: "export-video",
		name: "Export video",
		description: "Download the video in various formats like MOV and MP4.",
		icon: "video",
		iconColor: "text-pink-500",
		publisher: "Atlassian",
		publisherLogoSrc: ATLASSIAN_LOGO,
		starCount: 50,
		viewCount: 6278,
		category: "content-communication",
	},
	{
		id: "review-pull-request",
		name: "Review pull request",
		description: "Summarize diffs and surface review-worthy changes across a pull request.",
		icon: "angle-brackets",
		iconColor: "text-teal-500",
		publisher: "Atlassian",
		publisherLogoSrc: ATLASSIAN_LOGO,
		starCount: 61,
		viewCount: 8120,
		category: "software-development",
	},
	{
		id: "summarize-thread",
		name: "Summarize thread",
		description: "Condense a long conversation into the decisions, owners, and next steps.",
		icon: "comment",
		iconColor: "text-purple-500",
		publisher: "Slack",
		publisherLogoSrc: SLACK_LOGO,
		starCount: 54,
		viewCount: 7045,
		category: "content-communication",
	},
	{
		id: "schedule-meeting",
		name: "Schedule meeting",
		description: "Find a time that works for everyone and create a calendar invite.",
		icon: "calendar",
		iconColor: "text-orange-500",
		publisher: "Google",
		publisherLogoSrc: GOOGLE_LOGO,
		starCount: 33,
		viewCount: 5210,
		category: "administrative-tools",
	},
	{
		id: "build-report",
		name: "Build report",
		description: "Turn raw metrics into a narrative report your stakeholders will read.",
		icon: "chart-trend-up",
		iconColor: "text-teal-500",
		publisher: "Notion",
		publisherLogoSrc: NOTION_LOGO,
		starCount: 47,
		viewCount: 6940,
		category: "data-analytics",
	},
];

/** Convenience lookup for sidebar references (e.g. Favourites). */
export function getSkillById(
	skills: readonly SkillsDirectorySkill[],
	id: string,
): SkillsDirectorySkill | undefined {
	return skills.find((skill) => skill.id === id);
}
