"use client";

import { useLayoutEffect, useState, type CSSProperties, type ReactElement } from "react";

import { EDITOR_PALETTE_MENTION_SOURCES } from "@/components/blocks/editor-palette/data/mention-sources";
import {
	RovoSparkle,
	RovoSparkleButton,
	type RovoSparkleActionKind,
	type RovoSparkleActionRequest,
	type RovoSparkleItem,
	type RovoSparkleSelectedItem,
} from "@/components/ui-custom/rovo-sparkle";
import { getMentionChildItems } from "@/components/ui-custom/rich-text-editor";
import {
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";

export type JiraIssueGenerativeActionKind = RovoSparkleActionKind;

export interface JiraIssueGenerativeActionIssue {
	issueKey: string;
	summary: string;
}

export type JiraIssueGenerativeActionSelectedItem = RovoSparkleSelectedItem;

export interface JiraIssueGenerativeActionRequest {
	kind: JiraIssueGenerativeActionKind;
	prompt: string;
	issue: JiraIssueGenerativeActionIssue;
	selectedItem?: JiraIssueGenerativeActionSelectedItem;
}

export interface JiraIssueGenerativeActionConfig {
	agents?: readonly RovoSparkleItem[];
	ariaLabel?: string;
	onSubmit: (request: JiraIssueGenerativeActionRequest) => void | Promise<void>;
	skills?: readonly RovoSparkleItem[];
}

interface JiraIssueGenerativeActionMenuProps {
	action: JiraIssueGenerativeActionConfig;
	anchor?: HTMLElement | null;
	issue: JiraIssueGenerativeActionIssue;
	onOpenChange?: (open: boolean) => void;
	onTriggerBlur?: () => void;
	onTriggerFocus?: () => void;
	onTriggerPointerEnter?: () => void;
	onTriggerPointerLeave?: () => void;
	revealActive?: boolean;
	triggerElement?: ReactElement;
}

interface JiraIssueAgentAndSkillSubmenuProps {
	action: JiraIssueGenerativeActionConfig;
	issue: JiraIssueGenerativeActionIssue;
}

interface JiraIssueGenerativeActionPosition {
	bridgeHeight: number;
	left: number;
	top: number;
}

const JIRA_ISSUE_GENERATIVE_SKILLS = getMentionChildItems(EDITOR_PALETTE_MENTION_SOURCES, "skill");
const JIRA_ISSUE_GENERATIVE_AGENTS = getMentionChildItems(EDITOR_PALETTE_MENTION_SOURCES, "subagent");
const JIRA_ISSUE_GENERATIVE_TRIGGER_SIZE = 24;

function buildJiraIssueGenerativeAskRovoPrompt(
	prompt: string,
	issue: JiraIssueGenerativeActionIssue,
): string {
	return `${prompt.trim()}\n\nJira issue ${issue.issueKey}: ${issue.summary}`;
}

function buildJiraIssueGenerativeSkillPrompt(
	item: JiraIssueGenerativeActionSelectedItem,
	issue: JiraIssueGenerativeActionIssue,
): string {
	return `Use the "${item.label}" skill for Jira issue ${issue.issueKey}: ${issue.summary}.`;
}

function buildJiraIssueGenerativeAgentPrompt(
	item: JiraIssueGenerativeActionSelectedItem,
	issue: JiraIssueGenerativeActionIssue,
): string {
	return `Ask "${item.label}" to help with Jira issue ${issue.issueKey}: ${issue.summary}.`;
}

function submitJiraIssueAssignment(
	action: JiraIssueGenerativeActionConfig,
	issue: JiraIssueGenerativeActionIssue,
	kind: "agent" | "skill",
	item: JiraIssueGenerativeActionSelectedItem,
) {
	const prompt = kind === "agent"
		? buildJiraIssueGenerativeAgentPrompt(item, issue)
		: buildJiraIssueGenerativeSkillPrompt(item, issue);
	void action.onSubmit({ kind, prompt, issue, selectedItem: item });
}

function getJiraIssueGenerativeSelectedItem(item: RovoSparkleItem): JiraIssueGenerativeActionSelectedItem {
	return {
		id: item.id,
		label: item.label,
		description: item.description,
		avatarSrc: item.visual?.kind === "avatar" || item.visual?.kind === "image"
			? item.visual.src
			: undefined,
	};
}

export function JiraIssueAgentAndSkillSubmenu({
	action,
	issue,
}: Readonly<JiraIssueAgentAndSkillSubmenuProps>) {
	const agents = action.agents ?? JIRA_ISSUE_GENERATIVE_AGENTS;
	const skills = action.skills ?? JIRA_ISSUE_GENERATIVE_SKILLS;

	return (
		<DropdownMenuSub>
			<DropdownMenuSubTrigger>Assign agent and use skill</DropdownMenuSubTrigger>
			<DropdownMenuSubContent className="max-h-[min(24rem,var(--available-height,24rem))] w-[280px] overflow-auto">
				<DropdownMenuGroup>
					<DropdownMenuLabel>Agents</DropdownMenuLabel>
					{agents.map((agent) => (
						<DropdownMenuItem
							key={agent.id}
							onSelect={() => submitJiraIssueAssignment(action, issue, "agent", getJiraIssueGenerativeSelectedItem(agent))}
						>
							{agent.label}
						</DropdownMenuItem>
					))}
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuLabel>Skills</DropdownMenuLabel>
					{skills.map((skill) => (
						<DropdownMenuItem
							key={skill.id}
							onSelect={() => submitJiraIssueAssignment(action, issue, "skill", getJiraIssueGenerativeSelectedItem(skill))}
						>
							{skill.label}
						</DropdownMenuItem>
					))}
				</DropdownMenuGroup>
			</DropdownMenuSubContent>
		</DropdownMenuSub>
	);
}

function getJiraIssueGenerativeTriggerPosition(anchor: HTMLElement): JiraIssueGenerativeActionPosition {
	const rect = anchor.getBoundingClientRect();
	const issueSurface = anchor.querySelector<HTMLElement>("[data-slot='jira-issue-surface']");
	const top = issueSurface?.getBoundingClientRect().top ?? rect.top;
	return {
		bridgeHeight: Math.max(JIRA_ISSUE_GENERATIVE_TRIGGER_SIZE, rect.bottom - top),
		left: rect.right + 7,
		top,
	};
}

export function JiraIssueGenerativeActionMenu({
	action,
	anchor = null,
	issue,
	onOpenChange,
	onTriggerBlur,
	onTriggerFocus,
	onTriggerPointerEnter,
	onTriggerPointerLeave,
	revealActive = false,
	triggerElement,
}: Readonly<JiraIssueGenerativeActionMenuProps>) {
	const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

	useLayoutEffect(() => {
		setPortalContainer(document.body);
	}, []);
	const [open, setOpen] = useState(false);
	const [triggerPosition, setTriggerPosition] = useState<JiraIssueGenerativeActionPosition | null>(null);
	const hasTriggerElement = Boolean(triggerElement);
	const sparkleVisible = revealActive && !open;

	function handleOpenChange(nextOpen: boolean) {
		setOpen(nextOpen);
		onOpenChange?.(nextOpen);
	}

	useLayoutEffect(() => {
		if (!anchor) {
			return;
		}

		const updateTriggerPosition = () => setTriggerPosition(getJiraIssueGenerativeTriggerPosition(anchor));
		updateTriggerPosition();
		window.addEventListener("resize", updateTriggerPosition);
		window.addEventListener("scroll", updateTriggerPosition, true);
		const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(updateTriggerPosition);
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
				return currentPosition?.bridgeHeight === nextPosition.bridgeHeight
					&& currentPosition.left === nextPosition.left
					&& currentPosition.top === nextPosition.top
					? currentPosition
					: nextPosition;
			});
			animationFrameId = window.requestAnimationFrame(trackTriggerPosition);
		};

		trackTriggerPosition();
		return () => window.cancelAnimationFrame(animationFrameId);
	}, [anchor, open, revealActive]);

	function handleRovoSparkleSubmit(request: RovoSparkleActionRequest) {
		if (request.kind === "ask-rovo") {
			void action.onSubmit({
				kind: request.kind,
				prompt: buildJiraIssueGenerativeAskRovoPrompt(request.prompt, issue),
				issue,
			});
			return;
		}

		submitJiraIssueAssignment(action, issue, request.kind, request.selectedItem);
	}

	const generatedTrigger = triggerPosition ? (
		<RovoSparkleButton
			active={open}
			aria-label={action.ariaLabel ?? "Open Jira issue generative actions"}
			className="fixed z-[150] overflow-visible before:pointer-events-auto before:absolute before:-left-2 before:top-0 before:h-[var(--jira-issue-generative-bridge-height)] before:w-2 before:content-[''] [&>span]:rounded-[inherit]"
			hideWhenSelected
			onBlur={onTriggerBlur}
			onClick={(event) => event.stopPropagation()}
			onFocus={onTriggerFocus}
			onPointerDown={(event) => event.stopPropagation()}
			onPointerEnter={onTriggerPointerEnter}
			onPointerLeave={onTriggerPointerLeave}
			size="compact"
			style={{
				"--jira-issue-generative-bridge-height": `${triggerPosition.bridgeHeight}px`,
				left: triggerPosition.left,
				pointerEvents: open ? "none" : undefined,
				top: triggerPosition.top,
			} as CSSProperties}
			visible={sparkleVisible}
		/>
	) : null;
	const resolvedTrigger = triggerElement ?? generatedTrigger;

	if (!resolvedTrigger) {
		return null;
	}

	return (
		<RovoSparkle
			agents={action.agents ?? JIRA_ISSUE_GENERATIVE_AGENTS}
			ariaLabel={action.ariaLabel ?? "Open Jira issue generative actions"}
			emptyLabel="No Jira issue actions found"
			menuTitle="Jira issue actions"
			onOpenChange={handleOpenChange}
			onSubmit={handleRovoSparkleSubmit}
			open={open}
			popoverTitle="Jira issue generative actions"
			side="right"
			sideOffset={hasTriggerElement ? 4 : -24}
			size="compact"
			skills={action.skills ?? JIRA_ISSUE_GENERATIVE_SKILLS}
			triggerElement={resolvedTrigger}
			triggerPortalContainer={hasTriggerElement ? null : portalContainer}
		/>
	);
}
