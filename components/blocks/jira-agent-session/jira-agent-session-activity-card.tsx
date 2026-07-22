"use client";

import { useState } from "react";

import ChevronRightIcon from "@atlaskit/icon/core/chevron-right";

import { Icon } from "@/components/ui/icon";
import { Tag } from "@/components/ui/tag";
import { cn } from "@/lib/utils";

import { JiraAgentSessionActivityHeader } from "./jira-agent-session-card";
import type { JiraAgentSessionActivityCardProps } from "./jira-agent-session-types";

/**
 * Expanded agent-session card for chronological activity surfaces. The
 * consuming surface supplies its rich response, replies, and composer while
 * this component owns the shared card shell and expandable detail treatment.
 */
export function JiraAgentSessionActivityCard({
	item,
	agentName,
	timestamp,
	tag,
	action,
	headerAvatar,
	headerLayout = "inline",
	onView,
	children,
	details,
	replies,
	replyComposer,
	className,
}: Readonly<JiraAgentSessionActivityCardProps>) {
	const [detailsOpen, setDetailsOpen] = useState(false);
	const showFooter = replies != null || replyComposer != null;
	const detailsContent = details ? (
		<div className="grid gap-1">
			<button
				aria-expanded={detailsOpen}
				className="flex items-center gap-1 self-start rounded-xs text-sm font-medium text-text focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
				onClick={() => setDetailsOpen((previousOpen) => !previousOpen)}
				type="button"
			>
				<Icon
					aria-hidden
					className={cn(
						"text-icon-subtle transition-transform duration-fast ease-out-practical motion-reduce:transition-none",
						detailsOpen && "rotate-90",
					)}
					render={<ChevronRightIcon color="currentColor" label="" size="small" />}
				/>
				{details.label}
			</button>
			{detailsOpen ? details.children : null}
		</div>
	) : null;

	if (item) {
		return (
			<div
				className={cn(
					"w-full overflow-hidden rounded-xl border border-border bg-surface",
					className,
				)}
			>
				<div className="grid gap-4 p-4">
					<JiraAgentSessionActivityHeader
						action={action}
						item={item}
						key={item.id}
						onView={onView}
					/>
					<div className="text-sm leading-5 text-text">{children}</div>
					{detailsContent}
				</div>
				{showFooter ? (
					<div className="border-t border-border">
						{replies}
						{replyComposer}
					</div>
				) : null}
			</div>
		);
	}

	const hasStackedHeader = headerLayout === "stacked";

	return (
		<div
			className={cn(
				"w-full overflow-hidden border border-border bg-surface",
				hasStackedHeader ? "rounded-xl" : "rounded-lg",
				className,
			)}
		>
			<div className={cn("grid", hasStackedHeader ? "gap-4 p-4" : "gap-2 p-3")}>
				<div
					className={
						hasStackedHeader
							? "flex min-w-0 items-center gap-3"
							: "flex min-w-0 items-start gap-3"
					}
				>
					{headerAvatar}
					{hasStackedHeader ? (
						<div className="min-w-0 flex-1">
							<div className="flex min-w-0 items-center">
								<span className="min-w-0 truncate text-sm font-medium text-text">
									{agentName}
								</span>
							</div>
							<div className="flex min-w-0 items-center gap-1 text-xs leading-4 text-text-subtle">
								<span className="shrink-0">{timestamp}</span>
								{tag ? <Tag color={tag.color ?? "gray"}>{tag.text}</Tag> : null}
							</div>
						</div>
					) : (
						<div
							className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1 text-sm leading-5"
						>
							<span className="font-medium text-text">{agentName}</span>
							<span className="text-text-subtle">{timestamp}</span>
							{tag ? <Tag color={tag.color ?? "gray"}>{tag.text}</Tag> : null}
						</div>
					)}
					{action}
				</div>

				{children}

				{detailsContent}
			</div>

			{showFooter ? (
				<div className="border-t border-border">
					{replies}
					{replyComposer}
				</div>
			) : null}
		</div>
	);
}
