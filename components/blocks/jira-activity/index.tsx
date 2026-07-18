"use client";

import { useMemo, useReducer } from "react";

import { cn } from "@/lib/utils";

import { JIRA_ACTIVITY_CURRENT_USER, JIRA_ACTIVITY_ENTRIES } from "./data";
import { JiraActivityChangedFiles } from "./jira-activity-changed-files";
import { JiraActivityComment } from "./jira-activity-comment";
import { JiraActivityComposer } from "./jira-activity-composer";
import { JiraActivityEvent } from "./jira-activity-event";
import { JiraActivityHeader } from "./jira-activity-header";
import { JiraActivityNode } from "./jira-activity-node";
import type { JiraActivityActor, JiraActivityEntry } from "./jira-activity-types";
import {
	createCommentEntry,
	createReply,
	jiraActivityReducer,
} from "./lib/jira-activity-reducer";

export interface JiraActivityProps {
	/** Timeline entries, oldest first. Defaults to built-in sample data. */
	entries?: readonly JiraActivityEntry[];
	/** The signed-in viewer; authors new comments and replies. */
	currentUser?: JiraActivityActor;
	className?: string;
	onUnsubscribe?: () => void;
}

/**
 * A chronological activity timeline documenting work done by humans and AI
 * agents on a Jira work item. Renders event rows, comment cards, and
 * changed-files cards on a shared connector spine, with a header and a bottom
 * comment composer. Comments and replies append to the feed via a pure reducer.
 */
export function JiraActivity({
	entries = JIRA_ACTIVITY_ENTRIES,
	currentUser = JIRA_ACTIVITY_CURRENT_USER,
	className,
	onUnsubscribe,
}: Readonly<JiraActivityProps>) {
	const [state, dispatch] = useReducer(jiraActivityReducer, { entries });

	// The header avatar group reflects the distinct people involved in the thread.
	const participants = useMemo(() => {
		const seen = new Set<string>();
		const people: JiraActivityActor[] = [];
		for (const actor of [currentUser, ...state.entries.map((entry) => entry.actor)]) {
			if (actor.kind !== "person" || seen.has(actor.id)) continue;
			seen.add(actor.id);
			people.push(actor);
		}
		return people;
	}, [state.entries, currentUser]);

	function handleAddComment(body: string) {
		dispatch({
			type: "add-comment",
			entry: createCommentEntry({
				id: crypto.randomUUID(),
				actor: currentUser,
				timestamp: "Just now",
				body,
			}),
		});
	}

	function handleAddReply(entryId: string, body: string) {
		dispatch({
			type: "add-reply",
			entryId,
			reply: createReply({
				id: crypto.randomUUID(),
				actor: currentUser,
				timestamp: "Just now",
				body,
			}),
		});
	}

	return (
		<div className={cn("flex w-full flex-col gap-4", className)}>
			<JiraActivityHeader onUnsubscribe={onUnsubscribe} participants={participants} />

			<ol aria-label="Activity timeline" className="flex flex-col">
				{state.entries.map((entry, index) => {
					const isLast = index === state.entries.length - 1;

					return (
						<li className="flex gap-2" key={entry.id}>
							<JiraActivityNode
								actor={entry.actor}
								icon={entry.kind === "event" ? entry.icon : undefined}
								isLast={isLast}
							/>
							<div
								className={cn(
									"min-w-0 flex-1 pb-3",
									entry.kind === "event" && "pt-0.5",
								)}
							>
								{entry.kind === "event" ? <JiraActivityEvent entry={entry} /> : null}
								{entry.kind === "comment" ? (
									<JiraActivityComment
										currentUser={currentUser}
										entry={entry}
										onSubmitReply={(body) => handleAddReply(entry.id, body)}
									/>
								) : null}
								{entry.kind === "changed-files" ? (
									<JiraActivityChangedFiles entry={entry} />
								) : null}
							</div>
						</li>
					);
				})}
			</ol>

			<JiraActivityComposer
				author={currentUser}
				onSubmit={handleAddComment}
				placeholder="Leave a comment..."
				variant="comment"
			/>
		</div>
	);
}

export { JIRA_ACTIVITY_CURRENT_USER, JIRA_ACTIVITY_ENTRIES } from "./data";
export type {
	JiraActivityActor,
	JiraActivityActorKind,
	JiraActivityChangedFilesEntry,
	JiraActivityCommentEntry,
	JiraActivityEntry,
	JiraActivityEventEntry,
	JiraActivityEventIcon,
	JiraActivityReply,
	JiraActivitySegment,
} from "./jira-activity-types";
