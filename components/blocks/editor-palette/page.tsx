"use client";

import { useState, type ReactNode } from "react";

import SearchIcon from "@atlaskit/icon/core/search";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";

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
export type EditorPaletteVariant = "nested" | "flat";

export interface EditorPaletteProps {
	/** Skill catalog that drives the live editor's "/" Skills submenu counts. */
	mentionSources?: RichTextMentionSources;
	/**
	 * Layout for the showcase menus. `"nested"` (default) shows each top-level
	 * section as a single list you click into. `"flat"` expands every section
	 * inline, capped at five items with a "Browse all" / "View more" footer.
	 */
	variant?: EditorPaletteVariant;
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
 * "Browse all" footer (search icon) that links to a dedicated directory;
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
	variant = "nested",
	showLiveEditor = true,
	className,
}: Readonly<EditorPaletteProps>) {
	return (
		<div
			className={cn("flex w-full max-w-[1440px] flex-col", className)}
			style={{ gap: token("space.400") }}
		>
			{variant === "flat" ? (
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
						suggestionVariant={variant}
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
						icon: <SearchIcon label="" size="small" />,
						isSticky: true,
					}
				: {
						id: getSectionFooterId(section.category),
						label: showAll ? "View less" : "View more",
						icon: <ChevronDownIcon label="" size="small" />,
						isSticky: true,
					},
		);
	}

	return rows;
}

function FlatPalette({ mentionSources }: Readonly<PaletteVariantProps>) {
	return (
		<div
			className="grid w-full grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))] items-start justify-items-center"
			style={{ gap: token("space.300") }}
		>
			{FLAT_MENTION_SECTIONS.map((section) => (
				<FlatSectionPanel
					key={section.category}
					trigger="@"
					section={section}
					items={getFlatSectionItems(mentionSources, section.category)}
				/>
			))}

			<FlatCommandPanel mentionSources={mentionSources} />
		</div>
	);
}

interface FlatSectionPanelProps {
	trigger: "@" | "/";
	section: FlatSectionConfig;
	items: readonly RichTextSuggestionMenuItem[];
}

/** A single flat section rendered in its own panel (used by the "@" surface). */
function FlatSectionPanel({ trigger, section, items }: Readonly<FlatSectionPanelProps>) {
	const [expanded, setExpanded] = useState(false);
	const rows = getFlatSectionRows(section, items, expanded);

	const handleSelect = (item: RichTextSuggestionMenuItem) => {
		if (item.id === getSectionFooterId(section.category) && !section.hasDirectory) {
			setExpanded((value) => !value);
		}
	};

	return (
		<PalettePanel trigger={trigger} caption={section.title}>
			<RichTextSuggestionMenu
				className="rich-text-command-menu-borderless rich-text-command-menu-showcase"
				title={section.title}
				emptyLabel="No matching items"
				items={rows}
				selectedIndex={-1}
				onSelect={handleSelect}
			/>
		</PalettePanel>
	);
}

/**
 * The "/" surface for the flat variant: Skills, Tools, Knowledge, and Format
 * merged into one list, each preceded by a section heading and capped at five
 * items with its own "Browse all" / "View more" footer.
 */
function FlatCommandPanel({ mentionSources }: Readonly<PaletteVariantProps>) {
	const [expandedSections, setExpandedSections] = useState<Readonly<Record<string, boolean>>>({});

	const rows = FLAT_COMMAND_SECTIONS.flatMap((section) =>
		getFlatSectionRows(
			section,
			getFlatSectionItems(mentionSources, section.category),
			Boolean(expandedSections[section.category]),
			section.title,
		),
	);

	const handleSelect = (item: RichTextSuggestionMenuItem) => {
		const section = FLAT_COMMAND_SECTIONS.find(
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
		<PalettePanel trigger="/" caption="Commands">
			<RichTextSuggestionMenu
				className="rich-text-command-menu-borderless rich-text-command-menu-showcase"
				title="Commands"
				emptyLabel="No matching items"
				items={rows}
				selectedIndex={-1}
				onSelect={handleSelect}
			/>
		</PalettePanel>
	);
}

interface PalettePanelProps {
	trigger: string;
	caption: string;
	children: ReactNode;
}

function PalettePanel({ trigger, caption, children }: Readonly<PalettePanelProps>) {
	return (
		<figure className="m-0 flex flex-col" style={{ gap: token("space.100") }}>
			<figcaption className="flex items-center" style={{ gap: token("space.100") }}>
				<span
					className="inline-flex items-center justify-center rounded-sm bg-surface-sunken font-mono text-text-subtle"
					style={{ width: 24, height: 24, fontSize: 13 }}
				>
					{trigger}
				</span>
				<span className="text-sm font-medium text-text">{caption}</span>
			</figcaption>
			{children}
		</figure>
	);
}
