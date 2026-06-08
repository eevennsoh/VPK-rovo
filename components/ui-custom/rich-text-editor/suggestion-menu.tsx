"use client";

import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
	type ReactNode,
} from "react";
import { ReactRenderer } from "@tiptap/react";
import type { Editor } from "@tiptap/core";
import type {
	SuggestionKeyDownProps,
	SuggestionProps,
} from "@tiptap/suggestion";
import { motion, type Variants } from "motion/react";

import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import LinkIcon from "@atlaskit/icon/core/link";
import PersonIcon from "@atlaskit/icon/core/person";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";
import SnippetIcon from "@atlaskit/icon/core/snippet";
import TeamsIcon from "@atlaskit/icon/core/teams";
import AlignTextCenterIcon from "@atlaskit/icon/core/align-text-center";
import AlignTextLeftIcon from "@atlaskit/icon/core/align-text-left";
import AlignTextRightIcon from "@atlaskit/icon/core/align-text-right";
import ListBulletedIcon from "@atlaskit/icon/core/list-bulleted";
import ListChecklistIcon from "@atlaskit/icon/core/list-checklist";
import ListNumberedIcon from "@atlaskit/icon/core/list-numbered";
import PeopleGroupIcon from "@atlaskit/icon/core/people-group";
import QuotationMarkIcon from "@atlaskit/icon/core/quotation-mark";
import TextIcon from "@atlaskit/icon/core/text";
import TextBoldIcon from "@atlaskit/icon/core/text-bold";
import TextItalicIcon from "@atlaskit/icon/core/text-italic";
import TextStrikethroughIcon from "@atlaskit/icon/core/text-strikethrough";
import TextUnderlineIcon from "@atlaskit/icon/core/text-underline";
import TableIcon from "@atlaskit/icon/core/table";
import DividerElementIcon from "@atlaskit/icon-lab/core/divider-element";
import TerminalIcon from "@atlaskit/icon-lab/core/terminal";
import TextHeadingFiveIcon from "@atlaskit/icon-lab/core/text-heading-five";
import TextHeadingFourIcon from "@atlaskit/icon-lab/core/text-heading-four";
import TextHeadingOneIcon from "@atlaskit/icon-lab/core/text-heading-one";
import TextHeadingSixIcon from "@atlaskit/icon-lab/core/text-heading-six";
import TextHeadingThreeIcon from "@atlaskit/icon-lab/core/text-heading-three";
import TextHeadingTwoIcon from "@atlaskit/icon-lab/core/text-heading-two";

import { IconTile } from "@/components/ui/icon-tile";
import { Input } from "@/components/ui/input";
import { RovoColorIcon } from "@/components/ui/logo";
import { ArrowLeftIcon } from "@/components/ui/vpk-icons";
import { EDITOR_PALETTE_MENTION_SOURCES } from "@/components/blocks/editor-palette/data/mention-sources";
import { cn } from "@/lib/utils";

import { MENU_VISUAL_TILE_SIZE, RichTextMentionVisualMark } from "./mention-visual";
import {
	RICH_TEXT_REFERENCE_CATEGORY_OPTIONS,
	getRichTextReferenceCategoryIcon,
	getRichTextReferenceCategoryLabel,
	isRichTextReferenceCategory,
} from "./reference-categories";
import type {
	RichTextCommandCategory,
	RichTextMentionCategory,
	RichTextMentionItem,
	RichTextMentionSources,
	RichTextMentionVisual,
	RichTextSlashCategory,
} from "./types";

export interface RichTextCommandItem {
	id: string;
	label: string;
	description?: string;
	shortcut?: string;
	icon: ReactNode;
	run: (editor: Editor) => void;
}

export interface RichTextSuggestionMenuItem {
	id: string;
	label: string;
	description?: string;
	shortcut?: string;
	icon: ReactNode;
	isSticky?: boolean;
	visual?: RichTextMentionVisual;
	disabled?: boolean;
	/**
	 * When set, the entry renders as a non-interactive section heading (matching
	 * the dropdown menu's `DropdownMenuLabel`) instead of a selectable option.
	 * Used by the flat editor palette to merge several "/" categories into one
	 * list with a labeled group per category.
	 */
	headingLabel?: string;
	/**
	 * When true, the description stays visible at all times instead of revealing
	 * on hover/selection. Used by nested parent rows whose byline is a count
	 * (e.g. "13 available") that should always be readable.
	 */
	persistentDescription?: boolean;
}

interface RichTextSuggestionMenuProps {
	className?: string;
	emptyLabel: string;
	items: readonly RichTextSuggestionMenuItem[];
	onBack?: () => void;
	onSelect: (item: RichTextSuggestionMenuItem) => void;
	/**
	 * When true, the first item renders as a subtle text input (keeping its
	 * visual — e.g. the Rovo logo — at the front) instead of a button. Used by
	 * showcases like the editor palette; the live editor leaves this off.
	 */
	renderFirstItemAsInput?: boolean;
	selectedIndex: number;
	title: string;
}

interface SuggestionPopupState {
	component: ReactRenderer<unknown, RichTextSuggestionMenuProps> | null;
	element: HTMLDivElement | null;
	// Detaches the resize/scroll listeners used by the input-anchored (chat
	// composer) positioning mode. Null for caret-anchored menus.
	cleanup: (() => void) | null;
}

export type RichTextMentionMenuCategory = RichTextMentionCategory | "people-team";
type RichTextMentionParentCategory = "people-team" | "subagent";

const SUGGESTION_PAGE_KEY_STEP = 5;

const nestedCommandLabelVariants: Variants = {
	idle: {
		transform: "translateY(8px)",
		transition: { type: "spring", bounce: 0, visualDuration: 0.18 },
	},
	active: {
		transform: "translateY(0px)",
		transition: { type: "spring", bounce: 0.12, visualDuration: 0.24 },
	},
};

const nestedCommandDescriptionVariants: Variants = {
	idle: {
		opacity: 0,
		transform: "translateY(4px)",
		transition: { duration: 0.1, ease: [0.4, 0, 1, 1] },
	},
	active: {
		opacity: 1,
		transform: "translateY(0px)",
		transition: { delay: 0.02, duration: 0.16, ease: [0, 0.4, 0, 1] },
	},
};

const PEOPLE_AVATAR_SRCS = [
	"/avatar-user/andrea-wilson/color/asow-service-yellow.png",
	"/avatar-user/andrew-park/color/asow-dev-lime.png",
	"/avatar-user/annie-clare/color/asow-strategy-orange.png",
	"/avatar-user/aoife-burke/color/asow-service-yellow.png",
	"/avatar-user/bradley-phillips/color/asow-product-purple.png",
	"/avatar-user/brian-lin/color/asow-teamwork-blue.png",
	"/avatar-user/christine-sanchez/color/asow-strategy-orange.png",
	"/avatar-user/david-hsieh/color/asow-service-yellow.png",
	"/avatar-user/florence-garcia/color/asow-strategy-orange.png",
	"/avatar-user/maia-ma/color/asow-service-yellow.png",
	"/avatar-user/nova/color/asow-dev-lime.png",
	"/avatar-user/olivia-yang/color/asow-service-yellow.png",
] as const;

const TEAM_AVATAR_SRCS = [
	"/avatar-project/apple.svg",
	"/avatar-project/bank.svg",
	"/avatar-project/battery.svg",
	"/avatar-project/boat.svg",
	"/avatar-project/book.svg",
	"/avatar-project/canvas.svg",
	"/avatar-project/cat.svg",
	"/avatar-project/celebration.svg",
	"/avatar-project/cloud.svg",
	"/avatar-project/code.svg",
	"/avatar-project/compass.svg",
	"/avatar-project/connie-blog.svg",
	"/avatar-project/gears.svg",
	"/avatar-project/government.svg",
	"/avatar-project/graduation.svg",
	"/avatar-project/graph.svg",
	"/avatar-project/group.svg",
	"/avatar-project/hr-badge.svg",
	"/avatar-project/id.svg",
	"/avatar-project/it.svg",
	"/avatar-project/launch-ship.svg",
	"/avatar-project/life-ring.svg",
	"/avatar-project/light-bulb.svg",
	"/avatar-project/lightning.svg",
	"/avatar-project/loom-record.svg",
	"/avatar-project/loom-video.svg",
	"/avatar-project/magnifying-glass.svg",
	"/avatar-project/mail.svg",
	"/avatar-project/map.svg",
	"/avatar-project/megaphone.svg",
	"/avatar-project/palm-tree.svg",
	"/avatar-project/paper-airplane.svg",
	"/avatar-project/pencil.svg",
	"/avatar-project/phone.svg",
	"/avatar-project/pin.svg",
	"/avatar-project/plant.svg",
	"/avatar-project/rocket.svg",
	"/avatar-project/science.svg",
	"/avatar-project/service-bell.svg",
	"/avatar-project/shield.svg",
	"/avatar-project/shopping-cart.svg",
	"/avatar-project/star.svg",
	"/avatar-project/stopwatch.svg",
	"/avatar-project/store-bag.svg",
	"/avatar-project/storefront.svg",
	"/avatar-project/sun.svg",
	"/avatar-project/support-wrench.svg",
	"/avatar-project/tracking.svg",
	"/avatar-project/unicorn.svg",
	"/avatar-project/video.svg",
] as const;

const AGENT_AVATAR_SRCS = [
	"/avatar-agent/teamwork-agents/blocker-checker.svg",
	"/avatar-agent/teamwork-agents/brainstorm-facilitator.svg",
	"/avatar-agent/teamwork-agents/brand-guardian.svg",
	"/avatar-agent/teamwork-agents/bug-report-assistant.svg",
	"/avatar-agent/teamwork-agents/customer-insights.svg",
	"/avatar-agent/teamwork-agents/decision-director.svg",
	"/avatar-agent/teamwork-agents/diagram-creator.svg",
	"/avatar-agent/teamwork-agents/global-translator.svg",
	"/avatar-agent/dev-agents/code-accessibility-checker.svg",
	"/avatar-agent/dev-agents/code-documentation-writer.svg",
	"/avatar-agent/dev-agents/code-planner.svg",
	"/avatar-agent/dev-agents/code-reviewer.svg",
	"/avatar-agent/product-agents/feedback-analyzer.svg",
	"/avatar-agent/service-agents/ops-guide.svg",
	"/avatar-agent/service-agents/rca-agent.svg",
	"/avatar-agent/service-agents/service-triage.svg",
	"/avatar-agent/strategy-agents/strategic-insight.svg",
	"/avatar-agent/strategy-agents/talent-finder.svg",
] as const;

const MENTION_PARENT_LABELS: Record<RichTextMentionParentCategory, string> = {
	"people-team": "People and team",
	subagent: "Subagents",
};

/** "@" mention surface: people/teams and subagents, each opening a nested list. */
const MENTION_TARGET_ORDER: readonly RichTextMentionParentCategory[] = [
	"people-team",
	"subagent",
];

/**
 * "/" command surface: reference categories other than subagent (which lives on
 * the "@" surface), each opening a nested item list. Derived from the shared
 * `RICH_TEXT_REFERENCE_CATEGORY_OPTIONS` so the toolbar's "Add content" menu and
 * the slash menu stay in sync, minus subagent.
 */
const COMMAND_CATEGORY_ORDER: readonly RichTextCommandCategory[] = RICH_TEXT_REFERENCE_CATEGORY_OPTIONS
	.map((option) => option.category)
	.filter((category): category is RichTextCommandCategory => category !== "subagent");

const SLASH_CATEGORY_ORDER: readonly RichTextSlashCategory[] = [
	...COMMAND_CATEGORY_ORDER,
	"format",
];

/**
 * The slash category order, optionally without the "format" parent. The
 * mentions-only chat composer passes `includeFormat: false` so its "/" menu
 * surfaces references only; the document editor keeps the default.
 */
function getSlashCategoryOrder(
	includeFormat: boolean,
): readonly RichTextSlashCategory[] {
	return includeFormat
		? SLASH_CATEGORY_ORDER
		: COMMAND_CATEGORY_ORDER;
}
const ASK_ROVO_SLASH_ITEM: RichTextSuggestionMenuItem = {
	description: "Ask Rovo to help with the current editor context.",
	icon: <RovoColorIcon size="xxsmall" />,
	id: "ask-rovo",
	isSticky: true,
	label: "Ask Rovo",
};

/**
 * Static fallback mention catalog. Sourced from the single unified
 * `EDITOR_PALETTE_MENTION_SOURCES` (built from the `@/app/data/directory`
 * loaders) so the live editor's `@` and `/` surfaces draw from the same catalog
 * as the composer palette instead of a divergent hardcoded set. Consumer-passed
 * `getMentionSources` still take precedence via `getMergedMentionSources`.
 */
const STATIC_MENTION_ITEMS: RichTextMentionSources = EDITOR_PALETTE_MENTION_SOURCES;

export const SLASH_COMMANDS: readonly RichTextCommandItem[] = [
	{
		id: "normal-text",
		label: "Normal text",
		description: "Use the default paragraph style for body copy.",
		shortcut: "Text",
		icon: <TextIcon label="" size="small" />,
		run: (editor) => editor.chain().focus().setParagraph().run(),
	},
	{
		id: "heading-1",
		label: "Heading 1",
		description: "Create the largest section heading.",
		shortcut: "#",
		icon: <TextHeadingOneIcon label="" size="small" />,
		run: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
	},
	{
		id: "heading-2",
		label: "Heading 2",
		description: "Create a major subsection heading.",
		shortcut: "##",
		icon: <TextHeadingTwoIcon label="" size="small" />,
		run: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
	},
	{
		id: "heading-3",
		label: "Heading 3",
		description: "Create a smaller nested heading.",
		shortcut: "###",
		icon: <TextHeadingThreeIcon label="" size="small" />,
		run: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
	},
	{
		id: "heading-4",
		label: "Heading 4",
		description: "Create a compact fourth-level heading.",
		shortcut: "####",
		icon: <TextHeadingFourIcon label="" size="small" />,
		run: (editor) => editor.chain().focus().toggleHeading({ level: 4 }).run(),
	},
	{
		id: "heading-5",
		label: "Heading 5",
		description: "Create a small fifth-level heading.",
		shortcut: "#####",
		icon: <TextHeadingFiveIcon label="" size="small" />,
		run: (editor) => editor.chain().focus().toggleHeading({ level: 5 }).run(),
	},
	{
		id: "heading-6",
		label: "Heading 6",
		description: "Create the smallest heading style.",
		shortcut: "######",
		icon: <TextHeadingSixIcon label="" size="small" />,
		run: (editor) => editor.chain().focus().toggleHeading({ level: 6 }).run(),
	},
	{
		id: "quote",
		label: "Quote",
		description: "Set the current block as a quoted passage.",
		icon: <QuotationMarkIcon label="" size="small" />,
		run: (editor) => editor.chain().focus().toggleBlockquote().run(),
	},
	{
		id: "bold",
		label: "Bold",
		description: "Emphasize selected text with bold weight.",
		icon: <TextBoldIcon label="" size="small" />,
		run: (editor) => editor.chain().focus().toggleBold().run(),
	},
	{
		id: "italic",
		label: "Italic",
		description: "Emphasize selected text with italic styling.",
		icon: <TextItalicIcon label="" size="small" />,
		run: (editor) => editor.chain().focus().toggleItalic().run(),
	},
	{
		id: "underline",
		label: "Underline",
		description: "Add underline styling to selected text.",
		icon: <TextUnderlineIcon label="" size="small" />,
		run: (editor) => editor.chain().focus().toggleUnderline().run(),
	},
	{
		id: "strikethrough",
		label: "Strikethrough",
		description: "Mark selected text as removed or outdated.",
		icon: <TextStrikethroughIcon label="" size="small" />,
		run: (editor) => editor.chain().focus().toggleStrike().run(),
	},
	{
		id: "inline-code",
		label: "Inline code",
		description: "Render the selection in monospace (`code`).",
		shortcut: "`",
		icon: <SnippetIcon label="" size="small" />,
		run: (editor) => editor.chain().focus().toggleCode().run(),
	},
	{
		id: "code-block",
		label: "Code block",
		description: "Fenced code block with monospace text.",
		shortcut: "```",
		icon: <TerminalIcon label="" size="small" />,
		run: (editor) => editor.chain().focus().toggleCodeBlock().run(),
	},
	{
		id: "bulleted-list",
		label: "Bulleted list",
		description: "Turn the current block into an unordered list.",
		shortcut: "-",
		icon: <ListBulletedIcon label="" size="small" />,
		run: (editor) => editor.chain().focus().toggleBulletList().run(),
	},
	{
		id: "numbered-list",
		label: "Numbered list",
		description: "Turn the current block into an ordered list.",
		shortcut: "1.",
		icon: <ListNumberedIcon label="" size="small" />,
		run: (editor) => editor.chain().focus().toggleOrderedList().run(),
	},
	{
		id: "task-list",
		label: "Task list",
		description: "Track items with checkable boxes (GFM).",
		shortcut: "- [ ]",
		icon: <ListChecklistIcon label="" size="small" />,
		run: (editor) => editor.chain().focus().toggleTaskList().run(),
	},
	{
		id: "table",
		label: "Table",
		description: "Insert a 3×3 table with a header row (GFM).",
		icon: <TableIcon label="" size="small" />,
		run: (editor) =>
			editor
				.chain()
				.focus()
				.insertTable({ rows: 3, cols: 3, withHeaderRow: true })
				.run(),
	},
	{
		id: "align-left",
		label: "Align left",
		description: "Align the current block to the left edge.",
		icon: <AlignTextLeftIcon label="" size="small" />,
		run: (editor) => editor.chain().focus().setTextAlign("left").run(),
	},
	{
		id: "align-center",
		label: "Align center",
		description: "Center-align the current block.",
		icon: <AlignTextCenterIcon label="" size="small" />,
		run: (editor) => editor.chain().focus().setTextAlign("center").run(),
	},
	{
		id: "align-right",
		label: "Align right",
		description: "Align the current block to the right edge.",
		icon: <AlignTextRightIcon label="" size="small" />,
		run: (editor) => editor.chain().focus().setTextAlign("right").run(),
	},
	{
		id: "link",
		label: "Link",
		description: "Attach a URL to the selected text.",
		icon: <LinkIcon label="" size="small" />,
		run: (editor) => {
			const url = window.prompt("Enter URL");
			if (url) {
				editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
			}
		},
	},
	{
		id: "horizontal-rule",
		label: "Horizontal rule",
		description: "Insert a thematic break (`---`).",
		shortcut: "---",
		icon: <DividerElementIcon label="" size="small" />,
		run: (editor) => editor.chain().focus().setHorizontalRule().run(),
	},
];

function getCategoryIcon(category: RichTextMentionCategory): ReactNode {
	if (isRichTextReferenceCategory(category)) {
		return getRichTextReferenceCategoryIcon(category);
	}

	switch (category) {
		case "human":
			return <PersonIcon label="" size="small" />;
		case "team":
			return <TeamsIcon label="" size="small" />;
	}
}

function getSlashCategoryIcon(category: RichTextSlashCategory): ReactNode {
	return category === "format"
		? <TextIcon label="" size="small" />
		: getCategoryIcon(category);
}

function getSlashCategoryLabel(category: RichTextSlashCategory): string {
	return category === "format" ? "Format" : getRichTextReferenceCategoryLabel(category);
}

export function RichTextSuggestionMenu({
	className,
	emptyLabel,
	items,
	onBack,
	onSelect,
	renderFirstItemAsInput = false,
	selectedIndex,
	title,
}: Readonly<RichTextSuggestionMenuProps>) {
	const listRef = useRef<HTMLDivElement | null>(null);
	const [hasScrolledList, setHasScrolledList] = useState(false);
	const isNested = Boolean(onBack);

	const updateListScrollState = useCallback(() => {
		const listElement = listRef.current;
		setHasScrolledList(Boolean(listElement && listElement.scrollTop > 0));
	}, []);

	useEffect(() => {
		const listElement = listRef.current;
		if (listElement) {
			listElement.scrollTop = 0;
		}
		updateListScrollState();
	}, [isNested, title, updateListScrollState]);

	useLayoutEffect(() => {
		const listElement = listRef.current;
		const selectedElement = listElement?.querySelector<HTMLElement>("[role='option'][aria-selected='true']");
		if (!listElement || !selectedElement) {
			return;
		}

		selectedElement.scrollIntoView({ block: "nearest" });
		updateListScrollState();
	}, [items, selectedIndex, title, updateListScrollState]);

	return (
		<div
			className={cn("rich-text-command-menu", className)}
			data-nested={isNested ? "true" : undefined}
			data-list-scrolled={isNested && hasScrolledList ? "true" : undefined}
			role="listbox"
			aria-label={title}
		>
			{onBack ? (
				<button
					type="button"
					className="rich-text-command-menu-item rich-text-command-menu-back"
					onMouseDown={(event) => event.preventDefault()}
					onClick={onBack}
				>
					<span className="inline-flex size-8 items-center justify-center">
						<ArrowLeftIcon className="size-4" />
					</span>
					<span className="rich-text-command-menu-label">Back</span>
				</button>
			) : null}
			<div
				className="rich-text-command-menu-list"
				ref={listRef}
				onScroll={updateListScrollState}
			>
				{items.length > 0 ? (
					items.map((item, index) =>
						item.headingLabel !== undefined ? (
							<div
								key={item.id}
								className="rich-text-command-menu-heading"
								role="presentation"
							>
								{item.headingLabel}
							</div>
						) : renderFirstItemAsInput && index === 0 ? (
							<RichTextSuggestionMenuInputOption
								key={item.id}
								item={item}
								onSelect={onSelect}
							/>
						) : (
							<RichTextSuggestionMenuOption
								key={item.id}
								isSelected={index === selectedIndex}
								item={item}
								onSelect={onSelect}
							/>
						),
					)
				) : (
					<div className="rich-text-command-menu-empty">{emptyLabel}</div>
				)}
			</div>
		</div>
	);
}

interface RichTextSuggestionMenuOptionProps {
	isSelected: boolean;
	item: RichTextSuggestionMenuItem;
	onSelect: (item: RichTextSuggestionMenuItem) => void;
}

function RichTextSuggestionMenuOption({
	isSelected,
	item,
	onSelect,
}: Readonly<RichTextSuggestionMenuOptionProps>) {
	// Descriptions reveal on hover/selection wherever an item has one, in both
	// the nested drill-in lists and the merged flat lists, so the collapsed row
	// stays compact (label only) until the user lands on it. Rows that opt into
	// `persistentDescription` (nested parent rows with a count byline) instead
	// keep their description visible at all times.
	const hasDescription = Boolean(item.description);
	const showsPersistentDescription = hasDescription && Boolean(item.persistentDescription);
	const canRevealMetadata = hasDescription && !item.persistentDescription;
	const className = cn(
		"rich-text-command-menu-item",
		isSelected && "rich-text-command-menu-item-selected",
		item.isSticky && "rich-text-command-menu-item-sticky",
	);
	const children = (
		<>
			<RichTextSuggestionMenuItemVisual item={item} />
			{canRevealMetadata ? (
				<span className="rich-text-command-menu-copy rich-text-command-menu-nested-copy rich-text-command-menu-nested-copy-revealable">
					<motion.span
						className="rich-text-command-menu-label"
						style={{ willChange: "transform" }}
						variants={nestedCommandLabelVariants}
					>
						{item.label}
					</motion.span>
					<motion.span
						className="rich-text-command-menu-description rich-text-command-menu-nested-description"
						style={{ willChange: "transform, opacity" }}
						variants={nestedCommandDescriptionVariants}
					>
						{item.description}
					</motion.span>
				</span>
			) : (
				<span className="rich-text-command-menu-copy">
					<span className="rich-text-command-menu-label">{item.label}</span>
					{showsPersistentDescription ? (
						<span className="rich-text-command-menu-description">
							{item.description}
						</span>
					) : null}
				</span>
			)}
			{item.shortcut ? (
				<span className="rich-text-command-menu-shortcut">
					{item.shortcut}
				</span>
			) : null}
		</>
	);

	if (canRevealMetadata) {
		return (
			<motion.button
				type="button"
				role="option"
				aria-selected={isSelected}
				animate={isSelected ? "active" : "idle"}
				className={className}
				disabled={item.disabled}
				initial={false}
				onMouseDown={(event) => event.preventDefault()}
				onClick={() => onSelect(item)}
				whileFocus="active"
				whileHover="active"
			>
				{children}
			</motion.button>
		);
	}

	return (
		<button
			type="button"
			role="option"
			aria-selected={isSelected}
			className={className}
			disabled={item.disabled}
			onMouseDown={(event) => event.preventDefault()}
			onClick={() => onSelect(item)}
		>
			{children}
		</button>
	);
}

interface RichTextSuggestionMenuInputOptionProps {
	item: RichTextSuggestionMenuItem;
	onSelect: (item: RichTextSuggestionMenuItem) => void;
}

/**
 * Renders a menu item as a subtle text input with its visual (e.g. the Rovo
 * logo) kept at the front. Pressing Enter selects the underlying item.
 */
function RichTextSuggestionMenuInputOption({
	item,
	onSelect,
}: Readonly<RichTextSuggestionMenuInputOptionProps>) {
	return (
		<div className="rich-text-command-menu-item rich-text-command-menu-input">
			<span className="rich-text-command-menu-input-logo" aria-hidden={true}>
				{item.icon}
			</span>
			<Input
				variant="subtle"
				isCompact
				aria-label={item.label}
				placeholder={item.label}
				disabled={item.disabled}
				onKeyDown={(event) => {
					if (event.key === "Enter") {
						event.preventDefault();
						onSelect(item);
					}
				}}
			/>
		</div>
	);
}

function RichTextSuggestionMenuItemVisual({
	item,
}: Readonly<{ item: RichTextSuggestionMenuItem }>) {
	if (item.visual) {
		return (
			<RichTextMentionVisualMark
				className="rich-text-command-menu-avatar"
				label={item.label}
				size="menu"
				visual={item.visual}
			/>
		);
	}

	return (
		<IconTile
			size={MENU_VISUAL_TILE_SIZE}
			label={item.label}
			aria-hidden={true}
			className="rich-text-command-menu-avatar border border-border bg-surface text-icon-subtlest"
			icon={item.icon}
		/>
	);
}

function filterItems<T extends { label: string; description?: string; isSticky?: boolean }>(
	items: readonly T[],
	query: string,
): readonly T[] {
	const normalizedQuery = query.trim().toLowerCase();
	if (!normalizedQuery) {
		return items;
	}

	return items.filter((item) => {
		if (item.isSticky) {
			return true;
		}

		const haystack = `${item.label} ${item.description ?? ""}`.toLowerCase();
		return haystack.includes(normalizedQuery);
	});
}

function createPopup(anchorToInput = false): HTMLDivElement {
	const element = document.createElement("div");
	element.className = anchorToInput
		? "rich-text-command-menu-popover rich-text-command-menu-popover-anchored"
		: "rich-text-command-menu-popover";
	document.body.appendChild(element);
	return element;
}

function positionPopup(
	element: HTMLDivElement | null,
	clientRect?: (() => DOMRect | null) | null,
): void {
	if (!element || !clientRect) {
		return;
	}

	const rect = clientRect();
	if (!rect) {
		return;
	}

	element.style.left = `${rect.left}px`;
	element.style.top = `${rect.bottom + 6}px`;
}

/**
 * Chat-composer positioning: instead of opening at the caret, anchor the palette
 * to the prompt-input box (the `.chat-composer-form`), span its full width, and
 * sit 8px away. Flips above the input when there isn't room below — so the menu
 * follows available viewport space.
 */
const COMPOSER_POPUP_GAP = 8;

function positionComposerPopup(
	element: HTMLDivElement | null,
	editorDom?: HTMLElement | null,
): void {
	if (!element || !editorDom) {
		return;
	}

	const box =
		editorDom.closest<HTMLElement>(".chat-composer-form") ??
		editorDom.closest<HTMLElement>("form");
	if (!box) {
		return;
	}

	const rect = box.getBoundingClientRect();
	const popupHeight = element.offsetHeight || 0;
	const spaceBelow = window.innerHeight - rect.bottom - COMPOSER_POPUP_GAP;
	const spaceAbove = rect.top - COMPOSER_POPUP_GAP;
	// Prefer below; flip up only when the menu doesn't fit below but fits better above.
	const placeAbove = popupHeight > spaceBelow && spaceAbove > spaceBelow;

	element.style.maxWidth = "none";
	element.style.left = `${rect.left}px`;
	element.style.width = `${rect.width}px`;
	element.style.top = placeAbove
		? `${Math.max(COMPOSER_POPUP_GAP, rect.top - popupHeight - COMPOSER_POPUP_GAP)}px`
		: `${rect.bottom + COMPOSER_POPUP_GAP}px`;
}

/**
 * Attach the input-anchored positioning + a resize/scroll reposition loop for a
 * chat-composer palette. Returns a cleanup that detaches the listeners. A double
 * rAF lets the menu render (and re-render after a category drill-in) so its
 * measured height drives the up/down flip on the next frame.
 */
function attachComposerAnchor(
	element: HTMLDivElement | null,
	editorDom: HTMLElement | null,
): () => void {
	let frame = 0;
	const reposition = () => positionComposerPopup(element, editorDom);
	// Coalesce bursty scroll/resize events into a single reposition per frame —
	// each reposition does a getBoundingClientRect read + style writes, so an
	// unthrottled capture-phase scroll listener would force-reflow on every event
	// during momentum scrolling.
	const scheduleReposition = () => {
		if (frame) {
			return;
		}
		frame = requestAnimationFrame(() => {
			frame = 0;
			reposition();
		});
	};
	reposition();
	requestAnimationFrame(reposition);
	window.addEventListener("resize", scheduleReposition);
	// Capture phase so we also catch scrolls inside scrollable ancestors; passive
	// since we never preventDefault.
	window.addEventListener("scroll", scheduleReposition, { capture: true, passive: true });
	return () => {
		if (frame) {
			cancelAnimationFrame(frame);
		}
		window.removeEventListener("resize", scheduleReposition);
		window.removeEventListener("scroll", scheduleReposition, { capture: true });
	};
}

/**
 * A "/" selection is either a basic-block command to run or a reference item to
 * insert as a mention token (the migrated Skills/Tools/Knowledge categories).
 */
export type RichTextSlashAction =
	| { type: "ask-rovo"; onAskRovo?: (editor: Editor) => void }
	| { type: "command"; run: (editor: Editor) => void }
	| { type: "mention"; mention: RichTextMentionItem };

function isSlashCategoryId(id: string): id is RichTextSlashCategory {
	return (SLASH_CATEGORY_ORDER as readonly string[]).includes(id);
}

export function getSlashCommandFormatItems(
	query = "",
): readonly RichTextSuggestionMenuItem[] {
	return filterItems(
		SLASH_COMMANDS.map((command) => ({
			description: command.description,
			icon: command.icon,
			id: command.id,
			label: command.label,
			shortcut: command.shortcut,
		})),
		query,
	);
}

/**
 * Layout for the live suggestion menus. `"flat"` merges every section of a
 * surface into one list separated by headings; `"nested"` keeps the original
 * drill-in category lists.
 */
type SuggestionVariant = "nested" | "flat";

/** Max items shown per section (empty query) before the section footer. */
const FLAT_SECTION_LIMIT = 5;

/** Prefix for the synthetic footer rows ("Browse all" / "View more"). */
const FLAT_FOOTER_ID_PREFIX = "__rich-text-flat-footer__";

function getFlatFooterId(category: string): string {
	return `${FLAT_FOOTER_ID_PREFIX}${category}`;
}

function isFlatFooterId(id: string): boolean {
	return id.startsWith(FLAT_FOOTER_ID_PREFIX);
}

/** One section of a merged flat surface. */
interface FlatSectionSpec {
	/** Stable key used for the heading id, footer id, and expansion state. */
	key: string;
	/** Section heading text (mirrors the dropdown menu group label). */
	title: string;
	/**
	 * Directory-backed sections show a "Browse all" footer that links out;
	 * the rest show a "View more" / "View less" footer that expands inline.
	 */
	hasDirectory: boolean;
	/** Full item list for the section (already mapped to menu items). */
	items: readonly RichTextSuggestionMenuItem[];
}

/**
 * Builds the rows for a merged flat surface from its sections.
 *
 * - Empty query: each section leads with a heading, caps at five items, and
 *   ends with a footer ("Browse all" for directory sections, "View more" /
 *   "View less" for the rest). "View more" sections honor `expandedSections`.
 * - Non-empty query: every section is filtered, empty sections (and their
 *   headings/footers) are dropped, and all matches are shown with no cap.
 *
 * `stickyLeadItems` (e.g. "Ask Rovo") are prepended verbatim, before any
 * heading, and are kept regardless of the query.
 */
function buildFlatSurfaceRows(
	sections: readonly FlatSectionSpec[],
	query: string,
	expandedSections: Readonly<Record<string, boolean>>,
	stickyLeadItems: readonly RichTextSuggestionMenuItem[] = [],
): readonly RichTextSuggestionMenuItem[] {
	const normalizedQuery = query.trim();
	const isFiltering = normalizedQuery.length > 0;
	const rows: RichTextSuggestionMenuItem[] = [...stickyLeadItems];

	for (const section of sections) {
		const matchedItems = isFiltering
			? filterItems(section.items, normalizedQuery)
			: section.items;
		if (matchedItems.length === 0) {
			continue;
		}

		rows.push({
			id: `${section.key}-heading`,
			label: section.title,
			headingLabel: section.title,
			icon: null,
		});

		if (isFiltering) {
			// While filtering, show every match across all sections — no caps.
			rows.push(...matchedItems);
			continue;
		}

		const overflowing = matchedItems.length > FLAT_SECTION_LIMIT;
		const expanded = !section.hasDirectory && Boolean(expandedSections[section.key]);
		const visibleItems = expanded ? matchedItems : matchedItems.slice(0, FLAT_SECTION_LIMIT);
		rows.push(...visibleItems);

		if (overflowing) {
			rows.push(
				section.hasDirectory
					? {
							id: getFlatFooterId(section.key),
							label: "Browse all",
							icon: <ShowMoreHorizontalIcon label="" size="small" />,
							isSticky: true,
						}
					: {
							id: getFlatFooterId(section.key),
							label: expanded ? "View less" : "View more",
							icon: <ChevronDownIcon label="" size="small" />,
							isSticky: true,
						},
			);
		}
	}

	return rows;
}

/** A row is selectable when it is neither a section heading nor disabled. */
function isSelectableRow(item: RichTextSuggestionMenuItem): boolean {
	return item.headingLabel === undefined && !item.disabled;
}

/** First selectable index at or after `from` (wrapping), or -1 if none. */
function getFirstSelectableIndex(
	items: readonly RichTextSuggestionMenuItem[],
	from = 0,
): number {
	for (let offset = 0; offset < items.length; offset += 1) {
		const index = (from + offset) % items.length;
		if (isSelectableRow(items[index])) {
			return index;
		}
	}
	return -1;
}

/**
 * Moves the selected index to the next selectable row in `direction`, skipping
 * heading rows and wrapping around the list.
 */
function getNextSelectableIndex(
	items: readonly RichTextSuggestionMenuItem[],
	currentIndex: number,
	direction: -1 | 1,
): number {
	if (items.length === 0) {
		return 0;
	}
	for (let step = 1; step <= items.length; step += 1) {
		const index = (currentIndex + direction * step + items.length * step) % items.length;
		if (isSelectableRow(items[index])) {
			return index;
		}
	}
	return currentIndex;
}

/** Page up/down to a selectable row, clamped to the list bounds. */
function getPagedSelectableIndex(
	items: readonly RichTextSuggestionMenuItem[],
	currentIndex: number,
	direction: -1 | 1,
): number {
	if (items.length === 0) {
		return 0;
	}
	const target = Math.min(
		Math.max(currentIndex + direction * SUGGESTION_PAGE_KEY_STEP, 0),
		items.length - 1,
	);
	// Snap onto the nearest selectable row in the travel direction.
	for (let index = target; index >= 0 && index < items.length; index += direction) {
		if (isSelectableRow(items[index])) {
			return index;
		}
	}
	return getFirstSelectableIndex(items, target);
}

export function createSlashSuggestionRenderer(
	getMentionSources?: () => RichTextMentionSources | undefined,
	onAskRovo?: (editor: Editor) => void,
	includeFormat = true,
	anchorToInput = false,
	variant: SuggestionVariant = "flat",
) {
	const popupState: SuggestionPopupState = { component: null, element: null, cleanup: null };
	let selectedIndex = 0;
	let activeCategory: RichTextSlashCategory | null = null;
	let currentProps: SuggestionProps<RichTextSlashAction, RichTextSlashAction> | null = null;
	// Per-section inline expansion for "View more" footers (flat variant only).
	const expandedSections: Record<string, boolean> = {};

	const isFlat = variant === "flat";

	/** Maps a "/" category to its full, unfiltered menu items. */
	function getCategoryMenuItems(
		category: RichTextSlashCategory,
	): readonly RichTextSuggestionMenuItem[] {
		return category === "format"
			? getSlashCommandFormatItems()
			: getMentionChildItems(getMentionSources?.(), category);
	}

	/** Flat surface sections in slash order (skills, tools, knowledge, format). */
	function getFlatSections(): readonly FlatSectionSpec[] {
		return getSlashCategoryOrder(includeFormat).map((category) => ({
			key: category,
			title: getSlashCategoryLabel(category),
			// Reference categories link out to a directory; "format" expands inline.
			hasDirectory: category !== "format",
			items: getCategoryMenuItems(category),
		}));
	}

	// --- Nested (drill-in) item resolution -------------------------------------
	function getTopLevelItems(query: string): readonly RichTextSuggestionMenuItem[] {
		return filterItems(getSlashCommandCategoryItems(getMentionSources?.(), includeFormat), query);
	}

	function getChildItems(query: string): readonly RichTextSuggestionMenuItem[] {
		if (!activeCategory) {
			return [];
		}

		if (activeCategory === "format") {
			return getSlashCommandFormatItems(query);
		}

		return filterItems(getMentionChildItems(getMentionSources?.(), activeCategory), query);
	}

	function getVisibleItems(query: string): readonly RichTextSuggestionMenuItem[] {
		if (isFlat) {
			return buildFlatSurfaceRows(getFlatSections(), query, expandedSections, [ASK_ROVO_SLASH_ITEM]);
		}
		return activeCategory ? getChildItems(query) : getTopLevelItems(query);
	}

	function update(props: SuggestionProps<RichTextSlashAction, RichTextSlashAction>) {
		currentProps = props;
		const items = getVisibleItems(props.query);
		selectedIndex = clampSelectedIndex(items, selectedIndex);
		if (anchorToInput) {
			positionComposerPopup(popupState.element, props.editor.view.dom);
		} else {
			positionPopup(popupState.element, props.clientRect);
		}
		popupState.component?.updateProps({
			emptyLabel: !isFlat && activeCategory ? "No matching items" : "No commands found",
			items,
			onBack: !isFlat && activeCategory
				? () => {
						activeCategory = null;
						selectedIndex = 0;
						update(props);
					}
				: undefined,
			onSelect: (item: RichTextSuggestionMenuItem) => selectItem(item),
			// "Ask Rovo" renders as the subtle input row (matching the editor
			// palette). In flat mode it is always the first row; in nested mode it
			// only appears at the top level.
			renderFirstItemAsInput: isFlat || !activeCategory,
			selectedIndex,
			title: !isFlat && activeCategory ? getSlashCategoryLabel(activeCategory) : "Commands",
		});
	}

	/** Clamp/snap the selection onto a selectable row (skips headings). */
	function clampSelectedIndex(
		items: readonly RichTextSuggestionMenuItem[],
		index: number,
	): number {
		if (items.length === 0) {
			return 0;
		}
		const bounded = Math.min(Math.max(index, 0), items.length - 1);
		return isSelectableRow(items[bounded])
			? bounded
			: Math.max(getFirstSelectableIndex(items, bounded), 0);
	}

	function selectItem(item: RichTextSuggestionMenuItem | undefined): boolean {
		if (!item || !currentProps) {
			return false;
		}

		if (item.id === ASK_ROVO_SLASH_ITEM.id) {
			currentProps.command({ type: "ask-rovo", onAskRovo });
			return true;
		}

		if (isFlat) {
			// "Browse all" footers link out to a directory we don't host here; keep
			// the menu open. "View more" / "View less" footers toggle the section.
			if (isFlatFooterId(item.id)) {
				const sectionKey = item.id.slice(FLAT_FOOTER_ID_PREFIX.length);
				if (item.label === "View more" || item.label === "View less") {
					expandedSections[sectionKey] = !expandedSections[sectionKey];
					update(currentProps);
				}
				return true;
			}

			// Format commands run; everything else inserts a reference mention.
			const command = SLASH_COMMANDS.find((candidate) => candidate.id === item.id);
			if (command) {
				currentProps.command({ type: "command", run: command.run });
				return true;
			}

			const mention = findMentionAcrossCategories(item.id);
			if (mention) {
				currentProps.command({ type: "mention", mention });
				return true;
			}
			return false;
		}

		if (activeCategory) {
			if (activeCategory === "format") {
				const command = SLASH_COMMANDS.find((candidate) => candidate.id === item.id);
				if (!command) {
					return false;
				}

				currentProps.command({ type: "command", run: command.run });
				return true;
			}

			const mention = getCategoryItems(getMentionSources?.(), activeCategory).find(
				(candidate) => candidate.id === item.id,
			);
			if (!mention) {
				return false;
			}

			currentProps.command({ type: "mention", mention });
			return true;
		}

		if (isSlashCategoryId(item.id)) {
			activeCategory = item.id;
			selectedIndex = 0;
			update(currentProps);
			return true;
		}
		return false;
	}

	/** Find a reference mention by id across every "/" reference category. */
	function findMentionAcrossCategories(id: string): RichTextMentionItem | undefined {
		for (const category of getSlashCategoryOrder(includeFormat)) {
			if (category === "format") {
				continue;
			}
			const mention = getCategoryItems(getMentionSources?.(), category).find(
				(candidate) => candidate.id === id,
			);
			if (mention) {
				return mention;
			}
		}
		return undefined;
	}

	function moveSelection(direction: -1 | 1, paged: boolean) {
		if (!currentProps) {
			return;
		}
		const items = getVisibleItems(currentProps.query);
		selectedIndex = paged
			? getPagedSelectableIndex(items, selectedIndex, direction)
			: getNextSelectableIndex(items, selectedIndex, direction);
		update(currentProps);
	}

	return {
		onStart: (props: SuggestionProps<RichTextSlashAction, RichTextSlashAction>) => {
			popupState.element = createPopup(anchorToInput);
			popupState.component = new ReactRenderer(RichTextSuggestionMenu, {
				editor: props.editor,
				props: {
					className: "rich-text-command-menu-borderless",
					emptyLabel: "No commands found",
					items: getVisibleItems(props.query),
					onSelect: (item: RichTextSuggestionMenuItem) => selectItem(item),
					// Menus always open with "Ask Rovo" as the subtle input row
					// (matching the editor palette).
					renderFirstItemAsInput: true,
					selectedIndex,
					title: "Commands",
				},
			});
			popupState.element.appendChild(popupState.component.element);
			update(props);
			if (anchorToInput) {
				popupState.cleanup = attachComposerAnchor(popupState.element, props.editor.view.dom);
			}
		},
		onUpdate: update,
		onKeyDown: ({ event }: SuggestionKeyDownProps) => {
			if (!currentProps) {
				return false;
			}
			const items = getVisibleItems(currentProps.query);
			if (event.key === "ArrowDown") {
				moveSelection(1, false);
				return true;
			}
			if (event.key === "ArrowUp") {
				moveSelection(-1, false);
				return true;
			}
			if (event.key === "PageDown") {
				moveSelection(1, true);
				return true;
			}
			if (event.key === "PageUp") {
				moveSelection(-1, true);
				return true;
			}
			if (event.key === "Home") {
				selectedIndex = Math.max(getFirstSelectableIndex(items, 0), 0);
				update(currentProps);
				return true;
			}
			if (event.key === "End") {
				selectedIndex = clampSelectedIndex(items, items.length - 1);
				update(currentProps);
				return true;
			}
			if (event.key === "Enter" || event.key === "Tab") {
				return selectItem(items[selectedIndex]);
			}
			if (event.key === "Backspace" && !isFlat && activeCategory) {
				activeCategory = null;
				selectedIndex = 0;
				update(currentProps);
				return true;
			}
			if (event.key === "Escape") {
				return false;
			}
			return false;
		},
		onExit: () => {
			popupState.cleanup?.();
			popupState.cleanup = null;
			popupState.component?.destroy();
			popupState.element?.remove();
			popupState.component = null;
			popupState.element = null;
			currentProps = null;
			selectedIndex = 0;
			activeCategory = null;
		},
	};
}

function getMergedMentionSources(
	sources: RichTextMentionSources | undefined,
): RichTextMentionSources {
	const mergeCategoryItems = (category: RichTextMentionCategory): readonly RichTextMentionItem[] => {
		const merged = [...(sources?.[category] ?? []), ...(STATIC_MENTION_ITEMS[category] ?? [])];
		const seen = new Set<string>();

		return merged.filter((item) => {
			const key = `${item.category}:${item.id}:${item.label.trim().toLowerCase()}`;
			if (seen.has(key)) {
				return false;
			}
			seen.add(key);
			return true;
		});
	};

	return {
		...STATIC_MENTION_ITEMS,
		...sources,
		subagent: mergeCategoryItems("subagent"),
		human: mergeCategoryItems("human"),
		team: mergeCategoryItems("team"),
		skill: mergeCategoryItems("skill"),
		tool: mergeCategoryItems("tool"),
		knowledge: mergeCategoryItems("knowledge"),
	};
}

function getCategoryItems(
	sources: RichTextMentionSources | undefined,
	category: RichTextMentionMenuCategory,
): readonly RichTextMentionItem[] {
	if (category === "people-team") {
		return [
			...getCategoryItems(sources, "human"),
			...getCategoryItems(sources, "team"),
		];
	}

	return getMergedMentionSources(sources)[category] ?? [];
}

/** Lowercase, dotted handle from a display name (e.g. "Andrea Wilson" -> "andrea.wilson"). */
function getMentionHandle(name: string): string {
	return (
		name
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, ".")
			.replace(/^\.+|\.+$/g, "") || "user"
	);
}

/** Stable, pseudo-random member count (10-200) derived from the team id. */
function getStableMemberCount(seed: string): number {
	let hash = 0;

	for (let index = 0; index < seed.length; index += 1) {
		hash = ((hash * 31) + seed.charCodeAt(index)) >>> 0;
	}

	return 10 + (hash % 191);
}

function getMentionChildDescription(item: RichTextMentionItem): string {
	if (item.description) {
		return item.description;
	}

	switch (item.category) {
		case "subagent":
			return `Delegate context or follow-up work to ${item.label}.`;
		case "human":
			return `@${getMentionHandle(item.label)}`;
		case "team":
			return `${getStableMemberCount(item.id)} members`;
		case "skill":
			return `Run the ${item.label} skill.`;
		case "tool":
			return `Use ${item.label} for this task.`;
		case "knowledge":
			return `Reference ${item.label} as knowledge context.`;
		default: {
			// Exhaustiveness guard: a new RichTextMentionCategory must add a case above.
			const exhaustiveCategory: never = item.category;
			return exhaustiveCategory;
		}
	}
}

function getStableAssetIndex(seed: string, assetCount: number): number {
	let hash = 0;

	for (let index = 0; index < seed.length; index += 1) {
		hash = ((hash * 31) + seed.charCodeAt(index)) >>> 0;
	}

	return hash % assetCount;
}

function getMentionChildVisual(
	item: RichTextMentionItem,
): RichTextMentionVisual | undefined {
	if (item.visual) {
		return item.visual;
	}

	if (item.category === "human") {
		const nameSlug = item.label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
		const matchedByName = PEOPLE_AVATAR_SRCS.find((src) =>
			src.includes(`/avatar-user/${nameSlug}/`),
		);

		return {
			kind: "avatar",
			shape: "circle",
			src:
				matchedByName ??
				PEOPLE_AVATAR_SRCS[
					getStableAssetIndex(`${item.category}:${item.id}`, PEOPLE_AVATAR_SRCS.length)
				],
		};
	}

	if (item.category === "team") {
		return {
			kind: "avatar",
			shape: "square",
			src: TEAM_AVATAR_SRCS[
				getStableAssetIndex(`${item.category}:${item.id}`, TEAM_AVATAR_SRCS.length)
			],
		};
	}

	if (item.category === "subagent") {
		return {
			kind: "avatar",
			shape: "hexagon",
			src: AGENT_AVATAR_SRCS[
				getStableAssetIndex(`${item.category}:${item.id}`, AGENT_AVATAR_SRCS.length)
			],
		};
	}

	return undefined;
}

function buildCategoryMenuItems(
	order: readonly RichTextMentionParentCategory[],
	sources: RichTextMentionSources | undefined,
): readonly RichTextSuggestionMenuItem[] {
	return order.map((category) => ({
		description: `${getCategoryItems(sources, category).length} available`,
		persistentDescription: true,
		icon: category === "people-team"
			? <PeopleGroupIcon label="" size="small" />
			: getCategoryIcon(category),
		id: category,
		label: MENTION_PARENT_LABELS[category],
	}));
}

/** Parent entries for the "@" mention surface: people/teams and subagents. */
export function getMentionTargetItems(
	sources?: RichTextMentionSources,
): readonly RichTextSuggestionMenuItem[] {
	return buildCategoryMenuItems(MENTION_TARGET_ORDER, sources);
}

/** Parent entries for the "/" command surface: skills, tools, knowledge. */
export function getSlashCommandCategoryItems(
	sources?: RichTextMentionSources,
	includeFormat = true,
): readonly RichTextSuggestionMenuItem[] {
	return [
		ASK_ROVO_SLASH_ITEM,
		...getSlashCategoryOrder(includeFormat).map((category) => ({
			description: category === "format"
				? `${SLASH_COMMANDS.length} options`
				: `${getCategoryItems(sources, category).length} available`,
			persistentDescription: true,
			icon: getSlashCategoryIcon(category),
			id: category,
			label: getSlashCategoryLabel(category),
		})),
	];
}

/** Nested reference items for a single category (e.g. the Skills submenu). */
export function getMentionChildItems(
	sources: RichTextMentionSources | undefined,
	category: RichTextMentionMenuCategory,
): readonly RichTextSuggestionMenuItem[] {
	return getCategoryItems(sources, category).map((item) => ({
		description: getMentionChildDescription(item),
		icon: getCategoryIcon(item.category),
		id: item.id,
		label: item.label,
		visual: getMentionChildVisual(item),
	}));
}

/** "@" surface sections in mention order: people & team, then subagents. */
const MENTION_FLAT_SECTIONS: readonly { category: RichTextMentionParentCategory; hasDirectory: boolean }[] = [
	{ category: "people-team", hasDirectory: false },
	{ category: "subagent", hasDirectory: true },
];

export function createMentionSuggestionRenderer(
	getMentionSources?: () => RichTextMentionSources | undefined,
	anchorToInput = false,
	variant: SuggestionVariant = "flat",
) {
	const popupState: SuggestionPopupState = { component: null, element: null, cleanup: null };
	let selectedIndex = 0;
	let activeCategory: RichTextMentionParentCategory | null = null;
	let currentProps: SuggestionProps<RichTextMentionItem, RichTextMentionItem> | null = null;
	// Per-section inline expansion for "View more" footers (flat variant only).
	const expandedSections: Record<string, boolean> = {};

	const isFlat = variant === "flat";

	/** Flat surface sections: people & team, then subagents. */
	function getFlatSections(): readonly FlatSectionSpec[] {
		return MENTION_FLAT_SECTIONS.map(({ category, hasDirectory }) => ({
			key: category,
			title: MENTION_PARENT_LABELS[category],
			hasDirectory,
			items: getMentionChildItems(getMentionSources?.(), category),
		}));
	}

	function getParentItems(query: string): readonly RichTextSuggestionMenuItem[] {
		return filterItems(getMentionTargetItems(getMentionSources?.()), query);
	}

	function getChildItems(query: string): readonly RichTextSuggestionMenuItem[] {
		if (!activeCategory) {
			return [];
		}

		return filterItems(getMentionChildItems(getMentionSources?.(), activeCategory), query);
	}

	function getVisibleItems(
		props: SuggestionProps<RichTextMentionItem, RichTextMentionItem>,
	): readonly RichTextSuggestionMenuItem[] {
		if (isFlat) {
			return buildFlatSurfaceRows(getFlatSections(), props.query, expandedSections);
		}
		return activeCategory ? getChildItems(props.query) : getParentItems(props.query);
	}

	/** Clamp/snap the selection onto a selectable row (skips headings). */
	function clampSelectedIndex(
		items: readonly RichTextSuggestionMenuItem[],
		index: number,
	): number {
		if (items.length === 0) {
			return 0;
		}
		const bounded = Math.min(Math.max(index, 0), items.length - 1);
		return isSelectableRow(items[bounded])
			? bounded
			: Math.max(getFirstSelectableIndex(items, bounded), 0);
	}

	function update(props: SuggestionProps<RichTextMentionItem, RichTextMentionItem>) {
		currentProps = props;
		const items = getVisibleItems(props);
		selectedIndex = clampSelectedIndex(items, selectedIndex);
		if (anchorToInput) {
			positionComposerPopup(popupState.element, props.editor.view.dom);
		} else {
			positionPopup(popupState.element, props.clientRect);
		}
		popupState.component?.updateProps({
			emptyLabel: !isFlat && activeCategory ? "No matching items" : "No people or agents found",
			items,
			onBack: !isFlat && activeCategory
				? () => {
						activeCategory = null;
						selectedIndex = 0;
						update(props);
					}
				: undefined,
			onSelect: (item: RichTextSuggestionMenuItem) => selectItem(item),
			selectedIndex,
			title: !isFlat && activeCategory ? MENTION_PARENT_LABELS[activeCategory] : "Mention",
		});
	}

	/** Resolve a mention by id across both "@" parent categories. */
	function findMentionAcrossCategories(id: string): RichTextMentionItem | undefined {
		for (const { category } of MENTION_FLAT_SECTIONS) {
			const mention = getCategoryItems(getMentionSources?.(), category).find(
				(candidate) => candidate.id === id,
			);
			if (mention) {
				return mention;
			}
		}
		return undefined;
	}

	function selectItem(item: RichTextSuggestionMenuItem | undefined): boolean {
		if (!item || !currentProps) {
			return false;
		}

		if (isFlat) {
			// "Browse all" footers link out to a directory we don't host here; keep
			// the menu open. "View more" / "View less" footers toggle the section.
			if (isFlatFooterId(item.id)) {
				const sectionKey = item.id.slice(FLAT_FOOTER_ID_PREFIX.length);
				if (item.label === "View more" || item.label === "View less") {
					expandedSections[sectionKey] = !expandedSections[sectionKey];
					update(currentProps);
				}
				return true;
			}

			const mention = findMentionAcrossCategories(item.id);
			if (!mention) {
				return false;
			}
			currentProps.command(mention);
			return true;
		}

		if (!activeCategory) {
			activeCategory = item.id as RichTextMentionParentCategory;
			selectedIndex = 0;
			update(currentProps);
			return true;
		}

		const mention = getCategoryItems(getMentionSources?.(), activeCategory)
			.find((candidate) => candidate.id === item.id);
		if (!mention) {
			return false;
		}

		currentProps.command(mention);
		return true;
	}

	function moveSelection(direction: -1 | 1, paged: boolean) {
		if (!currentProps) {
			return;
		}
		const items = getVisibleItems(currentProps);
		selectedIndex = paged
			? getPagedSelectableIndex(items, selectedIndex, direction)
			: getNextSelectableIndex(items, selectedIndex, direction);
		update(currentProps);
	}

	return {
		onStart: (props: SuggestionProps<RichTextMentionItem, RichTextMentionItem>) => {
			popupState.element = createPopup(anchorToInput);
			popupState.component = new ReactRenderer(RichTextSuggestionMenu, {
				editor: props.editor,
				props: {
					className: "rich-text-command-menu-borderless",
					emptyLabel: "No people or agents found",
					items: getVisibleItems(props),
					onSelect: (item: RichTextSuggestionMenuItem) => selectItem(item),
					selectedIndex,
					title: "Mention",
				},
			});
			popupState.element.appendChild(popupState.component.element);
			update(props);
			if (anchorToInput) {
				popupState.cleanup = attachComposerAnchor(popupState.element, props.editor.view.dom);
			}
		},
		onUpdate: update,
		onKeyDown: ({ event }: SuggestionKeyDownProps) => {
			if (!currentProps) {
				return false;
			}
			const items = getVisibleItems(currentProps);
			if (event.key === "ArrowDown") {
				moveSelection(1, false);
				return true;
			}
			if (event.key === "ArrowUp") {
				moveSelection(-1, false);
				return true;
			}
			if (event.key === "PageDown") {
				moveSelection(1, true);
				return true;
			}
			if (event.key === "PageUp") {
				moveSelection(-1, true);
				return true;
			}
			if (event.key === "Home") {
				selectedIndex = Math.max(getFirstSelectableIndex(items, 0), 0);
				update(currentProps);
				return true;
			}
			if (event.key === "End") {
				selectedIndex = clampSelectedIndex(items, items.length - 1);
				update(currentProps);
				return true;
			}
			if (event.key === "Enter" || event.key === "Tab") {
				return selectItem(items[selectedIndex]);
			}
			if (event.key === "Backspace" && !isFlat && activeCategory) {
				activeCategory = null;
				selectedIndex = 0;
				update(currentProps);
				return true;
			}
			if (event.key === "Escape") {
				return false;
			}
			return false;
		},
		onExit: () => {
			popupState.cleanup?.();
			popupState.cleanup = null;
			popupState.component?.destroy();
			popupState.element?.remove();
			popupState.component = null;
			popupState.element = null;
			currentProps = null;
			selectedIndex = 0;
			activeCategory = null;
		},
	};
}
