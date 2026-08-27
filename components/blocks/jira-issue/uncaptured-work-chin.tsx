"use client";

import { useState } from "react";

import CheckMarkIcon from "@atlaskit/icon/core/check-mark";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import CopyIcon from "@atlaskit/icon/core/copy";
import DeleteIcon from "@atlaskit/icon/core/delete";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

export function UncapturedWorkChin({
	captured,
	createUnavailable,
	linkUnavailable,
	onCopyResume,
	onCreateWorkItem,
	onDismiss,
	onLinkWorkItem,
	suggestedWorkItemKey,
	summary,
}: Readonly<{
	captured: boolean;
	createUnavailable: boolean;
	linkUnavailable: boolean;
	onCopyResume?: () => void;
	onCreateWorkItem?: () => void;
	onDismiss?: () => void;
	onLinkWorkItem?: () => void;
	suggestedWorkItemKey?: string;
	summary: string;
}>) {
	const linkLabel = uncapturedWorkLinkLabel(suggestedWorkItemKey);
	const createLabel = captured
		? `${summary} captured`
		: createUnavailable
			? `Create work item for ${summary} unavailable`
			: `Create work item for ${summary}`;
	const linkActionLabel = suggestedWorkItemKey === undefined
		? `Link ${summary} to a work item`
		: `Link ${summary} to ${suggestedWorkItemKey}`;
	const [copiedResume, setCopiedResume] = useState(false);
	const copyActionLabel = copiedResume ? `Copied resume command for ${summary}` : "Resume session";
	const showTrailingActions = onCopyResume !== undefined || (!captured && onDismiss !== undefined);

	return (
		<footer
			className="flex items-center justify-between gap-2 border-t border-dashed border-border-disabled bg-surface px-3 py-2"
			data-slot="uncaptured-work-chin"
		>
			{captured ? (
				<Button
					aria-disabled
					aria-label={createLabel}
					className="justify-start border-transparent bg-transparent text-text-success [&_svg]:text-icon-success hover:bg-transparent active:bg-transparent"
					size="compact"
					variant="outline"
				>
					<Icon aria-hidden render={<CheckMarkIcon label="" />} />
					Captured
				</Button>
			) : (
				<ButtonGroup aria-label={`Work item actions for ${summary}`} variant="split">
					<Button
						aria-disabled={linkUnavailable}
						aria-label={linkUnavailable ? `${linkActionLabel} unavailable` : linkActionLabel}
						className={cn("justify-start", linkUnavailable ? "cursor-not-allowed opacity-(--opacity-disabled)" : null)}
						onClick={() => {
							onLinkWorkItem?.();
						}}
						size="compact"
						variant="outline"
					>
						{linkLabel}
					</Button>
					<DropdownMenu>
						<DropdownMenuTrigger
							render={
								<Button
									aria-label={`More work item actions for ${summary}`}
									size="icon-compact"
									type="button"
									variant="outline"
								/>
							}
						>
							<Icon aria-hidden render={<ChevronDownIcon label="" size="small" />} />
						</DropdownMenuTrigger>
						<DropdownMenuContent align="start" side="bottom">
							<DropdownMenuItem
								disabled={createUnavailable}
								onSelect={() => {
									onCreateWorkItem?.();
								}}
							>
								Create work item
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</ButtonGroup>
			)}
			{showTrailingActions ? (
				<div className="ml-auto flex shrink-0 items-center">
					{onCopyResume === undefined ? null : (
						<TooltipProvider delay={0}>
							<Tooltip>
								<TooltipTrigger
									render={
										<Button
											aria-label={copyActionLabel}
											onClick={() => {
												onCopyResume();
												setCopiedResume(true);
												window.setTimeout(() => {
													setCopiedResume(false);
												}, 2000);
											}}
											size="icon-compact"
											type="button"
											variant="ghost"
										/>
									}
								>
									<Icon
										aria-hidden
										render={copiedResume ? <CheckMarkIcon label="" /> : <CopyIcon label="" />}
									/>
								</TooltipTrigger>
								<TooltipContent>Resume session</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					)}
					{captured || onDismiss === undefined ? null : (
						<Button
							aria-label={`Dismiss ${summary}`}
							onClick={() => {
								onDismiss();
							}}
							size="icon-compact"
							type="button"
							variant="ghost"
						>
							<Icon aria-hidden render={<DeleteIcon label="" />} />
						</Button>
					)}
				</div>
			) : null}
		</footer>
	);
}
