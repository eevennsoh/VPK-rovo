"use client";

import { useMemo, useState, type ReactNode } from "react";

import type { JiraAgentSessionItem } from "@/components/blocks/jira-agent-session";
import { cn } from "@/lib/utils";

import { JIRA_ACTIVITY_CURRENT_USER, JIRA_ACTIVITY_ENTRIES } from "./data";
import { JiraActivityChangedFiles } from "./jira-activity-changed-files";
import { JiraActivityComment } from "./jira-activity-comment";
import { JiraActivityComposer } from "./jira-activity-composer";
import { JiraActivityEvent } from "./jira-activity-event";
import { JiraActivityHeader } from "./jira-activity-header";
import { JiraActivityNode } from "./jira-activity-node";
import type {
	JiraActivityActor,
	JiraActivityCommentEntry,
	JiraActivityEntry,
	JiraActivityFilter,
	JiraActivitySortOrder,
} from "./jira-activity-types";
import {
	createCommentEntry,
	createReply,
	jiraActivityReducer,
} from "./lib/jira-activity-reducer";

export interface JiraActivityProps {
	/** Timeline entries, oldest first. Defaults to built-in sample data. */
	entries?: readonly JiraActivityEntry[];
	/** Initial entries when the timeline is uncontrolled. */
	defaultEntries?: readonly JiraActivityEntry[];
	/** Receives the complete next timeline after a comment or reply is submitted. */
	onEntriesChange?: (entries: readonly JiraActivityEntry[]) => void;
	/** The signed-in viewer; authors new comments and replies. */
	currentUser?: JiraActivityActor;
	/** Override the bottom composer. Pass `null` to suppress it. */
	composer?: ReactNode | null;
	/** Optional trailing action for each comment card. */
	renderCommentAction?: (entry: JiraActivityCommentEntry) => ReactNode;
	/** Opens the rich agent-session summary shown by an agent comment. */
	onViewSession?: (item: JiraAgentSessionItem) => void;
	/** Handles an inline reply externally instead of appending it to local timeline state. */
	onSubmitReply?: (entry: JiraActivityCommentEntry, body: string) => void;
	className?: string;
	/** Controlled timeline ordering. */
	sortOrder?: JiraActivitySortOrder;
	/** Initial ordering when uncontrolled. Defaults to `ascending` (oldest first). */
	defaultSortOrder?: JiraActivitySortOrder;
	/** Receives the next ordering when the header sort control changes. */
	onSortOrderChange?: (next: JiraActivitySortOrder) => void;
	/** Controlled timeline filter. */
	filter?: JiraActivityFilter;
	/** Initial filter when uncontrolled. Defaults to `all`. */
	defaultFilter?: JiraActivityFilter;
	/** Receives the next filter when the header view control changes. */
	onFilterChange?: (next: JiraActivityFilter) => void;
	/** Controlled collapsed state for the timeline body. */
	collapsed?: boolean;
	/** Initial collapsed state when uncontrolled. Defaults to `false`. */
	defaultCollapsed?: boolean;
	/** Receives the next collapsed state when the header collapse control changes. */
	onCollapsedChange?: (next: boolean) => void;
}

/**
 * A chronological activity timeline documenting work done by humans and AI
 * agents on a Jira work item. Renders event rows, comment cards, and
 * changed-files cards on a shared connector spine, with a header and a bottom
 * comment composer. Comments and replies append to the feed via a pure reducer.
 */
export function JiraActivity({
	entries: controlledEntries,
	defaultEntries = JIRA_ACTIVITY_ENTRIES,
	onEntriesChange,
	currentUser = JIRA_ACTIVITY_CURRENT_USER,
	composer,
	renderCommentAction,
	onViewSession,
	onSubmitReply,
	className,
	sortOrder: controlledSortOrder,
	defaultSortOrder = "ascending",
	onSortOrderChange,
	filter: controlledFilter,
	defaultFilter = "all",
	onFilterChange,
	collapsed: controlledCollapsed,
	defaultCollapsed = false,
	onCollapsedChange,
}: Readonly<JiraActivityProps>) {
	const [uncontrolledEntries, setUncontrolledEntries] = useState(defaultEntries);
	const entries = controlledEntries ?? uncontrolledEntries;
	const [uncontrolledSortOrder, setUncontrolledSortOrder] = useState(defaultSortOrder);
	const sortOrder = controlledSortOrder ?? uncontrolledSortOrder;
	const [uncontrolledFilter, setUncontrolledFilter] = useState(defaultFilter);
	const filter = controlledFilter ?? uncontrolledFilter;
	const [uncontrolledCollapsed, setUncontrolledCollapsed] = useState(defaultCollapsed);
	const collapsed = controlledCollapsed ?? uncontrolledCollapsed;

	function handleSortOrderChange(next: JiraActivitySortOrder) {
		if (controlledSortOrder === undefined) {
			setUncontrolledSortOrder(next);
		}
		onSortOrderChange?.(next);
	}

	function handleCollapsedChange(next: boolean) {
		if (controlledCollapsed === undefined) {
			setUncontrolledCollapsed(next);
		}
		onCollapsedChange?.(next);
	}

	function handleFilterChange(next: JiraActivityFilter) {
		if (controlledFilter === undefined) {
			setUncontrolledFilter(next);
		}
		onFilterChange?.(next);
	}

	function applyAction(action: Parameters<typeof jiraActivityReducer>[1]) {
		const nextState = jiraActivityReducer({ entries }, action);
		if (nextState.entries === entries) return;
		if (controlledEntries === undefined) {
			setUncontrolledEntries(nextState.entries);
		}
		onEntriesChange?.(nextState.entries);
	}

	// Entries are stored oldest-first; `descending` shows newest first without
	// mutating the canonical order the reducer appends to.
	const visibleEntries = useMemo(
		() =>
			filter === "agents-only"
				? entries.filter(
						(entry) =>
							entry.actor.kind === "agent" &&
							(entry.kind === "comment" ||
								(entry.kind === "changed-files" && entry.outputs !== undefined)),
					)
				: entries,
		[entries, filter],
	);
	const orderedEntries = useMemo(
		() => (sortOrder === "descending" ? [...visibleEntries].reverse() : visibleEntries),
		[sortOrder, visibleEntries],
	);

	function handleAddComment(body: string) {
		applyAction({
			type: "add-comment",
			entry: createCommentEntry({
				id: crypto.randomUUID(),
				actor: currentUser,
				timestamp: "Just now",
				body,
			}),
		});
	}

	function handleAddReply(entry: JiraActivityCommentEntry, body: string) {
		if (onSubmitReply) {
			onSubmitReply(entry, body);
			return;
		}
		applyAction({
			type: "add-reply",
			entryId: entry.id,
			reply: createReply({
				id: crypto.randomUUID(),
				actor: currentUser,
				timestamp: "Just now",
				body,
			}),
		});
	}

	return (
		<div className={cn("group/jira-activity flex w-full flex-col gap-4", className)}>
			<div>
				<JiraActivityHeader
					collapsed={collapsed}
					count={visibleEntries.length}
					filter={filter}
					onCollapsedChange={handleCollapsedChange}
					onFilterChange={handleFilterChange}
					onSortOrderChange={handleSortOrderChange}
					sortOrder={sortOrder}
				/>
			</div>

			{collapsed ? null : (
				<ol aria-label="Activity timeline" className="flex flex-col">
					{orderedEntries.map((entry, index) => {
						const isLast = index === orderedEntries.length - 1;

						return (
							<li className="flex gap-2" data-jira-activity-entry-id={entry.id} key={entry.id}>
								<JiraActivityNode
									actor={entry.actor}
									icon={entry.kind === "event" ? entry.icon : undefined}
									isLast={isLast}
								/>
								<div
									className={cn(
										"min-w-0 flex-1",
										// Human and agent comment panels get a slightly larger 16px gap
										// below the card; event spine rows and changed-files outputs stay at 12px.
										entry.kind === "comment" ? "pb-4" : "pb-3",
									)}
								>
									{entry.kind === "event" ? <JiraActivityEvent entry={entry} /> : null}
									{entry.kind === "comment" ? (
										<JiraActivityComment
											currentUser={currentUser}
											entry={entry}
											onViewSession={onViewSession}
											onSubmitReply={(body) => handleAddReply(entry, body)}
											action={renderCommentAction?.(entry)}
										/>
									) : null}
									{entry.kind === "changed-files" ? (
										<JiraActivityChangedFiles entry={entry} onView={onViewSession} />
									) : null}
								</div>
							</li>
						);
					})}
				</ol>
			)}

			{collapsed || composer === null ? null : composer === undefined ? (
				<JiraActivityComposer
					author={currentUser}
					onSubmit={handleAddComment}
					placeholder="Leave a comment..."
					variant="comment"
				/>
			) : (
				composer
			)}
		</div>
	);
}

export { JIRA_ACTIVITY_CURRENT_USER, JIRA_ACTIVITY_ENTRIES } from "./data";
export { JiraActivityCard, type JiraActivityCardProps } from "./jira-activity-card";
export { JiraActivityComposer, type JiraActivityComposerProps } from "./jira-activity-composer";
export type {
	JiraActivityActor,
	JiraActivityActorKind,
	JiraActivityChangedFilesEntry,
	JiraActivityCommentEntry,
	JiraActivityEntry,
	JiraActivityEventEntry,
	JiraActivityEventIcon,
	JiraActivityFilter,
	JiraActivityReply,
	JiraActivitySegment,
	JiraActivitySortOrder,
} from "./jira-activity-types";
