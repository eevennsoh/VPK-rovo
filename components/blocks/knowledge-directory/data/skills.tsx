import { type ReactElement } from "react";
import AngleBracketsIcon from "@atlaskit/icon/core/angle-brackets";
import CalendarIcon from "@atlaskit/icon/core/calendar";
import ChartTrendUpIcon from "@atlaskit/icon/core/chart-trend-up";
import CommentIcon from "@atlaskit/icon/core/comment";
import CurlyBracketsIcon from "@atlaskit/icon/core/curly-brackets";
import EditIcon from "@atlaskit/icon/core/edit";
import LinkIcon from "@atlaskit/icon/core/link";
import MegaphoneIcon from "@atlaskit/icon/core/megaphone";
import PageIcon from "@atlaskit/icon/core/page";
import PaintPaletteIcon from "@atlaskit/icon/core/paint-palette";
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
	| "megaphone"
	| "paint-palette"
	| "search";

export interface KnowledgeDirectoryToolTag {
	id: string;
	name: string;
	icon?: SkillIconKey;
}

export interface KnowledgeDirectoryFileTreeItem {
	id: string;
	label: string;
	kind: "folder" | "file";
	depth?: number;
	expanded?: boolean;
	selected?: boolean;
}

export interface KnowledgeDirectorySkill {
	id: string;
	name: string;
	description: string;
	icon?: SkillIconKey;
	/** Decorative Tailwind text-color class applied to the leading icon. */
	iconColor?: string;
	publisherName?: string;
	publisherAvatarSrc?: string;
	companyId?: string;
	categoryId?: SkillCategory;
	starCount?: number;
	viewCount?: number;
	tools?: readonly KnowledgeDirectoryToolTag[];
	instructions?: string;
	fileTreeItems?: readonly KnowledgeDirectoryFileTreeItem[];
	favorite?: boolean;
	/** Legacy aliases kept for existing Knowledge Directory callers. */
	publisher?: string;
	publisherLogoSrc?: string;
	category?: SkillCategory;
}

export function getSkillPublisherName(skill: KnowledgeDirectorySkill): string {
	return skill.publisherName ?? skill.publisher ?? "Atlassian";
}

export function getSkillPublisherAvatarSrc(skill: KnowledgeDirectorySkill): string {
	return skill.publisherAvatarSrc ?? skill.publisherLogoSrc ?? ATLASSIAN_LOGO;
}

export function getSkillCategoryId(skill: KnowledgeDirectorySkill): SkillCategory | undefined {
	return skill.categoryId ?? skill.category;
}

/** Resolves a skill icon key to a raw Atlaskit icon element (color inherits from the parent). */
export function getSkillIcon(icon: SkillIconKey = "page"): ReactElement {
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
		case "megaphone":
			return <MegaphoneIcon label="" color="currentColor" />;
		case "paint-palette":
			return <PaintPaletteIcon label="" color="currentColor" />;
		case "search":
			return <SearchIcon label="" color="currentColor" />;
		case "page":
		default:
			return <PageIcon label="" color="currentColor" />;
	}
}

const ATLASSIAN_LOGO = "/1p/atlassian.svg";
const GOOGLE_LOGO = "/3p/google-drive/16.svg";
const NOTION_LOGO = "/3p/notion/16.svg";
const SLACK_LOGO = "/3p/slack/16.svg";
const STRIPE_LOGO = "/3p/stripe/16.svg";
const YOU_AVATAR = "/avatar-human/maia-ma.png";

const DESIGN_LANDING_INSTRUCTIONS = `# Design Landing Page

This skill guides creation of distinctive, production-grade frontend interfaces that avoid generic AI aesthetics. The goal is to implement real, working code with careful attention to aesthetic details and deliberate creative choices.

The user provides frontend requirements: a component, page, application, or interface to build. They may include context about the purpose, audience, or technical constraints.

---

## Design Thinking

Before coding, understand the context and commit to a bold aesthetic direction.`;

const MOBILE_APP_INSTRUCTIONS = `# Develop Mobile App Interface

Craft intuitive mobile app interfaces for iOS and Android. Use this skill for onboarding flows, productivity surfaces, detail views, and app experiences that need refined interaction patterns.

Plan the primary task first, then design the smallest complete surface that lets a user accomplish it.`;

const BRAND_IDENTITY_INSTRUCTIONS = `# Create Brand Identity

Create cohesive brand systems with logo direction, color palette, typography, voice, and reusable visual rules.

Use when a project needs a recognizable visual identity before product or marketing screens are built.`;

export const DEFAULT_SKILLS: readonly KnowledgeDirectorySkill[] = [
	{
		id: "design-landing-page",
		name: "Design landing page",
		description: "Create high-converting, visually distinctive landing pages from scratch or by refactoring existing pages. Use when the user asks to build, redesign, polish, or optimize a landing page.",
		icon: "paint-palette",
		iconColor: "text-purple-500",
		publisherName: "By you",
		publisherAvatarSrc: YOU_AVATAR,
		companyId: "you",
		categoryId: "content-communication",
		starCount: 30,
		viewCount: 6279,
		favorite: true,
		tools: [
			{ id: "tool-1", name: "Tool1", icon: "page" },
			{ id: "tool-2", name: "Tool2", icon: "page" },
			{ id: "tool-3", name: "Tool3", icon: "page" },
		],
		instructions: DESIGN_LANDING_INSTRUCTIONS,
	},
	{
		id: "develop-mobile-app-interface",
		name: "Develop mobile app interface",
		description: "Craft intuitive and engaging mobile app interfaces tailored for both iOS and Android platforms. Ideal for designing, enhancing, or refining app UI/UX.",
		icon: "paint-palette",
		iconColor: "text-blue-500",
		publisherName: "By you",
		publisherAvatarSrc: YOU_AVATAR,
		companyId: "you",
		categoryId: "software-development",
		starCount: 45,
		viewCount: 8345,
		favorite: true,
		tools: [
			{ id: "wireframe", name: "Wireframe", icon: "page" },
			{ id: "prototype", name: "Prototype", icon: "paint-palette" },
		],
		instructions: MOBILE_APP_INSTRUCTIONS,
	},
	{
		id: "create-brand-identity",
		name: "Create brand identity",
		description: "Establish a cohesive brand identity through logo design, color palettes, typography, and visual style guidelines. Use this when creating or refreshing a brand.",
		icon: "paint-palette",
		iconColor: "text-teal-500",
		publisherName: "By you",
		publisherAvatarSrc: YOU_AVATAR,
		companyId: "you",
		categoryId: "content-communication",
		starCount: 60,
		viewCount: 4921,
		favorite: true,
		tools: [
			{ id: "palette", name: "Palette", icon: "paint-palette" },
			{ id: "guidelines", name: "Guidelines", icon: "page" },
		],
		instructions: BRAND_IDENTITY_INSTRUCTIONS,
	},
	{
		id: "produce-marketing-materials",
		name: "Produce marketing materials",
		description: "Design eye-catching marketing collateral that resonates with target audiences, including brochures, posters, and social media graphics.",
		icon: "edit",
		iconColor: "text-text-subtle",
		publisherName: "By you",
		publisherAvatarSrc: YOU_AVATAR,
		companyId: "you",
		categoryId: "content-communication",
		starCount: 25,
		viewCount: 3810,
		tools: [{ id: "campaign-kit", name: "Campaign kit", icon: "megaphone" }],
		instructions: "Create polished campaign assets with clear hierarchy, strong brand fit, and production-ready copy blocks.",
	},
	{
		id: "review-pull-request",
		name: "Review pull request",
		description: "Summarize diffs and surface review-worthy changes across a pull request before a teammate merges it.",
		icon: "angle-brackets",
		iconColor: "text-teal-500",
		publisherName: "Atlassian",
		publisherAvatarSrc: ATLASSIAN_LOGO,
		companyId: "atlassian",
		categoryId: "software-development",
		starCount: 61,
		viewCount: 8120,
		tools: [{ id: "bitbucket", name: "Bitbucket", icon: "angle-brackets" }],
		instructions: "Inspect changed files, summarize behavioral risk, and produce actionable review comments.",
	},
	{
		id: "summarize-thread",
		name: "Summarize thread",
		description: "Condense a long conversation into the decisions, owners, and next steps that matter.",
		icon: "comment",
		iconColor: "text-purple-500",
		publisherName: "Slack",
		publisherAvatarSrc: SLACK_LOGO,
		companyId: "slack",
		categoryId: "content-communication",
		starCount: 54,
		viewCount: 7045,
		tools: [{ id: "slack", name: "Slack", icon: "comment" }],
		instructions: "Extract decisions, unresolved questions, and owner/date pairs from long Slack-style discussions.",
	},
	{
		id: "schedule-meeting",
		name: "Schedule meeting",
		description: "Find a time that works for everyone and create a calendar invite with the right context.",
		icon: "calendar",
		iconColor: "text-orange-500",
		publisherName: "Google",
		publisherAvatarSrc: GOOGLE_LOGO,
		companyId: "google",
		categoryId: "administrative-tools",
		starCount: 33,
		viewCount: 5210,
		tools: [{ id: "calendar", name: "Calendar", icon: "calendar" }],
		instructions: "Compare availability, propose meeting slots, and draft concise invites.",
	},
	{
		id: "build-report",
		name: "Build report",
		description: "Turn raw metrics into a narrative report your stakeholders will actually read.",
		icon: "chart-trend-up",
		iconColor: "text-teal-500",
		publisherName: "Notion",
		publisherAvatarSrc: NOTION_LOGO,
		companyId: "notion",
		categoryId: "data-analytics",
		starCount: 47,
		viewCount: 6940,
		tools: [{ id: "notion", name: "Notion", icon: "page" }],
		instructions: "Structure metric snapshots into a short, evidence-backed status report.",
	},
	{
		id: "create-payment-flow",
		name: "Create payment flow",
		description: "Design checkout, billing, and account-update flows with clear states and recovery paths.",
		icon: "link",
		iconColor: "text-indigo-500",
		publisherName: "Stripe",
		publisherAvatarSrc: STRIPE_LOGO,
		companyId: "stripe",
		categoryId: "project-management",
		starCount: 22,
		viewCount: 3384,
		tools: [{ id: "stripe", name: "Stripe", icon: "link" }],
		instructions: "Map payment states, error recovery, and confirmation copy for checkout-like flows.",
	},
];

/** Convenience lookup for sidebar references. */
export function getSkillById(
	skills: readonly KnowledgeDirectorySkill[],
	id: string,
): KnowledgeDirectorySkill | undefined {
	return skills.find((skill) => skill.id === id);
}
