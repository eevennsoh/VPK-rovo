"use client";

import type { ReactNode } from "react";
import { ReactRenderer } from "@tiptap/react";
import type { Editor } from "@tiptap/core";
import type {
	SuggestionKeyDownProps,
	SuggestionProps,
} from "@tiptap/suggestion";

import AppsIcon from "@atlaskit/icon/core/apps";
import BranchIcon from "@atlaskit/icon/core/branch";
import LibraryIcon from "@atlaskit/icon/core/library";
import LinkIcon from "@atlaskit/icon/core/link";
import PersonIcon from "@atlaskit/icon/core/person";
import SnippetIcon from "@atlaskit/icon/core/snippet";
import TeamsIcon from "@atlaskit/icon/core/teams";
import ToolsIcon from "@atlaskit/icon/core/tools";
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
import DividerElementIcon from "@atlaskit/icon-lab/core/divider-element";
import TerminalIcon from "@atlaskit/icon-lab/core/terminal";
import TextHeadingFiveIcon from "@atlaskit/icon-lab/core/text-heading-five";
import TextHeadingFourIcon from "@atlaskit/icon-lab/core/text-heading-four";
import TextHeadingOneIcon from "@atlaskit/icon-lab/core/text-heading-one";
import TextHeadingSixIcon from "@atlaskit/icon-lab/core/text-heading-six";
import TextHeadingThreeIcon from "@atlaskit/icon-lab/core/text-heading-three";
import TextHeadingTwoIcon from "@atlaskit/icon-lab/core/text-heading-two";
import ViewTypeTableHomeIcon from "@atlaskit/icon-lab/core/view-type-table-home";

import { IconTile } from "@/components/ui/icon-tile";
import { cn } from "@/lib/utils";

import type {
	RichTextCommandCategory,
	RichTextMentionCategory,
	RichTextMentionItem,
	RichTextMentionSources,
	RichTextMentionTarget,
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
	revealDescriptionOnHover?: boolean;
	shortcut?: string;
	icon: ReactNode;
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

const CATEGORY_LABELS: Record<RichTextMentionCategory, string> = {
	subagent: "Subagents",
	human: "Human",
	team: "A team",
	skill: "Skills",
	tool: "Tools",
	knowledge: "Knowledge",
};

/** "@" mention surface: people and agents only. */
const MENTION_TARGET_ORDER: readonly RichTextMentionTarget[] = [
	"subagent",
	"human",
	"team",
];

/** "/" command surface: everything else, each opening a nested item list. */
const COMMAND_CATEGORY_ORDER: readonly RichTextCommandCategory[] = [
	"skill",
	"tool",
	"knowledge",
];

const HOVER_REVEALED_BYLINE_CATEGORIES = new Set<RichTextMentionCategory>([
	"skill",
	"subagent",
	"tool",
]);

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
			label: "Teammate",
			description: "Mention a specific person on your team.",
		},
		{
			category: "human",
			id: "human:reviewer",
			label: "Reviewer",
			description: "Loop in a human reviewer for sign-off.",
		},
		{
			category: "human",
			id: "human:stakeholder",
			label: "Stakeholder",
			description: "Notify a project stakeholder.",
		},
	],
	team: [
		{
			category: "team",
			id: "team:engineering",
			label: "Engineering",
			description: "Mention the engineering team.",
		},
		{
			category: "team",
			id: "team:design",
			label: "Design",
			description: "Mention the design team.",
		},
		{
			category: "team",
			id: "team:support",
			label: "Support",
			description: "Mention the support team.",
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
		shortcut: "Text",
		icon: <TextIcon label="" size="small" />,
		run: (editor) => editor.chain().focus().setParagraph().run(),
	},
	{
		id: "heading-1",
		label: "Heading 1",
		shortcut: "#",
		icon: <TextHeadingOneIcon label="" size="small" />,
		run: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
	},
	{
		id: "heading-2",
		label: "Heading 2",
		shortcut: "##",
		icon: <TextHeadingTwoIcon label="" size="small" />,
		run: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
	},
	{
		id: "heading-3",
		label: "Heading 3",
		shortcut: "###",
		icon: <TextHeadingThreeIcon label="" size="small" />,
		run: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
	},
	{
		id: "heading-4",
		label: "Heading 4",
		shortcut: "####",
		icon: <TextHeadingFourIcon label="" size="small" />,
		run: (editor) => editor.chain().focus().toggleHeading({ level: 4 }).run(),
	},
	{
		id: "heading-5",
		label: "Heading 5",
		shortcut: "#####",
		icon: <TextHeadingFiveIcon label="" size="small" />,
		run: (editor) => editor.chain().focus().toggleHeading({ level: 5 }).run(),
	},
	{
		id: "heading-6",
		label: "Heading 6",
		shortcut: "######",
		icon: <TextHeadingSixIcon label="" size="small" />,
		run: (editor) => editor.chain().focus().toggleHeading({ level: 6 }).run(),
	},
	{
		id: "quote",
		label: "Quote",
		icon: <QuotationMarkIcon label="" size="small" />,
		run: (editor) => editor.chain().focus().toggleBlockquote().run(),
	},
	{
		id: "bold",
		label: "Bold",
		icon: <TextBoldIcon label="" size="small" />,
		run: (editor) => editor.chain().focus().toggleBold().run(),
	},
	{
		id: "italic",
		label: "Italic",
		icon: <TextItalicIcon label="" size="small" />,
		run: (editor) => editor.chain().focus().toggleItalic().run(),
	},
	{
		id: "underline",
		label: "Underline",
		icon: <TextUnderlineIcon label="" size="small" />,
		run: (editor) => editor.chain().focus().toggleUnderline().run(),
	},
	{
		id: "strikethrough",
		label: "Strikethrough",
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
		shortcut: "-",
		icon: <ListBulletedIcon label="" size="small" />,
		run: (editor) => editor.chain().focus().toggleBulletList().run(),
	},
	{
		id: "numbered-list",
		label: "Numbered list",
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
		icon: <ViewTypeTableHomeIcon label="" size="small" />,
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
		icon: <AlignTextLeftIcon label="" size="small" />,
		run: (editor) => editor.chain().focus().setTextAlign("left").run(),
	},
	{
		id: "align-center",
		label: "Align center",
		icon: <AlignTextCenterIcon label="" size="small" />,
		run: (editor) => editor.chain().focus().setTextAlign("center").run(),
	},
	{
		id: "align-right",
		label: "Align right",
		icon: <AlignTextRightIcon label="" size="small" />,
		run: (editor) => editor.chain().focus().setTextAlign("right").run(),
	},
	{
		id: "link",
		label: "Link",
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
	switch (category) {
		case "subagent":
			return <PeopleGroupIcon label="" size="small" />;
		case "human":
			return <PersonIcon label="" size="small" />;
		case "team":
			return <TeamsIcon label="" size="small" />;
		case "skill":
			return <AppsIcon label="" size="small" />;
		case "tool":
			return <ToolsIcon label="" size="small" />;
		case "knowledge":
			return <LibraryIcon label="" size="small" />;
	}
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
	return (
		<div
			className={cn("rich-text-command-menu", className)}
			role="listbox"
			aria-label={title}
		>
			<div className="rich-text-command-menu-title text-xs font-semibold leading-4 text-text-subtlest">
				{title}
			</div>
			{onBack ? (
				<button
					type="button"
					className="rich-text-command-menu-item rich-text-command-menu-back"
					onMouseDown={(event) => event.preventDefault()}
					onClick={onBack}
				>
					<BranchIcon label="" size="small" />
					<span>Back</span>
				</button>
			) : null}
			<div className="rich-text-command-menu-list">
				{items.length > 0 ? (
					items.map((item, index) => (
						<button
							type="button"
							key={item.id}
							role="option"
							aria-selected={index === selectedIndex}
							className={cn(
								"rich-text-command-menu-item",
								index === selectedIndex && "rich-text-command-menu-item-selected",
							)}
							disabled={item.disabled}
							onMouseDown={(event) => event.preventDefault()}
							onClick={() => onSelect(item)}
						>
							<IconTile
								size="small"
								label={item.label}
								aria-hidden={true}
								className="border border-border bg-surface text-icon-subtlest"
								icon={item.icon}
							/>
							<span className="rich-text-command-menu-copy">
								<span className="rich-text-command-menu-label">{item.label}</span>
								{item.description ? (
									<span
										className={cn(
											"rich-text-command-menu-description",
											item.revealDescriptionOnHover &&
												"rich-text-command-menu-description-hover",
										)}
									>
										{item.description}
									</span>
								) : null}
							</span>
							{item.shortcut ? (
								<span className="rich-text-command-menu-shortcut">
									{item.shortcut}
								</span>
							) : null}
						</button>
					))
				) : (
					<div className="rich-text-command-menu-empty">{emptyLabel}</div>
				)}
			</div>
		</div>
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

function isCommandCategoryId(id: string): id is RichTextCommandCategory {
	return (COMMAND_CATEGORY_ORDER as readonly string[]).includes(id);
}

function getSlashCommandMenuItems(query: string): readonly RichTextSuggestionMenuItem[] {
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
	let activeCategory: RichTextCommandCategory | null = null;
	let currentProps: SuggestionProps<RichTextSlashAction, RichTextSlashAction> | null = null;

	function getTopLevelItems(query: string): readonly RichTextSuggestionMenuItem[] {
		return [
			...filterItems(getSlashCommandCategoryItems(getMentionSources?.()), query),
			...getSlashCommandMenuItems(query),
		];
	}

	function getChildItems(query: string): readonly RichTextSuggestionMenuItem[] {
		if (!activeCategory) {
			return [];
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
			title: activeCategory ? CATEGORY_LABELS[activeCategory] : "Commands",
		});
	}

	function selectItem(item: RichTextSuggestionMenuItem | undefined): boolean {
		if (!item || !currentProps) {
			return false;
		}

		if (activeCategory) {
			const mention = getCategoryItems(getMentionSources?.(), activeCategory)
				.find((candidate) => candidate.id === item.id);
			if (!mention) {
				return false;
			}

			currentProps.command({ type: "mention", mention });
			return true;
		}

		if (isCommandCategoryId(item.id)) {
			activeCategory = item.id;
			selectedIndex = 0;
			update(currentProps);
			return true;
		}

		const command = SLASH_COMMANDS.find((candidate) => candidate.id === item.id);
		if (!command) {
			return false;
		}

		currentProps.command({ type: "command", run: command.run });
		return true;
	}

	return {
		onStart: (props: SuggestionProps<RichTextSlashAction, RichTextSlashAction>) => {
			popupState.element = createPopup();
			popupState.component = new ReactRenderer(RichTextSuggestionMenu, {
				editor: props.editor,
				props: {
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
	return {
		...STATIC_MENTION_ITEMS,
		...sources,
		subagent: sources?.subagent ?? STATIC_MENTION_ITEMS.subagent,
		human: sources?.human ?? STATIC_MENTION_ITEMS.human,
		team: sources?.team ?? STATIC_MENTION_ITEMS.team,
		tool: sources?.tool ?? STATIC_MENTION_ITEMS.tool,
		knowledge: sources?.knowledge ?? STATIC_MENTION_ITEMS.knowledge,
	};
}

function getCategoryItems(
	sources: RichTextMentionSources | undefined,
	category: RichTextMentionCategory,
): readonly RichTextMentionItem[] {
	return getMergedMentionSources(sources)[category] ?? [];
}

function buildCategoryMenuItems(
	order: readonly RichTextMentionCategory[],
	sources: RichTextMentionSources | undefined,
): readonly RichTextSuggestionMenuItem[] {
	return order.map((category) => ({
		description: `${getCategoryItems(sources, category).length} available`,
		icon: getCategoryIcon(category),
		id: category,
		label: CATEGORY_LABELS[category],
		revealDescriptionOnHover: HOVER_REVEALED_BYLINE_CATEGORIES.has(category),
	}));
}

/** Parent entries for the "@" mention surface: subagents, human, a team. */
export function getMentionTargetItems(
	sources?: RichTextMentionSources,
): readonly RichTextSuggestionMenuItem[] {
	return buildCategoryMenuItems(MENTION_TARGET_ORDER, sources);
}

/** Parent entries for the "/" command surface: skills, tools, knowledge. */
export function getSlashCommandCategoryItems(
	sources?: RichTextMentionSources,
): readonly RichTextSuggestionMenuItem[] {
	return buildCategoryMenuItems(COMMAND_CATEGORY_ORDER, sources);
}

/** Nested reference items for a single category (e.g. the Skills submenu). */
export function getMentionChildItems(
	sources: RichTextMentionSources | undefined,
	category: RichTextMentionCategory,
): readonly RichTextSuggestionMenuItem[] {
	return getCategoryItems(sources, category).map((item) => ({
		description: item.description,
		icon: getCategoryIcon(item.category),
		id: item.id,
		label: item.label,
	}));
}

export function createMentionSuggestionRenderer(
	getMentionSources?: () => RichTextMentionSources | undefined,
) {
	const popupState: SuggestionPopupState = { component: null, element: null };
	let selectedIndex = 0;
	let activeCategory: RichTextMentionTarget | null = null;
	let currentProps: SuggestionProps<RichTextMentionItem, RichTextMentionItem> | null = null;

	function getParentItems(query: string): readonly RichTextSuggestionMenuItem[] {
		return filterItems(getMentionTargetItems(getMentionSources?.()), query);
	}

	function getChildItems(query: string): readonly RichTextSuggestionMenuItem[] {
		if (!activeCategory) {
			return [];
		}

		return filterItems(
			getCategoryItems(getMentionSources?.(), activeCategory).map((item) => ({
				description: item.description,
				icon: getCategoryIcon(item.category),
				id: item.id,
				label: item.label,
			})),
			query,
		);
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
			title: activeCategory ? CATEGORY_LABELS[activeCategory] : "Mention",
		});
	}

	function selectItem(item: RichTextSuggestionMenuItem | undefined): boolean {
		if (!item || !currentProps) {
			return false;
		}

		if (!activeCategory) {
			activeCategory = item.id as RichTextMentionTarget;
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
