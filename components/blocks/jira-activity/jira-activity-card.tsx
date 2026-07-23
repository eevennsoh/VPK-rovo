"use client";

import { useState, type ReactNode } from "react";

import ChevronRightIcon from "@atlaskit/icon/core/chevron-right";

import {
	JiraAgentSessionActivityHeader,
	type JiraAgentSessionItem,
} from "@/components/blocks/jira-agent-session";
import { Icon } from "@/components/ui/icon";
import { Tag, type TagColor } from "@/components/ui/tag";
import { cn } from "@/lib/utils";

export interface JiraActivityCardProps {
	/** Session summary shown as the rich activity-card header. */
	item?: JiraAgentSessionItem;
	/** Agent name shown in the activity-card header. */
	agentName?: string;
	/** Relative activity timestamp shown beside the agent name. */
	timestamp?: string;
	/** Optional status tag shown in the activity-card header. */
	tag?: { text: string; color?: TagColor };
	/** Optional trailing header action supplied by the consuming surface. */
	action?: ReactNode;
	/** Optional leading identity shown in the plain activity-card header. */
	headerAvatar?: ReactNode;
	/** Header geometry for plain activity cards without a session summary. */
	headerLayout?: "inline" | "stacked";
	/** Called when the rich activity header's View button is activated. */
	onView?: (item: JiraAgentSessionItem) => void;
	/** Main activity content rendered inside the card. */
	children: ReactNode;
	/** Optional expandable supporting detail, such as a prompt or investigation. */
	details?: { label: string; children: ReactNode };
	/** Optional rendered replies shown below the activity content. */
	replies?: ReactNode;
	/** Optional reply composer shown at the bottom of the card. */
	replyComposer?: ReactNode;
	className?: string;
}

/**
 * Shared card shell for Jira Activity comments. It owns the human and agent
 * header treatments, expandable details, replies, and flush composer footer.
 * Jira Agent Session supplies only the session-specific header presentation.
 */
export function JiraActivityCard({
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
}: Readonly<JiraActivityCardProps>) {
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
						detailsOpen ? "rotate-90" : null,
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
						<div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1 text-sm leading-5">
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
