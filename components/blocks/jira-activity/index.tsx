"use client";

import { useMemo, useState, type ReactNode } from "react";

import type { AgentListItem } from "@/components/blocks/agent-list";
import { StickyRowScrollFade } from "@/components/visual/scroll-mask";
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
import { filterJiraActivityEntries } from "./lib/jira-activity-filter";
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
	/** Known actors used to resolve reaction hover details before they appear in the timeline. */
	actors?: readonly JiraActivityActor[];
	/** Override the bottom composer. Pass `null` to suppress it. */
	composer?: ReactNode | null;
	/** Optional trailing action for each comment card. */
	renderCommentAction?: (entry: JiraActivityCommentEntry) => ReactNode;
	/** Opens the rich agent-session summary shown by an agent comment. */
	onViewSession?: (item: AgentListItem) => void;
	/** Handles an inline reply externally instead of appending it to local timeline state. */
	onSubmitReply?: (entry: JiraActivityCommentEntry, body: string) => void;
	/**
	 * Per-comment action row and composer disclosure.
	 * - "none": no action row; the composer stays mounted (legacy behavior).
	 * - "reactions": pills + Add reaction; the composer stays mounted.
	 * - "reply-and-reactions": Reply plus reactions; the composer is hidden until Reply.
	 */
	commentActions?: "none" | "reactions" | "reply-and-reactions";
	/** Handles a reaction toggle externally instead of applying it to local state. */
	onToggleReaction?: (entry: JiraActivityCommentEntry, emoji: string) => void;
	className?: string;
	/** Optional classes for the header wrapper, including consumer-owned sticky positioning. */
	headerClassName?: string;
	/** Adds a fade below the header while its wrapper is stuck to the top. */
	headerScrollFade?: boolean;
	/**
	 * When true, omit the built-in header entirely so a parent can host the
	 * activity count and view/sort control (e.g. MetadataRail toggle row).
	 */
	hideHeader?: boolean;
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
	actors = [],
	composer,
	renderCommentAction,
	onViewSession,
	onSubmitReply,
	commentActions = "reply-and-reactions",
	onToggleReaction,
	className,
	headerClassName,
	headerScrollFade = false,
	hideHeader = false,
	sortOrder: controlledSortOrder,
	defaultSortOrder = "ascending",
	onSortOrderChange,
	filter: controlledFilter,
	defaultFilter = "all",
	onFilterChange,
	collapsed: controlledCollapsed,
}: Readonly<JiraActivityProps>) {
	const [uncontrolledEntries, setUncontrolledEntries] = useState(defaultEntries);
	const entries = controlledEntries ?? uncontrolledEntries;
	const [uncontrolledSortOrder, setUncontrolledSortOrder] = useState(defaultSortOrder);
	const sortOrder = controlledSortOrder ?? uncontrolledSortOrder;
	const [uncontrolledFilter, setUncontrolledFilter] = useState(defaultFilter);
	const filter = controlledFilter ?? uncontrolledFilter;
	const collapsed = controlledCollapsed ?? false;
	const actorsById = useMemo(() => {
		const actorDirectory = new Map<string, JiraActivityActor>();
		actorDirectory.set(currentUser.id, currentUser);
		for (const entry of entries) {
			actorDirectory.set(entry.actor.id, entry.actor);
			if (entry.kind === "comment") {
				for (const reply of entry.replies ?? []) {
					actorDirectory.set(reply.actor.id, reply.actor);
				}
			}
		}
		for (const actor of actors) actorDirectory.set(actor.id, actor);
		return actorDirectory;
	}, [actors, currentUser, entries]);

	function handleSortOrderChange(next: JiraActivitySortOrder) {
		if (controlledSortOrder === undefined) {
			setUncontrolledSortOrder(next);
		}
		onSortOrderChange?.(next);
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
		() => filterJiraActivityEntries(entries, filter),
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

	function handleToggleReaction(entry: JiraActivityCommentEntry, emoji: string) {
		if (onToggleReaction) {
			onToggleReaction(entry, emoji);
			return;
		}
		applyAction({
			type: "toggle-reaction",
			entryId: entry.id,
			emoji,
			actorId: currentUser.id,
		});
	}

	return (
		<div className={cn("flex w-full flex-col gap-4", className)}>
			{hideHeader ? null : (
				<div className={headerClassName} data-slot="jira-activity-header">
					<JiraActivityHeader
						count={visibleEntries.length}
						filter={filter}
						onFilterChange={handleFilterChange}
						onSortOrderChange={handleSortOrderChange}
						sortOrder={sortOrder}
					/>
					{headerScrollFade ? (
						<StickyRowScrollFade
							data-slot="jira-activity-header-scroll-fade"
						/>
					) : null}
				</div>
			)}

			{collapsed ? null : (
				<ol aria-label="Activity timeline" className="flex flex-col">
					{orderedEntries.map((entry, index) => {
						const isLast = index === orderedEntries.length - 1;
						const isCardEntry = entry.kind !== "event";
						const isNextEntryCard = orderedEntries[index + 1]?.kind !== "event" && !isLast;
						const spacingClassName = isLast
							? entry.kind === "comment" ? "pb-4" : "pb-3"
							: isCardEntry && isNextEntryCard
								? "pb-6"
								: isCardEntry || isNextEntryCard ? "pb-5" : "pb-3";

						return (
							<li
								className="relative flex gap-2"
								data-jira-activity-entry-id={entry.id}
								key={entry.id}
							>
								<JiraActivityNode
									actor={entry.actor}
									icon={entry.kind === "event" ? entry.icon : undefined}
									isLast={isLast}
									size={isCardEntry ? "card" : "event"}
								/>
								{isCardEntry ? (
									<>
										{/*
										 * Spine is centered in the shared w-8 node (x=16). Covers are
										 * positioned on the li so card content never needs a pull-left
										 * offset; w-1 cover centered on the spine → left-3.5.
										 */}
										<span
											aria-hidden
											className="pointer-events-none absolute -top-1 left-3.5 h-1 w-1 bg-surface"
										/>
										{isLast ? null : (
											<span
												aria-hidden
												className={cn(
													"pointer-events-none absolute left-3.5 h-1 w-1 bg-surface",
													isNextEntryCard ? "bottom-5" : "bottom-4",
												)}
											/>
										)}
									</>
								) : null}
								<div className={cn("min-w-0 flex-1", spacingClassName)}>
									{entry.kind === "event" ? <JiraActivityEvent entry={entry} /> : null}
									{entry.kind === "comment" ? (
										<JiraActivityComment
											actorsById={actorsById}
											commentActions={commentActions}
											currentUser={currentUser}
											entry={entry}
											onViewSession={onViewSession}
											onSubmitReply={(body) => handleAddReply(entry, body)}
											onToggleReaction={(emoji) => handleToggleReaction(entry, emoji)}
											action={renderCommentAction?.(entry)}
										/>
									) : null}
									{entry.kind === "changed-files" ? (
										<JiraActivityChangedFiles
											entry={entry}
											hideLeadAvatar
											onView={onViewSession}
										/>
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
export {
	JiraActivityHeader,
	JiraActivityViewControl,
} from "./jira-activity-header";
export type {
	JiraActivityActor,
	JiraActivityActorKind,
	JiraActivityChangedFilesEntry,
	JiraActivityCommentEntry,
	JiraActivityEntry,
	JiraActivityEventEntry,
	JiraActivityEventIcon,
	JiraActivityFilter,
	JiraActivityReaction,
	JiraActivityReply,
	JiraActivitySegment,
	JiraActivitySortOrder,
} from "./jira-activity-types";
