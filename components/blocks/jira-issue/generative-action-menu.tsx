"use client";

import { useLayoutEffect, useMemo, useState, type KeyboardEvent, type ReactElement } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion, type Transition } from "motion/react";
import GenerativeIndicatorIcon from "@atlaskit/icon-lab/core/generative-indicator";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";

import { EDITOR_PALETTE_MENTION_SOURCES } from "@/components/blocks/editor-palette/data/mention-sources";
import {
	RichTextCommandMenuSearchField,
	RichTextSuggestionMenu,
	getMentionChildItems,
	type RichTextSuggestionMenuItem,
} from "@/components/ui-custom/rich-text-editor";
import "@/components/ui-custom/rich-text-editor/rich-text-editor.css";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { RovoColorIcon } from "@/components/ui/logo";
import { token } from "@/lib/tokens";

export type JiraIssueGenerativeActionKind = "ask-rovo" | "skill" | "agent";

export interface JiraIssueGenerativeActionIssue {
	issueKey: string;
	summary: string;
}

export interface JiraIssueGenerativeActionSelectedItem {
	id: string;
	label: string;
	description?: string;
	avatarSrc?: string;
}

export interface JiraIssueGenerativeActionRequest {
	kind: JiraIssueGenerativeActionKind;
	prompt: string;
	issue: JiraIssueGenerativeActionIssue;
	selectedItem?: JiraIssueGenerativeActionSelectedItem;
}

export interface JiraIssueGenerativeActionConfig {
	ariaLabel?: string;
	onSubmit: (request: JiraIssueGenerativeActionRequest) => void | Promise<void>;
}

interface JiraIssueGenerativeActionMenuProps {
	action: JiraIssueGenerativeActionConfig;
	anchor?: HTMLElement | null;
	issue: JiraIssueGenerativeActionIssue;
	onTriggerBlur?: () => void;
	onTriggerFocus?: () => void;
	onTriggerPointerEnter?: () => void;
	onTriggerPointerLeave?: () => void;
	revealActive?: boolean;
	triggerElement?: ReactElement;
}

interface JiraIssueGenerativeActionPosition {
	left: number;
	top: number;
}

const JIRA_ISSUE_GENERATIVE_SKILLS_HEADING_ID = "jira-issue-generative-skills-heading";
const JIRA_ISSUE_GENERATIVE_AGENTS_HEADING_ID = "jira-issue-generative-agents-heading";
const JIRA_ISSUE_GENERATIVE_SKILLS_BROWSE_ALL_ID = "jira-issue-generative-skills-browse-all";
const JIRA_ISSUE_GENERATIVE_AGENTS_BROWSE_ALL_ID = "jira-issue-generative-agents-browse-all";
/** Each section shows at most this many items before a "Browse all" footer row. */
const JIRA_ISSUE_GENERATIVE_SECTION_LIMIT = 3;
const JIRA_ISSUE_GENERATIVE_SPARKLE_SCALE_ENTER: Transition = { type: "spring", bounce: 0, visualDuration: 0.15 };
const JIRA_ISSUE_GENERATIVE_SPARKLE_SCALE_EXIT: Transition = { type: "spring", bounce: 0, visualDuration: 0.1 };
const JIRA_ISSUE_GENERATIVE_SPARKLE_MOTION_ENTER: Transition = {
	opacity: { duration: 0.15, ease: [0.4, 1, 0.6, 1] }, // duration-normal + ease-out-practical
	scale: JIRA_ISSUE_GENERATIVE_SPARKLE_SCALE_ENTER,
};
const JIRA_ISSUE_GENERATIVE_SPARKLE_MOTION_EXIT: Transition = {
	opacity: { duration: 0.1, ease: [0.6, 0, 0.8, 0.6] }, // duration-fast + ease-in
	scale: JIRA_ISSUE_GENERATIVE_SPARKLE_SCALE_EXIT,
};
const JIRA_ISSUE_GENERATIVE_SPARKLE_MOTION_REDUCED: Transition = { duration: 0 };

function getJiraIssueGenerativeActionItemMetadata(
	item: RichTextSuggestionMenuItem,
): JiraIssueGenerativeActionSelectedItem {
	return {
		id: item.id,
		label: item.label,
		description: item.description,
		avatarSrc: item.visual?.kind === "avatar" || item.visual?.kind === "image"
			? item.visual.src
			: undefined,
	};
}

export function buildJiraIssueGenerativeAskRovoPrompt(
	prompt: string,
	issue: JiraIssueGenerativeActionIssue,
): string {
	return `${prompt.trim()}\n\nJira issue ${issue.issueKey}: ${issue.summary}`;
}

export function buildJiraIssueGenerativeSkillPrompt(
	item: JiraIssueGenerativeActionSelectedItem,
	issue: JiraIssueGenerativeActionIssue,
): string {
	return `Use the "${item.label}" skill for Jira issue ${issue.issueKey}: ${issue.summary}.`;
}

export function buildJiraIssueGenerativeAgentPrompt(
	item: JiraIssueGenerativeActionSelectedItem,
	issue: JiraIssueGenerativeActionIssue,
): string {
	return `Ask "${item.label}" to help with Jira issue ${issue.issueKey}: ${issue.summary}.`;
}

function getJiraIssueGenerativeBrowseAllRow(id: string): RichTextSuggestionMenuItem {
	return {
		id,
		label: "Browse all",
		icon: <ShowMoreHorizontalIcon label="" size="small" color="currentColor" />,
	};
}

function filterJiraIssueGenerativeActionItems(
	items: readonly RichTextSuggestionMenuItem[],
	query: string,
): readonly RichTextSuggestionMenuItem[] {
	const normalizedQuery = query.trim().toLowerCase();
	if (!normalizedQuery) {
		return items;
	}

	return items.filter((item) => {
		const searchableText = `${item.label} ${item.description ?? ""}`.toLowerCase();
		return searchableText.includes(normalizedQuery);
	});
}

function getJiraIssueGenerativeActionRows(
	query: string,
	showAllSkills: boolean,
	showAllAgents: boolean,
): readonly RichTextSuggestionMenuItem[] {
	const skills = getMentionChildItems(EDITOR_PALETTE_MENTION_SOURCES, "skill");
	const agents = getMentionChildItems(EDITOR_PALETTE_MENTION_SOURCES, "subagent");
	const isFiltering = query.trim().length > 0;
	const matchedSkills = filterJiraIssueGenerativeActionItems(skills, query);
	const matchedAgents = filterJiraIssueGenerativeActionItems(agents, query);
	const visibleSkills = isFiltering || showAllSkills
		? matchedSkills
		: matchedSkills.slice(0, JIRA_ISSUE_GENERATIVE_SECTION_LIMIT);
	const visibleAgents = isFiltering || showAllAgents
		? matchedAgents
		: matchedAgents.slice(0, JIRA_ISSUE_GENERATIVE_SECTION_LIMIT);

	return [
		...(matchedAgents.length > 0 ? [
			{
				id: JIRA_ISSUE_GENERATIVE_AGENTS_HEADING_ID,
				label: "Agents",
				headingLabel: "Agents",
				icon: null,
			},
			...visibleAgents,
			...(isFiltering || showAllAgents || agents.length <= JIRA_ISSUE_GENERATIVE_SECTION_LIMIT
				? []
				: [getJiraIssueGenerativeBrowseAllRow(JIRA_ISSUE_GENERATIVE_AGENTS_BROWSE_ALL_ID)]),
		] : []),
		...(matchedSkills.length > 0 ? [
			{
				id: JIRA_ISSUE_GENERATIVE_SKILLS_HEADING_ID,
				label: "Skills",
				headingLabel: "Skills",
				icon: null,
			},
			...visibleSkills,
			...(isFiltering || showAllSkills || skills.length <= JIRA_ISSUE_GENERATIVE_SECTION_LIMIT
				? []
				: [getJiraIssueGenerativeBrowseAllRow(JIRA_ISSUE_GENERATIVE_SKILLS_BROWSE_ALL_ID)]),
		] : []),
	];
}

function getJiraIssueGenerativeItemKind(item: RichTextSuggestionMenuItem): Exclude<JiraIssueGenerativeActionKind, "ask-rovo"> {
	return item.id.startsWith("subagent:") ? "agent" : "skill";
}

function getJiraIssueGenerativeTriggerPosition(anchor: HTMLElement): JiraIssueGenerativeActionPosition {
	const rect = anchor.getBoundingClientRect();
	return {
		left: rect.right + 7,
		top: rect.top,
	};
}

function isJiraIssueGenerativeSelectableRow(item: RichTextSuggestionMenuItem | undefined): boolean {
	return Boolean(item && item.headingLabel === undefined && !item.disabled);
}

function getJiraIssueGenerativeNextSelectedIndex(
	items: readonly RichTextSuggestionMenuItem[],
	currentIndex: number,
	direction: -1 | 1,
): number {
	if (items.length === 0) {
		return -1;
	}

	const startIndex = currentIndex < 0 ? (direction === 1 ? -1 : 0) : currentIndex;
	for (let step = 1; step <= items.length; step += 1) {
		const index = (startIndex + direction * step + items.length * step) % items.length;
		if (isJiraIssueGenerativeSelectableRow(items[index])) {
			return index;
		}
	}

	return -1;
}

export function JiraIssueGenerativeActionMenu({
	action,
	anchor = null,
	issue,
	onTriggerBlur,
	onTriggerFocus,
	onTriggerPointerEnter,
	onTriggerPointerLeave,
	revealActive = false,
	triggerElement,
}: Readonly<JiraIssueGenerativeActionMenuProps>) {
	const shouldReduceMotion = useReducedMotion();
	const [open, setOpen] = useState(false);
	const [triggerPosition, setTriggerPosition] = useState<JiraIssueGenerativeActionPosition | null>(null);
	const [askPrompt, setAskPrompt] = useState("");
	const [selectedIndex, setSelectedIndex] = useState(-1);
	const [showAllSkills, setShowAllSkills] = useState(false);
	const [showAllAgents, setShowAllAgents] = useState(false);
	const rows = useMemo(
		() => getJiraIssueGenerativeActionRows(askPrompt, showAllSkills, showAllAgents),
		[askPrompt, showAllSkills, showAllAgents],
	);
	const hasTriggerElement = Boolean(triggerElement);
	const sparkleVisible = revealActive && !open;

	useLayoutEffect(() => {
		if (!anchor) {
			return;
		}

		const updateTriggerPosition = () => {
			setTriggerPosition(getJiraIssueGenerativeTriggerPosition(anchor));
		};

		updateTriggerPosition();
		window.addEventListener("resize", updateTriggerPosition);
		window.addEventListener("scroll", updateTriggerPosition, true);
		const resizeObserver = typeof ResizeObserver === "undefined"
			? null
			: new ResizeObserver(updateTriggerPosition);
		resizeObserver?.observe(anchor);

		return () => {
			resizeObserver?.disconnect();
			window.removeEventListener("resize", updateTriggerPosition);
			window.removeEventListener("scroll", updateTriggerPosition, true);
		};
	}, [anchor]);

	useLayoutEffect(() => {
		if (!anchor || (!revealActive && !open)) {
			return;
		}

		let animationFrameId = 0;
		const trackTriggerPosition = () => {
			setTriggerPosition((currentPosition) => {
				const nextPosition = getJiraIssueGenerativeTriggerPosition(anchor);
				return currentPosition?.left === nextPosition.left && currentPosition.top === nextPosition.top
					? currentPosition
					: nextPosition;
			});
			animationFrameId = window.requestAnimationFrame(trackTriggerPosition);
		};

		trackTriggerPosition();
		return () => window.cancelAnimationFrame(animationFrameId);
	}, [anchor, open, revealActive]);

	function handleOpenChange(nextOpen: boolean) {
		setOpen(nextOpen);
		if (!nextOpen) {
			// Reset the palette back to its capped state for the next open.
			setAskPrompt("");
			setSelectedIndex(-1);
			setShowAllSkills(false);
			setShowAllAgents(false);
		}
	}

	function submitRequest(request: JiraIssueGenerativeActionRequest) {
		handleOpenChange(false);
		void action.onSubmit(request);
	}

	function handleAskRovoSubmit() {
		const prompt = askPrompt.trim();
		if (!prompt) {
			return;
		}

		submitRequest({
			kind: "ask-rovo",
			prompt: buildJiraIssueGenerativeAskRovoPrompt(prompt, issue),
			issue,
		});
	}

	function handleAskPromptChange(value: string) {
		setAskPrompt(value);
		setSelectedIndex(-1);
	}

	function handleMenuKeyDown(event: KeyboardEvent<HTMLInputElement>) {
		if (event.key === "ArrowDown" || event.key === "ArrowUp") {
			event.preventDefault();
			setSelectedIndex((currentIndex) => getJiraIssueGenerativeNextSelectedIndex(
				rows,
				currentIndex,
				event.key === "ArrowDown" ? 1 : -1,
			));
			return;
		}

		if (event.key === "Enter" && isJiraIssueGenerativeSelectableRow(rows[selectedIndex])) {
			event.preventDefault();
			handleSelectItem(rows[selectedIndex]);
		}
	}

	function handleSelectItem(item: RichTextSuggestionMenuItem) {
		if (item.id === JIRA_ISSUE_GENERATIVE_SKILLS_BROWSE_ALL_ID) {
			setShowAllSkills(true);
			setSelectedIndex(-1);
			return;
		}
		if (item.id === JIRA_ISSUE_GENERATIVE_AGENTS_BROWSE_ALL_ID) {
			setShowAllAgents(true);
			setSelectedIndex(-1);
			return;
		}

		const kind = getJiraIssueGenerativeItemKind(item);
		const selectedItem = getJiraIssueGenerativeActionItemMetadata(item);
		const prompt = kind === "agent"
			? buildJiraIssueGenerativeAgentPrompt(selectedItem, issue)
			: buildJiraIssueGenerativeSkillPrompt(selectedItem, issue);

		submitRequest({
			kind,
			prompt,
			issue,
			selectedItem,
		});
	}

	const trigger = triggerPosition ? createPortal(
		<PopoverTrigger
			render={(
				<button
					type="button"
					aria-label={action.ariaLabel ?? "Open Jira issue generative actions"}
					data-open={open || undefined}
					className="group/sparkle fixed z-[550] inline-flex h-6 w-4 items-start justify-center outline-none before:absolute before:inset-y-0 before:-left-2 before:w-2 before:content-[''] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
					onBlur={onTriggerBlur}
					onClick={(event) => event.stopPropagation()}
					onFocus={onTriggerFocus}
					onPointerDown={(event) => event.stopPropagation()}
					onPointerEnter={onTriggerPointerEnter}
					onPointerLeave={onTriggerPointerLeave}
					style={{
						left: triggerPosition.left,
						pointerEvents: open ? "none" : undefined,
						top: triggerPosition.top,
					}}
				>
					<motion.span
						aria-hidden="true"
						animate={{
							opacity: sparkleVisible ? 1 : 0,
							scale: shouldReduceMotion ? 1 : sparkleVisible ? 1 : 0.9,
						}}
						className="mt-2 inline-flex size-4 origin-center items-center justify-center rounded bg-bg-neutral-bold text-icon-inverse group-hover/sparkle:bg-bg-neutral-bold-hovered group-active/sparkle:bg-bg-neutral-bold-pressed"
						initial={false}
						style={{
							boxShadow: token("elevation.shadow.overlay"),
							willChange: "transform, opacity",
						}}
						transition={shouldReduceMotion
							? JIRA_ISSUE_GENERATIVE_SPARKLE_MOTION_REDUCED
							: sparkleVisible
								? JIRA_ISSUE_GENERATIVE_SPARKLE_MOTION_ENTER
								: JIRA_ISSUE_GENERATIVE_SPARKLE_MOTION_EXIT}
					>
						<span className="inline-flex size-3 items-center justify-center [&>span]:size-3 [&_svg]:size-3">
							<GenerativeIndicatorIcon label="" size="small" spacing="none" color="currentColor" />
						</span>
					</motion.span>
				</button>
			)}
		/>,
		document.body,
	) : null;
	const resolvedTrigger = triggerElement ? (
		<PopoverTrigger render={triggerElement} />
	) : trigger;

	return (
		<Popover open={open} onOpenChange={handleOpenChange}>
			{resolvedTrigger}
			<PopoverContent
				align="start"
				className="z-[600] w-auto gap-0 border-0 bg-transparent p-0 text-text shadow-none"
				positionerClassName="z-[600]"
				side="right"
				sideOffset={hasTriggerElement ? 4 : -16}
			>
				<PopoverTitle className="sr-only">Jira issue generative actions</PopoverTitle>
				<RichTextSuggestionMenu
					className="rich-text-command-menu-borderless rich-text-command-menu-search-selects"
					emptyLabel="No Jira issue actions found"
					emptyState={false}
					header={(
						<RichTextCommandMenuSearchField
							autoFocus
							icon={<RovoColorIcon size="xxsmall" />}
							label="Ask Rovo"
							onClear={() => handleAskPromptChange("")}
							onEscape={() => setOpen(false)}
							onKeyDown={handleMenuKeyDown}
							onSubmit={handleAskRovoSubmit}
							onValueChange={handleAskPromptChange}
							placeholder="Ask Rovo"
							value={askPrompt}
						/>
					)}
					items={rows}
					onHover={setSelectedIndex}
					onSelect={handleSelectItem}
					selectedIndex={selectedIndex}
					title="Jira issue actions"
				/>
			</PopoverContent>
		</Popover>
	);
}
