"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

import { JiraActivity } from "@/components/blocks/jira-activity";
import type {
	JiraActivityCommentEntry,
	JiraActivityReaction,
	JiraActivityReply,
} from "@/components/blocks/jira-activity";
import { toggleReaction } from "@/components/blocks/jira-activity/lib/jira-activity-reducer";
import { useJiraWorkItem } from "@/components/blocks/jira-work-item/experimental/context-jira-work-item";
import {
	JIRA_WORK_ITEM_CURRENT_USER,
	mapActivityEventsToJiraEntries,
} from "@/components/blocks/jira-work-item/experimental/lib/jira-activity-adapter";

/**
 * True when the work item has at least one activity event to show. Callers use
 * this to omit the Activity slot entirely (heading + sort control + timeline)
 * so the content above reclaims the vertical space when there is nothing to sort.
 */
export function useHasActivity(): boolean {
	const { meta } = useJiraWorkItem();
	return meta.activityEvents.length > 0;
}

/**
 * Live Jira Activity timeline for the experimental Jira Work Item block. The
 * timeline's built-in composer is suppressed because the shared Jira Work Item
 * composer remains pinned by ExperimentalWorkItemLayout. Agent comment actions
 * open the corresponding floating session surface.
 */
export function ActivityPanel() {
	const { state, meta, actions } = useJiraWorkItem();
	const activityRootRef = useRef<HTMLDivElement>(null);
	const lastScrolledSessionIdRef = useRef<string | null>(null);
	const shouldReduceMotion = Boolean(useReducedMotion());
	const latestSessionId = state.sessions.at(-1)?.id ?? null;
	const derivedEntries = useMemo(() => mapActivityEventsToJiraEntries(meta.activityEvents), [meta.activityEvents]);
	// Reactions and replies to human comments have no home in the work-item
	// context, so they are held here and overlaid onto the derived timeline.
	// Keyed by entry id rather than replacing the array, so streaming session
	// updates keep flowing through untouched.
	const [localReactions, setLocalReactions] = useState<
		Readonly<Record<string, readonly JiraActivityReaction[]>>
	>({});
	const [localReplies, setLocalReplies] = useState<
		Readonly<Record<string, readonly JiraActivityReply[]>>
	>({});

	const entries = derivedEntries.map((entry) => {
		if (entry.kind !== "comment") return entry;
		const reactions = localReactions[entry.id];
		const replies = localReplies[entry.id];
		if (!reactions && !replies) return entry;
		return {
			...entry,
			...(reactions ? { reactions } : {}),
			...(replies ? { replies: [...(entry.replies ?? []), ...replies] } : {}),
		};
	});

	function handleToggleReaction(entry: JiraActivityCommentEntry, emoji: string) {
		setLocalReactions((previous) => ({
			...previous,
			// `entry` is the overlaid entry, so its reactions are already current.
			[entry.id]: toggleReaction(entry.reactions ?? [], emoji, JIRA_WORK_ITEM_CURRENT_USER.id),
		}));
	}

	function handleSubmitReply(entry: JiraActivityCommentEntry, body: string) {
		const event = meta.activityEvents.find((activityEvent) => activityEvent.id === entry.id);
		if (event?.kind === "agent") {
			actions.replySession(event.sessionId, body);
			return;
		}
		// Human comments have no session to route into. Before reactions existed
		// they also had no composer; now that Reply is exposed, the draft must land
		// somewhere rather than being silently discarded.
		setLocalReplies((previous) => ({
			...previous,
			[entry.id]: [
				...(previous[entry.id] ?? []),
				{
					id: crypto.randomUUID(),
					actor: JIRA_WORK_ITEM_CURRENT_USER,
					timestamp: "Just now",
					body,
				},
			],
		}));
	}

	useEffect(() => {
		if (!latestSessionId?.startsWith("session-") || lastScrolledSessionIdRef.current === latestSessionId) {
			return undefined;
		}

		const animationFrame = requestAnimationFrame(() => {
			const activityEntryId = `activity-${latestSessionId}`;
			const target = Array.from(
				activityRootRef.current?.querySelectorAll<HTMLElement>("[data-jira-activity-entry-id]") ?? [],
			).find((entry) => entry.dataset.jiraActivityEntryId === activityEntryId);
			if (!target) {
				return;
			}

			lastScrolledSessionIdRef.current = latestSessionId;
			target.scrollIntoView({
				behavior: shouldReduceMotion ? "auto" : "smooth",
				block: "nearest",
			});
		});

		return () => cancelAnimationFrame(animationFrame);
	}, [latestSessionId, shouldReduceMotion]);

	return (
		<div ref={activityRootRef} data-jira-work-item-activity>
			<JiraActivity
				composer={null}
				currentUser={JIRA_WORK_ITEM_CURRENT_USER}
				entries={entries}
				onSubmitReply={handleSubmitReply}
				onToggleReaction={handleToggleReaction}
				onViewSession={(item) => actions.openSession(item.id)}
			/>
		</div>
	);
}
