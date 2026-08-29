"use client";

import type { ReactElement, ReactNode } from "react";

import CheckMarkIcon from "@atlaskit/icon/core/check-mark";
import SubtasksIcon from "@atlaskit/icon/core/subtasks";
import WorkItemAddIcon from "@atlaskit/icon-lab/core/work-item-add";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function uncapturedWorkLinkLabel(suggestedWorkItemKey?: string): string {
	return suggestedWorkItemKey === undefined ? "Link work item" : `Link to ${suggestedWorkItemKey}`;
}

/**
 * The keys this chin offers to link against, normalized to one list so the
 * no-suggestion, one-suggestion, and many-suggestion chins are the same shape.
 *
 * An empty list still yields one row — the generic "Link work item" control —
 * so the caller never has to special-case "no suggestion" downstream.
 */
export function uncapturedWorkSuggestionKeys(
	suggestedWorkItemKey?: string,
	suggestedWorkItemKeys?: readonly string[],
): readonly (string | undefined)[] {
	const keys = suggestedWorkItemKeys
		?? (suggestedWorkItemKey === undefined ? [] : [suggestedWorkItemKey]);

	return keys.length === 0 ? [undefined] : keys;
}

/**
 * A trailing icon-only chin control. Unavailable actions stay focusable via
 * `aria-disabled` rather than `disabled`, so the tooltip can still explain why
 * the control is there — the same treatment the Link button uses.
 */
function ChinIconAction({
	actionLabel,
	disabled = false,
	icon,
	label,
	onClick,
}: Readonly<{
	actionLabel: string;
	disabled?: boolean;
	icon: ReactElement;
	label: string;
	onClick?: () => void;
}>) {
	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger
					render={
						<Button
							aria-disabled={disabled}
							aria-label={disabled ? `${actionLabel} unavailable` : actionLabel}
							className={cn(disabled ? "cursor-not-allowed opacity-(--opacity-disabled)" : null)}
							onClick={() => {
								if (disabled) {
									return;
								}

								onClick?.();
							}}
							size="icon-compact"
							type="button"
							variant="ghost"
						/>
					}
				>
					<Icon aria-hidden render={icon} />
				</TooltipTrigger>
				<TooltipContent>{label}</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}

/**
 * One chin row: a leading control plus the trailing action pair, sharing a
 * single hover surface so they read as one group. The hover lives on the row
 * rather than the footer, because a multi-suggestion chin must light only the
 * row under the pointer.
 *
 * Geometry is the Figma spec (node 3002:7233): a 24px control in 4px vertical
 * padding makes a 32px row, and the row spans the footer's full content width
 * so the hover surface is inset 8px from the card edge. No horizontal padding —
 * the controls' own 12px padding supplies the label inset, so nothing shifts
 * when the surface appears.
 */
function ChinRow({ actions, children }: Readonly<{ actions?: ReactNode; children: ReactNode }>) {
	return (
		<div className="flex items-center justify-between gap-2 rounded-md py-1 transition-colors duration-normal ease-out-practical hover:bg-bg-neutral-subtle-hovered has-[:focus-visible]:bg-bg-neutral-subtle-hovered motion-reduce:transition-none">
			{children}
			{actions}
		</div>
	);
}

export function UncapturedWorkChin({
	captured,
	createUnavailable,
	linkUnavailable,
	onCreateWorkItem,
	onLinkWorkItem,
	onSubtasks,
	suggestedWorkItemKey,
	suggestedWorkItemKeys,
	summary,
}: Readonly<{
	captured: boolean;
	createUnavailable: boolean;
	linkUnavailable: boolean;
	onCreateWorkItem?: () => void;
	onLinkWorkItem?: (workItemKey?: string) => void;
	onSubtasks?: () => void;
	suggestedWorkItemKey?: string;
	/** Several candidates, one row each. Takes precedence over the single key. */
	suggestedWorkItemKeys?: readonly string[];
	summary: string;
}>) {
	const suggestionKeys = uncapturedWorkSuggestionKeys(suggestedWorkItemKey, suggestedWorkItemKeys);
	// Per the design, every offered row carries the pair — each row is a complete
	// "link here, or capture this instead" choice rather than a bare suggestion.
	const trailingActions = (
		<div className="ml-auto flex shrink-0 items-center">
			<ChinIconAction
				actionLabel={`Create work item for ${summary}`}
				disabled={createUnavailable}
				icon={<WorkItemAddIcon label="" />}
				label="Create work item"
				onClick={onCreateWorkItem}
			/>
			<ChinIconAction
				actionLabel={`Subtasks for ${summary}`}
				icon={<SubtasksIcon label="" />}
				label="Subtasks"
				onClick={onSubtasks}
			/>
		</div>
	);

	return (
		<footer
			className="flex flex-col gap-0.5 border-t border-dashed border-border-disabled bg-surface p-2"
			data-slot="uncaptured-work-chin"
		>
			{captured ? (
				<ChinRow>
					<Button
						disabled
						aria-label={`${summary} captured`}
						className="justify-start border-transparent bg-transparent text-text-success disabled:opacity-100 [&_svg]:text-icon-success hover:bg-transparent active:bg-transparent"
						size="compact"
						variant="outline"
					>
						<Icon aria-hidden render={<CheckMarkIcon label="" />} />
						Captured
					</Button>
				</ChinRow>
			) : (
				suggestionKeys.map((key) => (
					<ChinRow actions={trailingActions} key={key ?? "link-work-item"}>
						<Button
							aria-disabled={linkUnavailable}
							aria-label={linkUnavailable
								? `${linkActionLabel(summary, key)} unavailable`
								: linkActionLabel(summary, key)}
							className={cn("justify-start", linkUnavailable ? "cursor-not-allowed opacity-(--opacity-disabled)" : null)}
							onClick={() => {
								onLinkWorkItem?.(key);
							}}
							size="compact"
							type="button"
							variant="ghost"
						>
							{uncapturedWorkLinkLabel(key)}
						</Button>
					</ChinRow>
				))
			)}
		</footer>
	);
}

function linkActionLabel(summary: string, suggestedWorkItemKey?: string): string {
	return suggestedWorkItemKey === undefined
		? `Link ${summary} to a work item`
		: `Link ${summary} to ${suggestedWorkItemKey}`;
}
