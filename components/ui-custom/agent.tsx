"use client";

import type { Tool } from "ai";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useTransform, type MotionProps } from "motion/react";
import type { ComponentProps, CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { Fragment, memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";

import AddIcon from "@atlaskit/icon/core/add";
import ChartTrendUpIcon from "@atlaskit/icon/core/chart-trend-up";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import ChevronUpIcon from "@atlaskit/icon/core/chevron-up";
import DashboardIcon from "@atlaskit/icon/core/dashboard";
import PageIcon from "@atlaskit/icon/core/page";
import PersonIcon from "@atlaskit/icon/core/person";
import ScorecardIcon from "@atlaskit/icon/core/scorecard";
import VideoPlayIcon from "@atlaskit/icon/core/video-play";
import AiComputeIcon from "@atlaskit/icon-lab/core/ai-compute";
import AiModelIcon from "@atlaskit/icon-lab/core/ai-model";
import BookOpenIcon from "@atlaskit/icon-lab/core/book-open";
import ViewsIcon from "@atlaskit/icon-lab/core/views";

import { AgentTemplatesDialog } from "@/components/blocks/agent-templates";
import { DEMO_AGENT_TEMPLATES } from "@/components/blocks/agent-templates/data/demo-template-agents";
import { Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AtlassianLogo, isAtlassianLogoSource } from "@/components/ui/logo";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { InlineEdit } from "@/components/ui/inline-edit";
import { Lozenge, LozengeDropdownTrigger } from "@/components/ui/lozenge";
import { Tag } from "@/components/ui/tag";
import { Tile } from "@/components/ui/tile";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { CheckIcon, MoreHorizontalIcon, PlusIcon } from "@/components/ui/vpk-icons";
import { computeContextBarOverflow } from "@/components/ui-custom/context-bar/overflow";
import {
	TwgToolBannerBackground,
} from "@/components/ui-custom/twg-tool";
import { TWGAppstack, type TwgToolSource } from "@/components/ui-custom/twg-appstack";
import {
	type RichTextMentionItem,
	type RichTextMentionSources,
	RichTextEditor,
} from "@/components/ui-custom/rich-text-editor";
import { SkillTag } from "@/components/ui-custom/skill-tag";
import { useBentoDescriptionClamp } from "@/components/ui-custom/hooks/use-bento-description-clamp";
import { BENTO_CAROUSEL_TILE_CLASS, BentoCarousel } from "@/components/ui-custom/bento-carousel";
import { token } from "@/lib/tokens";
import type {
	HermesSkillSummary,
	WikiMemoryExplorerResponse,
} from "@/lib/rovo-runtime-types";
import { cn } from "@/lib/utils";

import { CodeBlock } from "./code-block";

const AGENT_AVATAR_HEXAGON_PATH = "M19.01 0.922148C20.24 0.212148 21.76 0.212148 23 0.922148L40 10.6921C41.24 11.4021 42.01 12.7321 42.01 14.1621V33.6721C42.01 35.1021 41.24 36.4221 40 37.1421L23 46.9121C21.77 47.6221 20.25 47.6221 19.01 46.9121L2.01 37.1321C0.77 36.4221 0 35.0921 0 33.6621V14.1621C0 12.7321 0.77 11.4121 2.01 10.6921L19.01 0.922148Z";
const AGENT_AVATAR_SRC = "/avatar-agent/teamwork-agents/blocker-checker.svg";
const DEFAULT_AGENT_PROFILE_COVER_COLOR = "#1868DB";
const MAX_AGENT_CONVERSATION_STARTERS = 3;
const AGENT_PROFILE_INLINE_EDIT_MOTION_PROPS = {
	initial: "rest",
	animate: "rest",
	whileHover: "active",
	whileFocus: "active",
	variants: {
		rest: { paddingLeft: 0, paddingRight: 0 },
		active: { paddingLeft: "0.375rem", paddingRight: "0.375rem" },
	},
	transition: { type: "spring", bounce: 0.08, visualDuration: 0.18 },
} satisfies Pick<MotionProps, "initial" | "animate" | "whileHover" | "whileFocus" | "variants" | "transition">;
const AGENT_PROFILE_INLINE_EDIT_BACKDROP_MOTION_PROPS = {
	variants: {
		rest: { opacity: 0, scaleX: 0.98 },
		active: { opacity: 1, scaleX: 1 },
	},
	transition: { type: "spring", bounce: 0.08, visualDuration: 0.18 },
} satisfies Pick<MotionProps, "variants" | "transition">;
const AGENT_COMPACT_CONFIG_EXPAND_BUTTON_SIZE = 24;
const AGENT_COMPACT_CONFIG_EXPAND_BUTTON_EDGE_GAP = 8;
const AGENT_COMPACT_CONFIG_EXPAND_BUTTON_REVEAL_DISTANCE = 72;
const AGENT_AVATAR_PROFILE_COVER_COLORS: Record<string, string> = {
	"dev-agents": "#82B536",
	"product-agents": "#BF63F3",
	"service-agents": "#FFC716",
	"strategy-agents": "#FCA700",
	"teamwork-agents": DEFAULT_AGENT_PROFILE_COVER_COLOR,
};

const AGENT_KNOWLEDGE_SOURCES = [
	{ id: "twg", label: "Teamwork Graph", provider: "twg" },
	{ id: "jira", label: "Jira", provider: "jira" },
	{ id: "google-drive", label: "Google Drive", provider: "google-drive" },
	{ id: "confluence", label: "Confluence", provider: "confluence" },
	{ id: "teams", label: "Microsoft Teams", provider: "teams" },
	{ id: "salesforce", label: "Salesforce", provider: "salesforce" },
] as const satisfies readonly TwgToolSource[];

const AGENT_COMPACT_EMPTY_CONFIG_NAV_ITEMS = [
	{ agentFieldName: "trigger", label: "Triggers" },
	{ agentFieldName: "skills", label: "Skills", listFieldName: "skills" },
	{ agentFieldName: "tools", label: "Tools", listFieldName: "tools" },
	{ agentFieldName: "subagents", label: "Subagents", listFieldName: "subagents" },
	{ agentFieldName: "knowledge", label: "Knowledge", kind: "knowledge" },
	{ agentFieldName: "conversationStarters", label: "Conversation starters", listFieldName: "conversationStarters" },
	{ agentFieldName: "reasoning", label: "Reasoning", kind: "reasoning" },
] as const;

const AGENT_COMPACT_CONFIG_NAV_GAP = 4;
const AGENT_COMPACT_CONFIG_NAV_OVERFLOW_WIDTH = 24;
const AGENT_EMPTY_ROW_ADD_LABELS: Partial<Record<AgentConfigListFieldName, string>> = {
	conversationStarters: "Add prompts to help people start",
	skills: "Add skills to guide specialized tasks",
	subagents: "Add subagents to handle specific scenarios",
	tools: "Add tools to extend what this agent can do",
	triggers: "Add rules for when this agent runs",
};

function getAgentFilledSummaryAddLabel(field: AgentConfigListFieldName, isEmpty: boolean, showAddButtons: boolean): string | undefined {
	if (!showAddButtons) {
		return undefined;
	}

	return isEmpty ? AGENT_EMPTY_ROW_ADD_LABELS[field] ?? "Add" : "Add";
}

function openAgentDirectoryOrAppendListItem(
	directory: AgentDirectoryKind,
	field: AgentConfigListFieldName,
	onOpenDirectory?: (directory: AgentDirectoryKind) => void,
	onAppendListItem?: (field: AgentConfigListFieldName) => void,
): void {
	if (onOpenDirectory) {
		onOpenDirectory(directory);
		return;
	}

	onAppendListItem?.(field);
}

function getAgentCompactEmptyConfigNavItems(config?: AgentConfigFormValue) {
	return AGENT_COMPACT_EMPTY_CONFIG_NAV_ITEMS.map((item) => {
		let count = 0;
		if (config) {
			switch (item.agentFieldName) {
				case "trigger":
					count = getAgentTriggerItems(config).length;
					break;
				case "skills":
					count = getNonEmptyConfigItems(config.skills).length;
					break;
				case "tools":
					count = getNonEmptyConfigItems(config.tools).length;
					break;
				case "subagents":
					count = getNonEmptyConfigItems(config.subagents).length;
					break;
				case "knowledge":
					count = 0;
					break;
				case "conversationStarters":
					count = getNonEmptyConfigItems(config.conversationStarters).length;
					break;
				case "reasoning":
					count = 0;
					break;
			}
		}
		return { ...item, count };
	});
}

interface AgentCompactBentoTemplate {
	description: string;
	iconSrc: string;
	title: string;
}

type AgentCompactBentoCardGlowCSSProperties = CSSProperties & Record<`--card-glow-${string}`, string | number>;

const AGENT_COMPACT_OPERATIONS_TEMPLATES: ReadonlyArray<AgentCompactBentoTemplate> = [
	{
		description: "Triage service requests, recommend field updates, and ask for missing details when needed.",
		iconSrc: "/avatar-agent/service-agents/service-triage.svg",
		title: "Service Triage",
	},
	{
		description: "Draft support responses, suggest assignees, and summarize requests for faster resolution.",
		iconSrc: "/avatar-agent/strategy-agents/strategic-insight.svg",
		title: "Service Request Helper",
	},
	{
		description: "Guide incident response, on-call actions, mitigation, status updates, and recovery.",
		iconSrc: "/avatar-agent/dev-agents/code-standardizer.svg",
		title: "Rovo Ops",
	},
	{
		description: "Answer Rovo setup and usage questions with concise guidance and helpful links.",
		iconSrc: "/avatar-agent/product-agents/wildcard-3.svg",
		title: "Rovo Expert",
	},
	{
		description: "Help teammates document working style, communication norms, and collaboration preferences.",
		iconSrc: "/avatar-agent/teamwork-agents/user-manual-writer.svg",
		title: "User Manual Writer",
	},
] as const;

const AGENT_COMPACT_BENTO_AVATAR_GROUP_ACCENTS: Readonly<Record<string, string>> = {
	"dev-agents": "#82B536",
	"product-agents": "#BF63F3",
	"service-agents": "#FFC716",
	"strategy-agents": "#FCA700",
	"teamwork-agents": DEFAULT_AGENT_PROFILE_COVER_COLOR,
};
const AGENT_COMPACT_BENTO_CARD_GLOW_FALLBACK_ACCENT = DEFAULT_AGENT_PROFILE_COVER_COLOR;
const AGENT_COMPACT_BENTO_CARD_GLOW_EFFECT_STYLE: AgentCompactBentoCardGlowCSSProperties = {
	"--card-glow-border-core": 36,
	"--card-glow-border-spread": 120,
	"--card-glow-border-width": 1,
	"--card-glow-icon-blur": 28,
	"--card-glow-icon-brightness": 1.3,
	"--card-glow-icon-contrast": 1.4,
	"--card-glow-icon-opacity": 0.25,
	"--card-glow-icon-saturate": 5,
	"--card-glow-icon-scale": 3.4,
};
const AGENT_COMPACT_BENTO_CARD_GLOW_LAYER_STYLE: CSSProperties = {
	filter: [
		"blur(calc(var(--card-glow-icon-blur) * 1px))",
		"saturate(var(--card-glow-icon-saturate))",
		"brightness(var(--card-glow-icon-brightness))",
		"contrast(var(--card-glow-icon-contrast))",
	].join(" "),
	scale: "var(--card-glow-icon-scale)",
	translate: "calc(var(--card-glow-pointer-x, -10) * 50cqi) calc(var(--card-glow-pointer-y, -10) * 50cqh)",
	willChange: "translate, scale, filter, opacity",
};
const AGENT_COMPACT_BENTO_CARD_BORDER_FADE_STYLE: CSSProperties = {
	maskImage: "linear-gradient(to bottom, #000 calc(100% - 64px), transparent 100%)",
	WebkitMaskImage: "linear-gradient(to bottom, #000 calc(100% - 64px), transparent 100%)",
};
const AGENT_COMPACT_BENTO_CARD_BASE_BORDER_STYLE: CSSProperties = {
	boxShadow: `inset 0 0 0 calc(var(--card-glow-border-width) * 1px) ${token("color.border")}`,
};
const AGENT_COMPACT_BENTO_CARD_BORDER_GLOW_STYLE: CSSProperties = {
	background: [
		"radial-gradient(",
		"circle at ",
		"calc((var(--card-glow-pointer-x, -10) + 1) * 50%) ",
		"calc((var(--card-glow-pointer-y, -10) + 1) * 50%), ",
		"var(--card-glow-tile-accent) 0 calc(var(--card-glow-border-core) * 1px), ",
		"transparent calc(var(--card-glow-border-spread) * 1px)",
		") border-box",
	].join(""),
	borderColor: "transparent",
	borderWidth: "calc(var(--card-glow-border-width) * 1px)",
	mask: "linear-gradient(#fff 0 100%) border-box, linear-gradient(#fff 0 100%) padding-box",
	maskComposite: "exclude",
	WebkitMask: "linear-gradient(#fff 0 100%) border-box, linear-gradient(#fff 0 100%) padding-box",
	WebkitMaskComposite: "xor",
};
const MENTION_SOURCE_LIMIT = 24;

interface AgentSkillMentionResponse {
	skills?: HermesSkillSummary[];
}

function toMentionId(category: RichTextMentionItem["category"], id: string): string {
	return `${category}:${id.trim().replace(/\s+/g, "-")}`;
}

function mapSkillsToMentionItems(
	skills: readonly HermesSkillSummary[] | undefined,
): RichTextMentionItem[] {
	return (skills ?? [])
		.filter((skill) => !skill.disabled)
		.slice(0, MENTION_SOURCE_LIMIT)
		.map((skill) => ({
			category: "skill",
			id: toMentionId("skill", skill.id || `${skill.category}/${skill.name}`),
			label: skill.title || skill.name,
			description: skill.description ?? `${skill.category} skill`,
		}));
}

function mapMemoryToKnowledgeItems(
	explorer: WikiMemoryExplorerResponse | null,
): RichTextMentionItem[] {
	return (explorer?.nodes ?? [])
		.slice(0, MENTION_SOURCE_LIMIT)
		.map((node) => ({
			category: "knowledge",
			id: toMentionId("knowledge", node.id),
			label: node.title || node.label || node.id,
			description: node.summary || node.kind,
		}));
}

function getAgentProfileCoverBackgroundColor(avatarSrc: string | undefined): string {
	const category = avatarSrc?.match(/\/avatar-agent\/([^/]+)\//u)?.[1];
	return (category ? AGENT_AVATAR_PROFILE_COVER_COLORS[category] : undefined) ?? DEFAULT_AGENT_PROFILE_COVER_COLOR;
}

export type AgentConfigTextFieldName =
	| "name"
	| "description"
	| "instructions"
	| "contextDescription"
	| "trigger"
	| "guardrail";

export type AgentConfigListFieldName =
	| "triggers"
	| "skills"
	| "tools"
	| "subagents"
	| "knowledge"
	| "conversationStarters";

export type AgentDirectoryKind = "knowledge" | "tools" | "skills";

export interface AgentConfigFormValue {
	name?: string;
	description?: string;
	summary?: string;
	instructions?: string;
	contextDescription?: string;
	trigger?: string;
	triggers?: readonly string[];
	skills?: readonly string[];
	guardrail?: string;
	tools?: readonly string[];
	subagents?: readonly string[];
	knowledge?: readonly string[];
	conversationStarters?: readonly string[];
	agentId?: string;
	action?: string;
}

export type AgentProps = ComponentProps<"div">;

export const Agent = memo(({ className, ...props }: Readonly<AgentProps>) => (
	<div
		className={cn("not-prose w-full overflow-hidden bg-surface text-text", className)}
		{...props}
	/>
));

const AGENT_COMPACT_HEADER_NAV_ITEMS = [
	{ icon: <DashboardIcon label="" size="small" color="currentColor" />, isSelected: true, label: "Details" },
	{ icon: <ChartTrendUpIcon label="" size="small" color="currentColor" />, isSelected: false, label: "Insights" },
	{ icon: <ViewsIcon label="" size="small" color="currentColor" />, isSelected: false, label: "Surfaces" },
	{ icon: <ScorecardIcon label="" size="small" color="currentColor" />, isSelected: false, label: "Evaluation" },
	{ icon: <PersonIcon label="" size="small" color="currentColor" />, isSelected: false, label: "Users" },
	{ icon: <VideoPlayIcon label="" size="small" color="currentColor" />, isSelected: false, label: "Access" },
] as const;

const AGENT_COMPACT_HEADER_NAV_GAP = 4;
const AGENT_COMPACT_HEADER_NAV_OVERFLOW_WIDTH = 24;

function AgentCompactHeaderNavButton({
	item,
}: Readonly<{
	item: (typeof AGENT_COMPACT_HEADER_NAV_ITEMS)[number];
}>) {
	return (
		<Button
			type="button"
			aria-pressed={item.isSelected ? true : undefined}
			size="compact"
			variant={item.isSelected ? "outline" : "ghost"}
			className={cn(
				"h-6 gap-1 rounded px-2 text-sm font-medium leading-5",
				item.isSelected
					? "border-border-selected bg-bg-selected text-text-selected [&_svg]:text-icon-selected"
					: "text-text-subtle [&_svg]:text-icon-subtle"
			)}
		>
			<Icon render={item.icon} aria-hidden />
			{item.label}
		</Button>
	);
}

export function AgentCompactHeaderNav({
	avatarSrc = AGENT_AVATAR_SRC,
}: Readonly<{ avatarSrc?: string }>) {
	const containerRef = useRef<HTMLDivElement>(null);
	const measureRef = useRef<HTMLDivElement>(null);
	const [visibleCount, setVisibleCount] = useState<number>(AGENT_COMPACT_HEADER_NAV_ITEMS.length);
	const visibleItems = AGENT_COMPACT_HEADER_NAV_ITEMS.slice(0, visibleCount);
	const hiddenItems = AGENT_COMPACT_HEADER_NAV_ITEMS.slice(visibleCount);

	useLayoutEffect(() => {
		const container = containerRef.current;
		const measure = measureRef.current;
		if (!container || !measure) {
			return;
		}

		function recompute(): void {
			const widths = Array.from(measure!.children).map((node) => (node as HTMLElement).offsetWidth);
			setVisibleCount(
				computeContextBarOverflow(
					widths,
					container!.clientWidth,
					AGENT_COMPACT_HEADER_NAV_OVERFLOW_WIDTH,
					AGENT_COMPACT_HEADER_NAV_GAP,
				),
			);
		}

		recompute();
		const observer = new ResizeObserver(recompute);
		observer.observe(container);
		return () => observer.disconnect();
	}, []);

	return (
		<div className="flex min-w-0 flex-1 items-center gap-4">
			<Avatar label="Agent" shape="hexagon" size="sm">
				{isAtlassianLogoSource(avatarSrc) ? (
					<AtlassianLogo name="atlassian" label="Agent" size="small" />
				) : (
					<AvatarImage alt="" src={avatarSrc} />
				)}
			</Avatar>
			<div
				className="relative flex min-w-0 flex-1 items-center overflow-hidden"
				ref={containerRef}
				style={{ gap: AGENT_COMPACT_HEADER_NAV_GAP }}
			>
				<div aria-hidden className="pointer-events-none absolute top-0 left-0 h-0 w-0 overflow-clip">
					<div className="invisible flex items-center" ref={measureRef} style={{ gap: AGENT_COMPACT_HEADER_NAV_GAP }}>
						{AGENT_COMPACT_HEADER_NAV_ITEMS.map((item) => (
							<AgentCompactHeaderNavButton item={item} key={`measure-${item.label}`} />
						))}
					</div>
				</div>
				{visibleItems.map((item) => (
					<AgentCompactHeaderNavButton item={item} key={item.label} />
				))}
				{hiddenItems.length > 0 ? (
					<DropdownMenu>
						<DropdownMenuTrigger
							aria-label="More agent sections"
							render={<Button className="size-6 rounded px-0" size="icon-compact" type="button" variant="ghost" />}
						>
							<MoreHorizontalIcon size="small" />
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuGroup>
								{hiddenItems.map((item) => (
									<DropdownMenuItem elemBefore={item.icon} key={item.label}>
										{item.label}
									</DropdownMenuItem>
								))}
							</DropdownMenuGroup>
						</DropdownMenuContent>
					</DropdownMenu>
				) : null}
			</div>
		</div>
	);
}

export type AgentHeaderProps = ComponentProps<"div"> & {
	name: string;
	avatarSrc?: string;
	model?: string;
	leadingContent?: ReactNode;
	primaryActionLabel?: string;
	secondaryActionLabel?: string;
	publishLabel?: string;
	showActions?: boolean;
	actions?: ReactNode;
	badge?: ReactNode;
};

export const AgentHeader = memo(
	({
		className,
		avatarSrc = AGENT_AVATAR_SRC,
		leadingContent,
		model,
		name,
		primaryActionLabel = "Configure",
		secondaryActionLabel = "Test",
		publishLabel = "Publish",
		showActions = true,
		actions,
		badge,
		...props
	}: Readonly<AgentHeaderProps>) => (
		<div
			className={cn(
				"flex h-14 w-full items-center justify-between gap-4 border-b border-border bg-surface px-6",
				className
			)}
			{...props}
		>
			{leadingContent ?? (
				<div className="flex min-w-0 items-center gap-2">
					<Avatar label="Agent" shape="hexagon" size="sm">
						{isAtlassianLogoSource(avatarSrc) ? (
							<AtlassianLogo name="atlassian" label={name} size="small" />
						) : (
							<AvatarImage alt="" src={avatarSrc} />
						)}
					</Avatar>
					<span className="truncate text-sm font-semibold leading-5 text-text">{name}</span>
					{model ? (
						<Lozenge>
							{model}
						</Lozenge>
					) : null}
					{badge}
				</div>
			)}
			{showActions ? (
				<div className="flex shrink-0 items-center gap-2">
					{actions ?? (
						// Self-contained compact ToggleGroup so the default
						// Configure/Test header works standalone. Consumers that need
						// controlled tabs (e.g. the compact agent config panel) pass
						// `actions` to supply their own tab parts wired to outer state
						// instead. ToggleGroup carries its own context, so no wrapper
						// is required here.
						<>
							<ToggleGroup
								aria-label="Agent views"
								defaultValue={["configure"]}
								variant="outline"
							>
								<ToggleGroupItem value="configure">
									{primaryActionLabel}
								</ToggleGroupItem>
								<ToggleGroupItem value="test">
									{secondaryActionLabel}
								</ToggleGroupItem>
							</ToggleGroup>
							<Button type="button" size="default" variant="default">
								{publishLabel}
							</Button>
						</>
					)}
				</div>
			) : null}
		</div>
	)
);

export type AgentContentProps = ComponentProps<"div">;

export const AgentContent = memo(
	({ className, ...props }: Readonly<AgentContentProps>) => (
		<div className={cn("space-y-4 p-6", className)} {...props} />
	)
);

export type AgentInstructionsProps = ComponentProps<"div"> & {
	children: string;
};

export const AgentInstructions = memo(
	({ className, children, ...props }: Readonly<AgentInstructionsProps>) => (
		<div className={cn("space-y-2", className)} {...props}>
			<span className="font-medium text-text-subtle text-sm">
				Instructions
			</span>
			<div className="rounded-md bg-surface-sunken p-3 text-text-subtle text-sm">
				<p>{children}</p>
			</div>
		</div>
	)
);

export type AgentToolsProps = ComponentProps<typeof Accordion>;

export const AgentTools = memo(({ className, ...props }: Readonly<AgentToolsProps>) => (
	<div className={cn("space-y-2", className)}>
		<span className="font-medium text-text-subtle text-sm">Tools</span>
		<Accordion className="rounded-md border border-border" {...props} />
	</div>
));

export type AgentToolProps = ComponentProps<typeof AccordionItem> & {
	tool: Tool;
};

export const AgentTool = memo(
	({ className, tool, value, ...props }: Readonly<AgentToolProps>) => {
		const schema =
			"jsonSchema" in tool && tool.jsonSchema
				? tool.jsonSchema
				: tool.inputSchema;

		return (
			<AccordionItem
				className={cn("border-b border-border last:border-b-0", className)}
				value={value}
				{...props}
			>
				<AccordionTrigger className="px-3 py-2 text-sm text-text-subtle transition-colors hover:text-text hover:no-underline">
					{tool.description ?? "No description"}
				</AccordionTrigger>
				<AccordionContent className="px-3 pb-3">
					<div className="rounded-md bg-surface-sunken">
						<CodeBlock code={JSON.stringify(schema, null, 2)} language="json" />
					</div>
				</AccordionContent>
			</AccordionItem>
		);
	}
);

export type AgentOutputProps = ComponentProps<"div"> & {
	schema: string;
};

export const AgentOutput = memo(
	({ className, schema, ...props }: Readonly<AgentOutputProps>) => (
		<div className={cn("space-y-2", className)} {...props}>
			<span className="font-medium text-text-subtle text-sm">
				Output Schema
			</span>
			<div className="rounded-md bg-surface-sunken">
				<CodeBlock code={schema} language="typescript" />
			</div>
		</div>
	)
);

interface AgentActionTileProps {
	agentFieldName?: string;
	label: string;
	onClick?: () => void;
	screenAssistantTargetId?: string;
}

interface AgentMissingConfigActionsProps {
	config: AgentConfigFormValue;
	onAppendListItem?: (field: AgentConfigListFieldName) => void;
	onOpenDirectory?: (directory: AgentDirectoryKind) => void;
	screenAssistantTargetPrefix?: string;
}

interface AgentMissingConfigAction {
	agentFieldName?: string;
	label: string;
	onClick?: () => void;
	screenAssistantTargetId?: string;
}

function AgentIconTile({ children, label }: Readonly<{ children: ReactNode; label: string }>) {
	return (
		<Tile
			className="shrink-0 text-icon-subtle"
			label={label}
			size="medium"
			variant="neutral"
		>
			{children}
		</Tile>
	);
}

function AgentActionTile({
	agentFieldName,
	label,
	onClick,
	screenAssistantTargetId,
}: Readonly<AgentActionTileProps>) {
	return (
		<button
			type="button"
			data-agent-field={agentFieldName}
			data-screen-assistant-target={screenAssistantTargetId}
			className="flex min-h-11 w-full items-center gap-3 rounded-xl border border-border bg-surface p-1.5 text-left text-sm font-medium text-text transition-colors hover:bg-surface-raised-hovered focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
			onClick={onClick}
		>
			<AgentIconTile label="Add">
				<Icon render={<AddIcon label="" size="small" />} aria-hidden />
			</AgentIconTile>
			<span className="min-w-0 truncate">{label}</span>
		</button>
	);
}

function AgentMissingConfigActions({
	config,
	onAppendListItem,
	onOpenDirectory,
	screenAssistantTargetPrefix,
}: Readonly<AgentMissingConfigActionsProps>) {
	const actions: ReadonlyArray<AgentMissingConfigAction | null> = [
		getAgentTriggerItems(config).length === 0
			? {
					agentFieldName: "trigger",
					label: "Add triggers",
					screenAssistantTargetId: screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:trigger` : undefined,
				}
			: null,
		getNonEmptyConfigItems(config.skills).length === 0
			? {
					agentFieldName: "skills",
					label: "Add skills",
					onClick: () => openAgentDirectoryOrAppendListItem("skills", "skills", onOpenDirectory, onAppendListItem),
					screenAssistantTargetId: screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:skills` : undefined,
				}
			: null,
		getNonEmptyConfigItems(config.tools).length === 0
			? {
					agentFieldName: "tools",
					label: "Add tools",
					onClick: () => openAgentDirectoryOrAppendListItem("tools", "tools", onOpenDirectory, onAppendListItem),
					screenAssistantTargetId: screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:tools` : undefined,
				}
			: null,
		getNonEmptyConfigItems(config.conversationStarters).length === 0
			? {
					agentFieldName: "conversationStarters",
					label: "Add conversation starters",
					onClick: () => onAppendListItem?.("conversationStarters"),
					screenAssistantTargetId: screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:conversation-starters` : undefined,
				}
			: null,
	];
	const visibleActions = actions.filter((action): action is AgentMissingConfigAction => action !== null);

	if (visibleActions.length === 0) {
		return null;
	}

	return (
		<div className="grid grid-cols-2 gap-2">
			{visibleActions.map((action) => (
				<AgentActionTile
					key={action.label}
					agentFieldName={action.agentFieldName}
					label={action.label}
					onClick={action.onClick}
					screenAssistantTargetId={action.screenAssistantTargetId}
				/>
			))}
		</div>
	);
}

type AgentCompactConfigNavItem = ReturnType<typeof getAgentCompactEmptyConfigNavItems>[number];

function getAgentCompactConfigNavItemOnClick(
	item: AgentCompactConfigNavItem,
	onAppendListItem?: (field: AgentConfigListFieldName) => void,
	onOpenDirectory?: (directory: AgentDirectoryKind) => void,
): (() => void) | undefined {
	if (item.agentFieldName === "tools") {
		return () => openAgentDirectoryOrAppendListItem("tools", "tools", onOpenDirectory, onAppendListItem);
	}

	if (item.agentFieldName === "skills") {
		return () => openAgentDirectoryOrAppendListItem("skills", "skills", onOpenDirectory, onAppendListItem);
	}

	if ("listFieldName" in item) {
		return () => onAppendListItem?.(item.listFieldName);
	}
	return undefined;
}

function AgentCompactConfigNavButton({
	item,
	onClick,
	screenAssistantTargetId,
}: Readonly<{
	item: AgentCompactConfigNavItem;
	onClick?: () => void;
	screenAssistantTargetId?: string;
}>) {
	return (
		<button
			type="button"
			data-agent-field={item.agentFieldName}
			data-screen-assistant-target={screenAssistantTargetId}
			className="inline-flex h-6 shrink-0 items-center gap-1 rounded px-2 text-xs font-semibold leading-4 text-text-subtlest transition-colors hover:bg-bg-neutral-subtle-hovered hover:text-text focus-visible:ring-3 focus-visible:ring-ring/50"
			onClick={onClick}
		>
			{item.label}
			{item.count > 0 ? <Badge>{item.count}</Badge> : null}
		</button>
	);
}

function AgentCompactEmptyConfigNav({
	config,
	onAppendListItem,
	onOpenDirectory,
	reasoningValue,
	onReasoningValueChange,
	knowledgeMode,
	onKnowledgeModeChange,
	screenAssistantTargetPrefix,
}: Readonly<{
	config?: AgentConfigFormValue;
	onAppendListItem?: (field: AgentConfigListFieldName) => void;
	onOpenDirectory?: (directory: AgentDirectoryKind) => void;
	reasoningValue: ReasoningModeValue;
	onReasoningValueChange: (next: ReasoningModeValue) => void;
	knowledgeMode: KnowledgeModeValue;
	onKnowledgeModeChange: (next: KnowledgeModeValue) => void;
	screenAssistantTargetPrefix?: string;
}>) {
	const items = getAgentCompactEmptyConfigNavItems(config);
	// Re-measure whenever counts change since a count Badge appearing/disappearing
	// changes a button's natural width. ResizeObserver alone only catches
	// container width changes.
	const itemsSignature = items.map((item) => `${item.agentFieldName}:${item.count}`).join("|");
	const containerRef = useRef<HTMLDivElement>(null);
	const measureRef = useRef<HTMLDivElement>(null);
	const [visibleCount, setVisibleCount] = useState<number>(items.length);

	useLayoutEffect(() => {
		const container = containerRef.current;
		const measure = measureRef.current;
		if (!container || !measure) {
			return;
		}

		function recompute(): void {
			const widths = Array.from(measure!.children).map((node) => (node as HTMLElement).offsetWidth);
			setVisibleCount(
				computeContextBarOverflow(
					widths,
					container!.clientWidth,
					AGENT_COMPACT_CONFIG_NAV_OVERFLOW_WIDTH,
					AGENT_COMPACT_CONFIG_NAV_GAP,
				),
			);
		}

		recompute();
		const observer = new ResizeObserver(recompute);
		observer.observe(container);
		return () => observer.disconnect();
	}, [itemsSignature]);

	if (items.length === 0) {
		return null;
	}

	const visibleItems = items.slice(0, visibleCount);
	const hiddenItems = items.slice(visibleCount);

	return (
		<div className="flex min-h-8 min-w-0 items-center">
			<div
				className="relative flex min-w-0 flex-1 items-center overflow-hidden"
				ref={containerRef}
				style={{ gap: AGENT_COMPACT_CONFIG_NAV_GAP }}
			>
				<div aria-hidden className="pointer-events-none absolute top-0 left-0 h-0 w-0 overflow-clip">
					<div className="invisible flex items-center" ref={measureRef} style={{ gap: AGENT_COMPACT_CONFIG_NAV_GAP }}>
						{items.map((item) => (
							<AgentCompactConfigNavButton item={item} key={`measure-${item.agentFieldName}`} />
						))}
					</div>
				</div>
				{visibleItems.map((item) => {
					if (item.agentFieldName === "reasoning") {
						return (
							<AgentReasoningSelector
								key={item.agentFieldName}
								render="nav-button"
								value={reasoningValue}
								onValueChange={onReasoningValueChange}
								screenAssistantTargetId={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:reasoning` : undefined}
							/>
						);
					}
					if (item.agentFieldName === "knowledge") {
						return (
							<AgentKnowledgeSelector
								key={item.agentFieldName}
								render="nav-button"
								value={knowledgeMode}
								onValueChange={onKnowledgeModeChange}
								screenAssistantTargetId={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:knowledge` : undefined}
							/>
						);
					}
					return (
						<AgentCompactConfigNavButton
							item={item}
							key={item.agentFieldName}
							onClick={getAgentCompactConfigNavItemOnClick(item, onAppendListItem, onOpenDirectory)}
							screenAssistantTargetId={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:${item.agentFieldName}` : undefined}
						/>
					);
				})}
				{hiddenItems.length > 0 ? (
					<DropdownMenu>
						<DropdownMenuTrigger
							aria-label="More configuration options"
							render={<Button className="size-6 rounded px-0" size="icon-compact" type="button" variant="ghost" />}
						>
							<MoreHorizontalIcon size="small" />
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuGroup>
								{hiddenItems.map((item) => {
									if (item.agentFieldName === "reasoning") {
										return (
											<AgentReasoningOverflowMenu
												key={item.agentFieldName}
												value={reasoningValue}
												onValueChange={onReasoningValueChange}
											/>
										);
									}
									if (item.agentFieldName === "knowledge") {
										return (
											<AgentKnowledgeOverflowMenu
												key={item.agentFieldName}
												value={knowledgeMode}
												onValueChange={onKnowledgeModeChange}
											/>
										);
									}
									return (
										<DropdownMenuItem
											elemAfter={item.count > 0 ? <Badge>{item.count}</Badge> : undefined}
											key={item.agentFieldName}
											onClick={getAgentCompactConfigNavItemOnClick(item, onAppendListItem, onOpenDirectory)}
										>
											{item.label}
										</DropdownMenuItem>
									);
								})}
							</DropdownMenuGroup>
						</DropdownMenuContent>
					</DropdownMenu>
				) : null}
			</div>
		</div>
	);
}

function getAgentCompactBentoCardGlowAccent(iconSrc: string): string {
	const group = iconSrc.match(/\/avatar-agent\/([^/]+)\//)?.[1];
	return (group && AGENT_COMPACT_BENTO_AVATAR_GROUP_ACCENTS[group]) || AGENT_COMPACT_BENTO_CARD_GLOW_FALLBACK_ACCENT;
}

function getAgentCompactBentoCardStyle(accentColor: string): AgentCompactBentoCardGlowCSSProperties {
	return {
		"--card-glow-tile-accent": accentColor,
		containerType: "size",
		willChange: "transform, opacity",
	};
}

function resetAgentCompactBentoCardPointer(tile: HTMLElement) {
	tile.style.setProperty("--card-glow-pointer-x", "-10");
	tile.style.setProperty("--card-glow-pointer-y", "-10");
}

function AgentCompactBentoCardGlowLayers({ iconSrc }: Readonly<{ iconSrc: string }>) {
	return (
		<>
			<span
				aria-hidden
				className="pointer-events-none absolute inset-0 z-0 grid place-items-center transform-gpu"
				style={AGENT_COMPACT_BENTO_CARD_GLOW_LAYER_STYLE}
			>
				<Image
					alt=""
					aria-hidden
					className="size-12 object-contain opacity-[var(--card-glow-icon-opacity)]"
					height={48}
					src={iconSrc}
					width={48}
				/>
			</span>
			<span
				aria-hidden
				className="pointer-events-none absolute inset-0 z-[1] rounded-[inherit]"
				data-agent-compact-bento-card-border-fade
				style={AGENT_COMPACT_BENTO_CARD_BORDER_FADE_STYLE}
			>
				<span
					aria-hidden
					className="pointer-events-none absolute inset-0 rounded-[inherit]"
					data-agent-compact-bento-card-base-border
					style={AGENT_COMPACT_BENTO_CARD_BASE_BORDER_STYLE}
				/>
				<span
					aria-hidden
					className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] border border-transparent"
					data-agent-compact-bento-card-glow-border
					style={AGENT_COMPACT_BENTO_CARD_BORDER_GLOW_STYLE}
				/>
			</span>
		</>
	);
}

function AgentCompactBentoTemplatesHint({
	onBrowseAll,
	onDismiss,
}: Readonly<{
	onBrowseAll?: () => void;
	onDismiss?: () => void;
}>) {
	return (
		<div className="relative z-[3] mb-3 flex items-center justify-between gap-3">
			<AgentSectionLabel>
				<span>Start with these agent templates</span>
				<span aria-hidden="true" className="mx-1">
					·
				</span>
				<button
					type="button"
					onClick={onBrowseAll}
					className="font-medium text-link underline-offset-2 hover:underline active:text-link-pressed focus-visible:rounded-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
				>
					Browse all
				</button>
			</AgentSectionLabel>
			<button
				type="button"
				onClick={onDismiss}
				className="shrink-0 text-xs font-medium text-link underline-offset-2 hover:underline active:text-link-pressed focus-visible:rounded-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
			>
				Not now
			</button>
		</div>
	);
}

function AgentCompactOperationsBento({ onDismiss }: Readonly<{ onDismiss?: () => void }>) {
	const shouldReduceMotion = useReducedMotion();
	const [browseOpen, setBrowseOpen] = useState(false);
	const tileRefs = useRef<Array<HTMLButtonElement | null>>([]);
	const handleBentoPointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
		for (const tile of tileRefs.current) {
			if (!tile) {
				continue;
			}

			const rect = tile.getBoundingClientRect();
			const centerX = rect.left + rect.width / 2;
			const centerY = rect.top + rect.height / 2;
			const relativeX = event.clientX - centerX;
			const relativeY = event.clientY - centerY;
			const normalizedX = relativeX / (rect.width / 2);
			const normalizedY = relativeY / (rect.height / 2);

			tile.style.setProperty("--card-glow-pointer-x", normalizedX.toFixed(3));
			tile.style.setProperty("--card-glow-pointer-y", normalizedY.toFixed(3));
		}
	}, []);
	const resetBentoPointer = useCallback(() => {
		for (const tile of tileRefs.current) {
			if (tile) {
				resetAgentCompactBentoCardPointer(tile);
			}
		}
	}, []);

	// Truncate each card description to the whole number of lines that fit its box;
	// shared with the studio bento (`HomeStarterBento`) so both stay identical.
	const registerDescBox = useBentoDescriptionClamp();

	return (
		<motion.section
			aria-label="Operations prompt starters"
			data-slot="agent-compact-operations-bento"
			className="@container/bento relative flex min-h-0 flex-1 flex-col lg:min-h-[11.5rem]"
			onPointerLeave={resetBentoPointer}
			onPointerMove={handleBentoPointerMove}
			style={{ ...AGENT_COMPACT_BENTO_CARD_GLOW_EFFECT_STYLE, willChange: "transform, opacity" }}
			initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
			transition={{ duration: 0.24, ease: [0, 0.4, 0, 1] }}
		>
			<AgentCompactBentoTemplatesHint onBrowseAll={() => setBrowseOpen(true)} onDismiss={onDismiss} />
			{/*
				`-mt-2 pt-2` gives the masked content top headroom that nets to zero
				visual shift: the bottom-fade mask clips its children to the box, so
				tiles flush with the top edge would have their focus ring and glow
				border sliced off. The padding keeps those effects inside the opaque
				region; the negative margin pulls the box back so spacing is unchanged.
			*/}
			<div className="relative -mt-2 min-h-0 pt-2 lg:flex-1 lg:overflow-hidden lg:bento-fade-bottom">
				<BentoCarousel
					gridClassName="lg:grid-cols-5"
					arrowLabels={{ next: "Show next agent templates", previous: "Show previous agent templates" }}
				>
					{AGENT_COMPACT_OPERATIONS_TEMPLATES.map((template, index) => {
						const accentColor = getAgentCompactBentoCardGlowAccent(template.iconSrc);

						return (
							<motion.button
								key={template.title}
								type="button"
								aria-label={`Use prompt starter: ${template.title}`}
								className={cn(
									"group group/agent-compact-bento-card relative isolate flex min-h-0 flex-col items-start gap-3 overflow-hidden rounded-lg bg-background p-4 text-left outline-none transition-[background-color,box-shadow] duration-fast ease-out hover:bg-bg-neutral-subtle focus-visible:ring-3 focus-visible:ring-ring/50",
									BENTO_CAROUSEL_TILE_CLASS
								)}
								ref={(node) => {
									tileRefs.current[index] = node;
								}}
								style={getAgentCompactBentoCardStyle(accentColor)}
								transition={{ duration: 0.2, ease: [0, 0.4, 0, 1] }}
								whileTap={shouldReduceMotion ? undefined : { scale: 0.98, transition: { duration: 0.05 } }}
							>
								<AgentCompactBentoCardGlowLayers iconSrc={template.iconSrc} />
								<span className="relative z-[3] inline-flex size-8 shrink-0 items-center justify-center transition-opacity duration-fast ease-out group-hover/agent-compact-bento-card:opacity-90">
									<Image
										alt=""
										aria-hidden
										className="size-8 object-contain"
										height={32}
										src={template.iconSrc}
										width={32}
									/>
								</span>
								<span className="relative z-[3] flex w-full min-w-0 flex-1 flex-col gap-1">
									<span className="block w-full min-w-0 text-sm font-semibold leading-5 text-text">
										{template.title}
									</span>
									<span
										ref={registerDescBox}
										className="block w-full min-w-0 flex-1 min-h-0 overflow-hidden"
									>
										<span className="text-sm leading-5 text-text-subtle line-clamp-2">
											{template.description}
										</span>
									</span>
								</span>
							</motion.button>
						);
					})}
				</BentoCarousel>
			</div>
			<AgentTemplatesDialog
				agents={DEMO_AGENT_TEMPLATES}
				open={browseOpen}
				onOpenChange={setBrowseOpen}
				onSelectAgent={() => setBrowseOpen(false)}
			/>
		</motion.section>
	);
}

function AgentSectionLabel({ children }: Readonly<{ children: ReactNode }>) {
	return (
		<div className="flex min-h-5 items-center text-xs font-semibold leading-4 text-text-subtlest">
			{children}
		</div>
	);
}

function getNonEmptyConfigItems(items: readonly string[] | undefined): readonly string[] {
	return (items ?? [])
		.map((item) => item.trim())
		.filter(Boolean);
}

function getAgentTriggerItems(config: AgentConfigFormValue): readonly string[] {
	const triggers = getNonEmptyConfigItems(config.triggers);
	if (triggers.length > 0) {
		return triggers;
	}

	const trigger = config.trigger?.trim();
	return trigger ? [trigger] : [];
}

function AgentReferenceChip({ label, onRemove }: Readonly<{ label: string; onRemove?: () => void }>) {
	return (
		<Tag
			color="blue"
			elemBefore={<PageIcon label="" size="small" />}
			onRemove={onRemove}
			removeVariant="overlay"
		>
			{label}
		</Tag>
	);
}

function AgentSkillChip({ label, onRemove }: Readonly<{ label: string; onRemove?: () => void }>) {
	return (
		<SkillTag
			color="teamwork"
			icon={<CheckIcon size="small" />}
			onRemove={onRemove}
			removeVariant="overlay"
			removeButtonLabel={`Remove ${label}`}
		>
			{label}
		</SkillTag>
	);
}

function AgentAddValueButton({
	className,
	label,
	onClick,
}: Readonly<{ className?: string; label: string; onClick?: () => void }>) {
	return (
		<button
			type="button"
			className={cn(
				"group/add-link inline-flex h-5 items-center gap-1 rounded-xs text-xs font-medium text-text-subtlest transition-colors hover:text-text focus-visible:text-text focus-visible:outline-none",
				className
			)}
			onClick={onClick}
		>
			<PlusIcon size="small" />
			<span className="group-hover/add-link:underline group-focus-visible/add-link:underline">{label}</span>
		</button>
	);
}

interface AgentFilledSummaryRowProps {
	label: string;
	items: readonly string[];
	variant?: "reference" | "skill";
	agentFieldName?: string;
	screenAssistantTargetId?: string;
	addLabel?: string;
	hideWhenEmpty?: boolean;
	onAdd?: () => void;
	onRemoveItem?: (index: number) => void;
}

function AgentFilledSummaryRow({
	addLabel,
	agentFieldName,
	hideWhenEmpty = false,
	items,
	label,
	onAdd,
	onRemoveItem,
	screenAssistantTargetId,
	variant = "reference",
}: Readonly<AgentFilledSummaryRowProps>) {
	const isEmpty = items.length === 0;

	// Empty rows render their inline "Add" affordance by default — in the default
	// layout that's the only way to populate an empty field. In the compact layout
	// empty fields are surfaced as single-line nav buttons instead, so
	// `hideWhenEmpty` drops the redundant empty row to avoid double-representation.
	if (isEmpty && (hideWhenEmpty || !addLabel)) {
		return null;
	}

	return (
		<div
			className="group/agent-row -mx-2 flex flex-col gap-y-1 rounded-md px-2 py-1 transition-colors hover:bg-bg-neutral-subtle-hovered sm:flex-row sm:items-center sm:gap-x-5"
			data-agent-field={agentFieldName}
			data-screen-assistant-target={screenAssistantTargetId}
		>
			<div className="sm:w-32 sm:shrink-0">
				<AgentSectionLabel>{label}</AgentSectionLabel>
			</div>
			<div className="flex min-h-5 min-w-0 flex-1 flex-wrap items-center gap-1.5">
				{items.map((item, index) => (
					variant === "skill" ? (
						<AgentSkillChip
							key={`${label}-${item}-${index}`}
							label={item}
							onRemove={onRemoveItem ? () => onRemoveItem(index) : undefined}
						/>
					) : (
						<AgentReferenceChip
							key={`${label}-${item}-${index}`}
							label={item}
							onRemove={onRemoveItem ? () => onRemoveItem(index) : undefined}
						/>
					)
				))}
				{addLabel ? (
					<AgentAddValueButton
						className={isEmpty
							? undefined
							: "opacity-0 transition-opacity group-hover/agent-row:opacity-100 group-focus-within/agent-row:opacity-100 focus-visible:opacity-100"}
						label={addLabel}
						onClick={onAdd}
					/>
				) : null}
			</div>
		</div>
	);
}

interface AgentFilledConfigSummaryProps {
	config: AgentConfigFormValue;
	hideEmptyRows?: boolean;
	knowledgeMode?: KnowledgeModeValue;
	onAppendListItem?: (field: AgentConfigListFieldName) => void;
	onKnowledgeModeChange?: (next: KnowledgeModeValue) => void;
	onOpenDirectory?: (directory: AgentDirectoryKind) => void;
	onRemoveListItem?: (field: AgentConfigListFieldName, index: number) => void;
	onTextChange?: (field: AgentConfigTextFieldName, value: string) => void;
	screenAssistantTargetPrefix?: string;
	showAddButtons?: boolean;
}

function AgentFilledConfigSummary({
	config,
	hideEmptyRows = false,
	knowledgeMode,
	onAppendListItem,
	onKnowledgeModeChange,
	onOpenDirectory,
	onRemoveListItem,
	onTextChange,
	screenAssistantTargetPrefix,
	showAddButtons = true,
}: Readonly<AgentFilledConfigSummaryProps>) {
	const triggerItems = getAgentTriggerItems(config);
	const triggerListItems = getNonEmptyConfigItems(config.triggers);
	const removeTriggerItem = triggerListItems.length > 0
		? (onRemoveListItem ? (index: number) => onRemoveListItem("triggers", index) : undefined)
		: (onTextChange ? () => onTextChange("trigger", "") : undefined);
	const skillItems = getNonEmptyConfigItems(config.skills);
	const toolItems = getNonEmptyConfigItems(config.tools);
	const subagentItems = getNonEmptyConfigItems(config.subagents);
	const knowledgeItems = getNonEmptyConfigItems(config.knowledge);
	const starterItems = getNonEmptyConfigItems(config.conversationStarters).slice(0, MAX_AGENT_CONVERSATION_STARTERS);

	const hasKnowledgeSelector = Boolean(knowledgeMode && onKnowledgeModeChange);
	// Rows declare their canonical order and whether they currently hold any user
	// content. Empty rows get sorted to the bottom (preserving the canonical order
	// within each group) so configured fields stay visually grouped at the top.
	// Source order IS the canonical display order (assuming every row is filled):
	// Triggers › Knowledge › Tools › Skills › Subagents › Memory › Conversation
	// starters. Reasoning renders separately after this list, so it always sits
	// last. `orderedRows` below preserves this order for filled rows, then sinks
	// empty rows to the bottom in the same relative order — so the array order is
	// the single source of truth for both groups. Reorder here, not in the sort.
	const rows: ReadonlyArray<{ key: string; isEmpty: boolean; node: ReactNode }> = [
		{
			key: "trigger",
			isEmpty: triggerItems.length === 0,
			node: (
				<AgentFilledSummaryRow
					addLabel={getAgentFilledSummaryAddLabel("triggers", triggerItems.length === 0, showAddButtons)}
					hideWhenEmpty={hideEmptyRows}
					agentFieldName="trigger"
					items={triggerItems}
					label="Triggers"
					onAdd={() => onAppendListItem?.("triggers")}
					onRemoveItem={removeTriggerItem}
					screenAssistantTargetId={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:trigger` : undefined}
				/>
			),
		},
		{
			key: "knowledge",
			// The new knowledge selector always renders its mode lozenge, so the row
			// is never visually empty even when no custom items are configured.
			isEmpty: hasKnowledgeSelector ? false : knowledgeItems.length === 0,
			node: hasKnowledgeSelector && knowledgeMode && onKnowledgeModeChange ? (
				<AgentKnowledgeRow
					addLabel={showAddButtons ? "Add" : undefined}
					items={knowledgeItems}
					onAdd={() => openAgentDirectoryOrAppendListItem("knowledge", "knowledge", onOpenDirectory, onAppendListItem)}
					onRemoveItem={onRemoveListItem ? (index) => onRemoveListItem("knowledge", index) : undefined}
					onValueChange={onKnowledgeModeChange}
					screenAssistantTargetId={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:knowledge` : undefined}
					value={knowledgeMode}
				/>
			) : (
				<AgentFilledSummaryRow
					addLabel={showAddButtons ? "Add" : undefined}
					hideWhenEmpty={hideEmptyRows}
					items={knowledgeItems}
					label="Knowledge"
					onAdd={() => openAgentDirectoryOrAppendListItem("knowledge", "knowledge", onOpenDirectory, onAppendListItem)}
					onRemoveItem={onRemoveListItem ? (index) => onRemoveListItem("knowledge", index) : undefined}
					screenAssistantTargetId={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:knowledge` : undefined}
				/>
			),
		},
		{
			key: "tools",
			isEmpty: toolItems.length === 0,
			node: (
				<AgentFilledSummaryRow
					addLabel={getAgentFilledSummaryAddLabel("tools", toolItems.length === 0, showAddButtons)}
					hideWhenEmpty={hideEmptyRows}
					agentFieldName="tools"
					items={toolItems}
					label="Tools"
					onAdd={() => openAgentDirectoryOrAppendListItem("tools", "tools", onOpenDirectory, onAppendListItem)}
					onRemoveItem={onRemoveListItem ? (index) => onRemoveListItem("tools", index) : undefined}
					screenAssistantTargetId={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:tools` : undefined}
				/>
			),
		},
		{
			key: "skills",
			isEmpty: skillItems.length === 0,
			node: (
				<AgentFilledSummaryRow
					addLabel={getAgentFilledSummaryAddLabel("skills", skillItems.length === 0, showAddButtons)}
					hideWhenEmpty={hideEmptyRows}
					items={skillItems}
					label="Skills"
					onAdd={() => openAgentDirectoryOrAppendListItem("skills", "skills", onOpenDirectory, onAppendListItem)}
					onRemoveItem={onRemoveListItem ? (index) => onRemoveListItem("skills", index) : undefined}
					variant="skill"
					screenAssistantTargetId={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:skills` : undefined}
				/>
			),
		},
		{
			key: "subagents",
			isEmpty: subagentItems.length === 0,
			node: (
				<AgentFilledSummaryRow
					addLabel={getAgentFilledSummaryAddLabel("subagents", subagentItems.length === 0, showAddButtons)}
					hideWhenEmpty={hideEmptyRows}
					items={subagentItems}
					label="Subagents"
					onAdd={() => onAppendListItem?.("subagents")}
					onRemoveItem={onRemoveListItem ? (index) => onRemoveListItem("subagents", index) : undefined}
					screenAssistantTargetId={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:subagents` : undefined}
				/>
			),
		},
		{
			key: "memory",
			// Memory is a default, always-on knowledge source, so this row is never
			// empty and stays directly under Subagents among the filled rows.
			isEmpty: false,
			node: (
				<AgentMemoryRow
					screenAssistantTargetId={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:memory` : undefined}
				/>
			),
		},
		{
			key: "conversationStarters",
			isEmpty: starterItems.length === 0,
			node: (
				<AgentFilledSummaryRow
					addLabel={getAgentFilledSummaryAddLabel("conversationStarters", starterItems.length === 0, showAddButtons)}
					hideWhenEmpty={hideEmptyRows}
					agentFieldName="conversationStarters"
					items={starterItems}
					label="Conversation starters"
					onAdd={() => onAppendListItem?.("conversationStarters")}
					onRemoveItem={onRemoveListItem ? (index) => onRemoveListItem("conversationStarters", index) : undefined}
					screenAssistantTargetId={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:conversation-starters` : undefined}
				/>
			),
		},
	];
	// Map then sort by index to keep the sort stable across runtimes (Array#sort
	// only became stable in V8 in 2018, but other engines may differ).
	const orderedRows = rows
		.map((row, index) => ({ ...row, index }))
		.sort((a, b) => {
			if (a.isEmpty !== b.isEmpty) return a.isEmpty ? 1 : -1;
			return a.index - b.index;
		});

	return (
		<div className="flex flex-col gap-1">
			{orderedRows.map((row) => (
				<Fragment key={row.key}>{row.node}</Fragment>
			))}
		</div>
	);
}

function hasFilledAgentConfig(config: AgentConfigFormValue): boolean {
	return (
		getAgentTriggerItems(config).length > 0 ||
		getNonEmptyConfigItems(config.skills).length > 0 ||
		getNonEmptyConfigItems(config.tools).length > 0 ||
		getNonEmptyConfigItems(config.subagents).length > 0 ||
		getNonEmptyConfigItems(config.knowledge).length > 0 ||
		getNonEmptyConfigItems(config.conversationStarters).length > 0
	);
}

function AgentProfileCover({ avatarSrc = AGENT_AVATAR_SRC }: Readonly<{ avatarSrc?: string }>) {
	const coverBackgroundColor = getAgentProfileCoverBackgroundColor(avatarSrc);
	const isAtlassianAvatar = isAtlassianLogoSource(avatarSrc);

	return (
		<div className="relative overflow-hidden rounded-t-xl bg-surface text-text">
			<div className="relative h-12 overflow-hidden" style={{ backgroundColor: coverBackgroundColor }}>
				{isAtlassianAvatar ? (
					<span className="absolute top-1/2 left-[88%] -translate-x-1/2 -translate-y-1/2 opacity-95">
						<AtlassianLogo name="atlassian" label="Atlassian" size="xlarge" />
					</span>
				) : (
					<Image
						alt=""
						aria-hidden
						className="absolute top-1/2 left-[88%] h-48 w-[168px] -translate-x-1/2 -translate-y-1/2 opacity-95"
						height={192}
						src={avatarSrc}
						width={168}
					/>
				)}
			</div>
			<div aria-hidden className="h-6" />
			<div className="absolute top-6 left-4 size-12">
				{isAtlassianAvatar ? (
					<span className="flex h-12 w-[42px] items-center justify-center">
						<AtlassianLogo name="atlassian" label="Agent avatar" size="large" />
					</span>
				) : (
					<Image
						alt="Agent avatar"
						className="h-12 w-[42px]"
						height={48}
						src={avatarSrc}
						width={42}
					/>
				)}
				<svg
					aria-hidden="true"
					className="pointer-events-none absolute top-0 left-0 h-12 w-[42px] overflow-visible"
					focusable="false"
					viewBox="0 0 43 48"
				>
					<path
						className="stroke-surface"
						d={AGENT_AVATAR_HEXAGON_PATH}
						fill="none"
						strokeWidth={2}
						vectorEffect="non-scaling-stroke"
					/>
				</svg>
			</div>
		</div>
	);
}

function AgentKnowledgePanel() {
	return (
		<section className="space-y-0">
			<AgentSectionLabel>Knowledge</AgentSectionLabel>
			<div className="rounded-xl border border-border bg-bg-input p-1.5">
				<div className="relative flex h-12 min-w-0 items-center justify-between gap-3 overflow-hidden rounded-lg bg-surface-sunken pl-1.5 pr-2">
					<TwgToolBannerBackground />
					<div className="relative z-10 flex min-w-0 items-center gap-2">
						<Tile
							className="bg-surface text-icon-discovery"
							hasBorder
							label="Teamwork Graph"
							size="medium"
							variant="transparent"
						>
							<svg
								className="size-4 text-icon"
								width={16}
								height={16}
								viewBox="0 0 16 16"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
								aria-hidden
							>
								<path d="M11 11L5 5" stroke="currentColor" strokeWidth={1.5} />
								<circle cx="3.5" cy="3.5" r="1.75" stroke="#1868DB" strokeWidth={1.5} />
								<circle cx="3.5" cy="12.5" r="1.75" stroke="#BF63F3" strokeWidth={1.5} />
								<circle cx="12.5" cy="12.5" r="1.75" stroke="#FCA700" strokeWidth={1.5} />
								<circle cx="12.5" cy="3.5" r="1.75" stroke="#6A9A23" strokeWidth={1.5} />
							</svg>
						</Tile>
						<span className="truncate text-sm font-medium text-text-subtle">Teamwork Graph</span>
					</div>
					<TWGAppstack
						className="relative z-10 max-w-[42%]"
						iconSize="md"
						sources={AGENT_KNOWLEDGE_SOURCES}
					/>
				</div>
				<div className="flex items-center justify-between rounded-lg p-1.5 transition-colors hover:bg-bg-neutral-subtle-hovered">
					<div className="flex min-w-0 items-center gap-3">
						<AgentIconTile label="Memory">
							<Icon render={<AiModelIcon label="" />} aria-hidden />
						</AgentIconTile>
						<span className="truncate text-sm font-medium text-text-subtle">Memory</span>
					</div>
					<Button variant="ghost">
						Manage
					</Button>
				</div>
				<div className="px-1.5 py-1.5">
					<div className="h-px bg-border-disabled" />
				</div>
				<button
					type="button"
					className="flex w-full items-center gap-3 rounded-lg p-1.5 text-left text-sm font-medium text-text-subtle transition-colors hover:bg-bg-neutral-subtle-hovered focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
				>
					<AgentIconTile label="Add knowledge">
						<Icon render={<AddIcon label="" size="small" />} aria-hidden />
					</AgentIconTile>
					<span>Add knowledge</span>
				</button>
			</div>
		</section>
	);
}

const REASONING_MODE_SECTIONS = [
	{
		title: "Quick answer",
		options: [{ value: "quick-auto", label: "Searching and simple Q&A" }],
	},
	{
		title: "Think deeper",
		options: [
			{ value: "deep-auto", label: "Recommended" },
			{ value: "gemini-flash-3", label: "Gemini Flash 3" },
			{ value: "gpt-5.4", label: "GPT 5.4" },
			{ value: "sonnet-4.6", label: "Sonnet 4.6" },
			{ value: "opus-4.6", label: "Opus 4.6" },
		],
	},
] as const;

type ReasoningModeValue =
	(typeof REASONING_MODE_SECTIONS)[number]["options"][number]["value"];

type ReasoningModeSectionTitle =
	(typeof REASONING_MODE_SECTIONS)[number]["title"];

const REASONING_MODE_FLAT_OPTIONS = REASONING_MODE_SECTIONS.flatMap((section) =>
	section.options.map((option) => ({
		...option,
		section: section.title,
	})),
);

function findReasoningModeOption(value: ReasoningModeValue) {
	return REASONING_MODE_FLAT_OPTIONS.find((option) => option.value === value);
}

function getReasoningSectionDefaultValue(section: ReasoningModeSectionTitle): ReasoningModeValue {
	const match = REASONING_MODE_SECTIONS.find((entry) => entry.title === section);
	return (match?.options[0]?.value ?? "deep-auto") as ReasoningModeValue;
}

function AgentReasoningSelectorMenu({
	value,
	onValueChange,
}: Readonly<{
	value: ReasoningModeValue;
	onValueChange: (next: ReasoningModeValue) => void;
}>) {
	return (
		<DropdownMenuContent align="start" className="min-w-[280px]">
			{REASONING_MODE_SECTIONS.map((section) => (
				<DropdownMenuGroup key={section.title}>
					<DropdownMenuLabel>{section.title}</DropdownMenuLabel>
					{section.options.map((option) => (
						<DropdownMenuItem
							elemAfter={value === option.value ? <CheckIcon size="small" /> : undefined}
							key={option.value}
							onClick={() => onValueChange(option.value as ReasoningModeValue)}
						>
							{option.label}
						</DropdownMenuItem>
					))}
				</DropdownMenuGroup>
			))}
		</DropdownMenuContent>
	);
}

interface AgentReasoningSelectorProps {
	value: ReasoningModeValue;
	onValueChange: (next: ReasoningModeValue) => void;
	render: "nav-button" | "row";
	screenAssistantTargetId?: string;
}

function AgentReasoningSelector({
	value,
	onValueChange,
	render,
	screenAssistantTargetId,
}: Readonly<AgentReasoningSelectorProps>) {
	const current = findReasoningModeOption(value);
	const sectionLabel = current?.section ?? "Reasoning";
	const isThinkDeeper = current?.section === "Think deeper";

	if (render === "nav-button") {
		return (
			<DropdownMenu>
				<DropdownMenuTrigger
					render={(
						<button
							type="button"
							data-agent-field="reasoning"
							data-screen-assistant-target={screenAssistantTargetId}
							className="inline-flex h-6 shrink-0 items-center gap-1 rounded px-2 text-xs font-semibold leading-4 text-text-subtlest transition-colors hover:bg-bg-neutral-subtle-hovered hover:text-text focus-visible:ring-3 focus-visible:ring-ring/50"
						/>
					)}
				>
					Reasoning
				</DropdownMenuTrigger>
				<AgentReasoningSelectorMenu value={value} onValueChange={onValueChange} />
			</DropdownMenu>
		);
	}

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger
					render={<LozengeDropdownTrigger aria-label="Reasoning mode" icon={<AiComputeIcon label="" size="small" />} />}
				>
					{sectionLabel}
				</DropdownMenuTrigger>
				<AgentReasoningSelectorMenu value={value} onValueChange={onValueChange} />
			</DropdownMenu>
			{isThinkDeeper ? (
				<>
					<div aria-hidden className="h-4 w-px shrink-0 bg-border" />
					<Tag>{current?.label ?? "Recommended"}</Tag>
				</>
			) : null}
		</>
	);
}

function AgentReasoningOverflowMenu({
	value,
	onValueChange,
}: Readonly<{
	value: ReasoningModeValue;
	onValueChange: (next: ReasoningModeValue) => void;
}>) {
	return (
		<DropdownMenuSub>
			<DropdownMenuSubTrigger>Reasoning</DropdownMenuSubTrigger>
			<DropdownMenuSubContent>
				{REASONING_MODE_SECTIONS.map((section) => (
					<DropdownMenuGroup key={section.title}>
						<DropdownMenuLabel>{section.title}</DropdownMenuLabel>
						{section.options.map((option) => (
							<DropdownMenuItem
								elemAfter={value === option.value ? <CheckIcon size="small" /> : undefined}
								key={option.value}
								onClick={() => onValueChange(option.value as ReasoningModeValue)}
							>
								{option.label}
							</DropdownMenuItem>
						))}
					</DropdownMenuGroup>
				))}
			</DropdownMenuSubContent>
		</DropdownMenuSub>
	);
}

interface AgentReasoningRowProps {
	value: ReasoningModeValue;
	onValueChange: (next: ReasoningModeValue) => void;
	screenAssistantTargetId?: string;
}

function AgentReasoningRow({
	value,
	onValueChange,
	screenAssistantTargetId,
}: Readonly<AgentReasoningRowProps>) {
	return (
		<div
			className="group/agent-row -mx-2 flex flex-col gap-y-1 rounded-md px-2 py-1 transition-colors hover:bg-bg-neutral-subtle-hovered sm:flex-row sm:items-center sm:gap-x-5"
			data-agent-field="reasoning"
			data-screen-assistant-target={screenAssistantTargetId}
		>
			<div className="sm:w-32 sm:shrink-0">
				<AgentSectionLabel>Reasoning</AgentSectionLabel>
			</div>
			<div className="flex min-h-5 min-w-0 flex-1 flex-wrap items-center gap-1.5">
				<AgentReasoningSelector
					render="row"
					value={value}
					onValueChange={onValueChange}
				/>
			</div>
		</div>
	);
}

const KNOWLEDGE_MODE_OPTIONS = [
	{ value: "all", label: "All organizational knowledge" },
	{ value: "custom", label: "Custom knowledge" },
	{ value: "none", label: "No organizational knowledge" },
] as const;

type KnowledgeModeValue = (typeof KNOWLEDGE_MODE_OPTIONS)[number]["value"];

function findKnowledgeModeOption(value: KnowledgeModeValue) {
	return KNOWLEDGE_MODE_OPTIONS.find((option) => option.value === value);
}

function AgentKnowledgeSelectorMenu({
	value,
	onValueChange,
}: Readonly<{
	value: KnowledgeModeValue;
	onValueChange: (next: KnowledgeModeValue) => void;
}>) {
	return (
		<DropdownMenuContent align="start" className="min-w-[280px]">
			<DropdownMenuGroup>
				{KNOWLEDGE_MODE_OPTIONS.map((option) => (
					<DropdownMenuItem
						elemAfter={value === option.value ? <CheckIcon size="small" /> : undefined}
						key={option.value}
						onClick={() => onValueChange(option.value)}
					>
						{option.label}
					</DropdownMenuItem>
				))}
			</DropdownMenuGroup>
		</DropdownMenuContent>
	);
}

interface AgentKnowledgeSelectorProps {
	value: KnowledgeModeValue;
	onValueChange: (next: KnowledgeModeValue) => void;
	render: "nav-button" | "row";
	screenAssistantTargetId?: string;
}

function AgentKnowledgeSelector({
	value,
	onValueChange,
	render,
	screenAssistantTargetId,
}: Readonly<AgentKnowledgeSelectorProps>) {
	const current = findKnowledgeModeOption(value);
	const label = current?.label ?? "Knowledge";

	if (render === "nav-button") {
		return (
			<DropdownMenu>
				<DropdownMenuTrigger
					render={(
						<button
							type="button"
							data-agent-field="knowledge"
							data-screen-assistant-target={screenAssistantTargetId}
							className="inline-flex h-6 shrink-0 items-center gap-1 rounded px-2 text-xs font-semibold leading-4 text-text-subtlest transition-colors hover:bg-bg-neutral-subtle-hovered hover:text-text focus-visible:ring-3 focus-visible:ring-ring/50"
						/>
					)}
				>
					Knowledge
				</DropdownMenuTrigger>
				<AgentKnowledgeSelectorMenu value={value} onValueChange={onValueChange} />
			</DropdownMenu>
		);
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={<LozengeDropdownTrigger aria-label="Knowledge mode" icon={<BookOpenIcon label="" size="small" />} />}
			>
				{label}
			</DropdownMenuTrigger>
			<AgentKnowledgeSelectorMenu value={value} onValueChange={onValueChange} />
		</DropdownMenu>
	);
}

function AgentKnowledgeOverflowMenu({
	value,
	onValueChange,
}: Readonly<{
	value: KnowledgeModeValue;
	onValueChange: (next: KnowledgeModeValue) => void;
}>) {
	return (
		<DropdownMenuSub>
			<DropdownMenuSubTrigger>Knowledge</DropdownMenuSubTrigger>
			<DropdownMenuSubContent>
				<DropdownMenuGroup>
					{KNOWLEDGE_MODE_OPTIONS.map((option) => (
						<DropdownMenuItem
							elemAfter={value === option.value ? <CheckIcon size="small" /> : undefined}
							key={option.value}
							onClick={() => onValueChange(option.value)}
						>
							{option.label}
						</DropdownMenuItem>
					))}
				</DropdownMenuGroup>
			</DropdownMenuSubContent>
		</DropdownMenuSub>
	);
}

const MEMORY_MODE_OPTIONS = [
	{ value: "on", label: "On" },
	{ value: "off", label: "Off" },
] as const;

type MemoryModeValue = (typeof MEMORY_MODE_OPTIONS)[number]["value"];

function AgentMemorySelector() {
	const [value, setValue] = useState<MemoryModeValue>("on");
	const selectedOption = MEMORY_MODE_OPTIONS.find((option) => option.value === value) ?? MEMORY_MODE_OPTIONS[0];

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={(
					<LozengeDropdownTrigger
						aria-label="Memory mode"
						icon={<AiModelIcon label="" size="small" />}
					/>
				)}
			>
				{`Memory ${selectedOption.label.toLowerCase()}`}
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start">
				<DropdownMenuGroup>
					{MEMORY_MODE_OPTIONS.map((option) => (
						<DropdownMenuItem
							elemAfter={value === option.value ? <CheckIcon size="small" /> : undefined}
							key={option.value}
							onClick={() => setValue(option.value)}
						>
							{option.label}
						</DropdownMenuItem>
					))}
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem>
						Configure memory
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function AgentMemoryRow({
	screenAssistantTargetId,
}: Readonly<{ screenAssistantTargetId?: string }>) {
	return (
		<div
			className="group/agent-row -mx-2 flex flex-col gap-y-1 rounded-md px-2 py-1 transition-colors hover:bg-bg-neutral-subtle-hovered sm:flex-row sm:items-center sm:gap-x-5"
			data-agent-field="memory"
			data-screen-assistant-target={screenAssistantTargetId}
		>
			<div className="sm:w-32 sm:shrink-0">
				<AgentSectionLabel>Memory</AgentSectionLabel>
			</div>
			<div className="flex min-h-5 min-w-0 flex-1 flex-wrap items-center gap-1.5">
				<AgentMemorySelector />
			</div>
		</div>
	);
}

interface AgentKnowledgeRowProps {
	value: KnowledgeModeValue;
	onValueChange: (next: KnowledgeModeValue) => void;
	items: readonly string[];
	addLabel?: string;
	onAdd?: () => void;
	onRemoveItem?: (index: number) => void;
	screenAssistantTargetId?: string;
}

function AgentKnowledgeRow({
	value,
	onValueChange,
	items,
	addLabel,
	onAdd,
	onRemoveItem,
	screenAssistantTargetId,
}: Readonly<AgentKnowledgeRowProps>) {
	const isCustom = value === "custom";
	const isEmpty = items.length === 0;

	return (
		<div
			className="group/agent-row -mx-2 flex flex-col gap-y-1 rounded-md px-2 py-1 transition-colors hover:bg-bg-neutral-subtle-hovered sm:flex-row sm:items-center sm:gap-x-5"
			data-agent-field="knowledge"
			data-screen-assistant-target={screenAssistantTargetId}
		>
			<div className="sm:w-32 sm:shrink-0">
				<AgentSectionLabel>Knowledge</AgentSectionLabel>
			</div>
			<div className="flex min-h-5 min-w-0 flex-1 flex-wrap items-center gap-1.5">
				<AgentKnowledgeSelector
					render="row"
					value={value}
					onValueChange={onValueChange}
				/>
				{isCustom ? (
					<>
						{items.map((item, index) => (
							<AgentReferenceChip
								key={`knowledge-${item}-${index}`}
								label={item}
								onRemove={onRemoveItem ? () => onRemoveItem(index) : undefined}
							/>
						))}
						{addLabel ? (
							<AgentAddValueButton
								className={isEmpty
									? undefined
									: "opacity-0 transition-opacity group-hover/agent-row:opacity-100 group-focus-within/agent-row:opacity-100 focus-visible:opacity-100"}
								label={addLabel}
								onClick={onAdd}
							/>
						) : null}
					</>
				) : null}
			</div>
		</div>
	);
}

function AgentInstructionsComposer({
	bottomSlot,
	bottomSlotClassName,
	className,
	contentClassName,
	editorClassName,
	instructions,
	onOpenDirectory,
	onInstructionsChange,
	screenAssistantTargetId,
	showSectionLabel = true,
	toolbarBelowSlot,
}: Readonly<{
	bottomSlot?: ReactNode;
	bottomSlotClassName?: string;
	className?: string;
	contentClassName?: string;
	editorClassName?: string;
	instructions?: string;
	onOpenDirectory?: (directory: AgentDirectoryKind) => void;
	onInstructionsChange?: (value: string) => void;
	screenAssistantTargetId?: string;
	showSectionLabel?: boolean;
	toolbarBelowSlot?: ReactNode;
}>) {
	const [skills, setSkills] = useState<RichTextMentionItem[]>([]);
	const [knowledge, setKnowledge] = useState<RichTextMentionItem[]>([]);
	const [templatesOpen, setTemplatesOpen] = useState(false);
	const mentionSources = useMemo<RichTextMentionSources>(() => ({
		skill: skills,
		knowledge,
	}), [knowledge, skills]);
	const handleInsertReferenceOption = useCallback((category: string): boolean => {
		if (category === "knowledge") {
			onOpenDirectory?.("knowledge");
			return Boolean(onOpenDirectory);
		}
		if (category === "tool") {
			onOpenDirectory?.("tools");
			return Boolean(onOpenDirectory);
		}
		if (category === "skill") {
			onOpenDirectory?.("skills");
			return Boolean(onOpenDirectory);
		}

		return false;
	}, [onOpenDirectory]);

	useEffect(() => {
		const abortController = new AbortController();

		async function loadMentionSources(): Promise<void> {
			try {
				const [skillsResponse, knowledgeResponse] = await Promise.all([
					fetch("/api/skills", { signal: abortController.signal }),
					fetch("/api/wiki/memory-explorer", { signal: abortController.signal }),
				]);

				if (skillsResponse.ok) {
					const payload = await skillsResponse.json() as AgentSkillMentionResponse;
					setSkills(mapSkillsToMentionItems(payload.skills));
				}

				if (knowledgeResponse.ok) {
					const payload = await knowledgeResponse.json() as WikiMemoryExplorerResponse;
					setKnowledge(mapMemoryToKnowledgeItems(payload));
				}
			} catch (error) {
				if (error instanceof DOMException && error.name === "AbortError") {
					return;
				}
			}
		}

		void loadMentionSources();

		return () => abortController.abort();
	}, []);

	return (
		<section
			className={cn("space-y-0", className)}
			data-agent-field="instructions"
			data-screen-assistant-target={screenAssistantTargetId}
		>
			{showSectionLabel ? (
				<AgentSectionLabel>Instructions</AgentSectionLabel>
			) : null}
			<RichTextEditor
				aria-label="Agent instructions"
				className="space-y-2"
				contentClassName={cn("pt-2", contentClassName)}
				editorClassName={cn("agent-instructions-tiptap-editor text-text", editorClassName)}
				placeholder="Describe the agent’s role and what it should do. @ to mention people and agents, / for skills, tools, and knowledge, or start with a template"
				placeholderSlot={(
					<p className="text-sm leading-[1.55] text-text-subtlest">
						Describe the agent’s role and what it should do. @ to mention people and agents, / for skills, tools, and knowledge, or{" "}
						<button
							type="button"
							className="pointer-events-auto cursor-pointer rounded-sm text-link no-underline underline-offset-2 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
							onClick={() => setTemplatesOpen(true)}
						>
							start with a template
						</button>
					</p>
				)}
				onInsertReferenceOption={handleInsertReferenceOption}
				toolbarBelowSlot={toolbarBelowSlot}
				value={instructions}
				mentionSources={mentionSources}
				onMarkdownChange={onInstructionsChange}
			/>
			{bottomSlot ? (
				<div className={bottomSlotClassName}>
					{bottomSlot}
				</div>
			) : null}
			<AgentTemplatesDialog
				agents={DEMO_AGENT_TEMPLATES}
				open={templatesOpen}
				onOpenChange={setTemplatesOpen}
				onSelectAgent={() => setTemplatesOpen(false)}
			/>
		</section>
	);
}

interface AgentConfigProfileProps {
	config: AgentConfigFormValue;
	avatarSrc?: string;
	onTextChange?: (field: AgentConfigTextFieldName, value: string) => void;
	screenAssistantTargetPrefix?: string;
}

function AgentConfigProfile({
	config,
	avatarSrc,
	onTextChange,
	screenAssistantTargetPrefix,
}: Readonly<AgentConfigProfileProps>) {
	return (
		<section
			className="flex flex-col gap-4"
			data-screen-assistant-target={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:profile` : undefined}
		>
			<AgentProfileCover avatarSrc={avatarSrc} />
			<div
				className="flex flex-col gap-1"
				data-agent-field="name"
				data-screen-assistant-target={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:name` : undefined}
			>
				<InlineEdit
					value={config.name ?? ""}
					placeholder="Untitled agent"
					editButtonLabel="Edit agent name"
					readViewClassName="relative h-auto overflow-visible border-2 bg-transparent px-0 py-1 text-2xl leading-7 font-semibold hover:bg-transparent active:bg-transparent focus:border-border-focused focus-visible:border-border-focused focus-visible:bg-transparent"
					readViewMotionProps={AGENT_PROFILE_INLINE_EDIT_MOTION_PROPS}
					readViewBackdropClassName="-inset-0.5 bg-bg-neutral-subtle-hovered"
					readViewBackdropMotionProps={AGENT_PROFILE_INLINE_EDIT_BACKDROP_MOTION_PROPS}
					inputProps={{ className: "h-auto border-2 px-1.5 py-1 text-2xl leading-7 font-semibold focus:border-ring md:text-2xl" }}
					onConfirm={(value) => onTextChange?.("name", value)}
				/>
				<div
					data-agent-field="description"
					data-screen-assistant-target={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:description` : undefined}
				>
					<InlineEdit
						value={config.description ?? config.summary ?? ""}
						placeholder="Add a description"
						editButtonLabel="Edit agent description"
						multiline
						readViewClassName="relative overflow-visible border-2 bg-transparent px-0 hover:bg-transparent active:bg-transparent focus-visible:bg-transparent"
						readViewMotionProps={AGENT_PROFILE_INLINE_EDIT_MOTION_PROPS}
						readViewBackdropClassName="-inset-0.5 bg-bg-neutral-subtle-hovered"
						readViewBackdropMotionProps={AGENT_PROFILE_INLINE_EDIT_BACKDROP_MOTION_PROPS}
						textareaProps={{ rows: 1, className: "min-h-10 border-2 bg-bg-neutral-subtle px-1.5 focus:border-ring focus-visible:border-ring focus-visible:ring-0 focus-visible:ring-offset-0 data-[variant=default]:border-transparent data-[variant=default]:focus:border-ring data-[variant=default]:focus-visible:border-ring" }}
						onConfirm={(value) => onTextChange?.("description", value)}
					/>
				</div>
			</div>
		</section>
	);
}

interface AgentConfigSummaryProps {
	config: AgentConfigFormValue;
	isFilledConfig: boolean;
	onAppendListItem?: (field: AgentConfigListFieldName) => void;
	onOpenDirectory?: (directory: AgentDirectoryKind) => void;
	onRemoveListItem?: (field: AgentConfigListFieldName, index: number) => void;
	onTextChange?: (field: AgentConfigTextFieldName, value: string) => void;
	screenAssistantTargetPrefix?: string;
}

function AgentConfigSummary({
	config,
	isFilledConfig,
	onAppendListItem,
	onOpenDirectory,
	onRemoveListItem,
	onTextChange,
	screenAssistantTargetPrefix,
}: Readonly<AgentConfigSummaryProps>) {
	return isFilledConfig ? (
		<AgentFilledConfigSummary
			config={config}
			onAppendListItem={onAppendListItem}
			onOpenDirectory={onOpenDirectory}
			onRemoveListItem={onRemoveListItem}
			onTextChange={onTextChange}
			screenAssistantTargetPrefix={screenAssistantTargetPrefix}
		/>
	) : (
		<AgentMissingConfigActions
			config={config}
			onAppendListItem={onAppendListItem}
			onOpenDirectory={onOpenDirectory}
			screenAssistantTargetPrefix={screenAssistantTargetPrefix}
		/>
	);
}

function AgentCompactConfigToolbarBelow({
	config,
	isFilledConfig,
	onAppendListItem,
	onOpenDirectory,
	onRemoveListItem,
	onTextChange,
	screenAssistantTargetPrefix,
}: Readonly<AgentConfigSummaryProps>) {
	const [expanded, setExpanded] = useState(() => !isFilledConfig);
	const [reasoningValue, setReasoningValue] = useState<ReasoningModeValue>("quick-auto");
	const [knowledgeMode, setKnowledgeMode] = useState<KnowledgeModeValue>(() =>
		getNonEmptyConfigItems(config.knowledge).length > 0 ? "custom" : "all",
	);
	const shouldReduceMotion = useReducedMotion();
	const expandButtonRowRef = useRef<HTMLDivElement | null>(null);
	const expandButtonX = useMotionValue(0);
	const expandButtonPaddingRight = useTransform(expandButtonX, (latest): number =>
		Math.abs(latest) > 0.5 ? AGENT_COMPACT_CONFIG_EXPAND_BUTTON_EDGE_GAP : 0,
	);
	const expandButtonVisualX = useTransform(expandButtonX, (latest): number =>
		latest + (Math.abs(latest) > 0.5 ? AGENT_COMPACT_CONFIG_EXPAND_BUTTON_EDGE_GAP : 0),
	);
	const isExpanded = expanded;
	const transition = shouldReduceMotion ? { duration: 0 } : { duration: 0.2, ease: "easeOut" as const };

	useEffect(() => {
		const handlePointerMove = (event: PointerEvent) => {
			const row = expandButtonRowRef.current;

			if (!row) {
				return;
			}

			const rect = row.getBoundingClientRect();
			const pointerDistanceFromBottom = rect.bottom - event.clientY;
			const isNearBottom = pointerDistanceFromBottom >= -AGENT_COMPACT_CONFIG_EXPAND_BUTTON_SIZE
				&& pointerDistanceFromBottom <= AGENT_COMPACT_CONFIG_EXPAND_BUTTON_REVEAL_DISTANCE;

			if (!isNearBottom) {
				expandButtonX.set(0);
				return;
			}

			const restingCenterX = rect.right - AGENT_COMPACT_CONFIG_EXPAND_BUTTON_SIZE / 2;
			const minCenterX = rect.left + AGENT_COMPACT_CONFIG_EXPAND_BUTTON_SIZE / 2;
			const maxCenterX = rect.right - AGENT_COMPACT_CONFIG_EXPAND_BUTTON_SIZE / 2;
			const targetCenterX = Math.min(Math.max(event.clientX, minCenterX), maxCenterX);

			expandButtonX.set(targetCenterX - restingCenterX);
		};
		const handlePointerLeave = () => {
			expandButtonX.set(0);
		};

		window.addEventListener("pointermove", handlePointerMove, true);
		window.addEventListener("pointerleave", handlePointerLeave);

		return () => {
			window.removeEventListener("pointermove", handlePointerMove, true);
			window.removeEventListener("pointerleave", handlePointerLeave);
		};
	}, [expandButtonX]);

	return (
		<div className="flex flex-col">
			<div className="relative flex h-6 items-center" ref={expandButtonRowRef}>
				<div aria-hidden className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border" />
				<motion.div
					className="relative z-10 ml-auto bg-surface pl-2"
					style={{ paddingRight: expandButtonPaddingRight, x: expandButtonVisualX }}
				>
					<Button
						aria-label={isExpanded ? "Collapse configuration" : "Expand configuration"}
						className="size-6 rounded border-border bg-surface-overlay px-0 text-icon-subtle hover:bg-surface-overlay-hovered active:bg-surface-overlay-pressed"
						onClick={() => setExpanded((prev) => !prev)}
						size="icon-compact"
						type="button"
						variant="ghost"
					>
						{isExpanded ? (
							<ChevronDownIcon label="" size="small" />
						) : (
							<ChevronUpIcon label="" size="small" />
						)}
					</Button>
				</motion.div>
			</div>
			<AnimatePresence initial={false} mode="wait">
				{isExpanded ? (
					<motion.div
						key="expanded"
						className="bg-surface pt-2"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={transition}
					>
						<AgentFilledConfigSummary
							config={config}
							knowledgeMode={knowledgeMode}
							onKnowledgeModeChange={setKnowledgeMode}
							onAppendListItem={onAppendListItem}
							onOpenDirectory={onOpenDirectory}
							onRemoveListItem={onRemoveListItem}
							onTextChange={onTextChange}
							screenAssistantTargetPrefix={screenAssistantTargetPrefix}
						/>
						<AgentReasoningRow
							value={reasoningValue}
							onValueChange={setReasoningValue}
							screenAssistantTargetId={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:reasoning` : undefined}
						/>
					</motion.div>
				) : (
					<motion.div
						key="collapsed"
						className="bg-surface pt-2"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={transition}
					>
						<AgentCompactEmptyConfigNav
							config={config}
							onAppendListItem={onAppendListItem}
							onOpenDirectory={onOpenDirectory}
							reasoningValue={reasoningValue}
							onReasoningValueChange={setReasoningValue}
							knowledgeMode={knowledgeMode}
							onKnowledgeModeChange={setKnowledgeMode}
							screenAssistantTargetPrefix={screenAssistantTargetPrefix}
						/>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

export interface AgentConfigFieldsProps extends ComponentProps<"div"> {
	config: AgentConfigFormValue;
	avatarSrc?: string;
	idPrefix: string;
	layout?: "default" | "compact";
	onTextChange?: (field: AgentConfigTextFieldName, value: string) => void;
	onListItemChange?: (field: AgentConfigListFieldName, index: number, value: string) => void;
	onRemoveListItem?: (field: AgentConfigListFieldName, index: number) => void;
	onAppendListItem?: (field: AgentConfigListFieldName) => void;
	onOpenDirectory?: (directory: AgentDirectoryKind) => void;
	screenAssistantTargetPrefix?: string;
}

export const AgentConfigFields = memo(
	({
		className,
		config,
		avatarSrc,
		idPrefix,
		layout = "default",
		onListItemChange,
		onAppendListItem,
		onOpenDirectory,
		onRemoveListItem,
		onTextChange,
		screenAssistantTargetPrefix,
		...props
	}: Readonly<AgentConfigFieldsProps>) => {
		const isFilledConfig = hasFilledAgentConfig(config);
		const [templatesDismissed, setTemplatesDismissed] = useState(false);
		const dismissTemplateTiles = useCallback(() => {
			setTemplatesDismissed(true);
		}, []);
		const handleTextChange = useCallback((field: AgentConfigTextFieldName, value: string) => {
			dismissTemplateTiles();
			onTextChange?.(field, value);
		}, [dismissTemplateTiles, onTextChange]);
		const handleListItemChange = useCallback((field: AgentConfigListFieldName, index: number, value: string) => {
			dismissTemplateTiles();
			onListItemChange?.(field, index, value);
		}, [dismissTemplateTiles, onListItemChange]);
		const handleRemoveListItem = useCallback((field: AgentConfigListFieldName, index: number) => {
			dismissTemplateTiles();
			onRemoveListItem?.(field, index);
		}, [dismissTemplateTiles, onRemoveListItem]);
		const handleAppendListItem = useCallback((field: AgentConfigListFieldName) => {
			dismissTemplateTiles();
			onAppendListItem?.(field);
		}, [dismissTemplateTiles, onAppendListItem]);
		const handleOpenDirectory = useCallback((directory: AgentDirectoryKind) => {
			dismissTemplateTiles();
			onOpenDirectory?.(directory);
		}, [dismissTemplateTiles, onOpenDirectory]);

		return (
			<div
				className={cn("flex flex-col gap-6", layout === "compact" && "min-h-0 flex-1", className)}
				data-agent-config-id={idPrefix}
				data-agent-config-layout={layout}
				data-screen-assistant-target={screenAssistantTargetPrefix}
				{...props}
			>
				{layout === "compact" ? (
					<div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
						{/* Scrollable region: profile + instructions grow to fill, the
						    sibling footer below stays anchored to the panel bottom. */}
						<div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
							<div className="flex flex-col gap-4">
								<AgentConfigProfile
									config={config}
									avatarSrc={avatarSrc}
									onTextChange={handleTextChange}
									screenAssistantTargetPrefix={screenAssistantTargetPrefix}
								/>
							</div>
							<AgentInstructionsComposer
								bottomSlot={isFilledConfig ? null : (
									<AnimatePresence>
										{templatesDismissed ? null : (
											<AgentCompactOperationsBento
												key="agent-compact-operations-bento"
												onDismiss={() => setTemplatesDismissed(true)}
											/>
										)}
									</AnimatePresence>
								)}
								bottomSlotClassName="mt-auto flex min-h-0 flex-col gap-2 pt-4"
								className="relative flex min-h-0 flex-1 flex-col"
								contentClassName={cn("pt-4", isFilledConfig ? "min-h-[240px]" : "min-h-[8rem]")}
								instructions={config.instructions}
								onOpenDirectory={handleOpenDirectory}
								onInstructionsChange={(value) => handleTextChange("instructions", value)}
								screenAssistantTargetId={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:instructions` : undefined}
								showSectionLabel={false}
							/>
						</div>
						{/* Bottom-anchored footer: always flush to the panel bottom. The
						    separator/expand row stays transparent so content scrolls
						    visibly behind it; only the field rows carry a solid surface. */}
						<div className="shrink-0">
							<AgentCompactConfigToolbarBelow
								config={config}
								isFilledConfig={isFilledConfig}
								onAppendListItem={handleAppendListItem}
								onOpenDirectory={handleOpenDirectory}
								onRemoveListItem={handleRemoveListItem}
								onTextChange={handleTextChange}
								screenAssistantTargetPrefix={screenAssistantTargetPrefix}
							/>
						</div>
					</div>
				) : (
					<>
						{/* Profile + config summary share one flex column; this `gap-4` is
						    the single knob for the agent description → summary rows gap. */}
						<div className="flex flex-col gap-4">
							<AgentConfigProfile
								config={config}
								avatarSrc={avatarSrc}
								onTextChange={handleTextChange}
								screenAssistantTargetPrefix={screenAssistantTargetPrefix}
							/>
							<AgentConfigSummary
								config={config}
								isFilledConfig={isFilledConfig}
								onAppendListItem={handleAppendListItem}
								onOpenDirectory={handleOpenDirectory}
								onRemoveListItem={handleRemoveListItem}
								onTextChange={handleTextChange}
								screenAssistantTargetPrefix={screenAssistantTargetPrefix}
							/>
						</div>

						{isFilledConfig ? (
							<div className="h-px bg-border" />
						) : (
							<AgentKnowledgePanel />
						)}
						<AgentInstructionsComposer
							instructions={config.instructions}
							onOpenDirectory={handleOpenDirectory}
							onInstructionsChange={(value) => handleTextChange("instructions", value)}
							screenAssistantTargetId={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:instructions` : undefined}
						/>
					</>
				)}
			</div>
		);
	}
);

Agent.displayName = "Agent";
AgentHeader.displayName = "AgentHeader";
AgentContent.displayName = "AgentContent";
AgentInstructions.displayName = "AgentInstructions";
AgentTools.displayName = "AgentTools";
AgentTool.displayName = "AgentTool";
AgentOutput.displayName = "AgentOutput";
AgentConfigFields.displayName = "AgentConfigFields";
