"use client";

import { useState, type ReactNode } from "react";

import ChevronRightIcon from "@atlaskit/icon/core/chevron-right";

import {
	AgentListActivityHeader,
	type AgentListItem,
} from "@/components/blocks/agent-list";
import { Icon } from "@/components/ui/icon";
import { Tag, type TagColor } from "@/components/ui/tag";
import { cn } from "@/lib/utils";

export interface JiraActivityCardProps {
	/** Session summary shown as the rich activity-card header. */
	item?: AgentListItem;
	/** Agent name shown in the activity-card header. */
	agentName?: string;
	/** Fixed sent timestamp shown before active runtime in agent-session headers. */
	timestamp?: string;
	/** Optional status tag shown in the activity-card header. */
	tag?: { text: string; color?: TagColor };
	/** Optional trailing header action supplied by the consuming surface. */
	action?: ReactNode;
	/** Optional leading identity shown in the plain activity-card header. */
	headerAvatar?: ReactNode;
	/** Header geometry for plain activity cards without a session summary. */
	headerLayout?: "inline" | "stacked";
	/** Named hover scope for cards nested inside another activity card. */
	activityGroup?: "activity-card" | "activity-reply";
	/** Called when the rich activity header's View button is activated. */
	onView?: (item: AgentListItem) => void;
	/** Main activity content rendered inside the card. */
	children: ReactNode;
	/** Optional expandable supporting detail, such as a prompt or investigation. */
	details?: { label: string; children: ReactNode };
	/** Optional action row (reply, reactions) rendered under the activity content. */
	footerActions?: ReactNode;
	/** Optional rendered replies shown below the activity content. */
	replies?: ReactNode;
	/** Keep reply content mounted but remove it from layout and the accessibility tree. */
	repliesHidden?: boolean;
	/** Optional reply composer shown at the bottom of the card. */
	replyComposer?: ReactNode;
	className?: string;
}

/**
 * Shared card shell for Jira Activity comments. It owns the human and agent
 * header treatments, expandable details, replies, and flush composer footer.
 * Agent List supplies only the session-specific header presentation.
 */
export function JiraActivityCard({
	item,
	agentName,
	timestamp,
	tag,
	action,
	headerAvatar,
	headerLayout = "inline",
	activityGroup = "activity-card",
	onView,
	children,
	details,
	footerActions,
	replies,
	repliesHidden = false,
	replyComposer,
	className,
}: Readonly<JiraActivityCardProps>) {
	const [detailsOpen, setDetailsOpen] = useState(false);
	const showFooter = replies != null || replyComposer != null;
	const showFooterBorder = (replies != null && !repliesHidden) || replyComposer != null;
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
	const hasStackedHeader = headerLayout === "stacked";
	const hasExpandedLayout = item != null || hasStackedHeader;
	const activityGroupClass = activityGroup === "activity-reply"
		? "group/activity-reply"
		: "group/activity-card";
	// Revealed on hover, but kept in layout and in the tab order: a `display: none`
	// wrapper could never satisfy its own `:focus-visible` reveal condition.
	const actionVisibilityClass = activityGroup === "activity-reply"
		? "group-hover/activity-reply:pointer-events-auto group-hover/activity-reply:opacity-100 group-has-[:focus-visible]/activity-reply:pointer-events-auto group-has-[:focus-visible]/activity-reply:opacity-100"
		: "group-hover/activity-card:pointer-events-auto group-hover/activity-card:opacity-100 group-has-[:focus-visible]/activity-card:pointer-events-auto group-has-[:focus-visible]/activity-card:opacity-100";

	return (
		<div
			className={cn(
				"w-full overflow-hidden border border-border bg-surface",
				hasExpandedLayout ? "rounded-xl" : "rounded-lg",
				className,
			)}
		>
			<div
				className={cn(
					activityGroupClass,
					"grid",
					hasExpandedLayout ? "gap-3 p-3" : "gap-2 p-3",
				)}
			>
				{item ? (
					<>
						<AgentListActivityHeader
							action={action}
							activityGroup={activityGroup}
							item={item}
							key={item.id}
							leadWithAgentName
							messageTimestamp={timestamp}
							onView={onView}
						/>
						<div className="text-sm leading-5 text-text">{children}</div>
					</>
				) : (
					<>
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
							{action ? (
								<div
									className={cn(
										"pointer-events-none flex shrink-0 items-center gap-2 opacity-0 transition-opacity duration-normal ease-out-practical motion-reduce:transition-none",
										actionVisibilityClass,
									)}
								>
									{action}
								</div>
							) : null}
						</div>

						{children}
					</>
				)}
				{detailsContent}
				{/* Last child of the body grid: inherits the card's gap and sits flush
				under the content, while the bordered footer keeps hosting replies. */}
				{footerActions}
			</div>

			{showFooter ? (
				<div className={cn(showFooterBorder ? "border-t border-border" : null)}>
					{replies}
					{replyComposer}
				</div>
			) : null}
		</div>
	);
}
