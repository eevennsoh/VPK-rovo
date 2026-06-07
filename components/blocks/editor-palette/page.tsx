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
 */
const FLAT_SECTIONS: readonly {
	category: RichTextMentionMenuCategory | "format";
	title: string;
	trigger: "@" | "/";
	hasDirectory: boolean;
}[] = [
	{ category: "people-team", title: "People and team", trigger: "@", hasDirectory: false },
	{ category: "subagent", title: "Subagents", trigger: "@", hasDirectory: true },
	{ category: "skill", title: "Skills", trigger: "/", hasDirectory: true },
	{ category: "tool", title: "Tools", trigger: "/", hasDirectory: true },
	{ category: "knowledge", title: "Knowledge", trigger: "/", hasDirectory: true },
	{ category: "format", title: "Format", trigger: "/", hasDirectory: false },
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

function FlatPalette({ mentionSources }: Readonly<PaletteVariantProps>) {
	return (
		<div
			className="grid w-full grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))] items-start justify-items-center"
			style={{ gap: token("space.300") }}
		>
			{FLAT_SECTIONS.map((section) => (
				<FlatSection
					key={section.category}
					trigger={section.trigger}
					title={section.title}
					hasDirectory={section.hasDirectory}
					items={getFlatSectionItems(mentionSources, section.category)}
				/>
			))}
		</div>
	);
}

interface FlatSectionProps {
	trigger: "@" | "/";
	title: string;
	hasDirectory: boolean;
	items: readonly RichTextSuggestionMenuItem[];
}

const FOOTER_ITEM_ID = "__editor-palette-footer__";

function FlatSection({ trigger, title, hasDirectory, items }: Readonly<FlatSectionProps>) {
	const [expanded, setExpanded] = useState(false);
	const overflowing = items.length > FLAT_SECTION_LIMIT;
	// Directory sections always cap at five and link out via "Browse all".
	// Non-directory sections cap at five but can expand the rest inline.
	const showAll = !hasDirectory && expanded;
	const visibleItems = showAll ? items : items.slice(0, FLAT_SECTION_LIMIT);

	const footerItem: RichTextSuggestionMenuItem | null = !overflowing
		? null
		: hasDirectory
			? {
					id: FOOTER_ITEM_ID,
					label: "Browse all",
					icon: <SearchIcon label="" size="small" />,
					isSticky: true,
				}
			: {
					id: FOOTER_ITEM_ID,
					label: showAll ? "View less" : "View more",
					icon: <ChevronDownIcon label="" size="small" />,
					isSticky: true,
				};

	const menuItems = footerItem ? [...visibleItems, footerItem] : visibleItems;

	const handleSelect = (item: RichTextSuggestionMenuItem) => {
		if (item.id === FOOTER_ITEM_ID && !hasDirectory) {
			setExpanded((value) => !value);
		}
	};

	return (
		<PalettePanel trigger={trigger} caption={title}>
			<RichTextSuggestionMenu
				className="rich-text-command-menu-borderless rich-text-command-menu-showcase"
				title={title}
				emptyLabel="No matching items"
				items={menuItems}
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
