"use client";

import { useMemo, useState } from "react";
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
import { cn } from "@/lib/utils";

export type JiraIssueGenerativeActionKind = "ask-rovo" | "skill" | "agent";

export interface JiraIssueGenerativeActionIssue {
	issueKey: string;
	summary: string;
}

export interface JiraIssueGenerativeActionSelectedItem {
	id: string;
	label: string;
	description?: string;
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
	issue: JiraIssueGenerativeActionIssue;
}

const JIRA_ISSUE_GENERATIVE_SKILLS_HEADING_ID = "jira-issue-generative-skills-heading";
const JIRA_ISSUE_GENERATIVE_AGENTS_HEADING_ID = "jira-issue-generative-agents-heading";
const JIRA_ISSUE_GENERATIVE_SKILLS_BROWSE_ALL_ID = "jira-issue-generative-skills-browse-all";
const JIRA_ISSUE_GENERATIVE_AGENTS_BROWSE_ALL_ID = "jira-issue-generative-agents-browse-all";
/** Each section shows at most this many items before a "Browse all" footer row. */
const JIRA_ISSUE_GENERATIVE_SECTION_LIMIT = 5;

function getJiraIssueGenerativeActionItemMetadata(
	item: RichTextSuggestionMenuItem,
): JiraIssueGenerativeActionSelectedItem {
	return {
		id: item.id,
		label: item.label,
		description: item.description,
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

function getJiraIssueGenerativeActionRows(
	showAllSkills: boolean,
	showAllAgents: boolean,
): readonly RichTextSuggestionMenuItem[] {
	const skills = getMentionChildItems(EDITOR_PALETTE_MENTION_SOURCES, "skill");
	const agents = getMentionChildItems(EDITOR_PALETTE_MENTION_SOURCES, "subagent");
	const visibleSkills = showAllSkills ? skills : skills.slice(0, JIRA_ISSUE_GENERATIVE_SECTION_LIMIT);
	const visibleAgents = showAllAgents ? agents : agents.slice(0, JIRA_ISSUE_GENERATIVE_SECTION_LIMIT);
	return [
		{
			id: JIRA_ISSUE_GENERATIVE_SKILLS_HEADING_ID,
			label: "Skills",
			headingLabel: "Skills",
			icon: null,
		},
		...visibleSkills,
		...(showAllSkills || skills.length <= JIRA_ISSUE_GENERATIVE_SECTION_LIMIT
			? []
			: [getJiraIssueGenerativeBrowseAllRow(JIRA_ISSUE_GENERATIVE_SKILLS_BROWSE_ALL_ID)]),
		{
			id: JIRA_ISSUE_GENERATIVE_AGENTS_HEADING_ID,
			label: "Agents",
			headingLabel: "Agents",
			icon: null,
		},
		...visibleAgents,
		...(showAllAgents || agents.length <= JIRA_ISSUE_GENERATIVE_SECTION_LIMIT
			? []
			: [getJiraIssueGenerativeBrowseAllRow(JIRA_ISSUE_GENERATIVE_AGENTS_BROWSE_ALL_ID)]),
	];
}

function getJiraIssueGenerativeItemKind(item: RichTextSuggestionMenuItem): Exclude<JiraIssueGenerativeActionKind, "ask-rovo"> {
	return item.id.startsWith("subagent:") ? "agent" : "skill";
}

export function JiraIssueGenerativeActionMenu({
	action,
	issue,
}: Readonly<JiraIssueGenerativeActionMenuProps>) {
	const [open, setOpen] = useState(false);
	const [askPrompt, setAskPrompt] = useState("");
	const [showAllSkills, setShowAllSkills] = useState(false);
	const [showAllAgents, setShowAllAgents] = useState(false);
	const rows = useMemo(
		() => getJiraIssueGenerativeActionRows(showAllSkills, showAllAgents),
		[showAllSkills, showAllAgents],
	);

	function handleOpenChange(nextOpen: boolean) {
		setOpen(nextOpen);
		if (!nextOpen) {
			// Reset the palette back to its capped state for the next open.
			setAskPrompt("");
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

	function handleSelectItem(item: RichTextSuggestionMenuItem) {
		if (item.id === JIRA_ISSUE_GENERATIVE_SKILLS_BROWSE_ALL_ID) {
			setShowAllSkills(true);
			return;
		}
		if (item.id === JIRA_ISSUE_GENERATIVE_AGENTS_BROWSE_ALL_ID) {
			setShowAllAgents(true);
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

	return (
		<Popover open={open} onOpenChange={handleOpenChange}>
			<PopoverTrigger
				render={(
					<button
						type="button"
						aria-label={action.ariaLabel ?? "Open Jira issue generative actions"}
						data-open={open || undefined}
						className={cn(
							"absolute top-2 -right-6 z-20 inline-flex size-4 items-center justify-center rounded bg-bg-neutral-bold text-icon-inverse outline-none",
							// Fade out immediately when the card loses hover/focus. The previous delayed
							// reverse translate made the trigger linger, then drift back into the card.
							"opacity-0 transition-[background-color,opacity] duration-fast ease-in motion-reduce:transition-none",
							"group-hover/jira-issue:opacity-100 group-hover/jira-issue:duration-normal group-hover/jira-issue:ease-out-practical group-focus-within/jira-issue:opacity-100 group-focus-within/jira-issue:duration-normal group-focus-within/jira-issue:ease-out-practical",
							"hover:bg-bg-neutral-bold-hovered active:bg-bg-neutral-bold-pressed focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
						)}
						onClick={(event) => event.stopPropagation()}
						onPointerDown={(event) => event.stopPropagation()}
						style={{
							boxShadow: token("elevation.shadow.overlay"),
							// Hide the trigger while open so the palette cleanly replaces it.
							...(open ? { opacity: 0, pointerEvents: "none" } : null),
						}}
					>
						<span className="inline-flex size-3 items-center justify-center [&>span]:size-3 [&_svg]:size-3" aria-hidden="true">
							<GenerativeIndicatorIcon label="" size="small" spacing="none" color="currentColor" />
						</span>
					</button>
				)}
			/>
			<PopoverContent
				align="start"
				className="z-[600] w-auto gap-0 border-0 bg-transparent p-0 text-text shadow-none"
				positionerClassName="z-[600]"
				side="right"
				sideOffset={-16}
			>
				<PopoverTitle className="sr-only">Jira issue generative actions</PopoverTitle>
				<RichTextSuggestionMenu
					className="rich-text-command-menu-borderless"
					emptyLabel="No Jira issue actions found"
					header={(
						<RichTextCommandMenuSearchField
							autoFocus
							icon={<RovoColorIcon size="xxsmall" />}
							label="Ask Rovo"
							onClear={() => setAskPrompt("")}
							onEscape={() => setOpen(false)}
							onSubmit={handleAskRovoSubmit}
							onValueChange={setAskPrompt}
							placeholder="Ask Rovo"
							value={askPrompt}
						/>
					)}
					items={rows}
					onSelect={handleSelectItem}
					selectedIndex={-1}
					title="Jira issue actions"
				/>
			</PopoverContent>
		</Popover>
	);
}
