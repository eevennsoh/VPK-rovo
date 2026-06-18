"use client";

/* eslint-disable react-hooks/exhaustive-deps -- These callbacks/effects intentionally read stable refs that bridge external animation, drag, preview, and editor state. */

// oxlint-disable react-doctor/exhaustive-deps -- Effects in this file intentionally coordinate refs, external animation loops, timers, subscriptions, or measured DOM state; dependencies are constrained to avoid restarting those bridges.
// oxlint-disable react-doctor/no-derived-state -- These components maintain local derived display state for controlled animations, measurements, or draft editing that cannot be represented as render-only values without changing UX.
// oxlint-disable react-doctor/no-reset-all-state-on-prop-change -- These prop/key changes intentionally restart a workflow to avoid carrying stale state across runs.
// oxlint-disable react-doctor/prefer-module-scope-pure-function -- These helpers are intentionally local to the component/demo because they depend on the surrounding interaction contract.

// oxlint-disable react-doctor/jsx-no-jsx-as-prop -- These components intentionally use slot/render-node props for icons, triggers, and adornments.

import type { Tool } from "ai";
import { AnimatePresence, motion, useReducedMotion, type MotionProps } from "motion/react";
import type { ComponentProps, ReactElement, ReactNode, RefObject } from "react";
import { Fragment, memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useLazyRef } from "@/lib/use-lazy-ref";

import ArrowLeftIcon from "@atlaskit/icon/core/arrow-left";
import AiAgentIcon from "@atlaskit/icon/core/ai-agent";
import AiChatIcon from "@atlaskit/icon/core/ai-chat";
import AutomationIcon from "@atlaskit/icon/core/automation";
import ChartTrendUpIcon from "@atlaskit/icon/core/chart-trend-up";
import DeleteIcon from "@atlaskit/icon/core/delete";
import AppsIcon from "@atlaskit/icon/core/apps";
import EditIcon from "@atlaskit/icon/core/edit";
import PageIcon from "@atlaskit/icon/core/page";
import PersonIcon from "@atlaskit/icon/core/person";
import ScorecardIcon from "@atlaskit/icon/core/scorecard";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";
import LockLockedIcon from "@atlaskit/icon/core/lock-locked";
import AiComputeIcon from "@atlaskit/icon-lab/core/ai-compute";
import AiModelIcon from "@atlaskit/icon-lab/core/ai-model";
import SkillIcon from "@atlaskit/icon-lab/core/skill";
import ViewsIcon from "@atlaskit/icon-lab/core/views";

import { AgentAccess } from "@/components/blocks/agent-access";
import { AgentEvaluation } from "@/components/blocks/agent-evaluation";
import { AgentInsights } from "@/components/blocks/agent-insights";
import { AgentSurfaces } from "@/components/blocks/agent-surfaces";
import { AgentUsers } from "@/components/blocks/agent-users";
import { AgentTemplatesDialog } from "@/components/blocks/agent-templates";
import { DEMO_AGENT_TEMPLATES } from "@/components/blocks/agent-templates/data/demo-template-agents";
import { AgentCompactOperationsBento } from "@/components/blocks/agent-bento";
import {
	DEFAULT_STARTER_ICON,
	getStarterIcon,
	type StarterIconKey,
} from "@/components/blocks/conversation-starters";
import {
	TriggerPicker,
	TriggerProviderSearchList,
	type AgentAutomationRule,
	type AgentTriggerValue,
} from "@/components/blocks/triggers/page";
import { createAgentAutomationRule, createAgentTriggerValue, getAgentAutomationRuleLabel, inferAutomationRules } from "@/components/blocks/triggers/data/trigger-catalog";
import { ManageTriggersDialog } from "@/components/blocks/triggers/components/manage-triggers-dialog";
import { UNTITLED_SUBAGENT_NAME } from "@/components/blocks/subagents/lib/subagent-prompts";
import { AgentTriggersDialog } from "@/components/ui-custom/agent-triggers-dialog";
import {
	hoverRevealRowClassName,
	HoverRevealActions,
	HoverRevealLabel,
} from "@/components/ui-custom/hover-reveal-row";
import {
	EDITOR_PALETTE_MENTION_SOURCES,
	getDirectoryMentionItemOrFallback,
	getToolIdFromMentionId,
} from "@/components/blocks/editor-palette/data/mention-sources";
import {
	EditorPaletteSearchPicker,
	type EditorPaletteSearchCategory,
} from "@/components/blocks/editor-palette/page";
import type { EditorToolbarViewMode } from "@/components/blocks/editor-toolbar";
import { Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AtlassianLogo, isAtlassianLogoSource } from "@/components/ui/logo";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
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
import { IconTile } from "@/components/ui/icon-tile";
import { HoverCard, HoverCardTrigger } from "@/components/ui/hover-card";
import { InlineEdit } from "@/components/ui/inline-edit";
import { Input } from "@/components/ui/input";
import { Lozenge, LozengeDropdownTrigger } from "@/components/ui/lozenge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tag, type TagColor } from "@/components/ui/tag";
import { LayoutDashboardIcon, MoreHorizontalIcon, PlusIcon } from "@/components/ui/vpk-icons";
import { computeContextBarOverflow } from "@/components/ui-custom/context-bar/overflow";
import {
	type RichTextMentionItem,
	type RichTextMentionRemovalRequest,
	type RichTextMentionSources,
	type RichTextReferenceCategory,
	type RichTextSlashCategory,
	type RichTextSuggestionMenuItem,
	type RichTextSuggestionVariantConfig,
	RichTextMentionVisualMark,
	RichTextEditor,
	getRichTextMentionTagType,
	isRichTextReferenceCategory,
} from "@/components/ui-custom/rich-text-editor";
import {
	getRichTextReferencePreview,
	RichTextReferencePreviewContent,
} from "@/components/ui-custom/rich-text-editor/reference-preview";
import "@/components/ui-custom/rich-text-editor/rich-text-editor.css";
import { useHasHorizontalOverflow } from "@/components/hooks/use-has-horizontal-overflow";
import { buildHorizontalScrollMaskStyle } from "@/components/visual/scroll-mask/lib";
import type {
	WikiMemoryExplorerResponse,
} from "@/lib/rovo-runtime-types";
import { cn } from "@/lib/utils";

import { CodeBlock } from "@/components/ui-custom/code-block";
import { SkillTag, type SkillTagColor } from "@/components/ui-custom/skill-tag";
import {
	DEFAULT_SKILLS,
	getSkillCollectionId,
	getSkillIcon,
	slugifySkillName,
} from "@/app/data/directory/skills";
import {
	AGENT_AVATAR_OPTION_GROUPS,
	AGENT_AVATAR_OPTION_SRCS,
} from "@/components/blocks/agent-2/data/agent-avatar-options";
import { getDeterministicAgentBannerSrc } from "@/lib/agent-avatars";

const AGENT_AVATAR_HEXAGON_PATH = "M19.01 0.922148C20.24 0.212148 21.76 0.212148 23 0.922148L40 10.6921C41.24 11.4021 42.01 12.7321 42.01 14.1621V33.6721C42.01 35.1021 41.24 36.4221 40 37.1421L23 46.9121C21.77 47.6221 20.25 47.6221 19.01 46.9121L2.01 37.1321C0.77 36.4221 0 35.0921 0 33.6621V14.1621C0 12.7321 0.77 11.4121 2.01 10.6921L19.01 0.922148Z";
const AGENT_AVATAR_SRC = "/avatar-agent/teamwork-agents/blocker-checker.svg";
const AGENT_AVATAR_OPTION_SRC_SET = new Set<string>(AGENT_AVATAR_OPTION_SRCS);
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

const AGENT_AVATAR_PROFILE_COVER_COLORS: Record<string, string> = {
	"dev-agents": "#82B536",
	"product-agents": "#BF63F3",
	"service-agents": "#FFC716",
	"strategy-agents": "#FCA700",
	"teamwork-agents": DEFAULT_AGENT_PROFILE_COVER_COLOR,
};

// Source order IS the canonical display order for the empty-state chip strip:
// Flows › Apps › Skills › Subagents › Conversation starters › Memory.
// Reasoning renders separately and always sits last.
const AGENT_COMPACT_EMPTY_CONFIG_NAV_ITEMS = [
	{ agentFieldName: "trigger", label: "Flows", Icon: AutomationIcon },
	{ agentFieldName: "apps", label: "Apps", listFieldName: "apps", Icon: AppsIcon },
	{ agentFieldName: "skills", label: "Skills", listFieldName: "skills", Icon: SkillIcon },
	{ agentFieldName: "subagents", label: "Subagents", listFieldName: "subagents", Icon: AiAgentIcon },
	{ agentFieldName: "conversationStarters", label: "Conversation starters", listFieldName: "conversationStarters", Icon: AiChatIcon },
	{ agentFieldName: "memory", label: "Memory", kind: "memory", Icon: AiModelIcon },
	{ agentFieldName: "reasoning", label: "Reasoning", kind: "reasoning", Icon: AiComputeIcon },
] as const;

// Match the shared Menubar's default `gap-0.5` (2px) so the connected config
// strip spaces items identically to the base component.
const AGENT_COMPACT_CONFIG_NAV_GAP = 2;
const AGENT_COMPACT_CONFIG_NAV_SCROLL_EDGE_THRESHOLD = 4;
const AGENT_COMPACT_CONFIG_NAV_START_MASK_STYLE = buildHorizontalScrollMaskStyle({
	edge: "start",
	fadeSize: "var(--ds-space-300)",
});
const AGENT_COMPACT_CONFIG_NAV_END_MASK_STYLE = buildHorizontalScrollMaskStyle({
	edge: "end",
	fadeSize: "var(--ds-space-300)",
});
const AGENT_COMPACT_CONFIG_NAV_BOTH_MASK_STYLE = buildHorizontalScrollMaskStyle({
	edge: "both",
	fadeSize: "var(--ds-space-300)",
});
// Shared flat-trigger look for every item in the connected config menu bar.
// Kept subtle (no border/background) so the strip reads as one continuous
// surface rather than a row of separate buttons.
const AGENT_COMPACT_CONFIG_NAV_TRIGGER_CLASS =
	"inline-flex h-6 shrink-0 items-center gap-1 rounded px-2 text-xs font-semibold leading-4 text-text-subtlest transition-colors outline-hidden hover:bg-bg-neutral-subtle-hovered hover:text-text aria-expanded:bg-bg-neutral-subtle-hovered aria-expanded:text-text focus-visible:ring-3 focus-visible:ring-ring/50";
const AGENT_EMPTY_ROW_ADD_LABELS: Record<AgentConfigListFieldName, string> = {
	conversationStarters: "Add prompts to help people start",
	knowledge: "Add knowledge to ground this agent",
	apps: "Add apps to connect tools and knowledge",
	skills: "Add skills to guide specialized tasks",
	subagents: "Add subagents to handle specific scenarios",
	tools: "Add tools to extend what this agent can do",
	triggers: "Add flows for when this agent runs",
};

function getAgentFilledSummaryAddLabel(field: AgentConfigListFieldName, isEmpty: boolean, showAddButtons: boolean): string | undefined {
	if (!showAddButtons) {
		return undefined;
	}

	return isEmpty ? AGENT_EMPTY_ROW_ADD_LABELS[field] : "Edit";
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
					count = getAgentAutomationItems(config).length;
					break;
				case "skills":
					count = getSkillConfigItems(config.skills).length;
					break;
				case "apps":
					count = getNonEmptyConfigItems(config.apps).length;
					break;
				case "subagents":
					count = getNonEmptyConfigItems(config.subagents).length;
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

// Studio instructions editor uses the shared nested-first suggestion behavior:
// bare "@" / "/" show parent categories, while top-level typing searches flat
// across that trigger's full set. Hoisted so the editor's extension memo stays
// referentially stable.
const AGENT_INSTRUCTIONS_SUGGESTION_VARIANT: RichTextSuggestionVariantConfig = "nested";

function toMentionId(category: RichTextMentionItem["category"], id: string): string {
	return `${category}:${id.trim().replace(/\s+/g, "-")}`;
}

export type AgentConfigReferenceListFieldName = Extract<
	AgentConfigListFieldName,
	"knowledge" | "skills" | "subagents" | "tools" | "apps"
>;

const AGENT_CONFIG_FIELD_BY_REFERENCE_CATEGORY: Record<RichTextReferenceCategory, AgentConfigReferenceListFieldName> = {
	knowledge: "knowledge",
	skill: "skills",
	subagent: "subagents",
	tool: "tools",
	app: "apps",
};

const AGENT_REFERENCE_CATEGORY_BY_CONFIG_FIELD: Record<AgentConfigReferenceListFieldName, RichTextReferenceCategory> = {
	knowledge: "knowledge",
	skills: "skill",
	subagents: "subagent",
	tools: "tool",
	apps: "app",
};
type AgentInlineSearchField = Extract<AgentConfigReferenceListFieldName, "apps" | "knowledge" | "skills" | "tools">;

const AGENT_INLINE_SEARCH_CATEGORY_BY_FIELD: Record<AgentInlineSearchField, EditorPaletteSearchCategory> = {
	apps: "app",
	knowledge: "knowledge",
	skills: "skill",
	tools: "tool",
};

// Sentinel passed to onPickKnowledgeApp when the picker's leading "Upload
// files" row is chosen (vs. a real app id).
// Sentinel "app id" for the "Upload files" lead row in the Add knowledge
// flyout. The config panel opens the directory's file browser instead of an
// app content step when it receives this value.
export const AGENT_KNOWLEDGE_UPLOAD_TARGET = "__upload__";

// Sticky lead row above the knowledge app list, mirroring the directory's
// upload drop zone. Selecting it opens the directory dialog's file browser.

function isAgentConfigReferenceListField(
	field: AgentConfigListFieldName,
): field is AgentConfigReferenceListFieldName {
	return field in AGENT_REFERENCE_CATEGORY_BY_CONFIG_FIELD;
}

function getNormalizedAgentReferenceValue(value: string): string {
	return value.trim().toLowerCase();
}

function getSkillConfigLabel(value: string): string {
	return slugifySkillName(value);
}

function getAgentConfigListLookupValue(field: AgentConfigListFieldName, value: string): string {
	return field === "skills" ? getSkillConfigLabel(value) : getNormalizedAgentReferenceValue(value);
}

function getAgentReferenceKey(
	field: AgentConfigReferenceListFieldName,
	value: string,
): string {
	return `${field}:${getAgentConfigListLookupValue(field, value)}`;
}

function hasAgentReferenceValue(
	config: AgentConfigFormValue,
	field: AgentConfigReferenceListFieldName,
	value: string,
): boolean {
	const normalizedValue = getAgentConfigListLookupValue(field, value);
	return getNonEmptyConfigItems(config[field]).some(
		(item) => getAgentConfigListLookupValue(field, item) === normalizedValue,
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

function mapSubagentConfigValuesToMentionItems(
	values: readonly string[] | undefined,
): RichTextMentionItem[] {
	return getNonEmptyConfigItems(values).map((value) => ({
		category: "subagent",
		id: toMentionId("subagent", value),
		label: value,
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
	| "guardrail"
	// Mode selectors are single-value (string) config like the text fields, so
	// they reuse the same onTextChange plumbing rather than a bespoke callback.
	| "memoryMode"
	| "reasoningMode"
	| "knowledgeMode";

export type AgentConfigListFieldName =
	| "triggers"
	| "skills"
	| "tools"
	| "subagents"
	| "knowledge"
	| "apps"
	| "conversationStarters";

export type AgentDirectoryKind = "knowledge" | "tools" | "apps" | "skills" | "memory" | "conversationStarters";

// Maps a directory-backed "/" slash category to the config-panel directory it
// opens from a nested empty state's "Browse all". "format" has no directory and
// is intentionally absent (the renderer omits its button), so the map only
// covers the reference categories.
const AGENT_DIRECTORY_BY_SLASH_CATEGORY: Record<
	Exclude<RichTextSlashCategory, "format">,
	AgentDirectoryKind
> = {
	skill: "skills",
	tool: "tools",
	knowledge: "knowledge",
	app: "apps",
};

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
	automationRules?: readonly AgentAutomationRule[];
	skills?: readonly string[];
	guardrail?: string;
	tools?: readonly string[];
	subagents?: readonly string[];
	knowledge?: readonly string[];
	apps?: readonly string[];
	conversationStarters?: readonly string[];
	conversationStarterIcons?: readonly string[];
	// Per-field set of disabled list items, keyed by the item's label (not index)
	// so the disabled state survives reordering and removal. A configured item
	// (tool / skill / knowledge / subagent) whose label appears here is shown in a
	// disabled state in both the collapsed-nav dropdown and the filled summary,
	// but stays listed until explicitly removed. Persisted on the agent draft
	// alongside the other config fields (e.g. localStorage).
	disabledItems?: Partial<Record<AgentConfigListFieldName, readonly string[]>>;
	// Mode selectors, persisted on the agent draft. Stored loosely as `string`
	// (matching the agent-result wire type); the option lists below
	// (MEMORY_MODE_OPTIONS / REASONING_MODE_SECTIONS / KNOWLEDGE_MODE_OPTIONS)
	// are the source of valid values, narrowed at the selector boundary.
	memoryMode?: string;
	reasoningMode?: string;
	knowledgeMode?: string;
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
	{ icon: <LayoutDashboardIcon size="small" />, label: "Details", value: "details" },
	{ icon: <ChartTrendUpIcon label="" size="small" color="currentColor" />, label: "Insights", value: "insights" },
	{ icon: <ViewsIcon label="" size="small" color="currentColor" />, label: "Surfaces", value: "surfaces" },
	{ icon: <ScorecardIcon label="" size="small" color="currentColor" />, label: "Evaluation", value: "evaluation" },
	{ icon: <PersonIcon label="" size="small" color="currentColor" />, label: "Users", value: "users" },
	{ icon: <LockLockedIcon label="" size="small" color="currentColor" />, label: "Access", value: "access" },
] as const;

export type AgentCompactHeaderSection = (typeof AGENT_COMPACT_HEADER_NAV_ITEMS)[number]["value"];
export type AgentCompactHeaderNavItem = (typeof AGENT_COMPACT_HEADER_NAV_ITEMS)[number];
// react-doctor-disable-next-line react-doctor/only-export-components -- This component module intentionally exports colocated non-component API used by consumers.
export const AGENT_COMPACT_HEADER_DEFAULT_NAV_ITEMS = AGENT_COMPACT_HEADER_NAV_ITEMS.filter((item) => item.value !== "details");
export const AGENT_COMPACT_HEADER_DETAILS_NAV_ITEM = AGENT_COMPACT_HEADER_NAV_ITEMS[0];

// Secondary sections that start folded into the "…" overflow menu regardless of
// available width. Primary sections (Insights, Evaluation) stay inline and still
// width-overflow on top of these. Kept as a value Set rather than a per-item flag
// so the `as const` literal union behind AgentCompactHeaderSection is preserved.
const AGENT_COMPACT_HEADER_DEFAULT_COLLAPSED_SECTIONS: ReadonlySet<AgentCompactHeaderSection> = new Set([
	"surfaces",
	"users",
	"access",
]);

const AGENT_COMPACT_HEADER_NAV_GAP = 4;
const AGENT_COMPACT_HEADER_AVATAR_NAV_GAP = 8;
const AGENT_COMPACT_HEADER_NAV_OVERFLOW_WIDTH = 24;

function AgentCompactHeaderNavButton({
	activeSection,
	item,
	onSectionChange,
}: Readonly<{
	activeSection?: AgentCompactHeaderSection | null;
	item: AgentCompactHeaderNavItem;
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
	items = AGENT_COMPACT_HEADER_DEFAULT_NAV_ITEMS,
	onSectionChange,
}: Readonly<{
	activeSection?: AgentCompactHeaderSection | null;
	avatarSrc?: string;
	items?: readonly AgentCompactHeaderNavItem[];
	onSectionChange?: (section: AgentCompactHeaderSection) => void;
}>) {
	const containerRef = useRef<HTMLDivElement>(null);
	const measureRef = useRef<HTMLDivElement>(null);
	// Sections that start folded into the "…" menu by default never render inline,
	// so only the primary items participate in the width-fitting math below.
	const primaryItems = useMemo(
		() => items.filter((item) => !AGENT_COMPACT_HEADER_DEFAULT_COLLAPSED_SECTIONS.has(item.value)),
		[items],
	);
	const defaultCollapsedItems = useMemo(
		() => items.filter((item) => AGENT_COMPACT_HEADER_DEFAULT_COLLAPSED_SECTIONS.has(item.value)),
		[items],
	);
	const [visibleCount, setVisibleCount] = useState<number>(primaryItems.length);
	const visibleItems = primaryItems.slice(0, visibleCount);
	// Width-overflowed primaries come first, then the always-collapsed sections.
	const hiddenItems = [...primaryItems.slice(visibleCount), ...defaultCollapsedItems];

	useLayoutEffect(() => {
		const container = containerRef.current;
		const measure = measureRef.current;
		if (!container || !measure) {
			return;
		}

		function recompute(): void {
			const widths = Array.from(measure!.children).map((node) => (node as HTMLElement).offsetWidth);
			// When sections are collapsed by default the "…" trigger is always
			// present, so always reserve its width (computed once inside the
			// helper) rather than only when the primaries overflow on their own.
			setVisibleCount(
				computeContextBarOverflow(
					widths,
					container!.clientWidth,
					AGENT_COMPACT_HEADER_NAV_OVERFLOW_WIDTH,
					AGENT_COMPACT_HEADER_NAV_GAP,
					defaultCollapsedItems.length > 0,
				),
			);
		}

		recompute();
		const observer = new ResizeObserver(recompute);
		observer.observe(container);
		return () => observer.disconnect();
	}, [primaryItems, defaultCollapsedItems]);

	return (
		<div className="flex min-w-0 flex-1 items-center" style={{ gap: AGENT_COMPACT_HEADER_AVATAR_NAV_GAP }}>
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
						{primaryItems.map((item) => (
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
	// Floats above the right edge of the leading (nav) area without taking
	// layout space — used for the transient save indicator, which veils the nav
	// behind a gradient scrim instead of pushing the surrounding controls.
	leadingOverlay?: ReactNode;
	primaryActionLabel?: string;
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
		leadingOverlay,
		model,
		name,
		primaryActionLabel = "Test",
		publishLabel = "Publish",
		showActions = true,
		actions,
		badge,
		...props
	}: Readonly<AgentHeaderProps>) => (
		<div
			className={cn(
				"flex h-14 w-full items-center justify-between gap-4 border-b border-border bg-surface px-4",
				className
			)}
			{...props}
		>
			<div className="relative flex min-w-0 flex-1 items-center">
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
				{leadingOverlay ? (
					<div className="pointer-events-none absolute inset-y-0 right-0 z-10 flex items-center justify-end">
						{leadingOverlay}
					</div>
				) : null}
			</div>
			{showActions ? (
				<div className="flex shrink-0 items-center gap-2">
					{actions ?? (
						<>
							<AgentMoreOptionsMenu />
							<Button type="button" size="default" variant="outline">
								{primaryActionLabel}
							</Button>
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
	onEditTriggers?: (seed?: AgentAutomationRule) => void,
): (() => void) | undefined {
	if (item.agentFieldName === "trigger") {
		return () => onEditTriggers?.();
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

// Flex-column popup sizing for the Memory/Reasoning menus: the list scrolls
// within the available height while a pinned section stays put.
const AGENT_COMPACT_NAV_MENU_FLEX_CONTENT_CLASS = "flex max-h-(--available-height) flex-col";

type AgentCompactNavMenuOpenChange = NonNullable<ComponentProps<typeof MenubarMenu>["onOpenChange"]>;

function shouldClearCompactNavInitialHighlight(eventDetails: Parameters<AgentCompactNavMenuOpenChange>[1]): boolean {
	if (
		eventDetails.reason === "trigger-focus" ||
		eventDetails.reason === "trigger-hover" ||
		eventDetails.reason === "sibling-open"
	) {
		return true;
	}

	if (eventDetails.reason !== "trigger-press") {
		return false;
	}

	const event = eventDetails.event;
	if (typeof PointerEvent !== "undefined" && event instanceof PointerEvent) {
		return true;
	}
	return !(event instanceof MouseEvent) || event.detail !== 0;
}

function clearCompactNavInitialHighlight(contentElement: HTMLElement): void {
	const activeElement = contentElement.ownerDocument.activeElement;

	for (const highlightedElement of contentElement.querySelectorAll<HTMLElement>("[data-highlighted]")) {
		highlightedElement.removeAttribute("data-highlighted");

		if (highlightedElement.getAttribute("tabindex") === "0") {
			highlightedElement.setAttribute("tabindex", "-1");
		}
	}

	if (
		activeElement instanceof HTMLElement &&
		contentElement.contains(activeElement) &&
		activeElement !== contentElement
	) {
		contentElement.focus({ preventScroll: true });
	}
}

function AgentCompactNavMenuInitialHighlightReset({
	enabled,
	resetToken,
}: Readonly<{
	enabled: boolean;
	resetToken: number;
}>) {
	const markerRef = useRef<HTMLSpanElement | null>(null);

	useLayoutEffect(() => {
		if (!enabled) {
			return;
		}

		const contentElement = markerRef.current?.closest<HTMLElement>(
			"[data-slot='menubar-content'], [data-slot='dropdown-menu-content']",
		);
		if (!contentElement) {
			return;
		}

		const clear = () => clearCompactNavInitialHighlight(contentElement);

		clear();

		// While the popup is opening, Base UI applies two auto-behaviors right after
		// our synchronous clear — too fast to react to — that we don't want:
		//   1. the item the popup materializes over flashes `data-highlighted` (the
		//      CSS rule keyed on the attribute below forces highlighted rows
		//      transparent for the brief open window); and
		//   2. initial focus auto-lands on the first form field (e.g. the
		//      Conversation starters inputs) — we bounce that *programmatic* focus
		//      back to the menu content, while leaving a deliberate user click alone.
		// The guards lift on the first real interaction (pointerdown/keydown), which
		// — unlike pointermove — never fires coincidentally while a cursor is still
		// gliding to a rest as the menu opens, or after a short fallback timeout.
		contentElement.setAttribute("data-agent-suppress-initial-highlight", "");

		let guardsReleased = false;
		const redirectInitialAutoFocus = (event: FocusEvent) => {
			if (guardsReleased) {
				return;
			}
			const target = event.target;
			if (
				target instanceof HTMLElement &&
				target !== contentElement &&
				contentElement.contains(target) &&
				target.matches("input, textarea, [contenteditable='true']")
			) {
				contentElement.focus({ preventScroll: true });
			}
		};
		const releaseInitialOpenGuards = () => {
			if (guardsReleased) {
				return;
			}
			guardsReleased = true;
			contentElement.removeAttribute("data-agent-suppress-initial-highlight");
			contentElement.removeEventListener("focusin", redirectInitialAutoFocus);
			window.removeEventListener("pointerdown", releaseInitialOpenGuards, true);
			window.removeEventListener("keydown", releaseInitialOpenGuards, true);
		};
		contentElement.addEventListener("focusin", redirectInitialAutoFocus);
		window.addEventListener("pointerdown", releaseInitialOpenGuards, true);
		window.addEventListener("keydown", releaseInitialOpenGuards, true);
		const guardTimeoutId = window.setTimeout(releaseInitialOpenGuards, 250);

		queueMicrotask(() => {
			clear();
			requestAnimationFrame(clear);
			window.setTimeout(clear, 120);
		});

		return () => {
			window.clearTimeout(guardTimeoutId);
			releaseInitialOpenGuards();
		};
	}, [enabled, resetToken]);

	return (
		<span
			aria-hidden
			className="hidden"
			data-agent-compact-nav-initial-highlight-reset=""
			ref={markerRef}
		/>
	);
}

function useCompactNavMenuNoInitialHighlight(): {
	onOpenChange: AgentCompactNavMenuOpenChange;
	resetInitialHighlight: boolean;
	resetToken: number;
} {
	const shouldResetInitialHighlightRef = useRef(false);
	const [resetToken, setResetToken] = useState(0);
	const handleOpenChange = useCallback<AgentCompactNavMenuOpenChange>(
		(open, eventDetails) => {
			if (open && shouldClearCompactNavInitialHighlight(eventDetails)) {
				shouldResetInitialHighlightRef.current = true;
				setResetToken((currentResetToken) => currentResetToken + 1);
				return;
			}

			if (!open) {
				shouldResetInitialHighlightRef.current = false;
			}
		},
		[],
	);

	return {
		onOpenChange: handleOpenChange,
		resetInitialHighlight: shouldResetInitialHighlightRef.current,
		resetToken,
	};
}

// Multi-select support for the Apps/Skills add menus. Picking a result adds it
// to the picker's `excludeLabels`, which unmounts the focused option button — so
// focus leaves the menu and Base UI closes the whole tree (submenu AND root) on
// focus-out. To let several items be added in a row we CONTROL the root menu's
// open state and ignore the close request triggered by a pick (flagged via
// `suppressNextClose`, which self-clears once the focus-out settles). Only the
// standalone row "Edit" instances opt in (`controlled`); the chip-strip
// instances stay uncontrolled because Base UI's `Menubar` coordinates its child
// menus' open state itself (and adding the first item there promotes the field
// to a row, unmounting the chip regardless).
function useCompactNavMenuKeepOpen(controlled: boolean): {
	resetInitialHighlight: boolean;
	resetToken: number;
	rootProps: { open?: boolean; onOpenChange: AgentCompactNavMenuOpenChange };
	keepOpenRef: RefObject<boolean>;
	suppressNextClose: () => void;
} {
	const base = useCompactNavMenuNoInitialHighlight();
	const baseOnOpenChange = base.onOpenChange;
	const [open, setOpen] = useState(false);
	const keepOpenRef = useRef(false);
	const handleRootOpenChange = useCallback<AgentCompactNavMenuOpenChange>(
		(next, eventDetails) => {
			if (!next && keepOpenRef.current) {
				return;
			}
			setOpen(next);
			baseOnOpenChange(next, eventDetails);
		},
		[baseOnOpenChange],
	);
	const suppressNextClose = useCallback(() => {
		keepOpenRef.current = true;
		// Cleared after the focus-out close has had a chance to fire and be
		// ignored, so a later deliberate dismiss (outside press / Escape) still
		// closes the menu.
		window.setTimeout(() => {
			keepOpenRef.current = false;
		}, 150);
	}, []);

	return {
		resetInitialHighlight: base.resetInitialHighlight,
		resetToken: base.resetToken,
		rootProps: controlled ? { open, onOpenChange: handleRootOpenChange } : { onOpenChange: baseOnOpenChange },
		keepOpenRef,
		suppressNextClose,
	};
}

// Memoize disabled label keys for O(1) per-row lookups. The collapsed-nav
// dropdowns receive the field's disabled labels (derived from the persisted
// config) and match by field-specific key so the state survives reorder/removal.
const trimDisabledLabel = (value: string) => value.trim();

function useDisabledLabelSet(
	disabledItems: readonly string[] | undefined,
	normalize: (value: string) => string = trimDisabledLabel,
): ReadonlySet<string> {
	return useMemo(() => new Set((disabledItems ?? []).map(normalize)), [disabledItems, normalize]);
}

function AgentCompactSubagentsNavButton({
	disabledItems,
	item,
	onCreateSubagent,
	onManageSubagents,
	onRemoveSubagent,
	onSelectSubagent,
	onToggleItem,
	renderTrigger,
	screenAssistantTargetId,
	selectedIndex,
	subagents,
	tagColor,
}: Readonly<{
	disabledItems?: readonly string[];
	item: AgentCompactConfigNavItem;
	onCreateSubagent?: () => void;
	onManageSubagents?: () => void;
	onRemoveSubagent?: (index: number) => void;
	onSelectSubagent?: (index: number) => void;
	onToggleItem?: (index: number, enabled: boolean) => void;
	// Overrides the default collapsed-nav trigger so the expanded Subagents row
	// can open this same dropdown from its inline "Add" button.
	renderTrigger?: ReactElement;
	screenAssistantTargetId?: string;
	selectedIndex?: number;
	subagents: readonly string[];
	tagColor?: TagColor;
}>) {
	const isEmpty = item.count === 0;
	const disabledSet = useDisabledLabelSet(disabledItems);
	const compactNavMenu = useCompactNavMenuNoInitialHighlight();

	return (
		<MenubarMenu onOpenChange={compactNavMenu.onOpenChange}>
			{renderTrigger ? (
				<MenubarTrigger render={renderTrigger} />
			) : (
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
			)}
			<MenubarContent align="start" className="w-64">
				<AgentCompactNavMenuInitialHighlightReset
					enabled={compactNavMenu.resetInitialHighlight}
					resetToken={compactNavMenu.resetToken}
				/>
				<DropdownMenuItem
					elemBefore={
						<span className="inline-flex size-6 shrink-0 items-center justify-center [&_svg]:size-4">
							<PlusIcon />
						</span>
					}
					onClick={onCreateSubagent}
				>
					Add subagent
				</DropdownMenuItem>
				<DropdownMenuItem
					elemBefore={
						<span className="inline-flex size-6 shrink-0 items-center justify-center [&_svg]:size-4">
							<AiAgentIcon label="" />
						</span>
					}
					onClick={onManageSubagents ?? onCreateSubagent}
				>
					Manage subagents
				</DropdownMenuItem>
				{isEmpty ? null : <DropdownMenuSeparator />}
				{isEmpty ? null : (
					<AgentCompactNavMenuList>
						<DropdownMenuGroup className="p-0">
							{subagents.map((subagent, index) => (
								<AgentCompactReferenceRow
									key={`${subagent}-${index}`}
									category="subagent"
									enabled={!disabledSet.has(subagent.trim())}
									label={subagent}
									onClick={() => onSelectSubagent?.(index)}
									onRemove={onRemoveSubagent ? () => onRemoveSubagent(index) : undefined}
									onToggle={onToggleItem ? (enabled) => onToggleItem(index, enabled) : undefined}
									selected={selectedIndex === index}
									tagColor={tagColor}
								/>
							))}
						</DropdownMenuGroup>
					</AgentCompactNavMenuList>
				)}
			</MenubarContent>
		</MenubarMenu>
	);
}

// A single automation row inside the collapsed Automations dropdown. Mirrors the
// subagent switcher (SubagentsSwitcherButton) hover model: a Switch parks at the
// far right and stays visible while off, an edit button slides in on hover, and a
// disabled (off) trigger reads as muted. Unlike a DropdownMenuItem this is a plain
// row so toggling/editing never closes the menu.
function AgentCompactTriggerRow({
	icon,
	label,
	enabled,
	onToggle,
	onEdit,
}: Readonly<{
	icon?: ReactNode;
	label: string;
	enabled: boolean;
	onToggle: (enabled: boolean) => void;
	onEdit?: () => void;
}>) {
	// The row is a Base UI Menu.Item with `closeOnClick={false}` so item activation
	// doesn't close the menu. The switch additionally calls `preventDefault()` on
	// pointerdown: Base UI's dismissal treats a prevented press that starts inside
	// the popup as intentional and suppresses the follow-up outside-click, so
	// toggling never dismisses the menu even when the re-render detaches the
	// pressed node. preventDefault is safe here because the Switch toggles via
	// `onCheckedChange`, not the native default.
	function suppressMenuDismissal(event: { preventDefault: () => void }) {
		event.preventDefault();
	}

	return (
		<DropdownMenuItem
			closeOnClick={false}
			className={cn(
				hoverRevealRowClassName,
				"cursor-default",
				// A disabled row reads as muted until re-enabled — keep it muted on
				// hover too (the item's `data-[highlighted]:text-text` would otherwise
				// re-darken the label).
				enabled ? undefined : "text-text-disabled data-[highlighted]:text-text-disabled",
			)}
			elemBefore={
				icon ? (
					// The icon is a self-colored collection tile, so dim it via opacity
					// when disabled — mirroring the subagent rows (`AgentCompactReferenceRow`)
					// rather than recoloring the glyph, which the tile's `!` color overrides.
					<span
						className={cn(
							"inline-flex size-6 shrink-0 items-center justify-center",
							enabled ? undefined : "opacity-(--opacity-disabled)",
						)}
					>
						{icon}
					</span>
				) : undefined
			}
		>
			<HoverRevealLabel
				reserveOnReveal={onEdit ? 2 : 1}
				// A disabled row parks its switch visibly, so keep its single-control
				// width reserved even at rest; an enabled row gets the full width.
				reserveAtRest={enabled ? 0 : 1}
			>
				{label}
			</HoverRevealLabel>
			<HoverRevealActions
				toggleParked={!enabled}
				toggle={
					<Switch
						size="sm"
						checked={enabled}
						onCheckedChange={onToggle}
						onPointerDown={suppressMenuDismissal}
						onMouseDown={suppressMenuDismissal}
						aria-label={`${enabled ? "Disable" : "Enable"} ${label}`}
					/>
				}
				action={
					onEdit ? (
						<button
							type="button"
							aria-label={`Edit ${label}`}
							className="flex size-6 items-center justify-center rounded-md text-text-subtlest transition-colors duration-normal ease-out hover:bg-bg-neutral-subtle-hovered hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-selected [&_svg]:size-4"
							onClick={onEdit}
						>
							<EditIcon label="" size="small" />
						</button>
					) : undefined
				}
			/>
		</DropdownMenuItem>
	);
}

// Resolves a configured reference row's leading "front slot" visual from its
// directory category — the same avatar/logo/icon the inline AgentReferenceChip
// shows. Rendered natively at `menu-compact` (a 24px `small` tile) to fill the
// 24px front slot, matching the trigger rows and footer icons in these
// dropdowns. Drawing natively (rather than scaling a 32px `menu` mark down to
// 75%) keeps the glyph on ADS's `small` Tile inset (14px) instead of freezing
// the `medium` inset and shrinking the glyph to 12px. Values not present in the
// directory fall back to a category-appropriate `small` icon tile, mirroring
// AgentReferenceChip's fallback. Subagents are prompt references owned by the
// parent agent, so they deliberately skip directory avatar resolution and always
// use the AI-agent tile. Glyph icons inherit the menu's subtle front-slot
// treatment; avatars/logos/images keep their color, exactly like the sibling
// Triggers rows.
function renderAgentReferenceRowVisual(
	category: RichTextReferenceCategory,
	label: string,
	tagColor?: TagColor,
): ReactNode {
	if (category === "subagent") {
		return (
			<span className="inline-flex size-6 shrink-0 items-center justify-center">
				<IconTile
					aria-hidden
					className={cn(
						"border border-border bg-surface",
						tagColor ? tagColorToMenuIconClassName[tagColor] : "text-icon-subtlest",
					)}
					icon={<AiAgentIcon label="" size="small" />}
					label=""
					size="small"
				/>
			</span>
		);
	}

	const visual = getDirectoryMentionItemOrFallback(category, label).visual;
	return (
		<span className="inline-flex size-6 shrink-0 items-center justify-center">
			{visual ? (
				<RichTextMentionVisualMark category={category} label={label} size="menu-compact" visual={visual} />
			) : (
				<IconTile
					aria-hidden
					className={cn(
						"border border-border bg-surface",
						tagColor ? tagColorToMenuIconClassName[tagColor] : "text-icon-subtlest",
					)}
					icon={<PageIcon label="" size="small" />}
					label=""
					size="small"
				/>
			)}
		</span>
	);
}

// A configured reference row (knowledge / tools / skills / subagents) inside a
// collapsed config dropdown. Mirrors AgentCompactTriggerRow's hover-reveal model:
// the label truncates clear of trailing controls that reveal on hover/focus —
// an enable/disable Switch (parked visible while off) plus a "Remove" button.
// The row's primary press keeps its normal behavior (open the directory on this
// item); both trailing controls stop propagation so they never also trigger the
// row press or dismiss the menu.
function AgentCompactReferenceRow({
	category,
	elemBefore,
	enabled = true,
	label,
	onClick,
	onRemove,
	onToggle,
	selected,
	tagColor,
}: Readonly<{
	// Directory category for the row. When set (and no explicit `elemBefore` is
	// passed), the row resolves its leading "front slot" visual from the directory
	// so every configured item shows the same avatar/logo/icon as its inline chip.
	category?: RichTextReferenceCategory;
	elemBefore?: ReactNode;
	enabled?: boolean;
	label: string;
	onClick?: () => void;
	onRemove?: () => void;
	onToggle?: (enabled: boolean) => void;
	selected?: boolean;
	tagColor?: TagColor;
}>) {
	// See AgentCompactTriggerRow: preventDefault on the switch's pointer/mouse
	// down stops Base UI from dismissing the menu when toggling.
	function suppressMenuDismissal(event: { preventDefault: () => void }) {
		event.preventDefault();
	}
	// Prefer an explicit elemBefore; otherwise derive the front slot from the row's
	// directory category so skills/tools/apps/subagents each lead with their icon.
	const frontSlot = elemBefore ?? (category ? renderAgentReferenceRowVisual(category, label, tagColor) : undefined);
	const hasToggle = onToggle !== undefined;
	// Reserve trailing width for whichever controls exist: switch + remove = 2,
	// either alone = 1, neither = none.
	const reserveCount = (hasToggle ? 1 : 0) + (onRemove ? 1 : 0);
	const resolvedElemBefore = frontSlot
		? hasToggle && !enabled
			? <span className="inline-flex size-6 items-center justify-center opacity-(--opacity-disabled)">{frontSlot}</span>
			: frontSlot
		: undefined;
	return (
		<DropdownMenuItem
			closeOnClick={!hasToggle}
			className={cn(
				hoverRevealRowClassName,
				// A disabled row reads as muted until re-enabled — keep it muted on
				// hover too (the item's `data-[highlighted]:text-text` would otherwise
				// re-darken the label).
				hasToggle && !enabled ? "text-text-disabled data-[highlighted]:text-text-disabled" : undefined,
			)}
			elemBefore={resolvedElemBefore}
			onClick={onClick}
			selected={selected}
		>
			<HoverRevealLabel
				reserveOnReveal={reserveCount > 0 ? (reserveCount as 1 | 2) : undefined}
				// A disabled row parks its switch visibly, so keep one control's width
				// reserved even at rest; otherwise reveal the full label at rest.
				reserveAtRest={hasToggle && !enabled ? 1 : 0}
			>
				{label}
			</HoverRevealLabel>
			{reserveCount > 0 ? (
				<HoverRevealActions
					toggleParked={hasToggle && !enabled}
					toggle={
						hasToggle ? (
							<Switch
								size="sm"
								checked={enabled}
								onCheckedChange={onToggle}
								onPointerDown={suppressMenuDismissal}
								onMouseDown={suppressMenuDismissal}
								aria-label={`${enabled ? "Disable" : "Enable"} ${label}`}
							/>
						) : undefined
					}
					action={
						onRemove ? (
							<button
								type="button"
								aria-label={`Remove ${label}`}
								className="flex size-6 items-center justify-center rounded-md text-text-subtlest transition-colors duration-normal ease-out hover:bg-bg-neutral-subtle-hovered hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-selected [&_svg]:size-4"
								onClick={(event) => {
									// Don't let the press bubble to the row's onClick (which would
									// open the directory) or close the menu via item activation.
									event.preventDefault();
									event.stopPropagation();
									onRemove();
								}}
							>
								<DeleteIcon label="" size="small" />
							</button>
						) : undefined
					}
				/>
			) : null}
		</DropdownMenuItem>
	);
}

// Automations dropdown: the automation list (when any) scrolls in the popup body,
// and the "Add automation ›" flyout + "Manage automations" live in a permanent
// sticky footer pinned to the bottom — so adding automations grows the list at the top
// while the footer stays anchored. The flyout reuses the full TriggerPicker
// provider/event content so behavior matches the expanded summary row exactly.
function AgentCompactTriggersNavButton({
	automationRules,
	item,
	triggers,
	onSelectEvent,
	onEditTriggers,
	onManageTriggers,
	onAutomationRulesChange,
	renderTrigger,
	screenAssistantTargetId,
	tagColor,
}: Readonly<{
	automationRules?: readonly AgentAutomationRule[];
	item: AgentCompactConfigNavItem;
	triggers: readonly string[];
	onSelectEvent: (providerId: Parameters<typeof createAgentTriggerValue>[0], eventId: string) => void;
	onEditTriggers?: (seed?: AgentAutomationRule) => void;
	onAutomationRulesChange?: (automationRules: readonly AgentAutomationRule[]) => void;
	// Opens the list-management dialog (reorder / toggle / delete / add), mirroring
	// "Manage subagents". Falls back to the rule-builder (`onEditTriggers`) when
	// not provided.
	onManageTriggers?: () => void;
	// Overrides the default collapsed-nav trigger button. The expanded Triggers
	// summary row passes its inline chips / "Edit" button here so they open this
	// same dropdown.
	renderTrigger?: ReactElement;
	screenAssistantTargetId?: string;
	// Agent collection color (derived from the avatar family). Tints each flow
	// row's leading automation glyph so the list mirrors the flow summary chip and
	// the subagent rows instead of the first trigger's provider logo.
	tagColor?: TagColor;
}>) {
	const isEmpty = triggers.length === 0;
	// Local enable/disable state keyed by row, mirroring the subagent switcher.
	// Disabled rows read as muted but stay listed until removed via "Manage".
	const [disabledTriggers, setDisabledTriggers] = useState<ReadonlySet<number>>(() => new Set());
	const setTriggerEnabled = useCallback((index: number, enabled: boolean) => {
		if (automationRules && onAutomationRulesChange) {
			onAutomationRulesChange(
				automationRules.map((rule, ruleIndex) => (ruleIndex === index ? { ...rule, enabled } : rule)),
			);
			return;
		}
		setDisabledTriggers((prev) => {
			const next = new Set(prev);
			if (enabled) {
				next.delete(index);
			} else {
				next.add(index);
			}
			return next;
		});
	}, [automationRules, onAutomationRulesChange]);
	// Controlled open for the "Add trigger ›" flyout so typing in its search input
	// (which blurs the submenu trigger) doesn't collapse the flyout: Base UI
	// reports that as a `focus-out` close, which we ignore. All explicit closes
	// (item press, escape, pointer leave, trigger toggle) still pass through.
	const [addTriggerOpen, setAddTriggerOpen] = useState(false);
	const handleAddTriggerOpenChange = useCallback(
		(nextOpen: boolean, eventDetails: { reason?: string }) => {
			if (!nextOpen && eventDetails.reason === "focus-out") {
				return;
			}
			setAddTriggerOpen(nextOpen);
		},
		[],
	);
	const compactNavMenu = useCompactNavMenuNoInitialHighlight();
	// "Add automation ›" reuses the picker's full searchable provider list (the
	// editor-palette "search" variant), so the flyout shows the same sticky search
	// input over the provider→event submenus as the expanded summary row's picker.
	const addTriggerFlyout = (
		<DropdownMenuSub open={addTriggerOpen} onOpenChange={handleAddTriggerOpenChange}>
			<DropdownMenuSubTrigger>
				<span className="flex items-center gap-3">
					<span className="inline-flex size-6 shrink-0 items-center justify-center [&_svg]:size-4">
						<PlusIcon />
					</span>
					Add flow
				</span>
			</DropdownMenuSubTrigger>
			<DropdownMenuSubContent className="w-80 p-0">
				<TriggerProviderSearchList autoFocus onSelectEvent={onSelectEvent} />
			</DropdownMenuSubContent>
		</DropdownMenuSub>
	);

	return (
		<MenubarMenu onOpenChange={compactNavMenu.onOpenChange}>
			{renderTrigger ? (
				<MenubarTrigger render={renderTrigger} />
			) : (
				<MenubarTrigger
					className={AGENT_COMPACT_CONFIG_NAV_TRIGGER_CLASS}
					render={(
						<AgentCompactConfigNavButton
							aria-label="Flows"
							item={item}
							screenAssistantTargetId={screenAssistantTargetId}
						/>
					)}
				/>
			)}
			<MenubarContent align="start" className="w-64">
				<AgentCompactNavMenuInitialHighlightReset
					enabled={compactNavMenu.resetInitialHighlight}
					resetToken={compactNavMenu.resetToken}
				/>
				{addTriggerFlyout}
				<DropdownMenuItem
					elemBefore={
						<span className="inline-flex size-6 shrink-0 items-center justify-center [&_svg]:size-4">
							<AutomationIcon label="" />
						</span>
					}
					onClick={() => (onManageTriggers ?? onEditTriggers)?.()}
				>
					Manage flows
				</DropdownMenuItem>
				{isEmpty ? null : <DropdownMenuSeparator />}
				{isEmpty ? null : (
					<AgentCompactNavMenuList>
						<DropdownMenuGroup className="p-0">
							{triggers.map((trigger, index) => {
								const rule = automationRules?.[index];
								// Every flow row leads with the same automation glyph in a
								// bordered tile, tinted by the agent's collection color — NOT
								// the first trigger's provider logo. A flow can own multiple
								// triggers, so a single provider mark would misrepresent it.
								// This mirrors the flow summary chip and the subagent rows
								// (see `renderAgentReferenceRowVisual`).
								const automationIcon = (
									<IconTile
										aria-hidden
										className={cn(
											"border border-border bg-surface",
											tagColor ? tagColorToMenuIconClassName[tagColor] : "text-icon-subtlest",
										)}
										icon={<AutomationIcon label="" size="small" />}
										label=""
										size="small"
									/>
								);
								return (
									<AgentCompactTriggerRow
										key={`trigger-${trigger}-${index}`}
										icon={automationIcon}
										label={trigger}
										enabled={(rule?.enabled !== false) && !disabledTriggers.has(index)}
										onToggle={(enabled) => setTriggerEnabled(index, enabled)}
										onEdit={onEditTriggers ? () => onEditTriggers(rule) : undefined}
									/>
								);
							})}
						</DropdownMenuGroup>
					</AgentCompactNavMenuList>
				)}
			</MenubarContent>
		</MenubarMenu>
	);
}

// Tools/Skills share one shape: configured items scroll in the body, while
// "Add {label} ›" and "Browse {label}" stay pinned in a permanent footer.
// Knowledge layers its mode options above the list (handled by
// AgentKnowledgeSelector instead).
function AgentCompactDirectoryNavButton({
	item,
	directory,
	items,
	browseLabel,
	onBrowse,
	disabledItems,
	onAddSearchItem,
	onPickTool,
	onRemoveItem,
	onSelectItem,
	onToggleItem,
	renderTrigger,
	screenAssistantTargetId,
}: Readonly<{
	item: AgentCompactConfigNavItem;
	directory: AgentInlineSearchField;
	items: readonly string[];
	browseLabel: string;
	onBrowse: () => void;
	disabledItems?: readonly string[];
	// Skills: picking a result adds it immediately. Tools: handled by
	// `onPickTool` instead (opens the tools directory on that tool's detail).
	onAddSearchItem?: (item: RichTextSuggestionMenuItem) => void;
	onPickTool?: (toolId: string) => void;
	onRemoveItem?: (index: number) => void;
	onSelectItem?: (item: string) => void;
	onToggleItem?: (index: number, enabled: boolean) => void;
	// Overrides the default collapsed-nav trigger button. The expanded summary
	// rows pass their inline "Add" button here so it opens this same dropdown.
	renderTrigger?: ReactElement;
	screenAssistantTargetId?: string;
}>) {
	const isEmpty = items.length === 0;
	const disabledSet = useDisabledLabelSet(
		disabledItems,
		directory === "skills" ? getSkillConfigLabel : undefined,
	);
	const addLabel = `Add ${item.label.toLowerCase()}`;
	// Multi-select (skills): keep the menu open after each pick so several skills
	// can be added in a row. Both the picker submenu and (for the controllable row
	// "Edit" instances) the root menu ignore the focus-out close a pick triggers.
	// Tools are excluded — picking a tool intentionally closes to open the
	// directory dialog on that tool's detail.
	const nav = useCompactNavMenuKeepOpen(Boolean(renderTrigger));
	const [addOpen, setAddOpen] = useState(false);
	const handleAddOpenChange = useCallback(
		(nextOpen: boolean) => {
			if (!nextOpen && nav.keepOpenRef.current) {
				return;
			}
			setAddOpen(nextOpen);
		},
		[nav.keepOpenRef],
	);
	const browseItem = (
		<DropdownMenuItem
			elemBefore={
				<span className="inline-flex size-6 shrink-0 items-center justify-center [&_svg]:size-4">
					<item.Icon label="" />
				</span>
			}
			onClick={onBrowse}
		>
			{browseLabel}
		</DropdownMenuItem>
	);
	// Tools open the directory dialog on the chosen tool's detail; skills add
	// the picked result immediately and keep the picker open for the next add.
	const handlePickerSelect = directory === "tools"
		? (onPickTool ? (picked: RichTextSuggestionMenuItem) => onPickTool(getToolIdFromMentionId(picked.id)) : undefined)
		: (onAddSearchItem
			? (picked: RichTextSuggestionMenuItem) => {
					nav.suppressNextClose();
					onAddSearchItem(picked);
				}
			: undefined);
	const addSearchFlyout = (
		<DropdownMenuSub open={addOpen} onOpenChange={handleAddOpenChange}>
			<DropdownMenuSubTrigger>
				<span className="flex items-center gap-3">
					<span className="inline-flex size-6 shrink-0 items-center justify-center [&_svg]:size-4">
						<PlusIcon />
					</span>
					{addLabel}
				</span>
			</DropdownMenuSubTrigger>
			<DropdownMenuSubContent className="w-auto min-w-0 overflow-visible border-0 bg-transparent p-0 shadow-none">
				<EditorPaletteSearchPicker
					autoFocus
					category={AGENT_INLINE_SEARCH_CATEGORY_BY_FIELD[directory]}
					className="rich-text-command-menu-borderless"
					excludeLabels={items}
					keepOpenOnSelect={directory !== "tools"}
					onBrowseAll={onBrowse}
					onSelectItem={handlePickerSelect}
				/>
			</DropdownMenuSubContent>
		</DropdownMenuSub>
	);

	return (
		<MenubarMenu {...nav.rootProps}>
			{renderTrigger ? (
				<MenubarTrigger render={renderTrigger} />
			) : (
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
			)}
			<MenubarContent align="start" className="w-64">
				<AgentCompactNavMenuInitialHighlightReset
					enabled={nav.resetInitialHighlight}
					resetToken={nav.resetToken}
				/>
				{addSearchFlyout}
				{browseItem}
				{isEmpty ? null : <DropdownMenuSeparator />}
				{isEmpty ? null : (
					<AgentCompactNavMenuList>
						<DropdownMenuGroup className="p-0">
							{items.map((value, index) => (
								<AgentCompactReferenceRow
									key={`${directory}-${value}-${index}`}
									category={AGENT_REFERENCE_CATEGORY_BY_CONFIG_FIELD[directory]}
									enabled={!disabledSet.has(directory === "skills" ? getSkillConfigLabel(value) : value.trim())}
									label={value}
									onClick={onSelectItem ? () => onSelectItem(value) : undefined}
									onRemove={onRemoveItem ? () => onRemoveItem(index) : undefined}
									onToggle={onToggleItem ? (enabled) => onToggleItem(index, enabled) : undefined}
								/>
							))}
						</DropdownMenuGroup>
					</AgentCompactNavMenuList>
				)}
			</MenubarContent>
		</MenubarMenu>
	);
}

// Apps mirror the Skills/Tools directory dropdown shell exactly: configured
// rows scroll above a pinned footer that holds an inline "Add app ›" search
// flyout and a "Browse apps" item. Picking a flyout result adds the app by
// label (via `onAddSearchItem`); "Browse apps" opens the full directory for
// connection/detail. Clicking the collapsed-nav trigger opens this menu.
function AgentCompactAppsNavButton({
	item,
	apps,
	disabledItems,
	onAddSearchItem,
	onBrowse,
	onRemoveItem,
	onSelectItem,
	onToggleItem,
	renderTrigger,
	screenAssistantTargetId,
}: Readonly<{
	item: AgentCompactConfigNavItem;
	apps: readonly string[];
	disabledItems?: readonly string[];
	// Picking a flyout result adds it immediately (mirrors Skills).
	onAddSearchItem?: (item: RichTextSuggestionMenuItem) => void;
	onBrowse: () => void;
	onRemoveItem?: (index: number) => void;
	onSelectItem?: (item: string) => void;
	onToggleItem?: (index: number, enabled: boolean) => void;
	// Overrides the default collapsed-nav trigger button so other surfaces can
	// open this same dropdown from their own inline control.
	renderTrigger?: ReactElement;
	screenAssistantTargetId?: string;
}>) {
	const isEmpty = apps.length === 0;
	const disabledSet = useDisabledLabelSet(disabledItems);
	const addLabel = `Add ${item.label.toLowerCase()}`;
	// Multi-select: keep the menu open after each pick so several apps can be added
	// in a row. Both the picker submenu and (for the controllable row "Edit"
	// instances) the root menu ignore the focus-out close that a pick triggers.
	const nav = useCompactNavMenuKeepOpen(Boolean(renderTrigger));
	const [addOpen, setAddOpen] = useState(false);
	const handleAddOpenChange = useCallback(
		(nextOpen: boolean) => {
			if (!nextOpen && nav.keepOpenRef.current) {
				return;
			}
			setAddOpen(nextOpen);
		},
		[nav.keepOpenRef],
	);
	const handleAddItem = useCallback(
		(picked: RichTextSuggestionMenuItem) => {
			nav.suppressNextClose();
			onAddSearchItem?.(picked);
		},
		[nav.suppressNextClose, onAddSearchItem],
	);
	const addSearchFlyout = (
		<DropdownMenuSub open={addOpen} onOpenChange={handleAddOpenChange}>
			<DropdownMenuSubTrigger>
				<span className="flex items-center gap-3">
					<span className="inline-flex size-6 shrink-0 items-center justify-center [&_svg]:size-4">
						<PlusIcon />
					</span>
					{addLabel}
				</span>
			</DropdownMenuSubTrigger>
			<DropdownMenuSubContent className="w-auto min-w-0 overflow-visible border-0 bg-transparent p-0 shadow-none">
				<EditorPaletteSearchPicker
					autoFocus
					category={AGENT_INLINE_SEARCH_CATEGORY_BY_FIELD.apps}
					className="rich-text-command-menu-borderless"
					excludeLabels={apps}
					keepOpenOnSelect
					onBrowseAll={onBrowse}
					onSelectItem={handleAddItem}
				/>
			</DropdownMenuSubContent>
		</DropdownMenuSub>
	);

	return (
		<MenubarMenu {...nav.rootProps}>
			{renderTrigger ? (
				<MenubarTrigger render={renderTrigger} />
			) : (
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
			)}
			<MenubarContent align="start" className="w-64">
				<AgentCompactNavMenuInitialHighlightReset
					enabled={nav.resetInitialHighlight}
					resetToken={nav.resetToken}
				/>
				{addSearchFlyout}
				<DropdownMenuItem
					elemBefore={
						<span className="inline-flex size-6 shrink-0 items-center justify-center [&_svg]:size-4">
							<item.Icon label="" />
						</span>
					}
					onClick={onBrowse}
				>
					Browse {item.label.toLowerCase()}
				</DropdownMenuItem>
				{isEmpty ? null : <DropdownMenuSeparator />}
				{isEmpty ? null : (
					<AgentCompactNavMenuList>
						<DropdownMenuGroup className="p-0">
							{apps.map((value, index) => (
								<AgentCompactReferenceRow
									key={`apps-${value}-${index}`}
									category="app"
									enabled={!disabledSet.has(value.trim())}
									label={value}
									onClick={onSelectItem ? () => onSelectItem(value) : undefined}
									onRemove={onRemoveItem ? () => onRemoveItem(index) : undefined}
									onToggle={onToggleItem ? (enabled) => onToggleItem(index, enabled) : undefined}
								/>
							))}
						</DropdownMenuGroup>
					</AgentCompactNavMenuList>
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
	const compactNavMenu = useCompactNavMenuNoInitialHighlight();

	return (
		<MenubarMenu onOpenChange={compactNavMenu.onOpenChange}>
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
			<MenubarContent align="start" className="w-70">
				<AgentCompactNavMenuInitialHighlightReset
					enabled={compactNavMenu.resetInitialHighlight}
					resetToken={compactNavMenu.resetToken}
				/>
				{/* 8px (`p-2`) of padding around the starter input fields. */}
				<div className="flex flex-col gap-1.5 p-2">
					{fields.map((field, index) => (
						<Input
							key={`starter-${index}`}
							onChange={(event) => onStarterChange?.(index, event.target.value)}
							onKeyDown={(event) => event.stopPropagation()}
							placeholder={`Starter ${index + 1}`}
							value={field.label}
						/>
					))}
				</div>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					elemBefore={
						<span className="inline-flex size-6 shrink-0 items-center justify-center [&_svg]:size-4">
							<AiChatIcon label="" />
						</span>
					}
					onClick={onManage}
				>
					Manage conversation starters
				</DropdownMenuItem>
			</MenubarContent>
		</MenubarMenu>
	);
}

function AgentCompactEmptyConfigNav({
	avatarSrc,
	config,
	hiddenConfigFields,
	hiddenFieldNames,
	onManageSubagents,
	onAddListValues,
	onAppendListItem,
	onEditTriggers,
	onManageTriggers,
	onAutomationRulesChange,
	onListItemChange,
	onOpenDirectory,
	onRemoveListItem,
	onSelectListItem,
	onToggleListItem,
	reasoningValue,
	onReasoningValueChange,
	memoryMode,
	onMemoryModeChange,
	screenAssistantTargetPrefix,
	selectedListItemIndexByField,
}: Readonly<{
	avatarSrc?: string;
	config?: AgentConfigFormValue;
	hiddenConfigFields?: ReadonlySet<AgentHideableConfigField>;
	// Field names (any `agentFieldName`) to omit from the chip strip — used to
	// hide fields that are already promoted to summary rows in the hybrid panel.
	hiddenFieldNames?: ReadonlySet<string>;
	onManageSubagents?: () => void;
	onAddListValues?: (field: AgentConfigReferenceListFieldName, values: readonly string[]) => void;
	onAppendListItem?: (field: AgentConfigListFieldName) => void;
	onEditTriggers?: (seed?: AgentAutomationRule) => void;
	onManageTriggers?: () => void;
	onAutomationRulesChange?: (automationRules: readonly AgentAutomationRule[]) => void;
	onListItemChange?: (field: AgentConfigListFieldName, index: number, value: string) => void;
	onOpenDirectory?: (directory: AgentDirectoryKind, selectedItem?: string) => void;
	onRemoveListItem?: (field: AgentConfigListFieldName, index: number) => void;
	onSelectListItem?: (field: AgentConfigListFieldName, index: number) => void;
	onToggleListItem?: (field: AgentConfigListFieldName, index: number, enabled: boolean) => void;
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
		(item) =>
			!hiddenConfigFields?.has(item.agentFieldName as AgentHideableConfigField)
			&& !hiddenFieldNames?.has(item.agentFieldName),
	);
	const navOverflow = useHasHorizontalOverflow<HTMLDivElement>({
		edgeThreshold: AGENT_COMPACT_CONFIG_NAV_SCROLL_EDGE_THRESHOLD,
	});
	const scrollMaskStyle = navOverflow.canScrollLeft && navOverflow.canScrollRight
		? AGENT_COMPACT_CONFIG_NAV_BOTH_MASK_STYLE
		: navOverflow.canScrollLeft
			? AGENT_COMPACT_CONFIG_NAV_START_MASK_STYLE
			: navOverflow.canScrollRight
				? AGENT_COMPACT_CONFIG_NAV_END_MASK_STYLE
				: {};
	const subagentTagColor = getTagColorForAgentAvatar(avatarSrc);

	if (items.length === 0) {
		return null;
	}

	return (
		// `-ml-4` cancels the Menubar's `pl-2` (8px) + the first chip's `px-2` (8px)
		// so the leading chip's content left-aligns with the summary row labels above.
		// The `pl-2` (not `pl-1`) keeps the first item's rounded/hover/expanded
		// background and 3px focus ring clear of the `overflow-x-auto` clip edge,
		// which would otherwise shear the leading button's left side flat. (The
		// sibling header nav fixes the same clip with `overflow-clip-margin`, but
		// that only applies to `overflow: clip`, not the `auto` this scrolling strip
		// needs.)
		<div className="relative -ml-4 flex min-h-8 min-w-0 items-center">
			<Menubar
				// Override the shared Menubar's bordered/elevated chrome so the strip
				// reads as one flat, connected surface (matching the prior loose-button
				// look) while still giving us roving focus + arrow-key nav across items.
				// When the container is too tight, the row scrolls horizontally and the
				// shared scroll-mask fades whichever edge has more content.
				className="relative -my-1 flex h-auto min-w-0 flex-1 items-center overflow-x-auto overflow-y-visible overscroll-x-contain rounded-none border-0 bg-transparent p-0 py-1 pl-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
				ref={navOverflow.ref}
				style={{
					gap: AGENT_COMPACT_CONFIG_NAV_GAP,
					...scrollMaskStyle,
				}}
			>
				{items.map((item) => {
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
					if (item.agentFieldName === "memory") {
						return (
							<AgentMemorySelector
								key={item.agentFieldName}
								render="nav-button"
								value={memoryMode}
								onValueChange={onMemoryModeChange}
								onManage={() => onOpenDirectory?.("memory")}
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
								disabledItems={config?.disabledItems?.subagents}
								onRemoveSubagent={onRemoveListItem ? (index) => onRemoveListItem("subagents", index) : undefined}
								onSelectSubagent={(index) => onSelectListItem?.("subagents", index)}
								onToggleItem={onToggleListItem ? (index, enabled) => onToggleListItem("subagents", index, enabled) : undefined}
								screenAssistantTargetId={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:subagents` : undefined}
								selectedIndex={selectedListItemIndexByField?.subagents}
								subagents={getNonEmptyConfigItems(config?.subagents)}
								tagColor={subagentTagColor}
							/>
						);
					}
					if (item.agentFieldName === "trigger") {
						const automationRules = config ? getAgentAutomationRules(config) : [];
						return (
							<AgentCompactTriggersNavButton
								automationRules={automationRules}
								item={item}
								key={item.agentFieldName}
								onAutomationRulesChange={onAutomationRulesChange}
								onEditTriggers={onEditTriggers}
								onManageTriggers={onManageTriggers}
								onSelectEvent={(providerId, eventId) => {
									const next = createAutomationRuleFromEvent(providerId, eventId, automationRules);
									onEditTriggers?.(next ?? undefined);
								}}
								screenAssistantTargetId={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:trigger` : undefined}
								tagColor={subagentTagColor}
								triggers={serializeAgentAutomationRuleLabels(automationRules)}
							/>
						);
					}
					if (item.agentFieldName === "apps") {
						return (
							<AgentCompactAppsNavButton
								apps={getNonEmptyConfigItems(config?.apps)}
								disabledItems={config?.disabledItems?.apps}
								item={item}
								key={item.agentFieldName}
								onAddSearchItem={(searchItem) => {
									if (searchItem.disabled) {
										return;
									}
									onAddListValues?.("apps", [searchItem.label]);
								}}
								onBrowse={() => openAgentDirectoryOrAppendListItem("apps", "apps", onOpenDirectory, onAppendListItem)}
								onRemoveItem={onRemoveListItem ? (index) => onRemoveListItem("apps", index) : undefined}
								onSelectItem={onOpenDirectory ? (value) => onOpenDirectory("apps", value) : undefined}
								onToggleItem={onToggleListItem ? (index, enabled) => onToggleListItem("apps", index, enabled) : undefined}
								screenAssistantTargetId={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:apps` : undefined}
							/>
						);
					}
					if (item.agentFieldName === "skills") {
						const directory = "skills" as const;
						return (
							<AgentCompactDirectoryNavButton
								browseLabel={`Browse ${item.label.toLowerCase()}`}
								directory={directory}
								item={item}
								items={getSkillConfigItems(config?.skills)}
								key={item.agentFieldName}
								onAddSearchItem={(searchItem) => {
									if (searchItem.disabled) {
										return;
									}
									onAddListValues?.(directory, [searchItem.label]);
								}}
								disabledItems={config?.disabledItems?.[directory]}
								onPickTool={undefined}
								onBrowse={() => openAgentDirectoryOrAppendListItem(directory, directory, onOpenDirectory, onAppendListItem)}
								onRemoveItem={onRemoveListItem ? (index) => onRemoveListItem(directory, index) : undefined}
								onToggleItem={onToggleListItem ? (index, enabled) => onToggleListItem(directory, index, enabled) : undefined}
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

function getSkillConfigItems(items: readonly string[] | undefined): readonly string[] {
	return getNonEmptyConfigItems(items)
		.map(getSkillConfigLabel)
		.filter(Boolean);
}

// Disabled-item lookups are label-keyed so they survive reordering and removal
// of the underlying list. Skills use their kebab-case config key; other rows use
// trimmed labels. A missing field or label means "enabled".
function getDisabledItemLabels(
	config: AgentConfigFormValue | undefined,
	field: AgentConfigListFieldName,
): readonly string[] {
	return config?.disabledItems?.[field] ?? [];
}

function isAgentListItemDisabled(
	config: AgentConfigFormValue | undefined,
	field: AgentConfigListFieldName,
	label: string,
): boolean {
	const target = getAgentConfigListLookupValue(field, label);
	return getDisabledItemLabels(config, field).some((entry) => getAgentConfigListLookupValue(field, entry) === target);
}

// Pure reducer: returns a new config with `label` added to / removed from the
// field's disabled set. Used by owners that persist the config (e.g. the studio
// draft saved to localStorage). Prunes empty field arrays and an empty
// `disabledItems` map so the persisted shape stays minimal.
// react-doctor-disable-next-line react-doctor/only-export-components -- This component module intentionally exports colocated non-component API used by consumers.
export function toggleAgentConfigDisabledItem(
	config: AgentConfigFormValue,
	field: AgentConfigListFieldName,
	label: string,
	enabled: boolean,
): AgentConfigFormValue {
	const target = getAgentConfigListLookupValue(field, label);
	if (!target) {
		return config;
	}
	const current = getDisabledItemLabels(config, field);
	const isCurrentlyDisabled = current.some((entry) => getAgentConfigListLookupValue(field, entry) === target);
	// No-op fast paths keep referential identity stable (avoids needless writes).
	if (enabled && !isCurrentlyDisabled) {
		return config;
	}
	if (!enabled && isCurrentlyDisabled) {
		return config;
	}
	const nextField = enabled
		? current.filter((entry) => getAgentConfigListLookupValue(field, entry) !== target)
		: [...current, target];
	const nextDisabledItems: Partial<Record<AgentConfigListFieldName, readonly string[]>> = {
		...config.disabledItems,
	};
	if (nextField.length > 0) {
		nextDisabledItems[field] = nextField;
	} else {
		delete nextDisabledItems[field];
	}
	const hasAny = Object.keys(nextDisabledItems).length > 0;
	return { ...config, disabledItems: hasAny ? nextDisabledItems : undefined };
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

function getAgentAutomationRules(config: AgentConfigFormValue): readonly AgentAutomationRule[] {
	if (Array.isArray(config.automationRules)) {
		return config.automationRules;
	}
	const triggers = getNonEmptyConfigItems(config.triggers);
	if (triggers.length > 0) {
		return inferAutomationRules(triggers) ?? [];
	}

	const trigger = config.trigger?.trim();
	return trigger ? inferAutomationRules([trigger]) ?? [] : [];
}

function getAgentAutomationItems(config: AgentConfigFormValue): readonly string[] {
	return serializeAgentAutomationRuleLabels(getAgentAutomationRules(config));
}

function serializeAgentAutomationRuleLabels(rules: readonly AgentAutomationRule[] | undefined): string[] {
	return (rules ?? [])
		.map((rule, index) => getAgentAutomationRuleLabel(rule, index).trim())
		.filter(Boolean);
}

function getNextAutomationRuleIndex(rules: readonly AgentAutomationRule[] | undefined): number {
	const usedIndexes = (rules ?? [])
		.map((rule) => /^automation-(\d+)$/u.exec(rule.id)?.[1])
		.map((value) => Number(value))
		.filter((value) => Number.isFinite(value));
	return usedIndexes.length > 0 ? Math.max(...usedIndexes) + 1 : (rules?.length ?? 0) + 1;
}

function createAutomationRuleFromEvent(
	providerId: Parameters<typeof createAgentTriggerValue>[0],
	eventId: string,
	existingRules: readonly AgentAutomationRule[] | undefined,
): AgentAutomationRule | null {
	const nextIndex = getNextAutomationRuleIndex(existingRules);
	const nextTrigger = createAgentTriggerValue(providerId, eventId, 1);
	return nextTrigger
		? createAgentAutomationRule({
				id: `automation-${nextIndex}`,
				name: "",
				prompt: "",
				triggers: [nextTrigger],
			})
		: null;
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

// Maps each agent avatar family (the `<group>` segment in `/avatar-agent/<group>/…`)
// to the Tag color that matches its brand accent (see AGENT_AVATAR_GROUP_ACCENTS).
// Used so a subagent chip is tinted with its base agent's custom color rather than
// the generic fallback — e.g. a lime (dev-agents) agent shows lime subagent chips.
const agentAvatarGroupToTagColor: Readonly<Record<string, TagColor>> = {
	"dev-agents": "lime",
	"product-agents": "purple",
	"service-agents": "yellow",
	"strategy-agents": "orange",
	"teamwork-agents": "blue",
};

const tagColorToMenuIconClassName: Partial<Record<TagColor, string>> = {
	blue: "text-blue-500 [&_svg]:text-blue-500!",
	blueLight: "text-blue-500 [&_svg]:text-blue-500!",
	discovery: "text-icon-discovery [&_svg]:text-icon-discovery!",
	green: "text-green-400 [&_svg]:text-green-400!",
	greenLight: "text-green-400 [&_svg]:text-green-400!",
	gray: "text-neutral-500 [&_svg]:text-neutral-500!",
	grayLight: "text-neutral-500 [&_svg]:text-neutral-500!",
	grey: "text-neutral-500 [&_svg]:text-neutral-500!",
	greyLight: "text-neutral-500 [&_svg]:text-neutral-500!",
	lime: "text-lime-400 [&_svg]:text-lime-400!",
	limeLight: "text-lime-400 [&_svg]:text-lime-400!",
	magenta: "text-pink-500 [&_svg]:text-pink-500!",
	magentaLight: "text-pink-500 [&_svg]:text-pink-500!",
	orange: "text-orange-400 [&_svg]:text-orange-400!",
	orangeLight: "text-orange-400 [&_svg]:text-orange-400!",
	purple: "text-purple-500 [&_svg]:text-purple-500!",
	purpleLight: "text-purple-500 [&_svg]:text-purple-500!",
	red: "text-red-600 [&_svg]:text-red-600!",
	redLight: "text-red-600 [&_svg]:text-red-600!",
	standard: "text-neutral-500 [&_svg]:text-neutral-500!",
	teal: "text-teal-400 [&_svg]:text-teal-400!",
	tealLight: "text-teal-400 [&_svg]:text-teal-400!",
	yellow: "text-yellow-400 [&_svg]:text-yellow-400!",
	yellowLight: "text-yellow-400 [&_svg]:text-yellow-400!",
};

// Single source of truth for the Flows and Subagents summary-chip leading-glyph
// color: it ALWAYS follows the agent's collection color (derived from the avatar
// family via `getTagColorForAgentAvatar`). When the agent has no recognized
// collection family, fall back to the neutral gray collection so the glyph still
// carries a collection color rather than inheriting the chip's text color. Both
// rows route through this helper so the rule can never drift between them.
function getAgentCollectionIconClassName(tagColor: TagColor | undefined): string {
	return tagColorToMenuIconClassName[tagColor ?? "gray"] ?? tagColorToMenuIconClassName.gray ?? "";
}

// Resolves a configured Skills row item (a skill label) to its SkillTag color
// (collection family) and leading icon by looking the label up in the skills
// directory. Unknown labels fall back to the neutral "default" collection and
// the page glyph so freshly added / off-directory skills still render a tag.
function getSkillForConfigLabel(label: string) {
	const normalized = getSkillConfigLabel(label);
	return DEFAULT_SKILLS.find((entry) => entry.id === normalized || getSkillConfigLabel(entry.name) === normalized);
}

function getSkillTagPropsForLabel(label: string): { color: SkillTagColor; icon: ReactNode } {
	const skill = getSkillForConfigLabel(label);
	return {
		color: skill ? getSkillCollectionId(skill) : "default",
		icon: getSkillIcon(skill?.icon ?? "page"),
	};
}

function getTagColorForAgentAvatar(avatarSrc: string | undefined): TagColor | undefined {
	const group = avatarSrc?.match(/\/avatar-agent\/([^/]+)\//u)?.[1];
	return group ? agentAvatarGroupToTagColor[group] : undefined;
}

function AgentReferenceChip({
	category,
	disabled = false,
	elemBefore,
	label,
	onClick,
	onRemove,
	tagColor,
	// Extra props (and ref) are injected when this chip is used as a menu/menubar
	// `render` target — Base UI merges its trigger handlers, aria state, id, and
	// ref onto whatever element it renders. Those MUST reach the underlying `Tag`
	// or the trigger is inert (e.g. clicking a trigger chip wouldn't open the
	// Triggers dropdown). We forward them onto the interactive `Tag` element.
	...rest
}: Readonly<
	Omit<ComponentProps<typeof Tag>, "color" | "children"> & {
		category?: RichTextReferenceCategory;
		disabled?: boolean;
		elemBefore?: ReactNode;
		label: string;
		onRemove?: () => void;
		tagColor?: TagColor;
	}
>) {
	const item = category && category !== "subagent" ? getDirectoryMentionItemOrFallback(category, label) : undefined;
	const visual = item?.visual;
	const resolvedTagColor = tagColor ?? getTagColorForMentionVisual(visual) ?? "blue";
	const preview = getRichTextReferencePreview(category, label);
	// When no directory visual resolves (e.g. a freshly created, still-unnamed
	// subagent that isn't in the demo agent directory), fall back to a
	// category-appropriate icon — subagents use the same agent icon as the
	// Subagents config row/header rather than the generic page icon.
	const FallbackIcon = category === "subagent" ? AiAgentIcon : PageIcon;
	const resolvedElemBefore = elemBefore ?? (
		visual ? (
			<RichTextMentionVisualMark
				category={category}
				label={label}
				visual={visual}
			/>
		) : (
			// Latest Tag standard: a bare leading icon is wrapped in the
			// `IconTile` xxsmall/transparent treatment (see `TagDemoFrontSlot`) so
			// the glyph is normalized to 16px and centered in the chip's leading
			// slot. Rendering the raw `@atlaskit/icon` instead left-aligns the 12px
			// glyph, which reads as a misaligned icon with an oversized gap.
			<IconTile
				aria-hidden
				// `text-inherit` lets the glyph pick up the Tag's color (the leading
				// slot wrapper applies the resolved Tag color, e.g. `text-lime-400`)
				// instead of the transparent variant's neutral `text-icon`. So a
				// lime subagent chip shows a lime icon, etc.
				className="text-inherit"
				icon={<Icon aria-hidden render={<FallbackIcon label="" size="small" />} />}
				label=""
				size="xxsmall"
				variant="transparent"
			/>
		)
	);

	// A disabled chip reads as muted but stays removable, so we deliberately do
	// NOT use Tag's `disabled` prop (which sets pointer-events:none and would also
	// kill the remove control). Instead we dim it via opacity and suppress only
	// the row's primary click (opening the directory), leaving the overlay remove
	// button fully interactive.
	//
	// Forward ONLY the behavioral props a `render`-target receives (event
	// handlers, aria state, id, ref) — NOT the injected `className`/`style`. When
	// this chip is a menu/menubar trigger, the parent injects its own trigger
	// styling (padding/rounding/hover background); applying that would visually
	// reshape the Tag into a button. The chip must always look like a Tag.
	const { className: injectedClassName, style: injectedStyle, ...behaviorProps } = rest;
	void injectedClassName;
	void injectedStyle;
	const tag = (
		<Tag
			{...behaviorProps}
			aria-disabled={disabled || undefined}
			className={cn(disabled && "opacity-(--opacity-disabled)")}
			color={resolvedTagColor}
			elemBefore={resolvedElemBefore}
			onClick={disabled ? undefined : onClick}
			onRemove={onRemove}
			removeButtonLabel={`Remove ${label}`}
			removeVariant="overlay"
			type={elemBefore ? "default" : getRichTextMentionTagType(visual)}
			variant="editor"
		>
			{label}
		</Tag>
	);

	return preview ? (
		<HoverCard>
			<HoverCardTrigger closeDelay={80} delay={120} render={<span className="inline-flex max-w-full" />}>
				{tag}
			</HoverCardTrigger>
			<RichTextReferencePreviewContent preview={preview} />
		</HoverCard>
	) : tag;
}

function AgentAddValueButton({
	className,
	// `icon` is retained in the prop contract so existing call sites keep
	// compiling, but every affordance now uses the edit glyph and this shared text
	// link chrome. `label` carries either "Edit" for filled rows or the descriptive
	// empty-row placeholder copy.
	icon,
	label,
	onClick,
	...props
}: Readonly<{ icon?: "add" | "edit"; label: string } & ComponentProps<"button">>) {
	void icon;
	return (
		// Shared visual chrome for Triggers and every other summary-row edit CTA.
		// The hover-reveal opacity (opacity-0 → group-hover/agent-row) is supplied
		// via `className` only for filled rows, so empty placeholders stay visible.
		<button
			type="button"
			className={cn(
				className,
				"inline-flex min-h-5 max-w-full shrink-0 items-center gap-1 rounded-xs p-0 text-left text-xs font-medium leading-4 text-text-subtlest transition-opacity hover:bg-transparent active:bg-transparent focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-expanded:bg-transparent aria-expanded:opacity-100",
			)}
			onClick={onClick}
			{...props}
		>
			<EditIcon label="" size="small" />
			<span className="min-w-0 whitespace-normal group-hover/agent-row:underline">{label}</span>
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
	isItemDisabled?: (item: string, index: number) => boolean;
	// When provided, each configured item is rendered by this callback instead of
	// the default AgentReferenceChip — used by the Skills row to render SkillTag
	// chips while every other row keeps the shared chip. The callback receives the
	// resolved disabled/click/remove handlers so the row's behavior is preserved.
	renderItem?: (opts: {
		item: string;
		index: number;
		disabled: boolean;
		onClick?: () => void;
		onRemove?: () => void;
	}) => ReactNode;
	inlinePicker?: ReactNode;
	onAdd?: () => void;
	// When provided, the row's inline "Add" affordance is rendered by this
	// callback instead of a plain click button — used to back "Add" with the same
	// dropdown the collapsed nav opens (list + add flyout + browse). It receives
	// the resolved label/icon plus the placement className (the hover-reveal
	// classes for the chip-paired spot, none for the empty-row spot) so the
	// trigger keeps the row's existing reveal behavior.
	renderAddControl?: (opts: { icon?: "add" | "edit"; label: string; className?: string }) => ReactNode;
	onItemClick?: (item: string, index: number) => void;
	onRemoveItem?: (index: number) => void;
	tagColor?: TagColor;
}

function AgentFilledSummaryRow({
	addIcon,
	addLabel,
	agentFieldName,
	hideWhenEmpty = false,
	inlinePicker,
	itemElemBefore,
	isItemDisabled,
	items,
	label,
	onAdd,
	renderAddControl,
	onItemClick,
	onRemoveItem,
	referenceCategory,
	renderItem,
	screenAssistantTargetId,
	tagColor,
}: Readonly<AgentFilledSummaryRowProps>) {
	const isEmpty = items.length === 0;

	// Resolve the "Add" affordance once: a dropdown-backed control (renderAddControl)
	// when supplied, otherwise the default click button. `className` carries the
	// placement-specific reveal classes so both spots stay visually identical.
	const renderAddButton = (className?: string): ReactNode =>
		addLabel === undefined
			? null
			: renderAddControl
				? renderAddControl({ icon: addIcon, label: addLabel, className })
				: (
					<AgentAddValueButton
						className={className}
						icon={addIcon}
						label={addLabel}
						onClick={onAdd}
					/>
				);

	// Empty rows render their inline "Add" affordance by default — in the default
	// layout that's the only way to populate an empty field. In the compact layout
	// empty fields are surfaced as single-line nav buttons instead, so
	// `hideWhenEmpty` drops the redundant empty row to avoid double-representation.
	if (isEmpty && (hideWhenEmpty || !addLabel)) {
		return null;
	}

	return (
		<div
			className="group/agent-row -mx-2 rounded-md px-2 py-1 transition-colors hover:bg-bg-neutral-subtle-hovered"
			data-agent-field={agentFieldName}
			data-screen-assistant-target={screenAssistantTargetId}
		>
			<div className="flex flex-col gap-y-1 sm:flex-row sm:items-center sm:gap-x-6">
				<div className="sm:w-20 sm:shrink-0">
					<AgentSectionLabel>{label}</AgentSectionLabel>
				</div>
				<div className="flex min-w-0 flex-1 flex-col gap-2">
					<div className="flex min-h-5 min-w-0 flex-1 flex-wrap items-center gap-1.5">
						{items.map((item, index) => {
							// Pair the final chip with the inline "Add" affordance inside a single
							// non-wrapping group so they reflow to the next line together. Without
							// this, a row-filling set of chips pushes "Add" onto its own line and
							// leaves an awkward gap beside the last chip.
							const isLastItem = index === items.length - 1;
							const itemKey = `${label}-${item}-${index}`;
							const itemDisabled = isItemDisabled?.(item, index) ?? false;
							const handleItemClick = onItemClick ? () => onItemClick(item, index) : undefined;
							const handleItemRemove = onRemoveItem ? () => onRemoveItem(index) : undefined;
							const chip = renderItem ? (
								<Fragment key={itemKey}>
									{renderItem({
										item,
										index,
										disabled: itemDisabled,
										onClick: handleItemClick,
										onRemove: handleItemRemove,
									})}
								</Fragment>
							) : (
								<AgentReferenceChip
									category={referenceCategory}
									disabled={itemDisabled}
									elemBefore={itemElemBefore?.(item, index)}
									key={itemKey}
									label={item}
									onClick={handleItemClick}
									onRemove={handleItemRemove}
									tagColor={tagColor}
								/>
							);

							if (isLastItem && addLabel) {
								return (
									// Constant key (not tied to the last item) so adding an item
									// doesn't remount this group — and the add control's stable
									// `row-tail-add` key keeps its menu mounted across adds, which
									// is what lets the Apps/Skills pickers stay open for
									// back-to-back selections. The last chip still updates in place.
									<div
										key={`${label}-add-tail`}
										className="inline-flex max-w-full items-center gap-1.5"
									>
										{chip}
										<Fragment key="row-tail-add">
											{renderAddButton(
												"shrink-0 opacity-0 transition-opacity group-hover/agent-row:opacity-100 group-focus-within/agent-row:opacity-100 focus-visible:opacity-100 aria-expanded:opacity-100",
											)}
										</Fragment>
									</div>
								);
							}

							return chip;
						})}
						{isEmpty && addLabel ? renderAddButton() : null}
					</div>
					{inlinePicker ? (
						<div className="w-full max-w-80">
							{inlinePicker}
						</div>
					) : null}
				</div>
			</div>
		</div>
	);
}

interface AgentTriggerSummaryRowProps {
	items: readonly string[];
	addLabel?: string;
	hideWhenEmpty?: boolean;
	screenAssistantTargetId?: string;
	onEditTriggers?: (seed?: AgentAutomationRule) => void;
	/**
	 * The structured automation rules backing `items`. Required for inline
	 * removal and for opening each rule in the editor because `items` is only
	 * the label projection.
	 */
	automationRules?: readonly AgentAutomationRule[];
	onAutomationRulesChange?: (automationRules: readonly AgentAutomationRule[]) => void;
	/**
	 * The collapsed-nav catalog entry for Triggers. When present, the filled-row
	 * "Edit" control opens the SAME flyout as the collapsed strip (list of
	 * triggers + "Add trigger ›" + "Manage triggers") via
	 * `AgentCompactTriggersNavButton`, keeping the two layouts consistent. Mirrors
	 * how `appsNavItem` / `skillsNavItem` / `subagentsNavItem` back the other
	 * summary rows' inline controls.
	 */
	triggerNavItem?: AgentCompactConfigNavItem;
	onManageTriggers?: () => void;
	/**
	 * Collection-derived Tag color (from the base agent's avatar family, via
	 * `getTagColorForAgentAvatar`). Drives the automation chips' Tag color and the
	 * leading automation icon so a lime (dev-agents) agent shows lime automation
	 * chips — mirroring the subagent chip treatment.
	 */
	tagColor?: TagColor;
}

/**
 * Automations row. Unlike the generic `AgentFilledSummaryRow`, the automation entry
 * launches the automation modal instead of inline editing:
 * - empty → the add affordance opens the modal with no triggers;
 * - non-empty → each chip opens the full automation modal and (when removal is wired)
 *   carries an overlay remove control, matching the other summary rows so a
 *   trigger can be removed inline without opening the modal. The trailing "Edit"
 *   control opens the same collapsed-nav management flyout as the compact strip
 *   (via `AgentCompactTriggersNavButton`) when `triggerNavItem` is supplied.
 */
function AgentTriggerSummaryRow({
	items,
	addLabel,
	hideWhenEmpty = false,
	screenAssistantTargetId,
	onEditTriggers,
	automationRules,
	onAutomationRulesChange,
	triggerNavItem,
	onManageTriggers,
	tagColor,
}: Readonly<AgentTriggerSummaryRowProps>) {
	const isEmpty = items.length === 0;

	const rulesAlignItems =
		automationRules !== undefined && automationRules.length === items.length;
	const canRemoveInline = rulesAlignItems && Boolean(onAutomationRulesChange);
	const handleRemoveAutomation = (index: number) => {
		if (!automationRules) {
			return;
		}
		onAutomationRulesChange?.(automationRules.filter((_, i) => i !== index));
	};

	// Picking a provider event starts a brand-new automation rule seeded only
	// with that event, so previous automations never appear in the new draft.
	const handleSelectEvent = (
		providerId: Parameters<typeof createAgentTriggerValue>[0],
		eventId: string,
	) => {
		const next = createAutomationRuleFromEvent(providerId, eventId, automationRules);
		onEditTriggers?.(next ?? undefined);
	};

	if (isEmpty && (hideWhenEmpty || !addLabel)) {
		return null;
	}

	return (
		<div
			className="group/agent-row -mx-2 flex flex-col gap-y-1 rounded-md px-2 py-1 transition-colors hover:bg-bg-neutral-subtle-hovered sm:flex-row sm:items-center sm:gap-x-6"
			data-agent-field="trigger"
			data-screen-assistant-target={screenAssistantTargetId}
		>
			<div className="sm:w-20 sm:shrink-0">
				<AgentSectionLabel>Flows</AgentSectionLabel>
			</div>
			<div className="flex min-h-5 min-w-0 flex-1 flex-wrap items-center gap-1.5">
				{isEmpty ? (
					<AgentAddValueButton
						icon="add"
						label={addLabel ?? "Add"}
						onClick={() => onEditTriggers?.()}
					/>
				) : (
					<div className="group/trigger-edit flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
						{items.map((item, index) => {
							const rule = rulesAlignItems ? automationRules?.[index] : undefined;
							// Every automation chip leads with the same automation glyph,
							// tinted by the agent's collection color — NOT the first
							// trigger's provider mark. An automation can now own multiple
							// triggers, so a single provider icon would misrepresent it.
							// The chip frame itself stays neutral gray (matching the Apps
							// row); only the leading glyph carries the collection color, so
							// we color the icon explicitly via `tagColorToMenuIconClassName`
							// (the `[&_svg]:…!` override beats the neutral leading-slot
							// color) instead of `text-inherit`, which would now resolve to
							// gray. Falls back to inheriting the neutral chip color when the
							// agent has no collection family. The `IconTile`
							// xxsmall/transparent wrap centers the glyph like the latest Tag
							// standard's other leading icons.
							const automationIcon = (
								<IconTile
									aria-hidden
									className={getAgentCollectionIconClassName(tagColor)}
									icon={<Icon aria-hidden render={<AutomationIcon label="" size="small" />} />}
									label=""
									size="xxsmall"
									variant="transparent"
								/>
							);
							// Clicking any configured automation chip opens that rule's editor;
							// event triggers remain nested inside the automation.
							return (
								<AgentReferenceChip
									key={`trigger-${item}-${index}`}
									elemBefore={automationIcon}
									label={item}
									onClick={
										onEditTriggers
											? () => onEditTriggers(rule)
											: undefined
									}
									onRemove={canRemoveInline ? () => handleRemoveAutomation(index) : undefined}
									tagColor="gray"
								/>
							);
						})}
						{onEditTriggers ? (
							// The trailing "Edit" control opens the SAME management flyout
							// as the collapsed nav strip (automation list + "Add automation ›"
							// + "Manage automations") by reusing `AgentCompactTriggersNavButton`
							// with the edit-styled button as its trigger — mirroring how the
							// Apps/Skills/Subagents rows back their inline controls with the
							// collapsed-nav dropdown so both layouts share one experience.
							triggerNavItem ? (
								<AgentCompactTriggersNavButton
									automationRules={automationRules}
									item={triggerNavItem}
									onEditTriggers={onEditTriggers}
									onManageTriggers={onManageTriggers}
									onSelectEvent={handleSelectEvent}
									renderTrigger={
										<AgentAddValueButton
											className="opacity-0 group-hover/agent-row:opacity-100"
											icon="edit"
											label={addLabel ?? "Edit"}
										/>
									}
									tagColor={tagColor}
									triggers={items}
								/>
							) : (
								<TriggerPicker
									label={addLabel ?? "Edit"}
									onSelectEvent={handleSelectEvent}
									trigger={
										<AgentAddValueButton
											className="opacity-0 group-hover/agent-row:opacity-100"
											icon="edit"
											label={addLabel ?? "Edit"}
										/>
									}
								/>
							)
						) : null}
					</div>
				)}
			</div>
		</div>
	);
}

interface AgentFilledConfigSummaryProps {
	config: AgentConfigFormValue;
	// Drives the subagent chips' Tag color so they match the base agent's custom
	// brand color (derived from the avatar family). When omitted the chips fall
	// back to their category default.
	avatarSrc?: string;
	hiddenConfigFields?: ReadonlySet<AgentHideableConfigField>;
	hideEmptyRows?: boolean;
	// Drops the always-on Memory and Reasoning rows so they can be surfaced as
	// chips instead (used by the hybrid panel where modes live in the chip strip).
	hideModeRows?: boolean;
	knowledgeMode?: KnowledgeModeValue;
	memoryMode: MemoryModeValue;
	onAddListValues?: (field: AgentConfigReferenceListFieldName, values: readonly string[]) => void;
	onAppendListItem?: (field: AgentConfigListFieldName) => void;
	onConnectTrigger?: (trigger: AgentTriggerValue) => void;
	onEditTriggers?: (seed?: AgentAutomationRule) => void;
	onKnowledgeModeChange?: (next: KnowledgeModeValue) => void;
	onListItemChange?: (field: AgentConfigListFieldName, index: number, value: string) => void;
	onManageSubagents?: () => void;
	onManageTriggers?: () => void;
	onMemoryModeChange: (next: MemoryModeValue) => void;
	onOpenDirectory?: (directory: AgentDirectoryKind, selectedItem?: string) => void;
	onReasoningModeChange: (next: ReasoningModeValue) => void;
	onRemoveListItem?: (field: AgentConfigListFieldName, index: number) => void;
	onSelectListItem?: (field: AgentConfigListFieldName, index: number) => void;
	onTextChange?: (field: AgentConfigTextFieldName, value: string) => void;
	onToggleListItem?: (field: AgentConfigListFieldName, index: number, enabled: boolean) => void;
	onAutomationRulesChange?: (automationRules: readonly AgentAutomationRule[]) => void;
	reasoningMode: ReasoningModeValue;
	screenAssistantTargetPrefix?: string;
	selectedListItemIndexByField?: Partial<Record<AgentConfigListFieldName, number>>;
	showAddButtons?: boolean;
}

function AgentFilledConfigSummary({
	config,
	avatarSrc,
	hiddenConfigFields,
	hideEmptyRows = false,
	hideModeRows = false,
	memoryMode,
	onAppendListItem,
	onAddListValues,
	onEditTriggers,
	onManageSubagents,
	onManageTriggers,
	onMemoryModeChange,
	onOpenDirectory,
	onReasoningModeChange,
	onRemoveListItem,
	onSelectListItem,
	onToggleListItem,
	onAutomationRulesChange,
	reasoningMode,
	screenAssistantTargetPrefix,
	selectedListItemIndexByField,
	showAddButtons = true,
}: Readonly<AgentFilledConfigSummaryProps>) {
	const automationRules = getAgentAutomationRules(config);
	const triggerItems = serializeAgentAutomationRuleLabels(automationRules);
	const skillItems = getSkillConfigItems(config.skills);
	const appItems = getNonEmptyConfigItems(config.apps);
	const subagentItems = getNonEmptyConfigItems(config.subagents);
	// Subagent chips inherit the base agent's custom brand color (from its avatar
	// family) so a lime agent shows lime subagent chips, etc.
	const subagentTagColor = getTagColorForAgentAvatar(avatarSrc);
	const starterSummaryItems = getConversationStarterSummaryItems(config).slice(0, MAX_AGENT_CONVERSATION_STARTERS);
	const starterItems = starterSummaryItems.map((item) => item.label);

	// Each summary row's inline "Add" opens the SAME dropdown as the collapsed
	// nav (list + "Add ›" search flyout + "Browse"), so the two layouts share one
	// experience. We reuse the collapsed nav components directly, passing the
	// inline "Add" button as their trigger. Look the catalog items up by field so
	// the dropdowns inherit the same label/icon the collapsed strip uses.
	const navItems = getAgentCompactEmptyConfigNavItems(config);
	const appsNavItem = navItems.find((entry) => entry.agentFieldName === "apps");
	const skillsNavItem = navItems.find((entry) => entry.agentFieldName === "skills");
	const subagentsNavItem = navItems.find((entry) => entry.agentFieldName === "subagents");
	const triggerNavItem = navItems.find((entry) => entry.agentFieldName === "trigger");
	const renderDirectoryAddControl = (
		field: Extract<AgentInlineSearchField, "skills" | "tools">,
		navItem: AgentCompactConfigNavItem | undefined,
		items: readonly string[],
	) =>
		navItem
			? ({ icon, label, className }: { icon?: "add" | "edit"; label: string; className?: string }) => (
					<AgentCompactDirectoryNavButton
						browseLabel={`Browse ${navItem.label.toLowerCase()}`}
						directory={field}
						item={navItem}
						items={items}
						onAddSearchItem={(searchItem) => {
							if (searchItem.disabled) {
								return;
							}
							onAddListValues?.(field, [searchItem.label]);
						}}
						disabledItems={config.disabledItems?.[field]}
						onPickTool={field === "tools" && onOpenDirectory ? (toolId) => onOpenDirectory("tools", toolId) : undefined}
						onBrowse={() => openAgentDirectoryOrAppendListItem(field, field, onOpenDirectory, onAppendListItem)}
						onRemoveItem={onRemoveListItem ? (index) => onRemoveListItem(field, index) : undefined}
						onToggleItem={onToggleListItem ? (index, enabled) => onToggleListItem(field, index, enabled) : undefined}
						onSelectItem={onOpenDirectory ? (value) => onOpenDirectory(field, value) : undefined}
						renderTrigger={<AgentAddValueButton className={className} icon={icon} label={label} />}
					/>
				)
			: undefined;
	// Rows declare their canonical order, whether they currently hold any user
	// content, and whether they are pinned to the absolute bottom. Memory and
	// Reasoning are `alwaysLast` so they sink below every other row (filled or
	// empty), keeping the two always-on system rows grouped at the very bottom.
	// Among the remaining rows, empty ones sort below filled ones (preserving the
	// canonical order within each group) so configured fields stay grouped at the
	// top. Source order IS the canonical display order: Triggers › Knowledge ›
	// Tools › Skills › Subagents › Conversation starters › Memory › Reasoning.
	// `orderedRows` below applies this in the sort, so the array order is the
	// single source of truth. Reorder here, not in the sort.
	const rows: ReadonlyArray<{ key: string; isEmpty: boolean; alwaysLast?: boolean; node: ReactNode }> = [
		{
			key: "trigger",
			isEmpty: triggerItems.length === 0,
			node: (
				<AgentTriggerSummaryRow
					addLabel={getAgentFilledSummaryAddLabel("triggers", triggerItems.length === 0, showAddButtons)}
					hideWhenEmpty={hideEmptyRows}
					items={triggerItems}
					onEditTriggers={onEditTriggers}
					onManageTriggers={onManageTriggers}
					onAutomationRulesChange={onAutomationRulesChange}
					screenAssistantTargetId={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:trigger` : undefined}
					automationRules={automationRules}
					triggerNavItem={triggerNavItem}
					tagColor={subagentTagColor}
				/>
			),
		},
		{
			key: "apps",
			isEmpty: appItems.length === 0,
			node: (
				<AgentFilledSummaryRow
					addLabel={getAgentFilledSummaryAddLabel("apps", appItems.length === 0, showAddButtons)}
					hideWhenEmpty={hideEmptyRows}
					agentFieldName="apps"
					isItemDisabled={(item) => isAgentListItemDisabled(config, "apps", item)}
					items={appItems}
					label="Apps"
					// The inline "Add apps" opens the SAME dropdown (list + "Add apps ›"
					// search flyout + "Browse apps") as the collapsed nav, matching how
					// Skills/Tools back their inline "Add" with the shared dropdown.
					renderAddControl={appsNavItem ? ({ icon, label, className }) => (
						<AgentCompactAppsNavButton
							apps={appItems}
							disabledItems={config.disabledItems?.apps}
							item={appsNavItem}
							onAddSearchItem={(searchItem) => {
								if (searchItem.disabled) {
									return;
								}
								onAddListValues?.("apps", [searchItem.label]);
							}}
							onBrowse={() => openAgentDirectoryOrAppendListItem("apps", "apps", onOpenDirectory, onAppendListItem)}
							onRemoveItem={onRemoveListItem ? (index) => onRemoveListItem("apps", index) : undefined}
							onSelectItem={onOpenDirectory ? (value) => onOpenDirectory("apps", value) : undefined}
							onToggleItem={onToggleListItem ? (index, enabled) => onToggleListItem("apps", index, enabled) : undefined}
							renderTrigger={<AgentAddValueButton className={className} icon={icon} label={label} />}
						/>
					) : undefined}
					// Clicking an app chip opens the apps directory focused on that app.
					onItemClick={onOpenDirectory ? (item) => onOpenDirectory("apps", item) : undefined}
					onRemoveItem={onRemoveListItem ? (index) => onRemoveListItem("apps", index) : undefined}
					referenceCategory="app"
					// App chips are brand-logo tags; without an explicit color they fall back
					// to AgentReferenceChip's "blue" default (a blue chip border). Pin them to
					// neutral gray so the logo carries the brand and the chip frame stays neutral.
					tagColor="gray"
					screenAssistantTargetId={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:apps` : undefined}
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
					isItemDisabled={(item) => isAgentListItemDisabled(config, "skills", item)}
					items={skillItems}
					label="Skills"
					renderAddControl={renderDirectoryAddControl("skills", skillsNavItem, skillItems)}
					// The Skills row renders its configured items as SkillTag chips
					// (slanted, collection-colored slash + icon) instead of the generic
					// reference chip used by every other row.
					renderItem={({ item, disabled, onClick, onRemove }) => {
						const { color, icon } = getSkillTagPropsForLabel(item);
						const skill = getSkillForConfigLabel(item);
						const preview = getRichTextReferencePreview("skill", skill?.name ?? item);
						const skillTag = (
							<SkillTag
								aria-disabled={disabled || undefined}
								className={cn(disabled && "opacity-(--opacity-disabled)")}
								color={color}
								icon={icon}
								onClick={disabled ? undefined : onClick}
								onRemove={onRemove}
								removeButtonLabel={`Remove ${item}`}
								removeVariant="overlay"
							>
								{item}
							</SkillTag>
						);
						// Hovering a skill chip shows its entity card (icon, name,
						// publisher, stats) — mirroring the app/knowledge reference
						// chips — when the label resolves to a directory skill.
						return preview ? (
							<HoverCard>
								<HoverCardTrigger closeDelay={80} delay={120} render={<span className="inline-flex max-w-full" />}>
									{skillTag}
								</HoverCardTrigger>
								<RichTextReferencePreviewContent preview={preview} />
							</HoverCard>
						) : skillTag;
					}}
					// Clicking a skill chip opens the skills directory on that skill's
					// detail/config view (its SKILL.md editor), mirroring the Apps row.
					onItemClick={onOpenDirectory ? (item) => onOpenDirectory("skills", item) : undefined}
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
					isItemDisabled={(item) => isAgentListItemDisabled(config, "subagents", item)}
					items={subagentItems}
					// Mirror the Apps/Flows treatment: the chip frame stays neutral gray
					// (see `tagColor="gray"` below) while only the leading agent glyph
					// carries the collection color, resolved through the shared
					// `getAgentCollectionIconClassName` (the `[&_svg]:…!` override beats the
					// neutral leading-slot color). The glyph always follows the agent
					// collection color, falling back to the neutral gray collection when the
					// agent has no family.
					itemElemBefore={() => (
						<IconTile
							aria-hidden
							className={getAgentCollectionIconClassName(subagentTagColor)}
							icon={<Icon aria-hidden render={<AiAgentIcon label="" size="small" />} />}
							label=""
							size="xxsmall"
							variant="transparent"
						/>
					)}
					label="Subagents"
					renderAddControl={subagentsNavItem ? ({ label, className }) => (
						<AgentCompactSubagentsNavButton
							item={subagentsNavItem}
							onCreateSubagent={() => onAppendListItem?.("subagents")}
							onManageSubagents={onManageSubagents}
							disabledItems={config.disabledItems?.subagents}
							onRemoveSubagent={onRemoveListItem ? (index) => onRemoveListItem("subagents", index) : undefined}
							onSelectSubagent={onSelectListItem ? (index) => onSelectListItem("subagents", index) : undefined}
							onToggleItem={onToggleListItem ? (index, enabled) => onToggleListItem("subagents", index, enabled) : undefined}
							selectedIndex={selectedListItemIndexByField?.subagents}
							subagents={subagentItems}
							tagColor={subagentTagColor}
							renderTrigger={<AgentAddValueButton className={className} icon="add" label={label} />}
						/>
					) : undefined}
					// Clicking a subagent chip opens that subagent (same select path as
					// the collapsed-nav menu's onSelectSubagent), rather than a directory.
					onItemClick={onSelectListItem ? (_item, index) => onSelectListItem("subagents", index) : undefined}
					onRemoveItem={onRemoveListItem ? (index) => onRemoveListItem("subagents", index) : undefined}
					referenceCategory="subagent"
					screenAssistantTargetId={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:subagents` : undefined}
					tagColor="gray"
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
						// Match the latest Tag standard: normalize the leading glyph to a
						// centered 16px slot via the `IconTile` xxsmall/transparent
						// treatment instead of dropping a raw left-aligned icon in.
						return (
							<IconTile
								aria-hidden
								icon={<Icon aria-hidden render={<StarterIcon label="" size="small" color="currentColor" />} className="text-icon-subtle" />}
								label=""
								size="xxsmall"
								variant="transparent"
							/>
						);
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
		{
			key: "memory",
			// Memory is a default, always-on knowledge source, so this row is never
			// empty. It is `alwaysLast` so it pins to the bottom (above Reasoning)
			// regardless of how many other rows are empty.
			isEmpty: false,
			alwaysLast: true,
			node: (
				<AgentMemoryRow
					onManage={() => onOpenDirectory?.("memory")}
					onValueChange={onMemoryModeChange}
					screenAssistantTargetId={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:memory` : undefined}
					value={memoryMode}
				/>
			),
		},
		{
			key: "reasoning",
			// Reasoning is always a single selected mode, so this row is never empty.
			// It is `alwaysLast` and declared last, so it sits at the very bottom of
			// the list regardless of how many other rows are empty.
			isEmpty: false,
			alwaysLast: true,
			node: (
				<AgentReasoningRow
					onValueChange={onReasoningModeChange}
					screenAssistantTargetId={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:reasoning` : undefined}
					value={reasoningMode}
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
		// In the hybrid panel, Memory and Reasoning live in the chip strip, not as rows.
		.filter((row) => !hideModeRows || (row.key !== "memory" && row.key !== "reasoning"))
		.map((row, index) => ({ ...row, index }))
		.sort((a, b) => {
			// `alwaysLast` rows (Memory, Reasoning) sink below every other row,
			// filled or empty, so they stay pinned to the very bottom of the list.
			if (a.alwaysLast !== b.alwaysLast) return a.alwaysLast ? 1 : -1;
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
		getAgentAutomationItems(config).length > 0 ||
		getSkillConfigItems(config.skills).length > 0 ||
		getNonEmptyConfigItems(config.tools).length > 0 ||
		getNonEmptyConfigItems(config.subagents).length > 0 ||
		getNonEmptyConfigItems(config.knowledge).length > 0 ||
		getNonEmptyConfigItems(config.conversationStarters).length > 0
	);
}

function AgentProfileAvatarGraphic({
	avatarSrc,
	isAtlassianAvatar,
}: Readonly<{
	avatarSrc: string;
	isAtlassianAvatar: boolean;
}>) {
	return isAtlassianAvatar ? (
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
	);
}

function AgentProfileAvatarHexStroke() {
	return (
		<svg
			aria-hidden="true"
			className="pointer-events-none absolute top-0 left-0 size-auto h-12 w-[42px] overflow-visible"
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
	);
}

function AgentAvatarOptionPreview({ src }: Readonly<{ src: string }>) {
	return (
		<span className="relative block h-10 w-[35px]">
			<Image
				alt=""
				aria-hidden
				className="h-10 w-[35px] object-contain"
				height={40}
				src={src}
				width={35}
			/>
		</span>
	);
}

/**
 * Stable screen-assistant target id for one avatar swatch, so the cursor can
 * point at or click a specific option. Mirrors the trigger id
 * (`<prefix>:avatar`) with the group id and the option's file slug appended.
 */
function getAgentAvatarOptionTargetId(prefix: string, groupId: string, src: string): string {
	const optionId = src.split("/").pop()?.replace(/\.svg$/, "") ?? src;
	return `${prefix}:avatar:${groupId}:${optionId}`;
}

function AgentAvatarPickerMenu({
	avatarSrc,
	isAtlassianAvatar,
	onAvatarChange,
	screenAssistantTargetPrefix,
}: Readonly<{
	avatarSrc: string;
	isAtlassianAvatar: boolean;
	onAvatarChange: (avatarSrc: string) => void;
	screenAssistantTargetPrefix?: string;
}>) {
	const [open, setOpen] = useState(false);
	const selectedAvatarSrc = AGENT_AVATAR_OPTION_SRC_SET.has(avatarSrc) ? avatarSrc : "";

	return (
		<DropdownMenu open={open} onOpenChange={setOpen}>
			<DropdownMenuTrigger
				aria-label="Change agent avatar"
				data-agent-field="avatar"
				data-screen-assistant-target={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:avatar` : undefined}
				render={(
					<Button
						className="group/avatar-picker relative h-12 w-[42px] overflow-visible rounded-xl border-0 bg-transparent p-0 hover:bg-transparent active:bg-transparent aria-expanded:border-transparent aria-expanded:bg-transparent aria-expanded:text-text-subtle focus-visible:ring-3 focus-visible:ring-ring/50"
						size="icon"
						type="button"
						variant="ghost"
					/>
				)}
			>
				<AgentProfileAvatarGraphic avatarSrc={avatarSrc} isAtlassianAvatar={isAtlassianAvatar} />
				{!open ? (
					<span
						aria-hidden
						className="pointer-events-none absolute top-0 left-0 flex h-12 w-[42px] items-center justify-center bg-blanket/80 text-icon-inverse opacity-0 transition-opacity [clip-path:polygon(50%_0%,100%_25%,100%_75%,50%_100%,0%_75%,0%_25%)] group-hover/avatar-picker:opacity-100 group-focus-visible/avatar-picker:opacity-100 [&_svg]:size-4"
						data-agent-avatar-edit-cue
					>
						<EditIcon label="" size="small" />
					</span>
				) : null}
				<AgentProfileAvatarHexStroke />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="w-[348px] p-2" sideOffset={8}>
				<DropdownMenuRadioGroup
					value={selectedAvatarSrc}
					onValueChange={(nextAvatarSrc) => {
						onAvatarChange(nextAvatarSrc);
						setOpen(false);
					}}
				>
					{AGENT_AVATAR_OPTION_GROUPS.map((group) => (
						<Fragment key={group.id}>
							<div className="px-1 pt-2 pb-1 text-xs leading-4 font-semibold text-text-subtlest">{group.label}</div>
							<div className="grid grid-cols-7 gap-1 px-1 pb-1">
								{group.options.map((option) => (
									<DropdownMenuRadioItem
										aria-label={`Use ${option.label} avatar`}
										className="group/avatar-option h-12 min-h-0 w-11 justify-center rounded-lg bg-transparent p-1! pr-1! pl-1! data-[highlighted]:bg-bg-neutral-subtle-hovered data-[highlighted]:text-text active:bg-bg-neutral-subtle-pressed data-checked:bg-bg-selected data-checked:text-text-selected data-checked:data-[highlighted]:bg-bg-selected-hovered data-checked:data-[highlighted]:text-text-selected data-checked:active:bg-bg-selected-pressed [&_[data-slot=dropdown-menu-radio-item-indicator]]:hidden"
										key={option.src}
										title={option.label}
										data-screen-assistant-target={screenAssistantTargetPrefix ? getAgentAvatarOptionTargetId(screenAssistantTargetPrefix, group.id, option.src) : undefined}
										value={option.src}
									>
										<AgentAvatarOptionPreview
											src={option.src}
										/>
									</DropdownMenuRadioItem>
								))}
							</div>
						</Fragment>
					))}
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

// The large decorative avatar that bleeds across the banner uses the
// container-less ("unmasked") illustration so it floats on the cover without its
// own lime hexagon tile. These assets mirror the masked set one-for-one under
// /avatar-agent-unmasked/. The small profile avatar below keeps its hexagon.
function getUnmaskedAvatarSrc(avatarSrc: string): string {
	return avatarSrc.startsWith("/avatar-agent/")
		? avatarSrc.replace("/avatar-agent/", "/avatar-agent-unmasked/")
		: avatarSrc;
}

function AgentProfileCover({
	avatarSrc = AGENT_AVATAR_SRC,
	onAvatarChange,
	bannerSrc,
	screenAssistantTargetPrefix,
}: Readonly<{
	avatarSrc?: string;
	onAvatarChange?: (avatarSrc: string) => void;
	// Cover-banner artwork from `/smart-folders`, picked deterministically per
	// agent so every cover shows a varied design + color (see
	// getDeterministicAgentBannerSrc). The solid color below shows only until the
	// artwork paints.
	bannerSrc: string;
	screenAssistantTargetPrefix?: string;
}>) {
	const coverBackgroundColor = getAgentProfileCoverBackgroundColor(avatarSrc);
	const isAtlassianAvatar = isAtlassianLogoSource(avatarSrc);

	return (
		<div className="relative overflow-hidden rounded-t-xl bg-surface text-text">
			<div
				className="relative h-20 overflow-hidden bg-cover bg-center"
				style={{
					backgroundColor: coverBackgroundColor,
					backgroundImage: `url("${bannerSrc}")`,
				}}
			>
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
						src={getUnmaskedAvatarSrc(avatarSrc)}
						width={168}
					/>
				)}
			</div>
			<div aria-hidden className="h-6" />
			{/* Avatar straddles the banner's bottom edge: top = bannerHeight − 24px
			    (half the 48px avatar). The 80px banner puts it at top-14, and the
			    24px overhang below the banner keeps the h-6 spacer above correct. */}
			<div className="absolute top-14 left-4 size-12">
				{onAvatarChange ? (
					<AgentAvatarPickerMenu
						avatarSrc={avatarSrc}
						isAtlassianAvatar={isAtlassianAvatar}
						onAvatarChange={onAvatarChange}
						screenAssistantTargetPrefix={screenAssistantTargetPrefix}
					/>
				) : (
					<>
						<AgentProfileAvatarGraphic avatarSrc={avatarSrc} isAtlassianAvatar={isAtlassianAvatar} />
						<AgentProfileAvatarHexStroke />
					</>
				)}
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

function getReasoningSectionTitle(value: ReasoningModeValue): string {
	return findReasoningModeOption(value)?.section ?? REASONING_MODE_SECTIONS[0].title;
}

// "Quick answer | Think deeper" tabs pinned to the bottom of the nav-button
// popup, mirroring the Knowledge menu's "All | Custom | None" tabs
// (`AgentKnowledgeModeTabs`). Unlike Knowledge — where a tab IS the mode — a
// reasoning section holds several options. Switching tabs only changes which
// section's options are *browsed*; it never commits a model. A new model is
// selected only when the user clicks an option row.
function AgentReasoningModeTabs({
	browsedSection,
	onBrowseSection,
}: Readonly<{
	browsedSection: string;
	onBrowseSection: (next: string) => void;
}>) {
	return (
		<Tabs
			// Base UI Tabs `value` must match a Tab `value`; the tab IS the section
			// title here. Picking a tab only previews that section's options.
			value={browsedSection}
			onValueChange={(next) => {
				if (REASONING_MODE_SECTIONS.some((entry) => entry.title === next)) {
					onBrowseSection(next);
				}
			}}
		>
			<TabsList className="w-full">
				{REASONING_MODE_SECTIONS.map((section) => (
					<TabsTrigger key={section.title} value={section.title}>
						{section.title}
					</TabsTrigger>
				))}
			</TabsList>
		</Tabs>
	);
}

// Nav-button reasoning popup: a flex column matching the Knowledge nav menu.
// The browsed section's options scroll in the body, a separator sits between
// the list and the tabs, and the "Quick answer | Think deeper" tab control (the
// section) is pinned at the bottom. The browsed section is local state so the
// user can flip tabs to browse without changing their committed model; it
// re-syncs to the committed value's section whenever that value changes.
function AgentReasoningNavMenuContent({
	value,
	onValueChange,
}: Readonly<{
	value: ReasoningModeValue;
	onValueChange: (next: ReasoningModeValue) => void;
}>) {
	const committedSection = getReasoningSectionTitle(value);
	const [browsedSection, setBrowsedSection] = useState(committedSection);
	// Re-anchor browsing to the committed value's section when it changes (e.g.
	// the menu reopens after a selection or an external update).
	const [lastCommittedSection, setLastCommittedSection] = useState(committedSection);
	if (committedSection !== lastCommittedSection) {
		setLastCommittedSection(committedSection);
		setBrowsedSection(committedSection);
	}
	const activeSection =
		REASONING_MODE_SECTIONS.find((section) => section.title === browsedSection) ??
		REASONING_MODE_SECTIONS[0];
	return (
		<MenubarContent align="start" className={cn("w-64", AGENT_COMPACT_NAV_MENU_FLEX_CONTENT_CLASS)}>
			<div className="shrink-0">
				<div className="pb-1">
					<AgentReasoningModeTabs browsedSection={browsedSection} onBrowseSection={setBrowsedSection} />
				</div>
				<DropdownMenuSeparator />
			</div>
			<div className="min-h-0 flex-1 overflow-y-auto">
				<AgentCompactNavMenuList>
					<DropdownMenuGroup className="p-0">
						{activeSection.options.map((option) => (
							<DropdownMenuItem
								key={option.value}
								onClick={() => onValueChange(option.value as ReasoningModeValue)}
								selected={value === option.value}
							>
								{option.label}
							</DropdownMenuItem>
						))}
					</DropdownMenuGroup>
				</AgentCompactNavMenuList>
			</div>
		</MenubarContent>
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
				<AgentReasoningNavMenuContent value={value} onValueChange={onValueChange} />
			</MenubarMenu>
		);
	}

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger
					render={<LozengeDropdownTrigger aria-label="Reasoning mode" icon={<Icon aria-hidden render={<AiComputeIcon label="" size="small" />} className="text-icon-subtle" />} />}
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
			className="group/agent-row -mx-2 flex flex-col gap-y-1 rounded-md px-2 py-1 transition-colors hover:bg-bg-neutral-subtle-hovered sm:flex-row sm:items-center sm:gap-x-6"
			data-agent-field="reasoning"
			data-screen-assistant-target={screenAssistantTargetId}
		>
			<div className="sm:w-20 sm:shrink-0">
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

type KnowledgeModeValue = "all" | "custom" | "none";

const MEMORY_MODE_OPTIONS = [
	{ value: "on", label: "On" },
	{ value: "off", label: "Off" },
] as const;

type MemoryModeValue = (typeof MEMORY_MODE_OPTIONS)[number]["value"];

// "On | Off" tabs pinned to the bottom of the popup, mirroring the Knowledge
// menu's "All | Custom | None" tabs (`AgentKnowledgeModeTabs`). The tabs ARE the
// memory mode: picking a tab calls `onValueChange` directly.
function AgentMemoryModeTabs({
	value,
	onValueChange,
}: Readonly<{
	value: MemoryModeValue;
	onValueChange: (next: MemoryModeValue) => void;
}>) {
	return (
		<Tabs
			// Base UI Tabs `value` must match a Tab `value`; map mode → tab 1:1.
			value={value}
			onValueChange={(next) => onValueChange(next as MemoryModeValue)}
		>
			<TabsList className="w-full">
				{MEMORY_MODE_OPTIONS.map((option) => (
					<TabsTrigger key={option.value} value={option.value}>
						{option.label}
					</TabsTrigger>
				))}
			</TabsList>
		</Tabs>
	);
}

// Nav-button memory popup: a flex column matching the Knowledge nav menu —
// "Manage memory" on top, then a separator, then the "On | Off" tab control
// (the mode) pinned at the bottom.
function AgentMemoryNavMenuContent({
	value,
	onValueChange,
	onManage,
}: Readonly<{
	value: MemoryModeValue;
	onValueChange: (next: MemoryModeValue) => void;
	onManage?: () => void;
}>) {
	return (
		<MenubarContent align="start" className={cn("w-64", AGENT_COMPACT_NAV_MENU_FLEX_CONTENT_CLASS)}>
			<div className="shrink-0">
				<div className="pb-1">
					<AgentMemoryModeTabs value={value} onValueChange={onValueChange} />
				</div>
				<DropdownMenuSeparator />
			</div>
			<div className="min-h-0 flex-1 overflow-y-auto">
				<DropdownMenuItem
					elemBefore={
						<span className="inline-flex size-6 shrink-0 items-center justify-center [&_svg]:size-4">
							<AiModelIcon label="" />
						</span>
					}
					onClick={onManage}
				>
					Manage memory
				</DropdownMenuItem>
			</div>
		</MenubarContent>
	);
}

function AgentMemorySelectorMenu({
	value,
	onValueChange,
	onManage,
}: Readonly<{
	value: MemoryModeValue;
	onValueChange: (next: MemoryModeValue) => void;
	onManage?: () => void;
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
				<DropdownMenuItem
					elemBefore={
						<span className="inline-flex size-6 shrink-0 items-center justify-center [&_svg]:size-4">
							<AiModelIcon label="" />
						</span>
					}
					onClick={onManage}
				>
					Manage memory
				</DropdownMenuItem>
			</DropdownMenuGroup>
		</DropdownMenuContent>
	);
}

interface AgentMemorySelectorProps {
	value: MemoryModeValue;
	onValueChange: (next: MemoryModeValue) => void;
	onManage?: () => void;
	render: "nav-button" | "row";
	screenAssistantTargetId?: string;
}

function AgentMemorySelector({
	value,
	onValueChange,
	onManage,
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
				<AgentMemoryNavMenuContent value={value} onValueChange={onValueChange} onManage={onManage} />
			</MenubarMenu>
		);
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={(
					<LozengeDropdownTrigger
						aria-label="Memory mode"
						icon={<Icon aria-hidden render={<AiModelIcon label="" size="small" />} className="text-icon-subtle" />}
					/>
				)}
			>
				{`Memory ${selectedOption.label.toLowerCase()}`}
			</DropdownMenuTrigger>
			<AgentMemorySelectorMenu value={value} onValueChange={onValueChange} onManage={onManage} />
		</DropdownMenu>
	);
}

interface AgentMemoryRowProps {
	value: MemoryModeValue;
	onValueChange: (next: MemoryModeValue) => void;
	onManage?: () => void;
	screenAssistantTargetId?: string;
}

function AgentMemoryRow({
	value,
	onValueChange,
	onManage,
	screenAssistantTargetId,
}: Readonly<AgentMemoryRowProps>) {
	return (
		<div
			className="group/agent-row -mx-2 flex flex-col gap-y-1 rounded-md px-2 py-1 transition-colors hover:bg-bg-neutral-subtle-hovered sm:flex-row sm:items-center sm:gap-x-6"
			data-agent-field="memory"
			data-screen-assistant-target={screenAssistantTargetId}
		>
			<div className="sm:w-20 sm:shrink-0">
				<AgentSectionLabel>Memory</AgentSectionLabel>
			</div>
			<div className="flex min-h-5 min-w-0 flex-1 flex-wrap items-center gap-1.5">
				<AgentMemorySelector render="row" value={value} onValueChange={onValueChange} onManage={onManage} />
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
	onOpenDirectory,
	onRemoveReferenceValue,
	onStartWithTemplate,
	onViewModeChange,
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
	onOpenDirectory?: (directory: AgentDirectoryKind, selectedItem?: string) => void;
	onRemoveReferenceValue?: (field: AgentConfigReferenceListFieldName, value: string) => void;
	onStartWithTemplate?: () => void;
	onViewModeChange?: (mode: EditorToolbarViewMode) => void;
	screenAssistantTargetId?: string;
	showSectionLabel?: boolean;
	toolbarBelowSlot?: ReactNode;
}>) {
	const [knowledge, setKnowledge] = useState<RichTextMentionItem[]>([]);
	const [templatesOpen, setTemplatesOpen] = useState(false);
	const inlineManagedReferenceKeysRef = useLazyRef(() => new Set<string>());
	const mentionInventoryCountsRef = useLazyRef(() => new Map<string, {
		count: number;
		field: AgentConfigReferenceListFieldName;
		label: string;
	}>());
	const mentionSources = useMemo<RichTextMentionSources>(() => ({
		// Subagents are NESTED agents owned by THIS agent — not globally
		// at-mentionable top-level agents. So the `@subagent` list comes ONLY from
		// this agent's own subagents (empty/0 until it generates some); the global
		// parent-agent palette is intentionally NOT merged in here.
		// Prompt references deliberately carry no directory visual/avatar: subagents
		// are prompt copies under the parent agent, not nested parent-agent profiles.
		subagent: mapSubagentConfigValuesToMentionItems(config.subagents),
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
	// "Browse all" in a nested "/" category's empty state opens that category's
	// directory. Map the slash category to the config-panel directory kind; the
	// renderer only fires this for directory-backed categories (not "format").
	const handleOpenDirectory = useCallback((category: RichTextSlashCategory): void => {
		if (category === "format") {
			return;
		}
		onOpenDirectory?.(AGENT_DIRECTORY_BY_SLASH_CATEGORY[category]);
	}, [onOpenDirectory]);
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
				className="space-y-0"
				contentClassName={contentClassName}
				editorClassName={cn("agent-instructions-tiptap-editor text-text", editorClassName)}
				enableDirectoryAutocomplete
				placeholder="Press / to help me create the agent, or start with a template"
				placeholderSlot={(
					<p className="tiptap-editor text-sm leading-[1.55] text-text-subtlest">
						Press <code>/</code> to help me create the agent, or{" "}
						<button
							type="button"
							className="pointer-events-auto cursor-pointer rounded-sm text-link no-underline underline-offset-2 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
							onClick={() => {
								// Choosing a template means the user is already mindful of
								// templates — animate the onboarding tiles away.
								if (onStartWithTemplate) {
									// A host (e.g. the Studio shell) owns the agents
									// directory and takes over: don't also open the local
									// templates dialog.
									onStartWithTemplate();
									return;
								}
								setTemplatesOpen(true);
							}}
						>
							start with a template
						</button>
					</p>
				)}
				onInsertReferenceOption={handleInsertReferenceOption}
				onOpenDirectory={handleOpenDirectory}
				onViewModeChange={onViewModeChange}
				suggestionVariant={AGENT_INSTRUCTIONS_SUGGESTION_VARIANT}
				toolbarBelowSlot={toolbarBelowSlot}
				toolbarReveal="hover"
				padStuckToolbar
				value={instructions}
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
	onAvatarChange?: (avatarSrc: string) => void;
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
	onAvatarChange,
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
			<AgentProfileCover
				avatarSrc={avatarSrc}
				onAvatarChange={onAvatarChange}
				bannerSrc={getDeterministicAgentBannerSrc(avatarSrc, config.agentId ?? avatarSrc)}
				screenAssistantTargetPrefix={screenAssistantTargetPrefix}
			/>
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
							<Button
								type="button"
								aria-label="Back to parent agent"
								data-agent-field="back-to-parent"
								className="-ml-2 text-icon-subtle"
								onClick={onSelectBaseAgent}
								size="icon"
								variant="ghost"
							>
								<ArrowLeftIcon label="" color="currentColor" />
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

interface AgentCompactConfigPanelProps {
	config: AgentConfigFormValue;
	// Forwarded to the expanded summary so subagent chips can match the agent's
	// custom brand color (derived from the avatar family).
	avatarSrc?: string;
	hiddenConfigFields?: ReadonlySet<AgentHideableConfigField>;
	onAddListValues?: (field: AgentConfigReferenceListFieldName, values: readonly string[]) => void;
	onAppendListItem?: (field: AgentConfigListFieldName) => void;
	onConnectTrigger?: (trigger: AgentTriggerValue) => void;
	onEditTriggers?: (seed?: AgentAutomationRule) => void;
	onManageTriggers?: () => void;
	onListItemChange?: (field: AgentConfigListFieldName, index: number, value: string) => void;
	onManageSubagents?: () => void;
	onOpenDirectory?: (directory: AgentDirectoryKind, selectedItem?: string) => void;
	onRemoveListItem?: (field: AgentConfigListFieldName, index: number) => void;
	onSelectListItem?: (field: AgentConfigListFieldName, index: number) => void;
	onTextChange?: (field: AgentConfigTextFieldName, value: string) => void;
	onToggleListItem?: (field: AgentConfigListFieldName, index: number, enabled: boolean) => void;
	onAutomationRulesChange?: (automationRules: readonly AgentAutomationRule[]) => void;
	screenAssistantTargetPrefix?: string;
	selectedListItemIndexByField?: Partial<Record<AgentConfigListFieldName, number>>;
}

function AgentCompactConfigPanel({
	config,
	avatarSrc,
	hiddenConfigFields,
	onAddListValues,
	onAppendListItem,
	onConnectTrigger,
	onEditTriggers,
	onManageTriggers,
	onListItemChange,
	onManageSubagents,
	onOpenDirectory,
	onRemoveListItem,
	onSelectListItem,
	onTextChange,
	onToggleListItem,
	onAutomationRulesChange,
	screenAssistantTargetPrefix,
	selectedListItemIndexByField,
}: Readonly<AgentCompactConfigPanelProps>) {
	// Mode selectors are controlled from the persisted config when present (so a
	// generated or published agent shows its saved modes) and fall back to local
	// state otherwise (standalone demo, or before the first edit). Changes persist
	// through onTextChange — the same draft→publish channel as the text fields —
	// and also update the local fallback so the chip strip reflects the selection.
	const [reasoningFallback, setReasoningFallback] = useState<ReasoningModeValue | null>(null);
	const [knowledgeFallback, setKnowledgeFallback] = useState<KnowledgeModeValue | null>(null);
	const [memoryFallback, setMemoryFallback] = useState<MemoryModeValue | null>(null);
	const reasoningValue =
		(config.reasoningMode as ReasoningModeValue | undefined) ?? reasoningFallback ?? "quick-auto";
	const knowledgeMode =
		(config.knowledgeMode as KnowledgeModeValue | undefined)
		?? knowledgeFallback
		?? (getNonEmptyConfigItems(config.knowledge).length > 0 ? "custom" : "all");
	const memoryMode = (config.memoryMode as MemoryModeValue | undefined) ?? memoryFallback ?? "on";
	const setReasoningValue = useCallback(
		(next: ReasoningModeValue) => {
			setReasoningFallback(next);
			onTextChange?.("reasoningMode", next);
		},
		[onTextChange],
	);
	const setKnowledgeMode = useCallback(
		(next: KnowledgeModeValue) => {
			setKnowledgeFallback(next);
			onTextChange?.("knowledgeMode", next);
		},
		[onTextChange],
	);
	const setMemoryMode = useCallback(
		(next: MemoryModeValue) => {
			setMemoryFallback(next);
			onTextChange?.("memoryMode", next);
		},
		[onTextChange],
	);

	// A list-type is "promoted" to a summary row once it holds at least one item
	// (and isn't suppressed via hiddenConfigFields). Promoted types are hidden from
	// the chip strip below; every other type — plus the always-on Memory and
	// Reasoning selectors and Conversation starters — stays a chip.
	const promotedFields = new Set<string>();
	if (getAgentAutomationItems(config).length > 0 && !hiddenConfigFields?.has("trigger")) {
		promotedFields.add("trigger");
	}
	if (getNonEmptyConfigItems(config.apps).length > 0) {
		promotedFields.add("apps");
	}
	if (getSkillConfigItems(config.skills).length > 0) {
		promotedFields.add("skills");
	}
	if (getNonEmptyConfigItems(config.subagents).length > 0 && !hiddenConfigFields?.has("subagents")) {
		promotedFields.add("subagents");
	}
	const hasRows = promotedFields.size > 0;
	// Conversation starters always lives in the chip strip (never a summary row),
	// so suppress its row in the summary while leaving it visible in the chips.
	const summaryHiddenConfigFields = new Set<AgentHideableConfigField>(hiddenConfigFields);
	summaryHiddenConfigFields.add("conversationStarters");

	// The secondary selector strip (divider + nav) is revealed on hover/focus so the
	// resting card shows only the configured summary rows. We only gate it when there
	// are summary rows to anchor the card — with no promoted rows the strip is the
	// card's sole content, so it must stay visible. Pointer drives hover; focus-within
	// (onFocusCapture/onBlurCapture) keeps the controls keyboard-reachable while hidden.
	const reduceMotion = useReducedMotion();
	const [stripHovered, setStripHovered] = useState(false);
	const [stripFocused, setStripFocused] = useState(false);
	// Touch devices have no persistent hover, so a hover-gated strip would strand the
	// secondary controls with no tappable entry point. Keep it visible when the device
	// lacks hover capability. Defaults to true (desktop) for SSR; corrected on mount.
	const [canHover, setCanHover] = useState(true);
	useEffect(() => {
		const mql = window.matchMedia("(hover: hover)");
		const onChange = () => setCanHover(mql.matches);
		onChange();
		mql.addEventListener("change", onChange);
		return () => mql.removeEventListener("change", onChange);
	}, []);
	// A menu opened from a strip control (e.g. the Memory/Reasoning dropdowns)
	// renders its popup in a portal *outside* this card, so moving the pointer
	// toward it fires `onPointerLeave` and collapses the strip out from under the
	// open menu. While any menu is open its trigger button — which stays inside
	// the card — carries `aria-expanded="true"`, so we observe that attribute on
	// the card subtree and latch the strip open until the menu closes. This spans
	// both the summary-row edit menus and the chip-strip menus without threading
	// an open-state callback through every nav button.
	const cardRef = useRef<HTMLDivElement | null>(null);
	const [stripMenuOpen, setStripMenuOpen] = useState(false);
	useEffect(() => {
		const card = cardRef.current;
		if (!card) {
			return;
		}
		const update = () => setStripMenuOpen(card.querySelector('[aria-expanded="true"]') !== null);
		const observer = new MutationObserver(update);
		observer.observe(card, { subtree: true, attributes: true, attributeFilter: ["aria-expanded"] });
		update();
		return () => observer.disconnect();
	}, []);
	const stripRevealed = !hasRows || !canHover || stripHovered || stripFocused || stripMenuOpen;

	return (
		<div
			ref={cardRef}
			className={cn(
				"mb-2 flex flex-col rounded-2xl border border-border px-4 pt-2",
				stripRevealed ? "pb-2" : "pb-0",
			)}
			onPointerEnter={() => setStripHovered(true)}
			onPointerLeave={() => setStripHovered(false)}
			onFocusCapture={(event) => {
				// Only keyboard focus should latch the strip open (its sole purpose is
				// keeping the hidden controls Tab-reachable). A mouse *click* on a strip
				// control also focuses it; without the `:focus-visible` gate that focus
				// would keep `stripFocused` true after the pointer leaves, stranding the
				// card in its expanded state until the next click elsewhere.
				const target = event.target;
				if (target instanceof Element && target.matches(":focus-visible")) {
					setStripFocused(true);
				}
			}}
			onBlurCapture={(event) => {
				if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
					setStripFocused(false);
				}
			}}
		>
			{hasRows ? (
				<AgentFilledConfigSummary
					config={config}
					avatarSrc={avatarSrc}
					hiddenConfigFields={summaryHiddenConfigFields}
					hideEmptyRows
					hideModeRows
					knowledgeMode={knowledgeMode}
					onKnowledgeModeChange={setKnowledgeMode}
					memoryMode={memoryMode}
					onMemoryModeChange={setMemoryMode}
					onAddListValues={onAddListValues}
					onAppendListItem={onAppendListItem}
					onConnectTrigger={onConnectTrigger}
					onEditTriggers={onEditTriggers}
					onListItemChange={onListItemChange}
					onManageSubagents={onManageSubagents}
					onManageTriggers={onManageTriggers}
					onOpenDirectory={onOpenDirectory}
					onReasoningModeChange={setReasoningValue}
					onRemoveListItem={onRemoveListItem}
					onSelectListItem={onSelectListItem}
					onTextChange={onTextChange}
					onToggleListItem={onToggleListItem}
					onAutomationRulesChange={onAutomationRulesChange}
					reasoningMode={reasoningValue}
					screenAssistantTargetPrefix={screenAssistantTargetPrefix}
					selectedListItemIndexByField={selectedListItemIndexByField}
				/>
			) : null}
			<motion.div
				// Reveal-on-hover collapsible: animate height 0 → auto + fade so the card
				// grows to surface the secondary selectors (matches the Figma two-state
				// spec). Kept mounted (not unmounted) so the controls stay in tab order;
				// `pt-2`/divider live inside the animated region so the parent doesn't keep
				// a residual gap while collapsed (flex `gap` wouldn't transition away).
				initial={false}
				animate={{ height: stripRevealed ? "auto" : 0, opacity: stripRevealed ? 1 : 0 }}
				transition={reduceMotion ? { duration: 0 } : { duration: 0.2, ease: [0.4, 1, 0.6, 1] }}
				// `overflow: hidden` drives the height-collapse animation, but it clips
				// BOTH axes — and `overflow-x: visible` can't pair with `overflow-y:
				// hidden` (it computes to `auto`, which still clips). The strip inside
				// uses `-ml-4` to left-align its first item's text with the summary-row
				// labels, so without room that first button's rounded/hover/focus-ring
				// edge gets sheared here. `-mx-4 px-4` pushes this clip box out to the
				// card's padding edge while keeping the content in place, so the bleed
				// has room. Card padding is `px-4`, so this nets to the card border.
				style={{ overflow: "hidden", willChange: "opacity" }}
				className={hasRows ? "-mx-4 flex flex-col gap-2 px-4 pt-2" : "-mx-4 flex flex-col gap-2 px-4"}
			>
				{hasRows ? <div aria-hidden className="h-px bg-border" /> : null}
				<AgentCompactEmptyConfigNav
					avatarSrc={avatarSrc}
					config={config}
					hiddenConfigFields={hiddenConfigFields}
					hiddenFieldNames={promotedFields}
					onAddListValues={onAddListValues}
					onAppendListItem={onAppendListItem}
					onEditTriggers={onEditTriggers}
					onManageTriggers={onManageTriggers}
					onListItemChange={onListItemChange}
					onManageSubagents={onManageSubagents}
					onOpenDirectory={onOpenDirectory}
					onRemoveListItem={onRemoveListItem}
					onSelectListItem={onSelectListItem}
					onToggleListItem={onToggleListItem}
					onAutomationRulesChange={onAutomationRulesChange}
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
	onInstructionsViewModeChange?: (mode: EditorToolbarViewMode) => void;
	onManageSubagents?: () => void;
	onProfileTextChange?: (field: AgentConfigTextFieldName, value: string) => void;
	onProfileAvatarChange?: (avatarSrc: string) => void;
	onTextChange?: (field: AgentConfigTextFieldName, value: string) => void;
	onListItemChange?: (field: AgentConfigListFieldName, index: number, value: string) => void;
	onRemoveListItem?: (field: AgentConfigListFieldName, index: number) => void;
	onSelectListItem?: (field: AgentConfigListFieldName, index: number) => void;
	// Toggle a configured list item's enabled state. Owners that persist the
	// config (e.g. the studio draft in localStorage) should apply
	// `toggleAgentConfigDisabledItem` to their stored value so the disabled state
	// survives a refresh. Omitting this prop hides the enable/disable switches.
	onToggleListItem?: (field: AgentConfigListFieldName, index: number, enabled: boolean) => void;
	onAddListValues?: (field: AgentConfigReferenceListFieldName, values: readonly string[]) => void;
	onAppendListItem?: (field: AgentConfigListFieldName) => void;
	onConnectTrigger?: (trigger: AgentTriggerValue) => void;
	onManageTriggers?: () => void;
	/**
	 * Registers an imperative opener for this config's automation dialog so a
	 * sibling surface (e.g. the Ask Rovo sidebar's agent-edit-summary card) can
	 * jump straight to the trigger/flow dialog. Called with the opener on mount
	 * and `null` on unmount. The dialog state stays encapsulated here.
	 */
	registerAutomationDialogOpener?: (opener: (() => void) | null) => void;
	onOpenDirectory?: (directory: AgentDirectoryKind, selectedItem?: string) => void;
	// When provided, the empty-instructions "start with a template" link defers to
	// the host (e.g. the Studio shell opens its Agent Directory on the first
	// template tab) instead of opening the composer's built-in templates dialog.
	onStartWithTemplate?: () => void;
	onAutomationRulesChange?: (automationRules: readonly AgentAutomationRule[]) => void;
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
		// Mirror AgentHeader / AgentConfigProfile, which default to the same avatar.
		// Without this, consumers that omit avatarSrc (e.g. the component demo) render
		// the default profile avatar but leave the Flows/Subagents leading glyphs on
		// the gray collection fallback — so the chip icons would mismatch the avatar's
		// collection color. Defaulting here keeps the glyph hue in sync with the avatar.
		avatarSrc = AGENT_AVATAR_SRC,
		compactFooterBefore,
		compactScrollAreaClassName,
		hiddenConfigFields,
		idPrefix,
		onListItemChange,
		onAddListValues,
		onAppendListItem,
		onConnectTrigger,
		onInstructionsViewModeChange,
		onManageTriggers,
		registerAutomationDialogOpener,
		onManageSubagents,
		onOpenDirectory,
		onProfileAvatarChange,
		onProfileTextChange,
		onRemoveListItem,
		onSelectListItem,
		onStartWithTemplate,
		onTextChange,
		onToggleListItem,
		onAutomationRulesChange,
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
		const [mentionRemovalRequest, setMentionRemovalRequest] = useState<RichTextMentionRemovalRequest | null>(null);
		// Onboarding bento dismissal ("Not now"). Local to the editor session so the
		// tiles can be hidden without persisting a flag onto the agent config.
		const [isOnboardingBentoDismissed, setIsOnboardingBentoDismissed] = useState(false);
		const handleTextChange = useCallback((field: AgentConfigTextFieldName, value: string) => {
			onTextChange?.(field, value);
		}, [onTextChange]);
		const handleProfileTextChange = useCallback((field: AgentConfigTextFieldName, value: string) => {
			(onProfileTextChange ?? onTextChange)?.(field, value);
		}, [onProfileTextChange, onTextChange]);
		const handleListItemChange = useCallback((field: AgentConfigListFieldName, index: number, value: string) => {
			onListItemChange?.(field, index, field === "skills" ? getSkillConfigLabel(value) : value);
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
			onAddListValues?.(field, field === "skills" ? values.map(getSkillConfigLabel).filter(Boolean) : values);
		}, [onAddListValues]);
		const handleRemoveReferenceValue = useCallback((field: AgentConfigReferenceListFieldName, value: string) => {
			const normalizedValue = getAgentConfigListLookupValue(field, value);
			const index = (config[field] ?? []).findIndex(
				(item) => getAgentConfigListLookupValue(field, item) === normalizedValue,
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
		const currentAutomationRules = useMemo(
			() => getAgentAutomationRules(config),
			[config],
		);
		// Automation authoring routes through the rule-builder modal hosted here so a
		// single dialog instance serves every entry point (summary row, collapsed
		// nav, missing-config tile). `seed` carries the automation rule the modal
		// opens with — an existing rule when editing, or a freshly-picked event.
		const [triggersEditor, setTriggersEditor] = useState<{ open: boolean; fromManage: boolean; seed: AgentAutomationRule; title: string }>({
			open: false,
			fromManage: false,
			title: "New flow",
			seed: createAgentAutomationRule({
					id: "automation-1",
				name: "",
				prompt: "",
				triggers: [],
			}),
		});
		const handleEditTriggers = useCallback((seed?: AgentAutomationRule, fromManage = false, isNew = false) => {
			setTriggersEditor({
				open: true,
				fromManage,
				title: !seed || isNew ? "Add flow" : "Edit flow",
				seed: seed ?? createAgentAutomationRule({
					id: `automation-${getNextAutomationRuleIndex(currentAutomationRules)}`,
					name: "",
					prompt: "",
					triggers: [],
				}),
			});
		}, [currentAutomationRules]);
		const handleTriggersEditorOpenChange = useCallback((open: boolean) => {
			setTriggersEditor((prev) => ({ ...prev, open }));
		}, []);
		const handleTriggersSave = useCallback((automationRule: AgentAutomationRule) => {
			const current = currentAutomationRules;
			const existingIndex = current.findIndex((rule) => rule.id === automationRule.id);
			onAutomationRulesChange?.(
				existingIndex >= 0
					? current.map((rule, index) => (index === existingIndex ? automationRule : rule))
					: [...current, automationRule],
			);
		}, [currentAutomationRules, onAutomationRulesChange]);

		const [manageTriggersOpen, setManageTriggersOpen] = useState(false);
		const handleManageTriggers = useCallback(() => {
			if (onManageTriggers) {
				onManageTriggers();
				return;
			}

			setManageTriggersOpen(true);
		}, [onManageTriggers]);
		// Opens the flow config dialog directly for the most recently configured
		// automation (the one the agent-edit-summary card refers to), instead of
		// the manage-flows list. Falls back to a fresh flow when none exist.
		const handleOpenAutomationFlowConfig = useCallback(() => {
			const rules = currentAutomationRules;
			if (rules.length > 0) {
				handleEditTriggers(rules[rules.length - 1]);
				return;
			}
			handleEditTriggers();
		}, [currentAutomationRules, handleEditTriggers]);
		// Hand the flow-config opener to a registered host so a sibling surface
		// (the Ask Rovo agent-edit-summary card) can open it. Re-register whenever
		// the opener identity changes and clear it on unmount.
		useEffect(() => {
			if (!registerAutomationDialogOpener) {
				return;
			}
			registerAutomationDialogOpener(handleOpenAutomationFlowConfig);
			return () => registerAutomationDialogOpener(null);
		}, [registerAutomationDialogOpener, handleOpenAutomationFlowConfig]);
		const handleAddAutomationFromManage = useCallback(
			(providerId: Parameters<typeof createAgentTriggerValue>[0], eventId: string) => {
				const next = createAutomationRuleFromEvent(providerId, eventId, currentAutomationRules);
				if (!next) {
					return;
				}
				setManageTriggersOpen(false);
				handleEditTriggers(next, false, true);
			},
			[currentAutomationRules, handleEditTriggers],
		);
		const handleReorderAutomations = useCallback(
			(activeId: string, overId: string) => {
				const current = currentAutomationRules;
				const from = current.findIndex((rule) => rule.id === activeId);
				const to = current.findIndex((rule) => rule.id === overId);
				if (from === -1 || to === -1) {
					return;
				}
				const next = current.slice();
				const [moved] = next.splice(from, 1);
				next.splice(to, 0, moved);
				onAutomationRulesChange?.(next);
			},
			[currentAutomationRules, onAutomationRulesChange],
		);
		const handleToggleAutomation = useCallback(
			(id: string, enabled: boolean) => {
				const current = currentAutomationRules;
				onAutomationRulesChange?.(
					current.map((rule) => (rule.id === id ? { ...rule, enabled } : rule)),
				);
			},
			[currentAutomationRules, onAutomationRulesChange],
		);
		const handleDeleteAutomation = useCallback(
			(id: string) => {
				const current = currentAutomationRules;
				onAutomationRulesChange?.(current.filter((rule) => rule.id !== id));
			},
			[currentAutomationRules, onAutomationRulesChange],
		);
		const handleEditAutomationFromManage = useCallback(
			(automationRule: AgentAutomationRule) => {
				setManageTriggersOpen(false);
				handleEditTriggers(automationRule, true);
			},
			[handleEditTriggers],
		);

		return (
			<div
				className={cn("flex min-h-0 flex-1 flex-col gap-6", className)}
				data-agent-config-id={idPrefix}
				data-screen-assistant-target={screenAssistantTargetPrefix}
				{...props}
			>
				<div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
					{/* Scrollable region: profile + instructions grow to fill, the
					    sibling footer below stays anchored to the panel bottom. */}
					<div
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
							compactScrollAreaClassName,
						)}
					>
						<div className="flex flex-col gap-4">
							<AgentConfigProfile
								config={profileConfig ?? config}
								avatarSrc={profileAvatarSrc ?? avatarSrc}
								onAvatarChange={onProfileAvatarChange}
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
						<AgentCompactConfigPanel
							config={config}
							avatarSrc={profileAvatarSrc ?? avatarSrc}
							hiddenConfigFields={hiddenConfigFields}
							onAddListValues={handleAddListValues}
							onAppendListItem={handleAppendListItem}
							onConnectTrigger={onConnectTrigger}
							onEditTriggers={handleEditTriggers}
							onManageTriggers={handleManageTriggers}
							onListItemChange={handleListItemChange}
							onManageSubagents={onManageSubagents ? handleManageSubagents : undefined}
							onOpenDirectory={handleOpenDirectory}
							onRemoveListItem={handleRemoveListItem}
							onSelectListItem={handleSelectListItem}
							onTextChange={handleTextChange}
							onToggleListItem={onToggleListItem}
							onAutomationRulesChange={onAutomationRulesChange}
							screenAssistantTargetPrefix={screenAssistantTargetPrefix}
							selectedListItemIndexByField={selectedListItemIndexByField}
						/>
						<AgentInstructionsComposer
							className="relative flex min-h-0 flex-1 flex-col"
							config={config}
							contentClassName={isFilledConfig ? "min-h-[240px]" : "min-h-[2rem]"}
							editorClassName={isFilledConfig ? undefined : "agent-instructions-tiptap-editor-compact-empty"}
							instructions={config.instructions}
							mentionRemovalRequest={mentionRemovalRequest}
							onAddListValues={handleAddListValues}
							onInstructionsChange={(value) => handleTextChange("instructions", value)}
							onMentionRemovalRequestHandled={handleMentionRemovalRequestHandled}
							onOpenDirectory={handleOpenDirectory}
							onRemoveReferenceValue={handleRemoveReferenceValue}
							onStartWithTemplate={onStartWithTemplate}
							onViewModeChange={onInstructionsViewModeChange}
							screenAssistantTargetId={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:instructions` : undefined}
							showSectionLabel={false}
						/>
						{/*
							Onboarding bento: on a brand-new, capability-empty base agent
							(not a subagent), surface the "Start with these agent templates"
							tiles pinned to the bottom of the config. The instructions
							composer above is `flex-1` and absorbs free space, so this
							`shrink-0` block lands flush at the scroll area's bottom. It
							animates away once the agent gains its first capability
							(`isFilledConfig`) or the user picks "Not now".
						*/}
						<AnimatePresence initial={false}>
							{!isFilledConfig && !isSubagent && !isOnboardingBentoDismissed ? (
								<motion.div
									key="agent-onboarding-bento"
									className="shrink-0"
									exit={{ opacity: 0 }}
									transition={{ duration: 0.2, ease: [0, 0.4, 0, 1] }}
								>
									<AgentCompactOperationsBento
										onDismiss={() => setIsOnboardingBentoDismissed(true)}
										onStartWithTemplate={onStartWithTemplate}
									/>
								</motion.div>
							) : null}
						</AnimatePresence>
					</div>
					{/* Optional caller-supplied slot rendered at the panel bottom. */}
					{compactFooterBefore}
				</div>
				<AgentTriggersDialog
					open={triggersEditor.open}
					onOpenChange={handleTriggersEditorOpenChange}
					automationRule={triggersEditor.seed}
					onSave={handleTriggersSave}
					showBack={triggersEditor.fromManage}
					title={triggersEditor.title}
				/>
				<ManageTriggersDialog
					open={manageTriggersOpen}
					onOpenChange={setManageTriggersOpen}
					automationRules={currentAutomationRules}
					onAddAutomation={handleAddAutomationFromManage}
					onReorderAutomations={handleReorderAutomations}
					onToggleAutomation={handleToggleAutomation}
					onDeleteAutomation={handleDeleteAutomation}
					onEditAutomation={handleEditAutomationFromManage}
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
