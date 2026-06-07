"use client";

import type { Tool } from "ai";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useTransform, type MotionProps } from "motion/react";
import type { ComponentProps, ReactNode } from "react";
import { Fragment, memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";

import ArrowLeftIcon from "@atlaskit/icon/core/arrow-left";
import AiAgentIcon from "@atlaskit/icon/core/ai-agent";
import AiChatIcon from "@atlaskit/icon/core/ai-chat";
import AutomationIcon from "@atlaskit/icon/core/automation";
import ChartTrendUpIcon from "@atlaskit/icon/core/chart-trend-up";
import DeleteIcon from "@atlaskit/icon/core/delete";
import ToolsIcon from "@atlaskit/icon/core/tools";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import ChevronUpIcon from "@atlaskit/icon/core/chevron-up";
import EditIcon from "@atlaskit/icon/core/edit";
import PageIcon from "@atlaskit/icon/core/page";
import PersonIcon from "@atlaskit/icon/core/person";
import ScorecardIcon from "@atlaskit/icon/core/scorecard";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";
import LockLockedIcon from "@atlaskit/icon/core/lock-locked";
import AiComputeIcon from "@atlaskit/icon-lab/core/ai-compute";
import AiModelIcon from "@atlaskit/icon-lab/core/ai-model";
import BookOpenIcon from "@atlaskit/icon-lab/core/book-open";
import SkillIcon from "@atlaskit/icon-lab/core/skill";
import ViewsIcon from "@atlaskit/icon-lab/core/views";

import { AgentAccess } from "@/components/blocks/agent-access";
import { AgentEvaluation } from "@/components/blocks/agent-evaluation";
import { AgentInsights } from "@/components/blocks/agent-insights";
import { AgentSurfaces } from "@/components/blocks/agent-surfaces";
import { AgentUsers } from "@/components/blocks/agent-users";
import { AgentTemplatesDialog } from "@/components/blocks/agent-templates";
import { DEMO_AGENT_TEMPLATES } from "@/components/blocks/agent-templates/data/demo-template-agents";
import {
	DEFAULT_STARTER_ICON,
	getStarterIcon,
	type StarterIconKey,
} from "@/components/blocks/conversation-starters";
import {
	renderAgentTriggerProviderIcon,
	serializeAgentTriggerLabels,
	TRIGGER_PROVIDERS,
	TriggerPicker,
	TriggerProviderSubmenu,
	type AgentTriggerValue,
} from "@/components/blocks/triggers/page";
import { createAgentTriggerValue } from "@/components/blocks/triggers/data/trigger-catalog";
import { UNTITLED_SUBAGENT_NAME } from "@/components/blocks/subagents/lib/subagent-prompts";
import { AgentTriggersDialog } from "@/components/ui-custom/agent-triggers-dialog";
import {
	EDITOR_PALETTE_MENTION_SOURCES,
	getDirectoryMentionItemOrFallback,
} from "@/components/blocks/editor-palette/data/mention-sources";
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
import {
	Menubar,
	MenubarContent,
	MenubarMenu,
	MenubarTrigger,
} from "@/components/ui/menubar";
import { Icon } from "@/components/ui/icon";
import { InlineEdit } from "@/components/ui/inline-edit";
import { Lozenge, LozengeDropdownTrigger } from "@/components/ui/lozenge";
import { Tag, type TagColor } from "@/components/ui/tag";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { MoreHorizontalIcon, PlusIcon } from "@/components/ui/vpk-icons";
import { computeContextBarOverflow } from "@/components/ui-custom/context-bar/overflow";
import {
	type RichTextMentionItem,
	type RichTextMentionRemovalRequest,
	type RichTextMentionSources,
	type RichTextReferenceCategory,
	RichTextMentionVisualMark,
	RichTextEditor,
	getRichTextMentionTagType,
	isRichTextReferenceCategory,
} from "@/components/ui-custom/rich-text-editor";
import { useHasVerticalOverflow } from "@/components/hooks/use-has-vertical-overflow";
import type {
	WikiMemoryExplorerResponse,
} from "@/lib/rovo-runtime-types";
import { cn } from "@/lib/utils";

import { CodeBlock } from "@/components/ui-custom/code-block";

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
// Direction-aware swap for the profile header (name + description, plus the
// inline back-arrow on subagents) when toggling between the base agent and a
// subagent. Forward (parent →
// subagent) slides the incoming content in from the right; back (subagent →
// parent) slides it in from the left. Spring-based so an interrupted swap (rapid
// jumps) settles naturally; `opacity` + `transform` are the only animated props.
const AGENT_PROFILE_SWAP_SLIDE_PX = 16;
const AGENT_PROFILE_SWAP_VARIANTS = {
	enter: (direction: number) => ({ opacity: 0, x: direction * AGENT_PROFILE_SWAP_SLIDE_PX }),
	center: { opacity: 1, x: 0 },
	exit: (direction: number) => ({ opacity: 0, x: direction * -AGENT_PROFILE_SWAP_SLIDE_PX }),
} as const;
const AGENT_PROFILE_SWAP_TRANSITION = { type: "spring", bounce: 0.12, visualDuration: 0.22 } as const;

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

// Source order IS the canonical display order, kept in lockstep with the
// AgentFilledConfigSummary rows array: Triggers › Knowledge › Tools › Skills ›
// Subagents › Memory › Conversation starters. Reasoning renders separately and
// always sits last. Keep both lists in sync when reordering.
const AGENT_COMPACT_EMPTY_CONFIG_NAV_ITEMS = [
	{ agentFieldName: "trigger", label: "Triggers", Icon: AutomationIcon },
	{ agentFieldName: "knowledge", label: "Knowledge", kind: "knowledge", Icon: BookOpenIcon },
	{ agentFieldName: "tools", label: "Tools", listFieldName: "tools", Icon: ToolsIcon },
	{ agentFieldName: "skills", label: "Skills", listFieldName: "skills", Icon: SkillIcon },
	{ agentFieldName: "subagents", label: "Subagents", listFieldName: "subagents", Icon: AiAgentIcon },
	{ agentFieldName: "memory", label: "Memory", kind: "memory", Icon: AiModelIcon },
	{ agentFieldName: "conversationStarters", label: "Conversation starters", listFieldName: "conversationStarters", Icon: AiChatIcon },
	{ agentFieldName: "reasoning", label: "Reasoning", kind: "reasoning", Icon: AiComputeIcon },
] as const;

// Match the shared Menubar's default `gap-0.5` (2px) so the connected config
// strip spaces items identically to the base component.
const AGENT_COMPACT_CONFIG_NAV_GAP = 2;
const AGENT_COMPACT_CONFIG_NAV_OVERFLOW_WIDTH = 24;
// Shared flat-trigger look for every item in the connected config menu bar.
// Kept subtle (no border/background) so the strip reads as one continuous
// surface rather than a row of separate buttons.
const AGENT_COMPACT_CONFIG_NAV_TRIGGER_CLASS =
	"inline-flex h-6 shrink-0 items-center gap-1 rounded px-2 text-xs font-semibold leading-4 text-text-subtlest transition-colors outline-hidden hover:bg-bg-neutral-subtle-hovered hover:text-text aria-expanded:bg-bg-neutral-subtle-hovered aria-expanded:text-text focus-visible:ring-3 focus-visible:ring-ring/50";
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

	if (field === "conversationStarters" && !isEmpty) {
		return "Manage";
	}

	return isEmpty ? AGENT_EMPTY_ROW_ADD_LABELS[field] ?? "Add" : "Add";
}

function openAgentDirectoryOrAppendListItem(
	directory: AgentDirectoryKind,
	field: AgentConfigListFieldName,
	onOpenDirectory?: (directory: AgentDirectoryKind, selectedItem?: string) => void,
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
				case "memory":
					// Memory is an always-on knowledge source with no item count.
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

const MENTION_SOURCE_LIMIT = 24;

function toMentionId(category: RichTextMentionItem["category"], id: string): string {
	return `${category}:${id.trim().replace(/\s+/g, "-")}`;
}

export type AgentConfigReferenceListFieldName = Extract<
	AgentConfigListFieldName,
	"knowledge" | "skills" | "subagents" | "tools"
>;

const AGENT_CONFIG_FIELD_BY_REFERENCE_CATEGORY: Record<RichTextReferenceCategory, AgentConfigReferenceListFieldName> = {
	knowledge: "knowledge",
	skill: "skills",
	subagent: "subagents",
	tool: "tools",
};

const AGENT_REFERENCE_CATEGORY_BY_CONFIG_FIELD: Record<AgentConfigReferenceListFieldName, RichTextReferenceCategory> = {
	knowledge: "knowledge",
	skills: "skill",
	subagents: "subagent",
	tools: "tool",
};

function isAgentConfigReferenceListField(
	field: AgentConfigListFieldName,
): field is AgentConfigReferenceListFieldName {
	return field in AGENT_REFERENCE_CATEGORY_BY_CONFIG_FIELD;
}

function getNormalizedAgentReferenceValue(value: string): string {
	return value.trim().toLowerCase();
}

function getAgentReferenceKey(
	field: AgentConfigReferenceListFieldName,
	value: string,
): string {
	return `${field}:${getNormalizedAgentReferenceValue(value)}`;
}

function hasAgentReferenceValue(
	config: AgentConfigFormValue,
	field: AgentConfigReferenceListFieldName,
	value: string,
): boolean {
	const normalizedValue = getNormalizedAgentReferenceValue(value);
	return getNonEmptyConfigItems(config[field]).some(
		(item) => getNormalizedAgentReferenceValue(item) === normalizedValue,
	);
}

function mapConfigValuesToMentionItems(
	category: RichTextReferenceCategory,
	values: readonly string[] | undefined,
): RichTextMentionItem[] {
	return getNonEmptyConfigItems(values).map((value) =>
		getDirectoryMentionItemOrFallback(category, value)
	);
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

function mergeMentionItems(
	...groups: ReadonlyArray<readonly RichTextMentionItem[] | undefined>
): RichTextMentionItem[] {
	const seen = new Set<string>();
	const items: RichTextMentionItem[] = [];

	for (const group of groups) {
		for (const item of group ?? []) {
			const key = `${item.category}:${item.id}:${getNormalizedAgentReferenceValue(item.label)}`;
			if (seen.has(key)) {
				continue;
			}
			seen.add(key);
			items.push(item);
		}
	}

	return items;
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

export type AgentDirectoryKind = "knowledge" | "tools" | "skills" | "conversationStarters";

// Config rows that can be suppressed by callers (e.g. while editing a subagent,
// where these capabilities can't be configured). Keyed by the canonical row key
// used in `AgentFilledConfigSummary` and the `agentFieldName` used by the
// compact empty-config nav and missing-config actions.
export type AgentHideableConfigField = "trigger" | "subagents" | "conversationStarters";

export interface AgentConfigFormValue {
	name?: string;
	description?: string;
	summary?: string;
	instructions?: string;
	contextDescription?: string;
	trigger?: string;
	triggers?: readonly string[];
	triggerDefinitions?: readonly AgentTriggerValue[];
	skills?: readonly string[];
	guardrail?: string;
	tools?: readonly string[];
	subagents?: readonly string[];
	knowledge?: readonly string[];
	conversationStarters?: readonly string[];
	conversationStarterIcons?: readonly string[];
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

// "Details" was dropped — it duplicated the "Configure" view already exposed by
// the header's Configure/Test toggle, so the active config view is no longer a
// nav tab here.
const AGENT_COMPACT_HEADER_NAV_ITEMS = [
	{ icon: <ChartTrendUpIcon label="" size="small" color="currentColor" />, label: "Insights", value: "insights" },
	{ icon: <ViewsIcon label="" size="small" color="currentColor" />, label: "Surfaces", value: "surfaces" },
	{ icon: <ScorecardIcon label="" size="small" color="currentColor" />, label: "Evaluation", value: "evaluation" },
	{ icon: <PersonIcon label="" size="small" color="currentColor" />, label: "Users", value: "users" },
	{ icon: <LockLockedIcon label="" size="small" color="currentColor" />, label: "Access", value: "access" },
] as const;

export type AgentCompactHeaderSection = (typeof AGENT_COMPACT_HEADER_NAV_ITEMS)[number]["value"];

const AGENT_COMPACT_HEADER_NAV_GAP = 4;
const AGENT_COMPACT_HEADER_NAV_OVERFLOW_WIDTH = 24;

function AgentCompactHeaderNavButton({
	activeSection,
	item,
	onSectionChange,
}: Readonly<{
	activeSection?: AgentCompactHeaderSection | null;
	item: (typeof AGENT_COMPACT_HEADER_NAV_ITEMS)[number];
	onSectionChange?: (section: AgentCompactHeaderSection) => void;
}>) {
	const isSelected = activeSection === item.value;

	return (
		<Button
			type="button"
			aria-pressed={isSelected ? true : undefined}
			onClick={() => onSectionChange?.(item.value)}
			size="compact"
			variant={isSelected ? "outline" : "ghost"}
			className={cn(
				"h-6 gap-1.5 rounded px-2 text-sm font-medium leading-5",
				isSelected
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
	activeSection = null,
	avatarSrc = AGENT_AVATAR_SRC,
	onSectionChange,
}: Readonly<{
	activeSection?: AgentCompactHeaderSection | null;
	avatarSrc?: string;
	onSectionChange?: (section: AgentCompactHeaderSection) => void;
}>) {
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
				// `overflow-x-clip` hides horizontally-overflowing items (the "…"
				// menu absorbs them). The first item ("Insights") would otherwise sit
				// flush at the clip box's left edge, so its 3px focus ring gets
				// shorn flat on the left even with a clip margin. `pl-1` insets the
				// content 4px inside the clip box so the ring clears the edge; `py-1
				// -my-1` adds matching vertical room, and the clip margin covers the
				// trailing "…" item on the right.
				className="relative -my-1 flex min-w-0 flex-1 items-center overflow-x-clip overflow-y-visible py-1 pl-1 [overflow-clip-margin:6px]"
				ref={containerRef}
				style={{ gap: AGENT_COMPACT_HEADER_NAV_GAP }}
			>
				<div aria-hidden className="pointer-events-none absolute top-0 left-0 h-0 w-0 overflow-clip">
					<div className="invisible flex items-center" ref={measureRef} style={{ gap: AGENT_COMPACT_HEADER_NAV_GAP }}>
						{AGENT_COMPACT_HEADER_NAV_ITEMS.map((item) => (
							<AgentCompactHeaderNavButton
								activeSection={activeSection}
								item={item}
								key={`measure-${item.label}`}
								onSectionChange={onSectionChange}
							/>
						))}
					</div>
				</div>
				{visibleItems.map((item) => (
					<AgentCompactHeaderNavButton
						activeSection={activeSection}
						item={item}
						key={item.label}
						onSectionChange={onSectionChange}
					/>
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
									<DropdownMenuItem
										elemBefore={item.icon}
										key={item.label}
										onSelect={() => onSectionChange?.(item.value)}
									>
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

export type AgentCompactSurfacesPanelProps = ComponentProps<typeof AgentSurfaces>;

export type AgentCompactInsightsPanelProps = ComponentProps<typeof AgentInsights>;

export function AgentCompactInsightsPanel(props: Readonly<AgentCompactInsightsPanelProps>) {
	return <AgentInsights {...props} />;
}

export function AgentCompactSurfacesPanel(props: Readonly<AgentCompactSurfacesPanelProps>) {
	return <AgentSurfaces {...props} />;
}

export type AgentCompactEvaluationPanelProps = ComponentProps<typeof AgentEvaluation>;

export function AgentCompactEvaluationPanel(props: Readonly<AgentCompactEvaluationPanelProps>) {
	return <AgentEvaluation {...props} />;
}

export type AgentCompactUsersPanelProps = ComponentProps<typeof AgentUsers>;

export function AgentCompactUsersPanel(props: Readonly<AgentCompactUsersPanelProps>) {
	return <AgentUsers {...props} />;
}

export type AgentCompactAccessPanelProps = ComponentProps<typeof AgentAccess>;

export function AgentCompactAccessPanel(props: Readonly<AgentCompactAccessPanelProps>) {
	return <AgentAccess {...props} />;
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

export type AgentMoreOptionsMenuProps = {
	deleteLabel?: string;
	triggerLabel?: string;
	onDelete?: () => void;
};

export function AgentMoreOptionsMenu({
	deleteLabel = "Delete agent",
	triggerLabel = "More options",
	onDelete,
}: Readonly<AgentMoreOptionsMenuProps>) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				aria-label={triggerLabel}
				render={(
					<Button
						type="button"
						size="icon"
						variant="outline"
					/>
				)}
			>
				<Icon render={<ShowMoreHorizontalIcon label="" color="currentColor" />} aria-hidden />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuGroup>
					<DropdownMenuItem
						variant="destructive"
						elemBefore={<Icon render={<DeleteIcon label="" size="small" />} aria-hidden />}
						onClick={onDelete}
					>
						{deleteLabel}
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export const AgentHeader = memo(
	({
		className,
		avatarSrc = AGENT_AVATAR_SRC,
		leadingContent,
		model,
		name,
		primaryActionLabel = "Test",
		secondaryActionLabel = "Configure",
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
							<AgentMoreOptionsMenu />
							<ToggleGroup
								aria-label="Agent views"
								defaultValue={["configure"]}
								variant="outline"
							>
								<ToggleGroupItem value="test">
									{primaryActionLabel}
								</ToggleGroupItem>
								<ToggleGroupItem value="configure">
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

type AgentCompactConfigNavItem = ReturnType<typeof getAgentCompactEmptyConfigNavItems>[number];

function getAgentCompactConfigNavItemOnClick(
	item: AgentCompactConfigNavItem,
	onAppendListItem?: (field: AgentConfigListFieldName) => void,
	onOpenDirectory?: (directory: AgentDirectoryKind, selectedItem?: string) => void,
	onEditTriggers?: (seed?: readonly AgentTriggerValue[]) => void,
): (() => void) | undefined {
	if (item.agentFieldName === "trigger") {
		return () => onEditTriggers?.([]);
	}

	if (item.agentFieldName === "tools") {
		return () => openAgentDirectoryOrAppendListItem("tools", "tools", onOpenDirectory, onAppendListItem);
	}

	if (item.agentFieldName === "skills") {
		return () => openAgentDirectoryOrAppendListItem("skills", "skills", onOpenDirectory, onAppendListItem);
	}

	if (item.agentFieldName === "conversationStarters") {
		return () => openAgentDirectoryOrAppendListItem("conversationStarters", "conversationStarters", onOpenDirectory, onAppendListItem);
	}

	if ("listFieldName" in item) {
		return () => onAppendListItem?.(item.listFieldName);
	}
	return undefined;
}

function AgentCompactConfigNavButton({
	className,
	item,
	onClick,
	screenAssistantTargetId,
	...props
}: Readonly<{
	item: AgentCompactConfigNavItem;
	onClick?: () => void;
	screenAssistantTargetId?: string;
} & ComponentProps<"button">>) {
	return (
		<button
			type="button"
			data-agent-field={item.agentFieldName}
			data-screen-assistant-target={screenAssistantTargetId}
			className={cn(AGENT_COMPACT_CONFIG_NAV_TRIGGER_CLASS, className)}
			onClick={onClick}
			{...props}
		>
			{item.label}
			{item.count > 0 ? <Badge>{item.count}</Badge> : null}
		</button>
	);
}

// Shared chrome for every collapsed-nav dropdown so Triggers, Knowledge/Tools/
// Skills, Subagents and Conversation starters all read identically to the
// Memory dropdown: items sit directly inside the popup's default `p-1` frame
// (4px all around), so list, separator, and footer share one even inset. The
// popup itself scrolls and caps height (`overflow-y-auto max-h-(--available-height)`),
// so no inner scroll region or sticky footer is needed.
function AgentCompactNavMenuList({ children }: Readonly<{ children: ReactNode }>) {
	return <>{children}</>;
}

function AgentCompactNavMenuFooter({ children }: Readonly<{ children: ReactNode }>) {
	// Inset separator (default `mx-1 my-1` = 4px) then the footer item, both
	// living in the popup's `p-1` frame — identical rhythm to the Memory menu.
	return (
		<>
			<DropdownMenuSeparator />
			{children}
		</>
	);
}

function AgentCompactSubagentsNavButton({
	item,
	onCreateSubagent,
	onManageSubagents,
	onSelectSubagent,
	screenAssistantTargetId,
	selectedIndex,
	subagents,
}: Readonly<{
	item: AgentCompactConfigNavItem;
	onCreateSubagent?: () => void;
	onManageSubagents?: () => void;
	onSelectSubagent?: (index: number) => void;
	screenAssistantTargetId?: string;
	selectedIndex?: number;
	subagents: readonly string[];
}>) {
	const isEmpty = item.count === 0;

	return (
		<MenubarMenu>
			<MenubarTrigger
				className={AGENT_COMPACT_CONFIG_NAV_TRIGGER_CLASS}
				render={(
					<AgentCompactConfigNavButton
						aria-label="Subagents"
						item={item}
						screenAssistantTargetId={screenAssistantTargetId}
					/>
				)}
			/>
			<MenubarContent align="start" className="w-64">
				{isEmpty ? null : (
					<AgentCompactNavMenuList>
						<DropdownMenuGroup className="p-0">
							{subagents.map((subagent, index) => (
								<DropdownMenuItem
									key={`${subagent}-${index}`}
									onClick={() => onSelectSubagent?.(index)}
									selected={selectedIndex === index}
								>
									{subagent}
								</DropdownMenuItem>
							))}
						</DropdownMenuGroup>
					</AgentCompactNavMenuList>
				)}
				{isEmpty ? (
					<DropdownMenuItem elemBefore={<PlusIcon size="small" />} onClick={onCreateSubagent}>
						Add subagent
					</DropdownMenuItem>
				) : null}
				<AgentCompactNavMenuFooter>
					<DropdownMenuItem
						elemBefore={<AiAgentIcon label="" size="small" />}
						onClick={onManageSubagents ?? onCreateSubagent}
					>
						Manage subagents
					</DropdownMenuItem>
				</AgentCompactNavMenuFooter>
			</MenubarContent>
		</MenubarMenu>
	);
}

// Trigger dropdown: 0 triggers → "Add trigger ›" flyout + "Manage triggers"
// footer; ≥1 → list of trigger chips with the same flyout/footer. The flyout
// reuses the full TriggerPicker provider/event content so behavior matches the
// expanded summary row exactly.
function AgentCompactTriggersNavButton({
	item,
	triggers,
	triggerDefinitions,
	onSelectEvent,
	onEditTriggers,
	screenAssistantTargetId,
}: Readonly<{
	item: AgentCompactConfigNavItem;
	triggers: readonly string[];
	triggerDefinitions?: readonly AgentTriggerValue[];
	onSelectEvent: (providerId: Parameters<typeof createAgentTriggerValue>[0], eventId: string) => void;
	onEditTriggers?: (seed?: readonly AgentTriggerValue[]) => void;
	screenAssistantTargetId?: string;
}>) {
	const isEmpty = triggers.length === 0;
	const definitionsAlignItems =
		triggerDefinitions !== undefined && triggerDefinitions.length === triggers.length;
	// "Add trigger ›" reuses the picker's provider→event submenus verbatim, so a
	// hover reveals the same provider list (and nested event flyouts) as the
	// expanded summary row, minus the search box that has no place in a footer.
	const addTriggerFlyout = (
		<DropdownMenuSub>
			<DropdownMenuSubTrigger>
				<span className="flex items-center gap-3">
					<PlusIcon size="small" />
					Add trigger
				</span>
			</DropdownMenuSubTrigger>
			<DropdownMenuSubContent className="min-w-64 p-1">
				<DropdownMenuGroup className="p-0">
					{TRIGGER_PROVIDERS.map((provider) => (
						<TriggerProviderSubmenu
							key={provider.id}
							onSelectEvent={onSelectEvent}
							provider={provider}
						/>
					))}
				</DropdownMenuGroup>
			</DropdownMenuSubContent>
		</DropdownMenuSub>
	);

	return (
		<MenubarMenu>
			<MenubarTrigger
				className={AGENT_COMPACT_CONFIG_NAV_TRIGGER_CLASS}
				render={(
					<AgentCompactConfigNavButton
						aria-label="Triggers"
						item={item}
						screenAssistantTargetId={screenAssistantTargetId}
					/>
				)}
			/>
			<MenubarContent align="start" className="w-64">
				{isEmpty ? (
					<>
						{addTriggerFlyout}
						<AgentCompactNavMenuFooter>
							<DropdownMenuItem
								elemBefore={<AutomationIcon label="" size="small" />}
								onClick={() => onEditTriggers?.()}
							>
								Manage triggers
							</DropdownMenuItem>
						</AgentCompactNavMenuFooter>
					</>
				) : (
					<>
						<AgentCompactNavMenuList>
							<DropdownMenuGroup className="p-0">
								{triggers.map((trigger, index) => {
									const definition = definitionsAlignItems ? triggerDefinitions?.[index] : undefined;
									const elemBefore = definition ? renderAgentTriggerProviderIcon(definition) : undefined;
									return (
										<DropdownMenuItem
											elemBefore={elemBefore ?? undefined}
											key={`trigger-${trigger}-${index}`}
											onClick={() => onEditTriggers?.()}
										>
											{trigger}
										</DropdownMenuItem>
									);
								})}
							</DropdownMenuGroup>
						</AgentCompactNavMenuList>
						<AgentCompactNavMenuFooter>{addTriggerFlyout}</AgentCompactNavMenuFooter>
					</>
				)}
			</MenubarContent>
		</MenubarMenu>
	);
}

// Knowledge/Tools/Skills share one shape: 0 items → single "Browse {label}"
// item; ≥1 → list of added items + "Browse {label}" footer. Knowledge layers
// its mode options above the list (handled by AgentKnowledgeSelector instead).
function AgentCompactDirectoryNavButton({
	item,
	directory,
	items,
	browseLabel,
	onBrowse,
	onSelectItem,
	screenAssistantTargetId,
}: Readonly<{
	item: AgentCompactConfigNavItem;
	directory: AgentDirectoryKind;
	items: readonly string[];
	browseLabel: string;
	onBrowse: () => void;
	onSelectItem?: (item: string) => void;
	screenAssistantTargetId?: string;
}>) {
	const isEmpty = items.length === 0;
	const browseItem = (
		<DropdownMenuItem elemBefore={<item.Icon label="" size="small" />} onClick={onBrowse}>
			{browseLabel}
		</DropdownMenuItem>
	);

	return (
		<MenubarMenu>
			<MenubarTrigger
				className={AGENT_COMPACT_CONFIG_NAV_TRIGGER_CLASS}
				render={(
					<AgentCompactConfigNavButton
						aria-label={item.label}
						item={item}
						screenAssistantTargetId={screenAssistantTargetId}
					/>
				)}
			/>
			<MenubarContent align="start" className="w-64">
				{isEmpty ? (
					browseItem
				) : (
					<>
						<AgentCompactNavMenuList>
							<DropdownMenuGroup className="p-0">
								{items.map((value, index) => (
									<DropdownMenuItem
										key={`${directory}-${value}-${index}`}
										onClick={onSelectItem ? () => onSelectItem(value) : undefined}
									>
										{value}
									</DropdownMenuItem>
								))}
							</DropdownMenuGroup>
						</AgentCompactNavMenuList>
						<AgentCompactNavMenuFooter>{browseItem}</AgentCompactNavMenuFooter>
					</>
				)}
			</MenubarContent>
		</MenubarMenu>
	);
}

// Conversation starters dropdown always exposes the 3 starter text fields for
// quick inline edits, with a "Manage conversation starters" footer that opens
// the full modal.
function AgentCompactConversationStartersNavButton({
	item,
	starters,
	onStarterChange,
	onManage,
	screenAssistantTargetId,
}: Readonly<{
	item: AgentCompactConfigNavItem;
	starters: ReadonlyArray<{ label: string }>;
	onStarterChange?: (index: number, value: string) => void;
	onManage: () => void;
	screenAssistantTargetId?: string;
}>) {
	// Always render MAX fields so the menu offers the full set of quick-edit
	// slots even before any starter exists.
	const fields = Array.from({ length: MAX_AGENT_CONVERSATION_STARTERS }, (_, index) => ({
		label: starters[index]?.label ?? "",
	}));

	return (
		<MenubarMenu>
			<MenubarTrigger
				className={AGENT_COMPACT_CONFIG_NAV_TRIGGER_CLASS}
				render={(
					<AgentCompactConfigNavButton
						aria-label="Conversation starters"
						item={item}
						screenAssistantTargetId={screenAssistantTargetId}
					/>
				)}
			/>
			<MenubarContent align="start" className="w-72">
				<div className="flex flex-col gap-1.5">
					{fields.map((field, index) => (
						<div
							className="flex items-center gap-2 rounded-sm border border-input px-3 focus-within:border-border-focused"
							key={`starter-${index}`}
						>
							<input
								className="h-7 w-full bg-transparent text-sm text-text outline-none placeholder:text-text-subtlest"
								onChange={(event) => onStarterChange?.(index, event.target.value)}
								onKeyDown={(event) => event.stopPropagation()}
								placeholder={`Starter ${index + 1}`}
								value={field.label}
							/>
						</div>
					))}
				</div>
				<AgentCompactNavMenuFooter>
					<DropdownMenuItem elemBefore={<AiChatIcon label="" size="small" />} onClick={onManage}>
						Manage conversation starters
					</DropdownMenuItem>
				</AgentCompactNavMenuFooter>
			</MenubarContent>
		</MenubarMenu>
	);
}

function AgentCompactEmptyConfigNav({
	config,
	hiddenConfigFields,
	onManageSubagents,
	onAppendListItem,
	onEditTriggers,
	onListItemChange,
	onOpenDirectory,
	onSelectListItem,
	reasoningValue,
	onReasoningValueChange,
	knowledgeMode,
	onKnowledgeModeChange,
	memoryMode,
	onMemoryModeChange,
	screenAssistantTargetPrefix,
	selectedListItemIndexByField,
}: Readonly<{
	config?: AgentConfigFormValue;
	hiddenConfigFields?: ReadonlySet<AgentHideableConfigField>;
	onManageSubagents?: () => void;
	onAppendListItem?: (field: AgentConfigListFieldName) => void;
	onEditTriggers?: (seed?: readonly AgentTriggerValue[]) => void;
	onListItemChange?: (field: AgentConfigListFieldName, index: number, value: string) => void;
	onOpenDirectory?: (directory: AgentDirectoryKind, selectedItem?: string) => void;
	onSelectListItem?: (field: AgentConfigListFieldName, index: number) => void;
	reasoningValue: ReasoningModeValue;
	onReasoningValueChange: (next: ReasoningModeValue) => void;
	knowledgeMode: KnowledgeModeValue;
	onKnowledgeModeChange: (next: KnowledgeModeValue) => void;
	memoryMode: MemoryModeValue;
	onMemoryModeChange: (next: MemoryModeValue) => void;
	screenAssistantTargetPrefix?: string;
	selectedListItemIndexByField?: Partial<Record<AgentConfigListFieldName, number>>;
}>) {
	// `agentFieldName` doubles as a hideable-field key for trigger/subagents/
	// conversationStarters; other field names never appear in the hidden set.
	const items = getAgentCompactEmptyConfigNavItems(config).filter(
		(item) => !hiddenConfigFields?.has(item.agentFieldName as AgentHideableConfigField),
	);
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
		<div className="relative flex min-h-8 min-w-0 items-center">
			{/* Hidden width-measurement strip lives outside the Menubar root so its
			    invisible duplicate buttons never join the menubar's roving focus. */}
			<div aria-hidden className="pointer-events-none absolute top-0 left-0 h-0 w-0 overflow-clip">
				<div className="invisible flex items-center" ref={measureRef} style={{ gap: AGENT_COMPACT_CONFIG_NAV_GAP }}>
					{items.map((item) => (
						<AgentCompactConfigNavButton item={item} key={`measure-${item.agentFieldName}`} />
					))}
				</div>
			</div>
			<Menubar
				// Override the shared Menubar's bordered/elevated chrome so the strip
				// reads as one flat, connected surface (matching the prior loose-button
				// look) while still giving us roving focus + arrow-key nav across items.
				// `overflow-x-clip` hides horizontally-overflowing items (the "…" menu
				// absorbs them). `pl-1` insets the first item so its focus ring isn't
				// shorn flat at the left clip edge; `py-1 -my-1` add vertical room and
				// `overflow-clip-margin` covers the trailing "…" on the right.
				className="relative -my-1 flex h-auto min-w-0 flex-1 items-center overflow-x-clip overflow-y-visible rounded-none border-0 bg-transparent p-0 py-1 pl-1 [overflow-clip-margin:6px]"
				ref={containerRef}
				style={{ gap: AGENT_COMPACT_CONFIG_NAV_GAP }}
			>
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
								itemCount={getNonEmptyConfigItems(config?.knowledge).length}
								screenAssistantTargetId={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:knowledge` : undefined}
							/>
						);
					}
					if (item.agentFieldName === "memory") {
						return (
							<AgentMemorySelector
								key={item.agentFieldName}
								render="nav-button"
								value={memoryMode}
								onValueChange={onMemoryModeChange}
								screenAssistantTargetId={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:memory` : undefined}
							/>
						);
					}
					if (item.agentFieldName === "subagents") {
						return (
							<AgentCompactSubagentsNavButton
								item={item}
								key={item.agentFieldName}
								onCreateSubagent={() => onAppendListItem?.("subagents")}
								onManageSubagents={onManageSubagents}
								onSelectSubagent={(index) => onSelectListItem?.("subagents", index)}
								screenAssistantTargetId={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:subagents` : undefined}
								selectedIndex={selectedListItemIndexByField?.subagents}
								subagents={getNonEmptyConfigItems(config?.subagents)}
							/>
						);
					}
					if (item.agentFieldName === "trigger") {
						return (
							<AgentCompactTriggersNavButton
								item={item}
								key={item.agentFieldName}
								onEditTriggers={onEditTriggers}
								onSelectEvent={(providerId, eventId) => {
									const next = createAgentTriggerValue(providerId, eventId, 1);
									onEditTriggers?.(next ? [next] : []);
								}}
								screenAssistantTargetId={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:trigger` : undefined}
								triggerDefinitions={config?.triggerDefinitions}
								triggers={config ? getAgentTriggerItems(config) : []}
							/>
						);
					}
					if (item.agentFieldName === "tools" || item.agentFieldName === "skills") {
						const directory = item.agentFieldName;
						return (
							<AgentCompactDirectoryNavButton
								browseLabel={`Browse ${item.label.toLowerCase()}`}
								directory={directory}
								item={item}
								items={getNonEmptyConfigItems(directory === "tools" ? config?.tools : config?.skills)}
								key={item.agentFieldName}
								onBrowse={() => openAgentDirectoryOrAppendListItem(directory, directory, onOpenDirectory, onAppendListItem)}
								onSelectItem={onOpenDirectory ? (value) => onOpenDirectory(directory, value) : undefined}
								screenAssistantTargetId={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:${item.agentFieldName}` : undefined}
							/>
						);
					}
					if (item.agentFieldName === "conversationStarters") {
						return (
							<AgentCompactConversationStartersNavButton
								item={item}
								key={item.agentFieldName}
								onManage={() => openAgentDirectoryOrAppendListItem("conversationStarters", "conversationStarters", onOpenDirectory, onAppendListItem)}
								onStarterChange={onListItemChange ? (index, value) => onListItemChange("conversationStarters", index, value) : undefined}
								screenAssistantTargetId={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:conversation-starters` : undefined}
								starters={config ? getConversationStarterSummaryItems(config) : []}
							/>
						);
					}
					// Every nav field is handled above; this guards future additions to
					// AGENT_COMPACT_EMPTY_CONFIG_NAV_ITEMS by falling back to a plain
					// click button rather than silently rendering nothing.
					const fallbackItem = item as AgentCompactConfigNavItem;
					return (
						<AgentCompactConfigNavButton
							item={fallbackItem}
							key={fallbackItem.agentFieldName}
							onClick={getAgentCompactConfigNavItemOnClick(fallbackItem, onAppendListItem, onOpenDirectory, onEditTriggers)}
							screenAssistantTargetId={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:${fallbackItem.agentFieldName}` : undefined}
						/>
					);
				})}
				{hiddenItems.length > 0 ? (
					<MenubarMenu>
						<MenubarTrigger
							aria-label="More configuration options"
							render={<Button className="size-6 rounded px-0" size="icon-compact" type="button" variant="ghost" />}
						>
							<MoreHorizontalIcon size="small" />
						</MenubarTrigger>
						<MenubarContent align="end">
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
									if (item.agentFieldName === "memory") {
										return (
											<AgentMemoryOverflowMenu
												key={item.agentFieldName}
												value={memoryMode}
												onValueChange={onMemoryModeChange}
											/>
										);
									}
									return (
										<DropdownMenuItem
											elemAfter={item.count > 0 ? <Badge>{item.count}</Badge> : undefined}
											key={item.agentFieldName}
											onClick={getAgentCompactConfigNavItemOnClick(item, onAppendListItem, onOpenDirectory, onEditTriggers)}
										>
											{item.label}
										</DropdownMenuItem>
									);
								})}
							</DropdownMenuGroup>
						</MenubarContent>
					</MenubarMenu>
				) : null}
			</Menubar>
		</div>
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

function getConversationStarterSummaryItems(config: AgentConfigFormValue): ReadonlyArray<{
	icon: StarterIconKey;
	label: string;
}> {
	const icons = config.conversationStarterIcons ?? [];

	return (config.conversationStarters ?? [])
		.map((item, index) => ({
			icon: (icons[index] as StarterIconKey | undefined) ?? DEFAULT_STARTER_ICON,
			label: item.trim(),
		}))
		.filter((item) => item.label.length > 0);
}

function getAgentTriggerItems(config: AgentConfigFormValue): readonly string[] {
	const triggerDefinitions = serializeAgentTriggerLabels(config.triggerDefinitions);
	if (triggerDefinitions.length > 0) {
		return triggerDefinitions;
	}

	const triggers = getNonEmptyConfigItems(config.triggers);
	if (triggers.length > 0) {
		return triggers;
	}

	const trigger = config.trigger?.trim();
	return trigger ? [trigger] : [];
}

const iconColorToTagColor: Readonly<Record<string, TagColor>> = {
	"text-icon-brand": "blue",
	"text-icon-information": "blue",
	"text-icon-success": "green",
	"text-icon-discovery": "discovery",
	"text-icon-warning": "yellow",
	"text-icon-danger": "red",
	"text-icon-accent-red": "red",
	"text-icon-accent-orange": "orange",
	"text-icon-accent-yellow": "yellow",
	"text-icon-accent-lime": "lime",
	"text-icon-accent-green": "green",
	"text-icon-accent-teal": "teal",
	"text-icon-accent-blue": "blue",
	"text-icon-accent-purple": "purple",
	"text-icon-accent-magenta": "magenta",
	"text-icon-accent-gray": "gray",
	"text-yellow-400": "yellow",
};

function getTagColorForMentionVisual(visual: RichTextMentionItem["visual"]): TagColor | undefined {
	return visual?.kind === "icon" && visual.iconColor
		? iconColorToTagColor[visual.iconColor]
		: undefined;
}

function AgentReferenceChip({
	category,
	elemBefore,
	label,
	onClick,
	onRemove,
	tagColor,
}: Readonly<{
	category?: RichTextReferenceCategory;
	elemBefore?: ReactNode;
	label: string;
	onClick?: () => void;
	onRemove?: () => void;
	tagColor?: TagColor;
}>) {
	const item = category ? getDirectoryMentionItemOrFallback(category, label) : undefined;
	const visual = item?.visual;
	const resolvedTagColor = tagColor ?? getTagColorForMentionVisual(visual) ?? "blue";
	const resolvedElemBefore = elemBefore ?? (
		visual ? (
			<RichTextMentionVisualMark
				category={category}
				label={label}
				visual={visual}
			/>
		) : (
			<PageIcon label="" size="small" />
		)
	);

	return (
		<Tag
			color={resolvedTagColor}
			elemBefore={resolvedElemBefore}
			onClick={onClick}
			onRemove={onRemove}
			removeButtonLabel={`Remove ${label}`}
			removeVariant="overlay"
			type={elemBefore ? "default" : getRichTextMentionTagType(visual)}
		>
			{label}
		</Tag>
	);
}

function AgentAddValueButton({
	className,
	icon = "add",
	label,
	onClick,
}: Readonly<{ className?: string; icon?: "add" | "edit"; label: string; onClick?: () => void }>) {
	return (
		<button
			type="button"
			className={cn(
				"group/add-link inline-flex h-5 items-center gap-1 rounded-xs text-xs font-medium text-text-subtlest transition-colors hover:text-text focus-visible:text-text focus-visible:outline-none",
				className
			)}
			onClick={onClick}
		>
			{icon === "edit" ? <EditIcon label="" size="small" /> : <PlusIcon size="small" />}
			<span className="group-hover/add-link:underline group-focus-visible/add-link:underline">{label}</span>
		</button>
	);
}

interface AgentFilledSummaryRowProps {
	label: string;
	items: readonly string[];
	referenceCategory?: RichTextReferenceCategory;
	agentFieldName?: string;
	screenAssistantTargetId?: string;
	addIcon?: "add" | "edit";
	addLabel?: string;
	hideWhenEmpty?: boolean;
	itemElemBefore?: (item: string, index: number) => ReactNode;
	onAdd?: () => void;
	onItemClick?: (item: string, index: number) => void;
	onRemoveItem?: (index: number) => void;
	tagColor?: TagColor;
}

function AgentFilledSummaryRow({
	addIcon,
	addLabel,
	agentFieldName,
	hideWhenEmpty = false,
	itemElemBefore,
	items,
	label,
	onAdd,
	onItemClick,
	onRemoveItem,
	referenceCategory,
	screenAssistantTargetId,
	tagColor,
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
				{items.map((item, index) => {
					// Pair the final chip with the inline "Add" affordance inside a single
					// non-wrapping group so they reflow to the next line together. Without
					// this, a row-filling set of chips pushes "Add" onto its own line and
					// leaves an awkward gap beside the last chip.
					const isLastItem = index === items.length - 1;
					const chip = (
						<AgentReferenceChip
							category={referenceCategory}
							elemBefore={itemElemBefore?.(item, index)}
							key={`${label}-${item}-${index}`}
							label={item}
							onClick={onItemClick ? () => onItemClick(item, index) : undefined}
							onRemove={onRemoveItem ? () => onRemoveItem(index) : undefined}
							tagColor={tagColor}
						/>
					);

					if (isLastItem && addLabel) {
						return (
							<div
								key={`${label}-${item}-${index}-group`}
								className="inline-flex max-w-full items-center gap-1.5"
							>
								{chip}
								<AgentAddValueButton
									className="shrink-0 opacity-0 transition-opacity group-hover/agent-row:opacity-100 group-focus-within/agent-row:opacity-100 focus-visible:opacity-100"
									icon={addIcon}
									label={addLabel}
									onClick={onAdd}
								/>
							</div>
						);
					}

					return chip;
				})}
				{isEmpty && addLabel ? (
					<AgentAddValueButton
						icon={addIcon}
						label={addLabel}
						onClick={onAdd}
					/>
				) : null}
			</div>
		</div>
	);
}

interface AgentTriggerSummaryRowProps {
	items: readonly string[];
	addLabel?: string;
	hideWhenEmpty?: boolean;
	screenAssistantTargetId?: string;
	onEditTriggers?: (seed?: readonly AgentTriggerValue[]) => void;
	/**
	 * The structured definitions backing `items`. Required for inline removal —
	 * a single chip is removed by splicing this array (the source of truth),
	 * because `items` is a serialized, possibly-filtered projection whose indices
	 * may not align with the definitions.
	 */
	triggerDefinitions?: readonly AgentTriggerValue[];
	onTriggerDefinitionsChange?: (triggers: readonly AgentTriggerValue[]) => void;
}

/**
 * Triggers row. Unlike the generic `AgentFilledSummaryRow`, the trigger entry
 * launches the rule-builder modal instead of inline editing:
 * - empty → the content area is the provider/event `TriggerPicker` dropdown;
 *   selecting an event seeds the modal with that one trigger;
 * - non-empty → each chip opens the modal on click and (when removal is wired)
 *   carries an overlay remove control, matching the other summary rows so a
 *   trigger can be removed inline without opening the modal.
 */
function AgentTriggerSummaryRow({
	items,
	addLabel,
	hideWhenEmpty = false,
	screenAssistantTargetId,
	onEditTriggers,
	triggerDefinitions,
	onTriggerDefinitionsChange,
}: Readonly<AgentTriggerSummaryRowProps>) {
	const isEmpty = items.length === 0;

	// The structured definitions back the displayed chips one-to-one only when
	// they are present and index-aligned with the serialized `items`. Both the
	// provider icon and inline removal depend on this alignment (removal also
	// needs a change handler).
	const definitionsAlignItems =
		triggerDefinitions !== undefined && triggerDefinitions.length === items.length;
	const canRemoveInline = definitionsAlignItems && Boolean(onTriggerDefinitionsChange);
	const handleRemoveTrigger = (index: number) => {
		if (!triggerDefinitions) {
			return;
		}
		onTriggerDefinitionsChange?.(triggerDefinitions.filter((_, i) => i !== index));
	};

	if (isEmpty && (hideWhenEmpty || !addLabel)) {
		return null;
	}

	return (
		<div
			className="group/agent-row -mx-2 flex flex-col gap-y-1 rounded-md px-2 py-1 transition-colors hover:bg-bg-neutral-subtle-hovered sm:flex-row sm:items-center sm:gap-x-5"
			data-agent-field="trigger"
			data-screen-assistant-target={screenAssistantTargetId}
		>
			<div className="sm:w-32 sm:shrink-0">
				<AgentSectionLabel>Triggers</AgentSectionLabel>
			</div>
			<div className="flex min-h-5 min-w-0 flex-1 flex-wrap items-center gap-1.5">
				{isEmpty ? (
					<TriggerPicker
						label={addLabel ?? "Add"}
						onSelectEvent={(providerId, eventId) => {
							const next = createAgentTriggerValue(providerId, eventId, 1);
							onEditTriggers?.(next ? [next] : []);
						}}
						trigger={<AgentAddValueButton icon="add" label={addLabel ?? "Add"} />}
					/>
				) : (
					<div className="group/trigger-edit flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
						{items.map((item, index) => {
							// Show the provider's own logo/icon — identical to the trigger
							// picker and rows — whenever the structured definition that backs
							// this chip is available and index-aligned with `items`. Falls
							// back to the chip's default icon for legacy label-only triggers.
							const definition = definitionsAlignItems ? triggerDefinitions?.[index] : undefined;
							const elemBefore = definition ? renderAgentTriggerProviderIcon(definition) : undefined;
							return (
								<AgentReferenceChip
									key={`trigger-${item}-${index}`}
									elemBefore={elemBefore ?? undefined}
									label={item}
									onClick={onEditTriggers ? () => onEditTriggers() : undefined}
									onRemove={canRemoveInline ? () => handleRemoveTrigger(index) : undefined}
								/>
							);
						})}
						{onEditTriggers ? (
							<button
								type="button"
								className="inline-flex h-5 shrink-0 items-center gap-1 rounded-xs text-xs font-medium text-text-subtlest opacity-0 transition-opacity group-hover/agent-row:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
								onClick={() => onEditTriggers()}
							>
								<EditIcon label="" size="small" />
								<span className="group-hover/trigger-edit:underline">Edit</span>
							</button>
						) : null}
					</div>
				)}
			</div>
		</div>
	);
}

interface AgentFilledConfigSummaryProps {
	config: AgentConfigFormValue;
	hiddenConfigFields?: ReadonlySet<AgentHideableConfigField>;
	hideEmptyRows?: boolean;
	knowledgeMode?: KnowledgeModeValue;
	memoryMode: MemoryModeValue;
	onAppendListItem?: (field: AgentConfigListFieldName) => void;
	onConnectTrigger?: (trigger: AgentTriggerValue) => void;
	onEditTriggers?: (seed?: readonly AgentTriggerValue[]) => void;
	onKnowledgeModeChange?: (next: KnowledgeModeValue) => void;
	onMemoryModeChange: (next: MemoryModeValue) => void;
	onOpenDirectory?: (directory: AgentDirectoryKind, selectedItem?: string) => void;
	onRemoveListItem?: (field: AgentConfigListFieldName, index: number) => void;
	onTextChange?: (field: AgentConfigTextFieldName, value: string) => void;
	onTriggerDefinitionsChange?: (triggers: readonly AgentTriggerValue[]) => void;
	screenAssistantTargetPrefix?: string;
	showAddButtons?: boolean;
}

function AgentFilledConfigSummary({
	config,
	hiddenConfigFields,
	hideEmptyRows = false,
	knowledgeMode,
	memoryMode,
	onAppendListItem,
	onEditTriggers,
	onKnowledgeModeChange,
	onMemoryModeChange,
	onOpenDirectory,
	onRemoveListItem,
	onTriggerDefinitionsChange,
	screenAssistantTargetPrefix,
	showAddButtons = true,
}: Readonly<AgentFilledConfigSummaryProps>) {
	const triggerItems = getAgentTriggerItems(config);
	const skillItems = getNonEmptyConfigItems(config.skills);
	const toolItems = getNonEmptyConfigItems(config.tools);
	const subagentItems = getNonEmptyConfigItems(config.subagents);
	const knowledgeItems = getNonEmptyConfigItems(config.knowledge);
	const starterSummaryItems = getConversationStarterSummaryItems(config).slice(0, MAX_AGENT_CONVERSATION_STARTERS);
	const starterItems = starterSummaryItems.map((item) => item.label);

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
				<AgentTriggerSummaryRow
					addLabel={getAgentFilledSummaryAddLabel("triggers", triggerItems.length === 0, showAddButtons)}
					hideWhenEmpty={hideEmptyRows}
					items={triggerItems}
					onEditTriggers={onEditTriggers}
					onTriggerDefinitionsChange={onTriggerDefinitionsChange}
					screenAssistantTargetId={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:trigger` : undefined}
					triggerDefinitions={config.triggerDefinitions}
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
					referenceCategory="knowledge"
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
					// Clicking a tool chip opens the tools directory focused on that tool.
					onItemClick={onOpenDirectory ? (item) => onOpenDirectory("tools", item) : undefined}
					onRemoveItem={onRemoveListItem ? (index) => onRemoveListItem("tools", index) : undefined}
					referenceCategory="tool"
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
					referenceCategory="skill"
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
					referenceCategory="subagent"
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
					onValueChange={onMemoryModeChange}
					screenAssistantTargetId={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:memory` : undefined}
					value={memoryMode}
				/>
			),
		},
		{
			key: "conversationStarters",
			isEmpty: starterItems.length === 0,
			node: (
				<AgentFilledSummaryRow
					addLabel={getAgentFilledSummaryAddLabel("conversationStarters", starterItems.length === 0, showAddButtons)}
					addIcon={starterItems.length > 0 ? "edit" : undefined}
					hideWhenEmpty={hideEmptyRows}
					agentFieldName="conversationStarters"
					itemElemBefore={(_, index) => {
						const StarterIcon = getStarterIcon(starterSummaryItems[index]?.icon ?? DEFAULT_STARTER_ICON);
						return <StarterIcon label="" size="small" color="currentColor" />;
					}}
					items={starterItems}
					label="Conversation starters"
					onAdd={() => openAgentDirectoryOrAppendListItem("conversationStarters", "conversationStarters", onOpenDirectory, onAppendListItem)}
					onRemoveItem={onRemoveListItem ? (index) => onRemoveListItem("conversationStarters", index) : undefined}
					screenAssistantTargetId={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:conversation-starters` : undefined}
					tagColor="standard"
				/>
			),
		},
	];
	// Map then sort by index to keep the sort stable across runtimes (Array#sort
	// only became stable in V8 in 2018, but other engines may differ). Row keys
	// (`trigger`, `subagents`, `conversationStarters`) double as hideable-field
	// keys, so suppressed rows are dropped before ordering.
	const orderedRows = rows
		.filter((row) => !hiddenConfigFields?.has(row.key as AgentHideableConfigField))
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

// The Knowledge panel now lives in its own reusable component; agent.tsx
// renders it directly via <Knowledge /> from "@/components/ui-custom/knowledge".

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

const REASONING_MODE_FLAT_OPTIONS = REASONING_MODE_SECTIONS.flatMap((section) =>
	section.options.map((option, index) => ({
		...option,
		section: section.title,
		// The default (first) option of a section represents the whole section.
		isSectionDefault: index === 0,
	})),
);

function findReasoningModeOption(value: ReasoningModeValue) {
	return REASONING_MODE_FLAT_OPTIONS.find((option) => option.value === value);
}

// Lozenge value: a section's default option reads as the section title
// ("Quick answer" / "Think deeper"); a specific model reads as its own label.
function getReasoningModeLozengeLabel(value: ReasoningModeValue): string | undefined {
	const option = findReasoningModeOption(value);
	if (!option) {
		return undefined;
	}
	return option.isSectionDefault ? option.section : option.label;
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
			{REASONING_MODE_SECTIONS.map((section, sectionIndex) => (
				<DropdownMenuGroup className={sectionIndex > 0 ? "mt-1" : undefined} key={section.title}>
					<DropdownMenuLabel>{section.title}</DropdownMenuLabel>
					{section.options.map((option) => (
						<DropdownMenuItem
							key={option.value}
							onClick={() => onValueChange(option.value as ReasoningModeValue)}
							selected={value === option.value}
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
	const lozengeLabel = getReasoningModeLozengeLabel(value);

	if (render === "nav-button") {
		return (
			<MenubarMenu>
				<MenubarTrigger
					className={AGENT_COMPACT_CONFIG_NAV_TRIGGER_CLASS}
					data-agent-field="reasoning"
					data-screen-assistant-target={screenAssistantTargetId}
				>
					Reasoning
					{/* Surface the chosen mode inline so it reads without opening the menu. */}
					{lozengeLabel ? <Badge>{lozengeLabel}</Badge> : null}
				</MenubarTrigger>
				<AgentReasoningSelectorMenu value={value} onValueChange={onValueChange} />
			</MenubarMenu>
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
								key={option.value}
								onClick={() => onValueChange(option.value as ReasoningModeValue)}
								selected={value === option.value}
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

// Compact nav-button label: "all" reads as "All", "none" as "None", and a
// "custom" selection reads as its item count so the strip stays terse.
function getKnowledgeNavLabel(value: KnowledgeModeValue, itemCount: number): string {
	if (value === "all") {
		return "All";
	}
	if (value === "none") {
		return "None";
	}
	return String(itemCount);
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
						key={option.value}
						onClick={() => onValueChange(option.value)}
						selected={value === option.value}
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
	itemCount?: number;
	screenAssistantTargetId?: string;
}

function AgentKnowledgeSelector({
	value,
	onValueChange,
	render,
	itemCount = 0,
	screenAssistantTargetId,
}: Readonly<AgentKnowledgeSelectorProps>) {
	const current = findKnowledgeModeOption(value);
	const label = current?.label ?? "Knowledge";

	if (render === "nav-button") {
		return (
			<MenubarMenu>
				<MenubarTrigger
					className={AGENT_COMPACT_CONFIG_NAV_TRIGGER_CLASS}
					data-agent-field="knowledge"
					data-screen-assistant-target={screenAssistantTargetId}
				>
					{getKnowledgeNavLabel(value, itemCount)}
				</MenubarTrigger>
				<AgentKnowledgeSelectorMenu value={value} onValueChange={onValueChange} />
			</MenubarMenu>
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
							key={option.value}
							onClick={() => onValueChange(option.value)}
							selected={value === option.value}
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

function AgentMemorySelectorMenu({
	value,
	onValueChange,
}: Readonly<{
	value: MemoryModeValue;
	onValueChange: (next: MemoryModeValue) => void;
}>) {
	return (
		<DropdownMenuContent align="start">
			<DropdownMenuGroup>
				{MEMORY_MODE_OPTIONS.map((option) => (
					<DropdownMenuItem
						key={option.value}
						onClick={() => onValueChange(option.value)}
						selected={value === option.value}
					>
						{option.label}
					</DropdownMenuItem>
				))}
			</DropdownMenuGroup>
			<DropdownMenuSeparator />
			<DropdownMenuGroup>
				<DropdownMenuItem elemBefore={<AiModelIcon label="" size="small" />}>
					Manage memory
				</DropdownMenuItem>
			</DropdownMenuGroup>
		</DropdownMenuContent>
	);
}

interface AgentMemorySelectorProps {
	value: MemoryModeValue;
	onValueChange: (next: MemoryModeValue) => void;
	render: "nav-button" | "row";
	screenAssistantTargetId?: string;
}

function AgentMemorySelector({
	value,
	onValueChange,
	render,
	screenAssistantTargetId,
}: Readonly<AgentMemorySelectorProps>) {
	const selectedOption = MEMORY_MODE_OPTIONS.find((option) => option.value === value) ?? MEMORY_MODE_OPTIONS[0];

	if (render === "nav-button") {
		return (
			<MenubarMenu>
				<MenubarTrigger
					className={AGENT_COMPACT_CONFIG_NAV_TRIGGER_CLASS}
					data-agent-field="memory"
					data-screen-assistant-target={screenAssistantTargetId}
				>
					Memory
					{/* Surface the on/off state inline so it reads without opening the menu. */}
					<Badge>{selectedOption.label}</Badge>
				</MenubarTrigger>
				<AgentMemorySelectorMenu value={value} onValueChange={onValueChange} />
			</MenubarMenu>
		);
	}

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
			<AgentMemorySelectorMenu value={value} onValueChange={onValueChange} />
		</DropdownMenu>
	);
}

function AgentMemoryOverflowMenu({
	value,
	onValueChange,
}: Readonly<{
	value: MemoryModeValue;
	onValueChange: (next: MemoryModeValue) => void;
}>) {
	return (
		<DropdownMenuSub>
			<DropdownMenuSubTrigger>Memory</DropdownMenuSubTrigger>
			<DropdownMenuSubContent>
				<DropdownMenuGroup>
					{MEMORY_MODE_OPTIONS.map((option) => (
						<DropdownMenuItem
							key={option.value}
							onClick={() => onValueChange(option.value)}
							selected={value === option.value}
						>
							{option.label}
						</DropdownMenuItem>
					))}
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem>
						Manage memory
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuSubContent>
		</DropdownMenuSub>
	);
}

interface AgentMemoryRowProps {
	value: MemoryModeValue;
	onValueChange: (next: MemoryModeValue) => void;
	screenAssistantTargetId?: string;
}

function AgentMemoryRow({
	value,
	onValueChange,
	screenAssistantTargetId,
}: Readonly<AgentMemoryRowProps>) {
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
				<AgentMemorySelector render="row" value={value} onValueChange={onValueChange} />
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
								category="knowledge"
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
	config,
	contentClassName,
	editorClassName,
	instructions,
	mentionRemovalRequest,
	onAddListValues,
	onMentionRemovalRequestHandled,
	onInstructionsChange,
	onRemoveReferenceValue,
	onStartWithTemplate,
	screenAssistantTargetId,
	showSectionLabel = true,
	toolbarBelowSlot,
}: Readonly<{
	bottomSlot?: ReactNode;
	bottomSlotClassName?: string;
	className?: string;
	config: AgentConfigFormValue;
	contentClassName?: string;
	editorClassName?: string;
	instructions?: string;
	mentionRemovalRequest?: RichTextMentionRemovalRequest | null;
	onAddListValues?: (field: AgentConfigReferenceListFieldName, values: readonly string[]) => void;
	onMentionRemovalRequestHandled?: (key: string) => void;
	onInstructionsChange?: (value: string) => void;
	onRemoveReferenceValue?: (field: AgentConfigReferenceListFieldName, value: string) => void;
	onStartWithTemplate?: () => void;
	screenAssistantTargetId?: string;
	showSectionLabel?: boolean;
	toolbarBelowSlot?: ReactNode;
}>) {
	const [knowledge, setKnowledge] = useState<RichTextMentionItem[]>([]);
	const [templatesOpen, setTemplatesOpen] = useState(false);
	const inlineManagedReferenceKeysRef = useRef(new Set<string>());
	const mentionInventoryCountsRef = useRef(new Map<string, {
		count: number;
		field: AgentConfigReferenceListFieldName;
		label: string;
	}>());
	const mentionSources = useMemo<RichTextMentionSources>(() => ({
		subagent: mergeMentionItems(
			mapConfigValuesToMentionItems("subagent", config.subagents),
			EDITOR_PALETTE_MENTION_SOURCES.subagent,
		),
		skill: mergeMentionItems(
			mapConfigValuesToMentionItems("skill", config.skills),
			EDITOR_PALETTE_MENTION_SOURCES.skill,
		),
		tool: mergeMentionItems(
			mapConfigValuesToMentionItems("tool", config.tools),
			EDITOR_PALETTE_MENTION_SOURCES.tool,
		),
		knowledge: mergeMentionItems(
			mapConfigValuesToMentionItems("knowledge", config.knowledge),
			EDITOR_PALETTE_MENTION_SOURCES.knowledge,
			knowledge,
		),
	}), [config.knowledge, config.skills, config.subagents, config.tools, knowledge]);
	const handleInsertReferenceOption = useCallback((category: RichTextReferenceCategory, label: string): false => {
		const field = AGENT_CONFIG_FIELD_BY_REFERENCE_CATEGORY[category];
		const key = getAgentReferenceKey(field, label);

		inlineManagedReferenceKeysRef.current.add(key);
		if (!hasAgentReferenceValue(config, field, label)) {
			onAddListValues?.(field, [label]);
		}

		return false;
	}, [config, onAddListValues]);
	const handleMentionInventoryChange = useCallback((mentions: readonly RichTextMentionItem[]): void => {
		const nextCounts = new Map<string, {
			count: number;
			field: AgentConfigReferenceListFieldName;
			label: string;
		}>();

		for (const mention of mentions) {
			if (!isRichTextReferenceCategory(mention.category)) {
				continue;
			}

			const field = AGENT_CONFIG_FIELD_BY_REFERENCE_CATEGORY[mention.category];
			const key = getAgentReferenceKey(field, mention.label);
			const current = nextCounts.get(key);
			nextCounts.set(key, {
				count: (current?.count ?? 0) + 1,
				field,
				label: mention.label,
			});
		}

		for (const [key, next] of nextCounts) {
			const previousCount = mentionInventoryCountsRef.current.get(key)?.count ?? 0;
			if (next.count <= previousCount) {
				continue;
			}

			inlineManagedReferenceKeysRef.current.add(key);
			if (!hasAgentReferenceValue(config, next.field, next.label)) {
				onAddListValues?.(next.field, [next.label]);
			}
		}

		for (const [key, previous] of mentionInventoryCountsRef.current) {
			if (nextCounts.has(key) || !inlineManagedReferenceKeysRef.current.has(key)) {
				continue;
			}

			inlineManagedReferenceKeysRef.current.delete(key);
			onRemoveReferenceValue?.(previous.field, previous.label);
		}

		mentionInventoryCountsRef.current = nextCounts;
	}, [config, onAddListValues, onRemoveReferenceValue]);

	useEffect(() => {
		const abortController = new AbortController();

		async function loadMentionSources(): Promise<void> {
			try {
				const knowledgeResponse = await fetch("/api/wiki/memory-explorer", { signal: abortController.signal });
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
				placeholder="Press / to help me describe the agent's role, or start with a template"
				placeholderSlot={(
					<p className="tiptap-editor text-sm leading-[1.55] text-text-subtlest">
						Press <code>/</code> to help me describe the agent&apos;s role, or{" "}
						<button
							type="button"
							className="pointer-events-auto cursor-pointer rounded-sm text-link no-underline underline-offset-2 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
							onClick={() => {
								// Choosing a template means the user is already mindful of
								// templates — animate the onboarding tiles away.
								onStartWithTemplate?.();
								setTemplatesOpen(true);
							}}
						>
							start with a template
						</button>
					</p>
				)}
				onInsertReferenceOption={handleInsertReferenceOption}
				toolbarBelowSlot={toolbarBelowSlot}
				value={instructions}
				dataFlowConfig={config}
				dataFlowDiagramLabel="Architectural diagram"
				mentionSources={mentionSources}
				mentionRemovalRequest={mentionRemovalRequest}
				onMarkdownChange={onInstructionsChange}
				onMentionInventoryChange={handleMentionInventoryChange}
				onMentionRemovalRequestHandled={onMentionRemovalRequestHandled}
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
	// Subagent editing context. When `isSubagent` is true the profile header
	// shows a back-arrow icon button inline before the name (a quick way back to
	// the base agent, wired to `onSelectBaseAgent`), and the big editable title
	// becomes the subagent's name (placeholder "Untitled subagent") wired to
	// `onSubagentNameChange` instead of the base config name.
	isSubagent?: boolean;
	baseAgentName?: string;
	subagentName?: string;
	onSelectBaseAgent?: () => void;
	onSubagentNameChange?: (value: string) => void;
	// While editing a subagent the description slot becomes the trigger
	// condition ("Describe the situation that should trigger this subagent"),
	// bound to the subagent's condition rather than the base agent description.
	subagentCondition?: string;
	onSubagentConditionChange?: (value: string) => void;
}

function AgentConfigProfile({
	config,
	avatarSrc,
	onTextChange,
	screenAssistantTargetPrefix,
	isSubagent = false,
	subagentName,
	onSelectBaseAgent,
	onSubagentNameChange,
	subagentCondition,
	onSubagentConditionChange,
}: Readonly<AgentConfigProfileProps>) {
	const shouldReduceMotion = useReducedMotion();
	// Swap direction for the header content: +1 when entering a subagent (slide in
	// from the right), -1 when returning to the parent (slide in from the left).
	// Reduced motion collapses the slide to a pure crossfade.
	const direction = shouldReduceMotion ? 0 : isSubagent ? 1 : -1;
	return (
		<section
			className="flex flex-col gap-4"
			data-screen-assistant-target={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:profile` : undefined}
		>
			<AgentProfileCover avatarSrc={avatarSrc} />
			<div className="flex flex-col gap-1" data-agent-field="name">
				{/* The cover/avatar and the description below stay put; only the name
				    row (title + inline back-arrow on subagents) crossfades and slides
				    when swapping between the base agent and a subagent. `popLayout`
				    lets the exiting copy leave the layout flow so the entering copy
				    doesn't jump. */}
				<AnimatePresence custom={direction} initial={false} mode="popLayout">
					<motion.div
						key={isSubagent ? "subagent" : "base"}
						custom={direction}
						variants={AGENT_PROFILE_SWAP_VARIANTS}
						initial="enter"
						animate="center"
						exit="exit"
						transition={AGENT_PROFILE_SWAP_TRANSITION}
						className="flex items-center gap-1"
						style={{ willChange: "transform, opacity" }}
						data-screen-assistant-target={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:name` : undefined}
					>
						{isSubagent ? (
							// Match the name field's read-view height (h-auto + py-1 +
							// leading-7 + border-2 ≈ 40px) so the icon button aligns with
							// the title row. `[&_svg]:size-4` forces the arrow to 16px
							// without the ADS size prop.
							<Button
								type="button"
								aria-label="Back to parent agent"
								data-agent-field="back-to-parent"
								className="size-10 shrink-0 rounded text-icon-subtle hover:text-icon [&_svg]:size-4"
								onClick={onSelectBaseAgent}
								size="icon"
								variant="ghost"
							>
								<ArrowLeftIcon label="" />
							</Button>
						) : null}
						<InlineEdit
							className="min-w-0 flex-1"
							value={isSubagent ? subagentName ?? "" : config.name ?? ""}
							placeholder={isSubagent ? UNTITLED_SUBAGENT_NAME : "Untitled agent"}
							editButtonLabel={isSubagent ? "Edit subagent name" : "Edit agent name"}
							readViewClassName="relative h-auto overflow-visible border-2 bg-transparent px-0 py-1 text-2xl leading-7 font-semibold hover:bg-transparent active:bg-transparent focus:border-border-focused focus-visible:border-border-focused focus-visible:bg-transparent"
							readViewMotionProps={AGENT_PROFILE_INLINE_EDIT_MOTION_PROPS}
							readViewBackdropClassName="-inset-0.5 bg-bg-neutral-subtle-hovered"
							readViewBackdropMotionProps={AGENT_PROFILE_INLINE_EDIT_BACKDROP_MOTION_PROPS}
							inputProps={{ className: "h-auto border-2 px-1.5 py-1 text-2xl leading-7 font-semibold focus:border-ring md:text-2xl" }}
							onConfirm={(value) => (isSubagent ? onSubagentNameChange?.(value) : onTextChange?.("name", value))}
						/>
					</motion.div>
				</AnimatePresence>
				{/* Description / trigger condition is intentionally NOT animated — it
				    stays put and just swaps its bound value as the view changes. */}
				<div
					data-agent-field={isSubagent ? "condition" : "description"}
					data-screen-assistant-target={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:${isSubagent ? "condition" : "description"}` : undefined}
				>
					<InlineEdit
						value={isSubagent ? subagentCondition ?? "" : config.description ?? config.summary ?? ""}
						placeholder={isSubagent ? "Describe the situation that should trigger this subagent" : "Add a description"}
						editButtonLabel={isSubagent ? "Edit subagent trigger condition" : "Edit agent description"}
						multiline
						readViewClassName="relative overflow-visible border-2 bg-transparent px-0 hover:bg-transparent active:bg-transparent focus-visible:bg-transparent"
						readViewMotionProps={AGENT_PROFILE_INLINE_EDIT_MOTION_PROPS}
						readViewBackdropClassName="-inset-0.5 bg-bg-neutral-subtle-hovered"
						readViewBackdropMotionProps={AGENT_PROFILE_INLINE_EDIT_BACKDROP_MOTION_PROPS}
						textareaProps={{ rows: 1, className: "min-h-10 border-2 bg-bg-neutral-subtle px-1.5 focus:border-ring focus-visible:border-ring focus-visible:ring-0 focus-visible:ring-offset-0 data-[variant=default]:border-transparent data-[variant=default]:focus:border-ring data-[variant=default]:focus-visible:border-ring" }}
						onConfirm={(value) => (isSubagent ? onSubagentConditionChange?.(value) : onTextChange?.("description", value))}
					/>
				</div>
			</div>
		</section>
	);
}

interface AgentCompactConfigToolbarBelowProps {
	config: AgentConfigFormValue;
	hiddenConfigFields?: ReadonlySet<AgentHideableConfigField>;
	onAppendListItem?: (field: AgentConfigListFieldName) => void;
	onConnectTrigger?: (trigger: AgentTriggerValue) => void;
	onEditTriggers?: (seed?: readonly AgentTriggerValue[]) => void;
	onListItemChange?: (field: AgentConfigListFieldName, index: number, value: string) => void;
	onManageSubagents?: () => void;
	onOpenDirectory?: (directory: AgentDirectoryKind, selectedItem?: string) => void;
	onRemoveListItem?: (field: AgentConfigListFieldName, index: number) => void;
	onSelectListItem?: (field: AgentConfigListFieldName, index: number) => void;
	onTextChange?: (field: AgentConfigTextFieldName, value: string) => void;
	onTriggerDefinitionsChange?: (triggers: readonly AgentTriggerValue[]) => void;
	screenAssistantTargetPrefix?: string;
	selectedListItemIndexByField?: Partial<Record<AgentConfigListFieldName, number>>;
}

function AgentCompactConfigToolbarBelow({
	config,
	hiddenConfigFields,
	onAppendListItem,
	onConnectTrigger,
	onEditTriggers,
	onListItemChange,
	onManageSubagents,
	onOpenDirectory,
	onRemoveListItem,
	onSelectListItem,
	onTextChange,
	onTriggerDefinitionsChange,
	screenAssistantTargetPrefix,
	selectedListItemIndexByField,
}: Readonly<AgentCompactConfigToolbarBelowProps>) {
	const [expanded, setExpanded] = useState(true);
	const [reasoningValue, setReasoningValue] = useState<ReasoningModeValue>("quick-auto");
	const [knowledgeMode, setKnowledgeMode] = useState<KnowledgeModeValue>(() =>
		getNonEmptyConfigItems(config.knowledge).length > 0 ? "custom" : "all",
	);
	// Memory state is lifted here so the collapsed nav button and the expanded
	// Memory row stay in sync as the toolbar toggles between the two views.
	const [memoryMode, setMemoryMode] = useState<MemoryModeValue>("on");
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
						className="overflow-hidden bg-surface pt-2"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={transition}
						style={{ willChange: "opacity" }}
					>
						<AgentFilledConfigSummary
							config={config}
							hiddenConfigFields={hiddenConfigFields}
							knowledgeMode={knowledgeMode}
							onKnowledgeModeChange={setKnowledgeMode}
							memoryMode={memoryMode}
							onMemoryModeChange={setMemoryMode}
							onAppendListItem={onAppendListItem}
							onConnectTrigger={onConnectTrigger}
							onEditTriggers={onEditTriggers}
							onOpenDirectory={onOpenDirectory}
							onRemoveListItem={onRemoveListItem}
							onTextChange={onTextChange}
							onTriggerDefinitionsChange={onTriggerDefinitionsChange}
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
						className="overflow-hidden bg-surface pt-2"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={transition}
						style={{ willChange: "opacity" }}
					>
						<AgentCompactEmptyConfigNav
							config={config}
							hiddenConfigFields={hiddenConfigFields}
							onAppendListItem={onAppendListItem}
							onEditTriggers={onEditTriggers}
							onListItemChange={onListItemChange}
							onManageSubagents={onManageSubagents}
							onOpenDirectory={onOpenDirectory}
							onSelectListItem={onSelectListItem}
							reasoningValue={reasoningValue}
							onReasoningValueChange={setReasoningValue}
							knowledgeMode={knowledgeMode}
							onKnowledgeModeChange={setKnowledgeMode}
							memoryMode={memoryMode}
							onMemoryModeChange={setMemoryMode}
							screenAssistantTargetPrefix={screenAssistantTargetPrefix}
							selectedListItemIndexByField={selectedListItemIndexByField}
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
	compactScrollAreaClassName?: string;
	compactFooterBefore?: ReactNode;
	// Config rows callers can suppress — e.g. while editing a subagent, where
	// triggers, subagents, and conversation starters can't be configured.
	hiddenConfigFields?: ReadonlySet<AgentHideableConfigField>;
	idPrefix: string;
	onManageSubagents?: () => void;
	onProfileTextChange?: (field: AgentConfigTextFieldName, value: string) => void;
	onTextChange?: (field: AgentConfigTextFieldName, value: string) => void;
	onListItemChange?: (field: AgentConfigListFieldName, index: number, value: string) => void;
	onRemoveListItem?: (field: AgentConfigListFieldName, index: number) => void;
	onSelectListItem?: (field: AgentConfigListFieldName, index: number) => void;
	onAddListValues?: (field: AgentConfigReferenceListFieldName, values: readonly string[]) => void;
	onAppendListItem?: (field: AgentConfigListFieldName) => void;
	onConnectTrigger?: (trigger: AgentTriggerValue) => void;
	onOpenDirectory?: (directory: AgentDirectoryKind, selectedItem?: string) => void;
	onTriggerDefinitionsChange?: (triggers: readonly AgentTriggerValue[]) => void;
	profileAvatarSrc?: string;
	profileConfig?: AgentConfigFormValue;
	screenAssistantTargetPrefix?: string;
	selectedListItemIndexByField?: Partial<Record<AgentConfigListFieldName, number>>;
	// Subagent editing context, forwarded to the profile header so it can render
	// the base-agent → subagent breadcrumb, edit the subagent's name, and treat
	// the description slot as the subagent's trigger condition.
	isSubagent?: boolean;
	baseAgentName?: string;
	subagentName?: string;
	onSelectBaseAgent?: () => void;
	onSubagentNameChange?: (value: string) => void;
	subagentCondition?: string;
	onSubagentConditionChange?: (value: string) => void;
}

export const AgentConfigFields = memo(
	({
		className,
		config,
		avatarSrc,
		compactFooterBefore,
		compactScrollAreaClassName,
		hiddenConfigFields,
		idPrefix,
		onListItemChange,
		onAddListValues,
		onAppendListItem,
		onConnectTrigger,
		onManageSubagents,
		onOpenDirectory,
		onProfileTextChange,
		onRemoveListItem,
		onSelectListItem,
		onTextChange,
		onTriggerDefinitionsChange,
		profileAvatarSrc,
		profileConfig,
		screenAssistantTargetPrefix,
		selectedListItemIndexByField,
		isSubagent,
		baseAgentName,
		subagentName,
		onSelectBaseAgent,
		onSubagentNameChange,
		subagentCondition,
		onSubagentConditionChange,
		...props
	}: Readonly<AgentConfigFieldsProps>) => {
		const isFilledConfig = hasFilledAgentConfig(config);
		const compactScrollOverflow = useHasVerticalOverflow<HTMLDivElement>();
		const [mentionRemovalRequest, setMentionRemovalRequest] = useState<RichTextMentionRemovalRequest | null>(null);
		const handleTextChange = useCallback((field: AgentConfigTextFieldName, value: string) => {
			onTextChange?.(field, value);
		}, [onTextChange]);
		const handleProfileTextChange = useCallback((field: AgentConfigTextFieldName, value: string) => {
			(onProfileTextChange ?? onTextChange)?.(field, value);
		}, [onProfileTextChange, onTextChange]);
		const handleListItemChange = useCallback((field: AgentConfigListFieldName, index: number, value: string) => {
			onListItemChange?.(field, index, value);
		}, [onListItemChange]);
		const handleRemoveListItem = useCallback((field: AgentConfigListFieldName, index: number) => {
			const removedValue = config[field]?.[index]?.trim();

			onRemoveListItem?.(field, index);
			if (removedValue && isAgentConfigReferenceListField(field)) {
				setMentionRemovalRequest({
					category: AGENT_REFERENCE_CATEGORY_BY_CONFIG_FIELD[field],
					key: `${field}:${index}:${removedValue}:${Date.now()}`,
					label: removedValue,
				});
			}
		}, [config, onRemoveListItem]);
		const handleAddListValues = useCallback((field: AgentConfigReferenceListFieldName, values: readonly string[]) => {
			onAddListValues?.(field, values);
		}, [onAddListValues]);
		const handleRemoveReferenceValue = useCallback((field: AgentConfigReferenceListFieldName, value: string) => {
			const normalizedValue = getNormalizedAgentReferenceValue(value);
			const index = (config[field] ?? []).findIndex(
				(item) => getNormalizedAgentReferenceValue(item) === normalizedValue,
			);

			if (index < 0) {
				return;
			}

			onRemoveListItem?.(field, index);
		}, [config, onRemoveListItem]);
		const handleMentionRemovalRequestHandled = useCallback((key: string) => {
			setMentionRemovalRequest((current) => current?.key === key ? null : current);
		}, []);
		const handleAppendListItem = useCallback((field: AgentConfigListFieldName) => {
			onAppendListItem?.(field);
		}, [onAppendListItem]);
		const handleManageSubagents = useCallback(() => {
			onManageSubagents?.();
		}, [onManageSubagents]);
		const handleSelectListItem = useCallback((field: AgentConfigListFieldName, index: number) => {
			onSelectListItem?.(field, index);
		}, [onSelectListItem]);
		const handleOpenDirectory = useCallback((directory: AgentDirectoryKind, selectedItem?: string) => {
			onOpenDirectory?.(directory, selectedItem);
		}, [onOpenDirectory]);
		// Trigger authoring routes through the rule-builder modal hosted here so a
		// single dialog instance serves every entry point (summary row, collapsed
		// nav, missing-config tile). `seed` carries the definitions the modal opens
		// with — the existing list when editing, or a freshly-picked trigger.
		const [triggersEditor, setTriggersEditor] = useState<{ open: boolean; seed: readonly AgentTriggerValue[] }>({
			open: false,
			seed: [],
		});
		const handleEditTriggers = useCallback((seed?: readonly AgentTriggerValue[]) => {
			setTriggersEditor({ open: true, seed: seed ?? config.triggerDefinitions ?? [] });
		}, [config.triggerDefinitions]);
		const handleTriggersEditorOpenChange = useCallback((open: boolean) => {
			setTriggersEditor((prev) => ({ ...prev, open }));
		}, []);
		const handleTriggersSave = useCallback((triggers: readonly AgentTriggerValue[]) => {
			onTriggerDefinitionsChange?.(triggers);
		}, [onTriggerDefinitionsChange]);

		return (
			<div
				className={cn("flex min-h-0 flex-1 flex-col gap-6", className)}
				data-agent-config-id={idPrefix}
				data-screen-assistant-target={screenAssistantTargetPrefix}
				{...props}
			>
				<div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
					{/* Scrollable region: profile + instructions grow to fill, the
					    sibling footer below stays anchored to the panel bottom. The
					    bottom scroll mask fades content into the footer while there's
					    more below, and clears once the region is scrolled to the end. */}
					<div
						ref={compactScrollOverflow.ref}
						// `overflow-y-auto` forces `overflow-x` to compute to `auto`,
						// which clips the left/right edges of descendant focus-visible
						// rings. `px-1.5` insets the content 6px so full-width controls
						// (the title/description inputs, whose focus backdrop bleeds
						// `-inset-0.5` past their box) clear the scroll-clip edge. We do
						// NOT cancel this with a negative margin on the profile block,
						// because that would pull those full-width inputs back to the
						// clip edge and re-clip their rings.
						className={cn(
							"flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-1.5",
							compactScrollOverflow.showBottomScrollMask && "scroll-mask-bottom",
							compactScrollAreaClassName,
						)}
					>
						<div className="flex flex-col gap-4">
							<AgentConfigProfile
								config={profileConfig ?? config}
								avatarSrc={profileAvatarSrc ?? avatarSrc}
								onTextChange={handleProfileTextChange}
								screenAssistantTargetPrefix={screenAssistantTargetPrefix}
								isSubagent={isSubagent}
								baseAgentName={baseAgentName}
								subagentName={subagentName}
								onSelectBaseAgent={onSelectBaseAgent}
								onSubagentNameChange={onSubagentNameChange}
								subagentCondition={subagentCondition}
								onSubagentConditionChange={onSubagentConditionChange}
							/>
						</div>
						<AgentInstructionsComposer
							className="relative flex min-h-0 flex-1 flex-col"
							config={config}
							contentClassName={cn("pt-4", isFilledConfig ? "min-h-[240px]" : "min-h-[2rem]")}
							editorClassName={isFilledConfig ? undefined : "agent-instructions-tiptap-editor-compact-empty"}
							instructions={config.instructions}
							mentionRemovalRequest={mentionRemovalRequest}
							onAddListValues={handleAddListValues}
							onInstructionsChange={(value) => handleTextChange("instructions", value)}
							onMentionRemovalRequestHandled={handleMentionRemovalRequestHandled}
							onRemoveReferenceValue={handleRemoveReferenceValue}
							screenAssistantTargetId={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:instructions` : undefined}
							showSectionLabel={false}
						/>
					</div>
					{/* Bottom-anchored footer: always flush to the panel bottom. The
					    separator/expand row stays transparent so content scrolls
					    visibly behind it; only the field rows carry a solid surface. */}
					{compactFooterBefore}
					<div className="shrink-0">
						<AgentCompactConfigToolbarBelow
							config={config}
							hiddenConfigFields={hiddenConfigFields}
							onAppendListItem={handleAppendListItem}
							onConnectTrigger={onConnectTrigger}
							onEditTriggers={handleEditTriggers}
							onListItemChange={handleListItemChange}
							onManageSubagents={onManageSubagents ? handleManageSubagents : undefined}
							onOpenDirectory={handleOpenDirectory}
							onRemoveListItem={handleRemoveListItem}
							onSelectListItem={handleSelectListItem}
							onTextChange={handleTextChange}
							onTriggerDefinitionsChange={onTriggerDefinitionsChange}
							screenAssistantTargetPrefix={screenAssistantTargetPrefix}
							selectedListItemIndexByField={selectedListItemIndexByField}
						/>
					</div>
				</div>
				<AgentTriggersDialog
					open={triggersEditor.open}
					onOpenChange={handleTriggersEditorOpenChange}
					triggerDefinitions={triggersEditor.seed}
					onSave={handleTriggersSave}
				/>
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
