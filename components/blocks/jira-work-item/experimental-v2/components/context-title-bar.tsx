"use client";

import { useEffect, useState } from "react";

import LinkIcon from "@atlaskit/icon/core/link";
import StatusSuccessIcon from "@atlaskit/icon/core/status-success";

import { ContextEditableTitle } from "@/components/blocks/jira-work-item/experimental-v2/components/context-editable-header";
import { useJiraWorkItemMeta } from "@/components/blocks/jira-work-item/experimental-v2/context-jira-work-item";
import { Icon } from "@/components/ui/icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const COPIED_STATE_DURATION_MS = 1800;

/** Compact title-block control for copying the stable work-item key. */
export function WorkItemKeyCopy() {
	const { workItem } = useJiraWorkItemMeta();
	const [copied, setCopied] = useState(false);
	const [tooltipOpen, setTooltipOpen] = useState(false);

	useEffect(() => {
		if (!copied) return undefined;

		const timeout = window.setTimeout(() => {
			setCopied(false);
			setTooltipOpen(false);
		}, COPIED_STATE_DURATION_MS);

		return () => window.clearTimeout(timeout);
	}, [copied]);

	const handleCopyWorkItemKey = async () => {
		try {
			await navigator.clipboard?.writeText(workItem.code);
		} catch {
			// Keep the interaction optimistic if clipboard access is unavailable.
		}

		setCopied(true);
		setTooltipOpen(true);
	};

	return (
		<Tooltip onOpenChange={setTooltipOpen} open={copied || tooltipOpen}>
			{/* Base UI TooltipTrigger defaults to 600ms; 0 keeps the copy affordance snappy. */}
			<TooltipTrigger
				delay={0}
				render={
					<button
						type="button"
						aria-label={copied ? "Work item key copied" : "Copy work item key"}
						className="group/work-item-key inline-flex min-w-0 cursor-pointer items-center border-0 bg-transparent p-0 font-mono text-base leading-5 text-text-subtle hover:text-text focus-visible:text-text focus-visible:outline-none"
						data-jira-work-item-key
						onClick={() => void handleCopyWorkItemKey()}
					/>
				}
			>
				<span className="pointer-events-none inline-flex min-w-0 items-center">
					<span data-jira-work-item-key-label>{workItem.code}</span>
					<span
						aria-hidden
						className={cn(
							"inline-flex max-w-0 shrink-0 translate-x-1 scale-95 overflow-hidden opacity-0 transition-[max-width,opacity,translate,scale] duration-normal ease-out-practical motion-reduce:transition-none group-hover/work-item-key:max-w-6 group-hover/work-item-key:translate-x-0 group-hover/work-item-key:scale-100 group-hover/work-item-key:opacity-100 group-focus-visible/work-item-key:max-w-6 group-focus-visible/work-item-key:translate-x-0 group-focus-visible/work-item-key:scale-100 group-focus-visible/work-item-key:opacity-100",
							copied && "max-w-6 translate-x-0 scale-100 opacity-100",
						)}
						data-jira-work-item-key-copy-icon
					>
						<span className="ml-1 inline-flex size-4 shrink-0 items-center justify-center [&_[data-slot=icon]]:size-4 [&_svg]:size-4">
							<Icon
								className={cn("size-4", copied ? "text-icon-success" : "text-text-subtle")}
								render={copied ? <StatusSuccessIcon label="" size="small" /> : <LinkIcon label="" size="small" />}
							/>
						</span>
					</span>
				</span>
			</TooltipTrigger>
			<TooltipContent side="top">
				{copied ? "Work item key copied" : "Copy work item key"}
			</TooltipContent>
		</Tooltip>
	);
}

/** Editable title at the top of the left Context column. */
export function ContextTitleBar() {
	return (
		<div
			className="min-w-0 self-stretch @[860px]/agentlayout:mr-[var(--metadata-panel-offset)]"
			data-jira-work-item-title-column
		>
			<div className="min-w-0" data-jira-work-item-title>
				<ContextEditableTitle />
			</div>
		</div>
	);
}
