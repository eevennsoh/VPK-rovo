"use client";

import { useMemo, useState } from "react";
import GenerativeIndicatorIcon from "@atlaskit/icon-lab/core/generative-indicator";

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

function getJiraIssueGenerativeActionRows(): readonly RichTextSuggestionMenuItem[] {
	return [
		{
			id: JIRA_ISSUE_GENERATIVE_SKILLS_HEADING_ID,
			label: "Skills",
			headingLabel: "Skills",
			icon: null,
		},
		...getMentionChildItems(EDITOR_PALETTE_MENTION_SOURCES, "skill"),
		{
			id: JIRA_ISSUE_GENERATIVE_AGENTS_HEADING_ID,
			label: "Agents",
			headingLabel: "Agents",
			icon: null,
		},
		...getMentionChildItems(EDITOR_PALETTE_MENTION_SOURCES, "subagent"),
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
	const rows = useMemo(() => getJiraIssueGenerativeActionRows(), []);

	function submitRequest(request: JiraIssueGenerativeActionRequest) {
		setOpen(false);
		setAskPrompt("");
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
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger
				render={(
					<button
						type="button"
						aria-label={action.ariaLabel ?? "Open Jira issue generative actions"}
						data-open={open || undefined}
						className={cn(
							"absolute top-2 -right-6 z-20 inline-flex size-4 items-center justify-center rounded bg-bg-neutral-bold text-icon-inverse opacity-0 outline-none transition-[background-color,opacity,scale] duration-normal ease-out",
							"group-hover/jira-issue:opacity-100 group-focus-within/jira-issue:opacity-100 data-open:opacity-100",
							"hover:bg-bg-neutral-bold-hovered active:bg-bg-neutral-bold-pressed focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
						)}
						onClick={(event) => event.stopPropagation()}
						onPointerDown={(event) => event.stopPropagation()}
						style={{
							boxShadow: token("elevation.shadow.overlay"),
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
				className="z-[600] w-[360px] gap-0 overflow-hidden border border-border bg-surface-overlay p-0 text-text shadow-xl"
				positionerClassName="z-[600]"
				side="right"
				sideOffset={8}
			>
				<PopoverTitle className="sr-only">Jira issue generative actions</PopoverTitle>
				<RichTextSuggestionMenu
					className="rich-text-command-menu-embedded"
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
