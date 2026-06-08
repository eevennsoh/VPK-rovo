"use client";

import { useState, type ReactNode } from "react";

import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import ChevronUpIcon from "@atlaskit/icon/core/chevron-up";

import { Kbd } from "@/components/ui/kbd";
import { RovoColorIcon } from "@/components/ui/logo";
import { SearchIcon } from "@/components/ui/vpk-icons";
import "@/components/ui-custom/rich-text-editor/rich-text-editor.css";
import {
	RichTextEditor,
	RichTextSuggestionMenu,
	getMentionChildItems,
	getMentionTargetItems,
	getSlashCommandCategoryItems,
	getSlashCommandFormatItems,
	type RichTextMentionMenuCategory,
	type RichTextMentionSources,
	type RichTextSuggestionMenuItem,
} from "@/components/ui-custom/rich-text-editor";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

import { EDITOR_PALETTE_MENTION_SOURCES } from "./data/mention-sources";

/** How the editor palette lays out its suggestion surfaces. */
export type EditorPaletteVariant = "nested" | "flat" | "search";
export type EditorPaletteSearchCategory = Extract<
	RichTextMentionMenuCategory,
	"knowledge" | "skill" | "subagent" | "tool"
>;

export interface EditorPaletteProps {
	/** Skill catalog that drives the live editor's "/" Skills submenu counts. */
	mentionSources?: RichTextMentionSources;
	/**
	 * Layout for the showcase menus. `"nested"` (default) shows each top-level
	 * section as a single list you click into. `"flat"` expands every section
	 * inline, capped at five items with a "Browse all" / "View more" footer.
	 * `"search"` shows one category-specific inline search picker.
	 */
	variant?: EditorPaletteVariant;
	searchCategory?: EditorPaletteSearchCategory;
	/** Render a live editor where typing "@" or "/" opens the real menus. */
	showLiveEditor?: boolean;
	className?: string;
}

function noop(): void {}

/** Max items shown per section before the "Browse all" / "View more" footer. */
const FLAT_SECTION_LIMIT = 5;

const NESTED_MENTION_SHOWCASES: readonly {
	category: RichTextMentionMenuCategory;
	title: string;
	trigger: "@" | "/";
	caption: string;
}[] = [
	{ category: "people-team", title: "People and team", trigger: "@", caption: "People and team nested" },
	{ category: "subagent", title: "Subagents", trigger: "@", caption: "Subagents nested" },
	{ category: "skill", title: "Skills", trigger: "/", caption: "Skills nested" },
	{ category: "tool", title: "Tools", trigger: "/", caption: "Tools nested" },
	{ category: "knowledge", title: "Knowledge", trigger: "/", caption: "Knowledge nested" },
];

/**
 * Sections rendered by the flat variant. `hasDirectory` sections get a
 * "Browse all" footer (ellipsis icon) that links to a dedicated directory;
 * sections without one get a "View more" footer (chevron) that expands the
 * remaining items inline.
 *
 * `"@"` sections each render as their own panel. `"/"` sections are merged into
 * a single panel/menu, separated by section headings, since they share one
 * trigger.
 */
interface FlatSectionConfig {
	category: RichTextMentionMenuCategory | "format";
	title: string;
	hasDirectory: boolean;
}

const FLAT_MENTION_SECTIONS: readonly FlatSectionConfig[] = [
	{ category: "people-team", title: "People and team", hasDirectory: false },
	{ category: "subagent", title: "Subagents", hasDirectory: true },
];

const FLAT_COMMAND_SECTIONS: readonly FlatSectionConfig[] = [
	{ category: "skill", title: "Skills", hasDirectory: true },
	{ category: "tool", title: "Tools", hasDirectory: true },
	{ category: "knowledge", title: "Knowledge", hasDirectory: true },
	{ category: "format", title: "Format", hasDirectory: false },
];

export default function EditorPalette({
	mentionSources = EDITOR_PALETTE_MENTION_SOURCES,
	searchCategory = "tool",
	variant = "nested",
	showLiveEditor = true,
	className,
}: Readonly<EditorPaletteProps>) {
	return (
		<div
			className={cn("flex w-full max-w-[1440px] flex-col", className)}
			style={{ gap: token("space.400") }}
		>
			{variant === "search" ? (
				<SearchPalette category={searchCategory} mentionSources={mentionSources} />
			) : variant === "flat" ? (
				<FlatPalette mentionSources={mentionSources} />
			) : (
				<NestedPalette mentionSources={mentionSources} />
			)}

			{showLiveEditor ? (
				<div
					className="rounded-lg border border-border bg-surface"
					style={{ padding: token("space.200") }}
				>
					<RichTextEditor
						mentionSources={mentionSources}
						suggestionVariant={variant === "search" ? "flat" : variant}
						placeholder="Type @ to mention people and agents, or / for commands…"
						showToolbar={false}
						showBubbleMenu={false}
						aria-label="Editor palette demo"
						editorClassName="agent-instructions-tiptap-editor"
					/>
				</div>
			) : null}
		</div>
	);
}

interface PaletteVariantProps {
	mentionSources: RichTextMentionSources;
}

const SEARCH_CATEGORY_LABELS: Record<EditorPaletteSearchCategory, string> = {
	knowledge: "knowledge",
	skill: "skills",
	subagent: "subagents",
	tool: "tools",
};

const SEARCH_INPUT_ITEM_ID = "__editor-palette-search-input__";
const SEARCH_BROWSE_ALL_ITEM_ID = "__editor-palette-search-browse-all__";
const SEARCH_EMPTY_ITEM_ID = "__editor-palette-search-empty__";

function getSearchPlaceholder(category: EditorPaletteSearchCategory): string {
	return `Search ${SEARCH_CATEGORY_LABELS[category]}`;
}

function filterSearchItems(
	items: readonly RichTextSuggestionMenuItem[],
	query: string,
): readonly RichTextSuggestionMenuItem[] {
	const normalizedQuery = query.trim().toLowerCase();
	if (!normalizedQuery) {
		return items;
	}

	return items.filter((item) => {
		const haystack = `${item.label} ${item.description ?? ""}`.toLowerCase();
		return haystack.includes(normalizedQuery);
	});
}

export interface EditorPaletteSearchPickerProps {
	autoFocus?: boolean;
	category: EditorPaletteSearchCategory;
	className?: string;
	emptyLabel?: string;
	mentionSources?: RichTextMentionSources;
	onBrowseAll?: () => void;
	onSelectItem?: (item: RichTextSuggestionMenuItem) => void;
}

export function EditorPaletteSearchPicker({
	autoFocus,
	category,
	className,
	emptyLabel = "No matching items",
	mentionSources = EDITOR_PALETTE_MENTION_SOURCES,
	onBrowseAll,
	onSelectItem,
}: Readonly<EditorPaletteSearchPickerProps>) {
	const [query, setQuery] = useState("");
	const items = filterSearchItems(getMentionChildItems(mentionSources, category), query);
	const resultRows: readonly RichTextSuggestionMenuItem[] = items.length > 0 ? items : [
		{
			id: SEARCH_EMPTY_ITEM_ID,
			disabled: true,
			icon: <SearchIcon className="size-4" />,
			label: emptyLabel,
		},
	];
	const searchItem: RichTextSuggestionMenuItem = {
		id: SEARCH_INPUT_ITEM_ID,
		icon: <SearchIcon className="size-4" />,
		isSticky: true,
		label: getSearchPlaceholder(category),
	};
	const browseAllItem: RichTextSuggestionMenuItem = {
		id: SEARCH_BROWSE_ALL_ITEM_ID,
		icon: <ShowMoreHorizontalIcon label="" size="small" />,
		isSticky: true,
		label: "Browse all",
		stickyPosition: "bottom",
	};
	const rows = [searchItem, ...resultRows, browseAllItem];

	const handleSelect = (item: RichTextSuggestionMenuItem) => {
		if (item.id === SEARCH_INPUT_ITEM_ID) {
			const firstItem = items[0];
			if (firstItem) {
				onSelectItem?.(firstItem);
			}
			return;
		}

		if (item.id === SEARCH_BROWSE_ALL_ITEM_ID) {
			onBrowseAll?.();
			return;
		}

		onSelectItem?.(item);
	};

	return (
		<RichTextSuggestionMenu
			className={className}
			title={getSearchPlaceholder(category)}
			emptyLabel={emptyLabel}
			inputAutoFocus={autoFocus}
			inputValue={query}
			items={rows}
			onInputValueChange={setQuery}
			onSelect={handleSelect}
			renderFirstItemAsInput
			selectedIndex={-1}
		/>
	);
}

interface SearchPaletteProps extends PaletteVariantProps {
	category: EditorPaletteSearchCategory;
}

function SearchPalette({ category, mentionSources }: Readonly<SearchPaletteProps>) {
	return (
		<div
			className="grid w-full grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))] items-start justify-items-center"
			style={{ gap: token("space.300") }}
		>
			<PalettePanel caption={getSearchPlaceholder(category)}>
				<EditorPaletteSearchPicker
					category={category}
					className="rich-text-command-menu-borderless"
					mentionSources={mentionSources}
				/>
			</PalettePanel>
		</div>
	);
}

function NestedPalette({ mentionSources }: Readonly<PaletteVariantProps>) {
	const mentionItems = getMentionTargetItems(mentionSources);
	const commandItems = getSlashCommandCategoryItems(mentionSources);
	const formatItems = getSlashCommandFormatItems();

	return (
		<div
			className="grid w-full grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))] items-start justify-items-center"
			style={{ gap: token("space.300") }}
		>
			<PalettePanel trigger="@" caption="Mention">
				<RichTextSuggestionMenu
					className="rich-text-command-menu-borderless rich-text-command-menu-showcase"
					title="Mention"
					emptyLabel="No people or agents found"
					items={mentionItems}
					selectedIndex={0}
					onSelect={noop}
				/>
			</PalettePanel>

			<PalettePanel trigger="/" caption="Commands">
				<RichTextSuggestionMenu
					className="rich-text-command-menu-borderless rich-text-command-menu-showcase"
					title="Commands"
					emptyLabel="No commands found"
					items={commandItems}
					selectedIndex={0}
					renderFirstItemAsInput
					onSelect={noop}
				/>
			</PalettePanel>

			{NESTED_MENTION_SHOWCASES.map(({ category, caption, title, trigger }) => (
				<PalettePanel key={category} trigger={trigger} caption={caption}>
					<RichTextSuggestionMenu
						className="rich-text-command-menu-borderless rich-text-command-menu-showcase"
						title={title}
						emptyLabel="No matching items"
						items={getMentionChildItems(mentionSources, category)}
						selectedIndex={0}
						onBack={noop}
						onSelect={noop}
					/>
				</PalettePanel>
			))}

			<PalettePanel trigger="/" caption="Format nested">
				<RichTextSuggestionMenu
					className="rich-text-command-menu-borderless rich-text-command-menu-showcase"
					title="Format"
					emptyLabel="No matching items"
					items={formatItems}
					selectedIndex={0}
					onBack={noop}
					onSelect={noop}
				/>
			</PalettePanel>
		</div>
	);
}

function getFlatSectionItems(
	mentionSources: RichTextMentionSources,
	category: RichTextMentionMenuCategory | "format",
): readonly RichTextSuggestionMenuItem[] {
	return category === "format"
		? getSlashCommandFormatItems()
		: getMentionChildItems(mentionSources, category);
}

const FOOTER_ITEM_ID_PREFIX = "__editor-palette-footer__";

function getSectionFooterId(category: string): string {
	return `${FOOTER_ITEM_ID_PREFIX}${category}`;
}

/**
 * Builds the rows for one flat section: up to five items capped by the limit,
 * plus a sticky footer ("Browse all" for directory-backed sections, "View
 * more" / "View less" for the rest). When `headingLabel` is provided the
 * section leads with a non-interactive heading so several sections can share
 * one merged list.
 */
function getFlatSectionRows(
	section: FlatSectionConfig,
	items: readonly RichTextSuggestionMenuItem[],
	expanded: boolean,
	headingLabel?: string,
): readonly RichTextSuggestionMenuItem[] {
	const overflowing = items.length > FLAT_SECTION_LIMIT;
	// Directory sections always cap at five and link out via "Browse all".
	// Non-directory sections cap at five but can expand the rest inline.
	const showAll = !section.hasDirectory && expanded;
	const visibleItems = showAll ? items : items.slice(0, FLAT_SECTION_LIMIT);

	const rows: RichTextSuggestionMenuItem[] = [];

	if (headingLabel !== undefined) {
		rows.push({
			id: `${section.category}-heading`,
			label: headingLabel,
			headingLabel,
			icon: null,
		});
	}

	rows.push(...visibleItems);

	if (overflowing) {
		rows.push(
			section.hasDirectory
				? {
						id: getSectionFooterId(section.category),
						label: "Browse all",
						icon: <ShowMoreHorizontalIcon label="" size="small" />,
						isSticky: true,
					}
				: {
						id: getSectionFooterId(section.category),
						label: showAll ? "View less" : "View more",
						icon: showAll ? (
							<ChevronUpIcon label="" size="small" />
						) : (
							<ChevronDownIcon label="" size="small" />
						),
						isSticky: true,
					},
		);
	}

	return rows;
}

/**
 * Sticky "Ask Rovo" lead row for the "/" surface, rendered as a subtle input
 * (matching the live slash menu). The "@" surface has no equivalent.
 */
const ASK_ROVO_LEAD_ITEM: RichTextSuggestionMenuItem = {
	id: "ask-rovo",
	label: "Ask Rovo",
	description: "Ask Rovo to help with the current editor context.",
	icon: <RovoColorIcon size="xxsmall" />,
	isSticky: true,
};

function FlatPalette({ mentionSources }: Readonly<PaletteVariantProps>) {
	return (
		<div
			className="grid w-full grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))] items-start justify-items-center"
			style={{ gap: token("space.300") }}
		>
			<FlatMergedPanel
				trigger="@"
				caption="Mention"
				sections={FLAT_MENTION_SECTIONS}
				mentionSources={mentionSources}
			/>

			<FlatMergedPanel
				trigger="/"
				caption="Commands"
				sections={FLAT_COMMAND_SECTIONS}
				mentionSources={mentionSources}
				leadItem={ASK_ROVO_LEAD_ITEM}
			/>
		</div>
	);
}

interface FlatMergedPanelProps extends PaletteVariantProps {
	trigger: "@" | "/";
	caption: string;
	sections: readonly FlatSectionConfig[];
	/**
	 * Optional sticky lead row (e.g. "Ask Rovo") prepended before the section
	 * list and rendered as the subtle input row, matching the live slash menu.
	 */
	leadItem?: RichTextSuggestionMenuItem;
}

/**
 * A flat surface: every section is merged into one list, each preceded by a
 * section heading and capped at five items with its own "Browse all" / "View
 * more" footer. Used by both the "@" (Mention) and "/" (Commands) surfaces.
 */
function FlatMergedPanel({
	trigger,
	caption,
	sections,
	mentionSources,
	leadItem,
}: Readonly<FlatMergedPanelProps>) {
	const [expandedSections, setExpandedSections] = useState<Readonly<Record<string, boolean>>>({});

	const rows = [
		...(leadItem ? [leadItem] : []),
		...sections.flatMap((section) =>
			getFlatSectionRows(
				section,
				getFlatSectionItems(mentionSources, section.category),
				Boolean(expandedSections[section.category]),
				section.title,
			),
		),
	];

	const handleSelect = (item: RichTextSuggestionMenuItem) => {
		const section = sections.find(
			(candidate) => item.id === getSectionFooterId(candidate.category),
		);
		if (section && !section.hasDirectory) {
			setExpandedSections((value) => ({
				...value,
				[section.category]: !value[section.category],
			}));
		}
	};

	return (
		<PalettePanel trigger={trigger} caption={caption}>
			<RichTextSuggestionMenu
				className="rich-text-command-menu-borderless rich-text-command-menu-showcase"
				title={caption}
				emptyLabel="No matching items"
				items={rows}
				selectedIndex={-1}
				onSelect={handleSelect}
				renderFirstItemAsInput={leadItem !== undefined}
			/>
		</PalettePanel>
	);
}

interface PalettePanelProps {
	trigger?: string;
	caption: string;
	children: ReactNode;
}

function PalettePanel({ trigger, caption, children }: Readonly<PalettePanelProps>) {
	return (
		<figure className="m-0 flex flex-col" style={{ gap: token("space.100") }}>
			<figcaption className="flex items-center" style={{ gap: token("space.100") }}>
				{trigger ? <Kbd>{trigger}</Kbd> : null}
				<span className="text-sm font-medium text-text">{caption}</span>
			</figcaption>
			{children}
		</figure>
	);
}
