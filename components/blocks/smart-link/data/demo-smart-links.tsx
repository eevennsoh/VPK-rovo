"use client";

import AtlassianIntelligenceIcon from "@atlaskit/icon/core/atlassian-intelligence";
import ClockIcon from "@atlaskit/icon/core/clock";
import GrowDiagonalIcon from "@atlaskit/icon/core/grow-diagonal";
import LinkIcon from "@atlaskit/icon/core/link";
import PageIcon from "@atlaskit/icon/core/page";
import PanelRightIcon from "@atlaskit/icon/core/panel-right";
import PeopleGroupIcon from "@atlaskit/icon/core/people-group";
import TargetIcon from "@atlaskit/icon/core/target";

import type { SmartLinkItem } from "@/components/blocks/smart-link/components/smart-link";

// Existing-assets-only demo data: Atlassian logos and checked-in /3p assets are
// used directly; unavailable external artwork falls back to configurable tiles.
const DEFAULT_ACTIONS = [
	{
		id: "open-preview",
		label: "Open preview modal",
		icon: <GrowDiagonalIcon label="" size="medium" />,
	},
	{
		id: "copy-link",
		label: "Copy link",
		icon: <LinkIcon label="" size="medium" />,
	},
] satisfies SmartLinkItem["actions"];

const PANEL_ACTIONS = [
	{
		id: "open-panel",
		label: "Open preview panel",
		icon: <PanelRightIcon label="" size="medium" />,
	},
	{
		id: "copy-link",
		label: "Copy link",
		icon: <LinkIcon label="" size="medium" />,
	},
] satisfies SmartLinkItem["actions"];

export const SMART_LINK_DEMO_ITEMS = [
	{
		id: "engineering-whiteboard",
		href: "#engineering-whiteboard",
		title: "Engineering Whiteboard for Platform Foundation | List",
		variant: "jira",
		provider: { name: "Jira", logo: { kind: "atlassian", name: "jira" } },
		icon: { kind: "atlassian", name: "jira" },
		assignee: { name: "Priya Hansra", src: "/avatar-human/priya-hansra.png" },
		status: {
			label: "In progress",
			variant: "information",
			options: [
				{ label: "To do", variant: "neutral" },
				{ label: "In progress", variant: "information" },
				{ label: "Done", variant: "success" },
			],
		},
		priority: "lowest",
		description: "Planning board for platform foundation engineering work, motion design reviews, and rollout dependencies.",
		actions: DEFAULT_ACTIONS,
	},
	{
		id: "verge",
		href: "#verge",
		title: "The Verge",
		variant: "article",
		provider: { name: "The Verge", logo: { kind: "text", label: "V", tone: "discovery" } },
		icon: { kind: "text", label: "V", tone: "discovery" },
		previewImage: {
			kind: "brand-panel",
			title: "The Verge",
			tone: "discovery",
		},
		actions: [
			{
				id: "copy-link",
				label: "Copy link",
				icon: <LinkIcon label="" size="medium" />,
			},
		],
	},
	{
		id: "laptop-refresh",
		href: "#laptop-refresh",
		title: "Updates To Our Laptop Refresh Process",
		variant: "confluence",
		provider: { name: "Confluence", logo: { kind: "atlassian", name: "confluence" } },
		icon: { kind: "icon-tile", icon: <PageIcon label="" size="medium" />, tone: "information" },
		author: { name: "Charlie Atlas", src: "/avatar-human/andrea-wilson.png" },
		date: "Updated 5 days ago",
		description:
			"To further strengthen our security, reduce unnecessary risk, and support more responsible hardware management, we're updating Atlassian's 3-year laptop refresh process.",
		actions: [
			...DEFAULT_ACTIONS,
			{
				id: "summarize",
				label: "Summarize with Rovo",
				icon: <AtlassianIntelligenceIcon label="" size="medium" />,
			},
			{
				id: "related",
				label: "View related links",
				icon: <ClockIcon label="" size="medium" />,
			},
		],
	},
	{
		id: "trust-scorecards",
		href: "#trust-scorecards",
		title: "[Trust Scorecards team] Core Design.",
		variant: "team",
		provider: { name: "Teams", logo: { kind: "atlassian", name: "teams" } },
		icon: { kind: "icon-tile", icon: <PeopleGroupIcon label="" size="medium" />, tone: "magenta" },
		avatars: [
			{ name: "Priya Hansra", src: "/avatar-human/priya-hansra.png" },
			{ name: "Veronica Rodriguez", src: "/avatar-human/veronica-rodriguez.png" },
			{ name: "Anthony Chen", src: "/avatar-human/anthony-chen.png" },
		],
		avatarOverflow: 48,
		description:
			"Team created for purpose of Trust Scorecard reports. Model Ownership: aou_group Owner: Charlie Sutton Organisation Name: Core Design",
		actions: PANEL_ACTIONS,
	},
	{
		id: "q3-motion-goal",
		href: "#q3-motion-goal",
		title: "By end of Q3FY25, we have formed a nucleus of motion design SMEs who are actively advising/consulting the broader design org on motion use",
		variant: "goal",
		provider: { name: "Goals", logo: { kind: "atlassian", name: "goals" } },
		icon: { kind: "icon", icon: <TargetIcon label="" size="medium" /> },
		avatars: [{ name: "Omar Salah", src: "/avatar-human/omar-salah.png" }],
		status: { label: "Completed", variant: "neutral" },
		score: "1.0",
		dueDate: "Jun 30, 2025",
		actions: [
			...PANEL_ACTIONS,
			{
				id: "unfollow",
				label: "Unfollow goal",
				icon: <TargetIcon label="" size="medium" />,
			},
		],
	},
	{
		id: "loom-agent-directory",
		href: "#loom-agent-directory",
		title: "Agent Directory and Editing Experience Walkthrough",
		variant: "loom",
		provider: { name: "Loom", logo: { kind: "atlassian", name: "loom" } },
		icon: { kind: "atlassian", name: "loom" },
		description:
			"This Loom reviews updated UI design for an agents directory and agent edit experience. It proposes an empty state by default for users without agency.",
		actions: DEFAULT_ACTIONS,
	},
	{
		id: "project-slingshot",
		href: "#project-slingshot",
		title: "Project slingshot release plan",
		variant: "file",
		provider: { name: "Google Drive", logo: { kind: "image", src: "/3p/google-drive/16.svg", alt: "Google Drive" } },
		icon: { kind: "image", src: "/3p/google-drive/24.svg", alt: "Google Drive" },
		previewImage: {
			kind: "brand-panel",
			title: "ATLASSIAN",
			tone: "information",
		},
		metadata: [{ label: "Updated 9 hours ago" }],
		description: "Project Slingshot is an AI-powered health monitoring app that helps owners keep track of important signals.",
		actions: [
			...DEFAULT_ACTIONS,
			{
				id: "summarize",
				label: "Summarize with AI",
				icon: <AtlassianIntelligenceIcon label="" size="medium" />,
			},
		],
	},
	{
		id: "slack-release-plan",
		href: "#slack-release-plan",
		title: "Project slingshot release plan",
		variant: "generic",
		provider: { name: "Slack", logo: { kind: "image", src: "/3p/slack/16.svg", alt: "Slack" } },
		icon: { kind: "image", src: "/3p/slack/24.svg", alt: "Slack" },
		metadata: [
			{ label: "Sent on Feb 21, 2023" },
			{ label: "4" },
			{ label: "16" },
		],
		description:
			"Project Slingshot is an AI-powered health monitoring app that helps pet owners keep track of their friend's health.",
		actions: [
			{
				id: "open-preview",
				label: "Open preview",
				icon: <LinkIcon label="" size="medium" />,
			},
		],
	},
] satisfies SmartLinkItem[];

export const SMART_LINK_VARIANT_EXAMPLES = {
	rich: SMART_LINK_DEMO_ITEMS.filter((item) => item.variant === "confluence" || item.variant === "jira"),
	article: SMART_LINK_DEMO_ITEMS.filter((item) => item.variant === "article"),
	team: SMART_LINK_DEMO_ITEMS.filter((item) => item.variant === "team"),
	goal: SMART_LINK_DEMO_ITEMS.filter((item) => item.variant === "goal"),
	loom: SMART_LINK_DEMO_ITEMS.filter((item) => item.variant === "loom"),
	generic: SMART_LINK_DEMO_ITEMS.filter((item) => item.variant === "file" || item.variant === "generic"),
} as const;

export const SMART_LINK_REQUIRED_VARIANTS = [
	"confluence",
	"jira",
	"team",
	"goal",
	"loom",
	"article",
	"file",
	"generic",
] as const;
