"use client";

import {
	useCallback,
	useEffect,
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

import LinkIcon from "@atlaskit/icon/core/link";
import PersonIcon from "@atlaskit/icon/core/person";
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
import { ArrowLeftIcon } from "@/components/ui/vpk-icons";
import { cn } from "@/lib/utils";

import { RichTextMentionVisualMark } from "./mention-visual";
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
	RichTextReferenceCategory,
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
	visual?: RichTextMentionVisual;
	disabled?: boolean;
}

interface RichTextSuggestionMenuProps {
	className?: string;
	emptyLabel: string;
	items: readonly RichTextSuggestionMenuItem[];
	onBack?: () => void;
	onSelect: (item: RichTextSuggestionMenuItem) => void;
	selectedIndex: number;
	title: string;
}

interface SuggestionPopupState {
	component: ReactRenderer<unknown, RichTextSuggestionMenuProps> | null;
	element: HTMLDivElement | null;
}

export type RichTextMentionMenuCategory = RichTextMentionCategory | "people-team";
type RichTextMentionParentCategory = "subagent" | "people-team";

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
	subagent: getRichTextReferenceCategoryLabel("subagent"),
	"people-team": "People and team",
};

/** "@" mention surface: people and agents only. */
const MENTION_TARGET_ORDER: readonly RichTextMentionParentCategory[] = [
	"subagent",
	"people-team",
];

/** "/" command surface: everything else, each opening a nested item list. */
const COMMAND_CATEGORY_ORDER: readonly RichTextCommandCategory[] = RICH_TEXT_REFERENCE_CATEGORY_OPTIONS.map((option) => option.category);

const SLASH_CATEGORY_ORDER: readonly RichTextSlashCategory[] = [
	...COMMAND_CATEGORY_ORDER,
	"format",
];

const STATIC_MENTION_ITEMS: RichTextMentionSources = {
	subagent: [
		{
			category: "subagent",
			id: "subagent:researcher",
			label: "Researcher",
			description: "Investigates open questions and gathers source context.",
		},
		{
			category: "subagent",
			id: "subagent:reviewer",
			label: "Reviewer",
			description: "Checks changes for regressions, risks, and missing tests.",
		},
		{
			category: "subagent",
			id: "subagent:designer",
			label: "Designer",
			description: "Explores UI polish, layout, and interaction refinements.",
		},
	],
	human: [
		{
			category: "human",
			id: "human:teammate",
			label: "Andrea Wilson",
		},
		{
			category: "human",
			id: "human:reviewer",
			label: "Brian Lin",
		},
		{
			category: "human",
			id: "human:stakeholder",
			label: "Florence Garcia",
		},
	],
	team: [
		{
			category: "team",
			id: "team:engineering",
			label: "Engineering",
		},
		{
			category: "team",
			id: "team:design",
			label: "Design",
		},
		{
			category: "team",
			id: "team:support",
			label: "Support",
		},
	],
	knowledge: [
		{
			category: "knowledge",
			id: "knowledge:agent-definition",
			label: "Agent definition",
			description: "Reference the canonical generated agent profile.",
		},
		{
			category: "knowledge",
			id: "knowledge:studio-thread",
			label: "Studio thread",
			description: "Reference the active Studio conversation.",
		},
		{
			category: "knowledge",
			id: "knowledge:work-item",
			label: "Work item",
			description: "Reference a Jira or project work item.",
		},
	],
	tool: [
		{
			category: "tool",
			id: "tool:web-search",
			label: "Web search",
			description: "Search the web for current public information.",
		},
		{
			category: "tool",
			id: "tool:teamwork-graph",
			label: "Teamwork Graph",
			description: "Find project, people, and work-item context.",
		},
		{
			category: "tool",
			id: "tool:jira",
			label: "Jira work items",
			description: "Read and update relevant Jira work items.",
		},
		{
			category: "tool",
			id: "tool:google-drive",
			label: "Google Drive",
			description: "Reference Drive and Docs content.",
		},
		{
			category: "tool",
			id: "tool:create-image",
			label: "Create image",
			description: "Generate visual assets when the agent task needs them.",
		},
	],
};

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
					<span className="inline-flex size-6 items-center justify-center">
						<ArrowLeftIcon size="small" />
					</span>
					<span className="block text-xs font-semibold leading-4 text-text-subtle">
						Back
					</span>
				</button>
			) : null}
			<div
				className="rich-text-command-menu-list"
				ref={listRef}
				onScroll={updateListScrollState}
			>
				{items.length > 0 ? (
					items.map((item, index) => (
						<RichTextSuggestionMenuOption
							key={item.id}
							isNested={isNested}
							isSelected={index === selectedIndex}
							item={item}
							onSelect={onSelect}
						/>
					))
				) : (
					<div className="rich-text-command-menu-empty">{emptyLabel}</div>
				)}
			</div>
		</div>
	);
}

interface RichTextSuggestionMenuOptionProps {
	isNested: boolean;
	isSelected: boolean;
	item: RichTextSuggestionMenuItem;
	onSelect: (item: RichTextSuggestionMenuItem) => void;
}

function RichTextSuggestionMenuOption({
	isNested,
	isSelected,
	item,
	onSelect,
}: Readonly<RichTextSuggestionMenuOptionProps>) {
	const canRevealMetadata = isNested && Boolean(item.description);
	const className = cn(
		"rich-text-command-menu-item",
		isSelected && "rich-text-command-menu-item-selected",
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
				<span className={cn(
					"rich-text-command-menu-copy",
					isNested && "rich-text-command-menu-nested-copy",
				)}>
					<span className="rich-text-command-menu-label">{item.label}</span>
					{item.description ? (
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

	if (isNested) {
		return (
			<motion.button
				type="button"
				role="option"
				aria-selected={isSelected}
				animate={canRevealMetadata && isSelected ? "active" : "idle"}
				className={className}
				disabled={item.disabled}
				initial={false}
				onMouseDown={(event) => event.preventDefault()}
				onClick={() => onSelect(item)}
				whileFocus={canRevealMetadata ? "active" : undefined}
				whileHover={canRevealMetadata ? "active" : undefined}
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
			size="small"
			label={item.label}
			aria-hidden={true}
			className="border border-border bg-surface text-icon-subtlest"
			icon={item.icon}
		/>
	);
}

function filterItems<T extends { label: string; description?: string }>(
	items: readonly T[],
	query: string,
): readonly T[] {
	const normalizedQuery = query.trim().toLowerCase();
	if (!normalizedQuery) {
		return items;
	}

	return items.filter((item) => {
		const haystack = `${item.label} ${item.description ?? ""}`.toLowerCase();
		return haystack.includes(normalizedQuery);
	});
}

function createPopup(): HTMLDivElement {
	const element = document.createElement("div");
	element.className = "rich-text-command-menu-popover";
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
 * A "/" selection is either a basic-block command to run or a reference item to
 * insert as a mention token (the migrated Skills/Tools/Knowledge categories).
 */
export type RichTextSlashAction =
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

export function createSlashSuggestionRenderer(
	getMentionSources?: () => RichTextMentionSources | undefined,
) {
	const popupState: SuggestionPopupState = { component: null, element: null };
	let selectedIndex = 0;
	let activeCategory: RichTextSlashCategory | null = null;
	let currentProps: SuggestionProps<RichTextSlashAction, RichTextSlashAction> | null = null;

	function getTopLevelItems(query: string): readonly RichTextSuggestionMenuItem[] {
		return filterItems(getSlashCommandCategoryItems(getMentionSources?.()), query);
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
		return activeCategory ? getChildItems(query) : getTopLevelItems(query);
	}

	function update(props: SuggestionProps<RichTextSlashAction, RichTextSlashAction>) {
		currentProps = props;
		const items = getVisibleItems(props.query);
		selectedIndex = Math.min(selectedIndex, Math.max(items.length - 1, 0));
		positionPopup(popupState.element, props.clientRect);
		popupState.component?.updateProps({
			emptyLabel: activeCategory ? "No matching items" : "No commands found",
			items,
			onBack: activeCategory
				? () => {
						activeCategory = null;
						selectedIndex = 0;
						update(props);
					}
				: undefined,
			onSelect: (item: RichTextSuggestionMenuItem) => selectItem(item),
			selectedIndex,
			title: activeCategory ? getSlashCategoryLabel(activeCategory) : "Commands",
		});
	}

	function selectItem(item: RichTextSuggestionMenuItem | undefined): boolean {
		if (!item || !currentProps) {
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

	return {
		onStart: (props: SuggestionProps<RichTextSlashAction, RichTextSlashAction>) => {
			popupState.element = createPopup();
			popupState.component = new ReactRenderer(RichTextSuggestionMenu, {
				editor: props.editor,
				props: {
					className: "rich-text-command-menu-borderless",
					emptyLabel: "No commands found",
					items: getVisibleItems(props.query),
					onSelect: (item: RichTextSuggestionMenuItem) => selectItem(item),
					selectedIndex,
					title: "Commands",
				},
			});
			popupState.element.appendChild(popupState.component.element);
			update(props);
		},
		onUpdate: update,
		onKeyDown: ({ event }: SuggestionKeyDownProps) => {
			if (!currentProps) {
				return false;
			}
			const items = getVisibleItems(currentProps.query);
			if (event.key === "ArrowDown") {
				selectedIndex = items.length > 0 ? (selectedIndex + 1) % items.length : 0;
				update(currentProps);
				return true;
			}
			if (event.key === "ArrowUp") {
				selectedIndex = items.length > 0
					? (selectedIndex + items.length - 1) % items.length
					: 0;
				update(currentProps);
				return true;
			}
			if (event.key === "Enter") {
				return selectItem(items[selectedIndex]);
			}
			if (event.key === "Backspace" && activeCategory) {
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
	}

	const exhaustiveCategory: never = item.category;
	return exhaustiveCategory;
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
		icon: category === "people-team"
			? <PeopleGroupIcon label="" size="small" />
			: getCategoryIcon(category),
		id: category,
		label: MENTION_PARENT_LABELS[category],
	}));
}

/** Parent entries for the "@" mention surface: subagents plus people and teams. */
export function getMentionTargetItems(
	sources?: RichTextMentionSources,
): readonly RichTextSuggestionMenuItem[] {
	return buildCategoryMenuItems(MENTION_TARGET_ORDER, sources);
}

/** Parent entries for the "/" command surface: subagents, skills, tools, knowledge. */
export function getSlashCommandCategoryItems(
	sources?: RichTextMentionSources,
): readonly RichTextSuggestionMenuItem[] {
	return SLASH_CATEGORY_ORDER.map((category) => ({
		description: category === "format"
			? `${SLASH_COMMANDS.length} options`
			: `${getCategoryItems(sources, category).length} available`,
		icon: getSlashCategoryIcon(category),
		id: category,
		label: getSlashCategoryLabel(category),
	}));
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

export function createMentionSuggestionRenderer(
	getMentionSources?: () => RichTextMentionSources | undefined,
) {
	const popupState: SuggestionPopupState = { component: null, element: null };
	let selectedIndex = 0;
	let activeCategory: RichTextMentionParentCategory | null = null;
	let currentProps: SuggestionProps<RichTextMentionItem, RichTextMentionItem> | null = null;

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
		return activeCategory ? getChildItems(props.query) : getParentItems(props.query);
	}

	function update(props: SuggestionProps<RichTextMentionItem, RichTextMentionItem>) {
		currentProps = props;
		const items = getVisibleItems(props);
		selectedIndex = Math.min(selectedIndex, Math.max(items.length - 1, 0));
		positionPopup(popupState.element, props.clientRect);
		popupState.component?.updateProps({
			emptyLabel: activeCategory ? "No matching items" : "No people or agents found",
			items,
			onBack: activeCategory
				? () => {
						activeCategory = null;
						selectedIndex = 0;
						update(props);
					}
				: undefined,
			onSelect: (item: RichTextSuggestionMenuItem) => selectItem(item),
			selectedIndex,
			title: activeCategory ? MENTION_PARENT_LABELS[activeCategory] : "Mention",
		});
	}

	function selectItem(item: RichTextSuggestionMenuItem | undefined): boolean {
		if (!item || !currentProps) {
			return false;
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

	return {
		onStart: (props: SuggestionProps<RichTextMentionItem, RichTextMentionItem>) => {
			popupState.element = createPopup();
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
		},
		onUpdate: update,
		onKeyDown: ({ event }: SuggestionKeyDownProps) => {
			if (!currentProps) {
				return false;
			}
			const items = getVisibleItems(currentProps);
			if (event.key === "ArrowDown") {
				selectedIndex = items.length > 0 ? (selectedIndex + 1) % items.length : 0;
				update(currentProps);
				return true;
			}
			if (event.key === "ArrowUp") {
				selectedIndex = items.length > 0
					? (selectedIndex + items.length - 1) % items.length
					: 0;
				update(currentProps);
				return true;
			}
			if (event.key === "Enter") {
				return selectItem(items[selectedIndex]);
			}
			if (event.key === "Backspace" && activeCategory) {
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
