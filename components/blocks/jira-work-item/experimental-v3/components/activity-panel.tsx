"use client";

import {
	useEffect,
	useEffectEvent,
	useMemo,
	useRef,
	useState,
} from "react";
import { useReducedMotion } from "motion/react";

import { JiraActivity, JiraActivityViewControl } from "@/components/blocks/jira-activity";
import type {
	JiraActivityCommentEntry,
	JiraActivityEventEntry,
	JiraActivityFilter,
	JiraActivityReaction,
	JiraActivityReply,
	JiraActivitySortOrder,
} from "@/components/blocks/jira-activity";
import { jiraActivitySegmentsToPlainText } from "@/components/blocks/jira-activity/lib/jira-activity-comment-text";
import { toggleReaction } from "@/components/blocks/jira-activity/lib/jira-activity-reducer";
import { SESSION_EPOCH_MS } from "@/components/blocks/jira-work-item/data/session-fixtures";
import { useActivityChatComments } from "@/components/blocks/jira-work-item/experimental-v3/context-activity-chat-comments";
import { useJiraWorkItem } from "@/components/blocks/jira-work-item/experimental-v3/context-jira-work-item";
import { useMetadataRail } from "@/components/blocks/jira-work-item/experimental-v3/context-metadata-rail";
import { WorkItemSection } from "@/components/blocks/jira-work-item/experimental-v3/components/work-item-section";
import { usePublishActivityCount } from "@/components/blocks/jira-work-item/experimental-v3/context-section-navigation";
import {
	applyActivitySessionThreadPresentation,
	collectActivityActors,
	composeActivitySessionThread,
	JIRA_WORK_ITEM_CURRENT_USER,
	mapActivityEventsToJiraEntries,
	type ActivitySessionThreadConfig,
} from "@/components/blocks/jira-work-item/experimental-v3/lib/jira-activity-adapter";

/**
 * Orchestration reveals the prompt comment ~1.5s after an agent-mention submit.
 * Keep `requestRevealLatestActivity` alive long enough for that row to become
 * latest and receive scroll, instead of settling on the prior intake event.
 */
const ACTIVITY_REVEAL_SETTLE_MS = 2_000;

/**
 * Live Jira Activity timeline for the experimental Jira Work Item block.
 *
 * Renders as the `activity` section of the stacked left column, directly above
 * the pinned composer, so reading the conversation and replying to it no longer
 * span two columns. The timeline's built-in composer is suppressed because that
 * shared composer stays docked by ExperimentalWorkItemLayout; "Add to chat"
 * attaches comments to it as pills (multi-select).
 *
 * Owns its own section heading so the filter/sort control sits beside the
 * "Activity" title, and publishes its entry count for the nav's count pill.
 */
export function ActivityPanel({
	activitySessionThread,
	onOpenPullRequest,
}: Readonly<{
	activitySessionThread?: ActivitySessionThreadConfig;
	/** Opens the same in-app PR detail as Review pull request / PR resource select. */
	onOpenPullRequest?: (entry: JiraActivityEventEntry) => void;
}>) {
	const { state, meta, actions } = useJiraWorkItem();
	const { addComment: addActivityChatComment } = useActivityChatComments();
	const {
		activityRevealRequest,
		consumeActivityRevealRequest,
	} = useMetadataRail();
	const activityRootRef = useRef<HTMLDivElement>(null);
	const lastScrolledActivitySignatureRef = useRef<string | null>(null);
	const shouldReduceMotion = Boolean(useReducedMotion());
	const latestSessionId = state.sessions.at(-1)?.id ?? null;
	const activityReferenceTimeMs = SESSION_EPOCH_MS + state.elapsedMs;
	const [sortOrder, setSortOrder] = useState<JiraActivitySortOrder>("ascending");
	const [filter, setFilter] = useState<JiraActivityFilter>("all");
	const composedActivityEvents = useMemo(
		() => composeActivitySessionThread(meta.activityEvents, activitySessionThread),
		[activitySessionThread, meta.activityEvents],
	);
	const reactionActors = useMemo(
		() => collectActivityActors(meta.activityEvents),
		[meta.activityEvents],
	);
	const derivedEntries = useMemo(
		() => applyActivitySessionThreadPresentation(
			mapActivityEventsToJiraEntries(composedActivityEvents, activityReferenceTimeMs, meta.activityEvents),
			activitySessionThread,
		),
		[activityReferenceTimeMs, activitySessionThread, composedActivityEvents, meta.activityEvents],
	);
	const latestActivityEntryId = derivedEntries.at(-1)?.id ?? null;
	const activityRevealSignature = latestActivityEntryId
		? `${latestActivityEntryId}:${activitySessionThread?.visibleSessionIds.join(",") ?? "default"}`
		: null;
	const autoScrollEnabled = Boolean(activitySessionThread) || Boolean(latestSessionId?.startsWith("session-"));
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

	usePublishActivityCount(entries.length);

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

	function attachActivityCommentToComposer(comment: {
		id: string;
		actorName: string;
		timestamp: string;
		body: string;
	}) {
		// Accumulates into the sticky activity composer pill (multi-select). Focus
		// / scroll is owned by ActivityComposer via `focusRequestKey`.
		addActivityChatComment(comment);
	}

	function handleAddCommentToChat(entry: JiraActivityCommentEntry) {
		attachActivityCommentToComposer({
			id: entry.id,
			actorName: entry.actor.name,
			timestamp: entry.timestamp,
			body: jiraActivitySegmentsToPlainText(entry.body),
		});
	}

	function handleAddReplyToChat(reply: JiraActivityReply) {
		attachActivityCommentToComposer({
			id: reply.id,
			actorName: reply.actor.name,
			timestamp: reply.timestamp,
			body: reply.body,
		});
	}

	const activityScrollBlock = sortOrder === "descending" ? "start" : "end";

	const scrollActivityEntryIntoView = useEffectEvent(
		(target: HTMLElement, block: ScrollLogicalPosition = activityScrollBlock) => {
			target.scrollIntoView({
				behavior: shouldReduceMotion ? "auto" : "smooth",
				block,
				inline: "nearest",
			});
		},
	);

	const findActivityEntryElement = useEffectEvent((entryId: string): HTMLElement | null => {
		const target = Array.from(
			activityRootRef.current?.querySelectorAll<HTMLElement>("[data-jira-activity-entry-id]") ?? [],
		).find((entry) => entry.dataset.jiraActivityEntryId === entryId) ?? null;
		// Sections are always visible in the stacked column, so this guard is inert
		// today. Kept because scrollIntoView is a no-op on a hidden subtree, and a
		// future conditionally-hidden section would otherwise break reveal silently.
		if (!target || target.closest("[hidden]")) {
			return null;
		}
		return target;
	});

	useEffect(() => {
		if (
			!autoScrollEnabled
			|| !latestActivityEntryId
			|| !activityRevealSignature
			|| lastScrolledActivitySignatureRef.current === activityRevealSignature
			// Targeted reveals (e.g. Build → Claude Code header) own scroll until settled.
			|| activityRevealRequest?.entryId
		) {
			return undefined;
		}

		let secondFrame = 0;
		const firstFrame = requestAnimationFrame(() => {
			const scrollLatest = () => {
				const target = findActivityEntryElement(latestActivityEntryId);
				if (!target) {
					return false;
				}
				lastScrolledActivitySignatureRef.current = activityRevealSignature;
				scrollActivityEntryIntoView(target);
				return true;
			};
			if (scrollLatest()) {
				return;
			}
			// New rows (orchestration comment, agent cards) can mount one frame later.
			secondFrame = requestAnimationFrame(() => {
				scrollLatest();
			});
		});

		return () => {
			cancelAnimationFrame(firstFrame);
			cancelAnimationFrame(secondFrame);
		};
	}, [
		activityRevealRequest?.entryId,
		activityRevealSignature,
		autoScrollEnabled,
		latestActivityEntryId,
	]);

	// Composer/agent-mention submits and chapter reveals open Activity via
	// requestRevealLatestActivity. Keep the one-shot open across staged entry
	// updates (e.g. orchestration adds the prompt comment after agents-working)
	// so scroll lands on the intended row — newest by default, or a specific
	// entryId (Build anchors the Claude Code card header, not the tall card end).
	useEffect(() => {
		if (!activityRevealRequest) {
			return undefined;
		}
		const preferredEntryId = activityRevealRequest.entryId;
		const entryId = preferredEntryId ?? latestActivityEntryId;
		if (!entryId) {
			return undefined;
		}

		const { nonce } = activityRevealRequest;
		let secondFrame = 0;
		let settleTimer = 0;
		const firstFrame = requestAnimationFrame(() => {
			const scrollRevealTarget = () => {
				const target = findActivityEntryElement(entryId);
				if (!target) {
					return false;
				}
				// Pin specific cards at the start so agent names stay visible;
				// newest-row reveals keep sort-aware end/start alignment.
				scrollActivityEntryIntoView(
					target,
					preferredEntryId ? "start" : activityScrollBlock,
				);
				if (activityRevealSignature) {
					lastScrolledActivitySignatureRef.current = activityRevealSignature;
				}
				window.clearTimeout(settleTimer);
				settleTimer = window.setTimeout(() => {
					consumeActivityRevealRequest(nonce);
				}, ACTIVITY_REVEAL_SETTLE_MS);
				return true;
			};
			if (scrollRevealTarget()) {
				return;
			}
			secondFrame = requestAnimationFrame(() => {
				scrollRevealTarget();
			});
		});

		return () => {
			cancelAnimationFrame(firstFrame);
			cancelAnimationFrame(secondFrame);
			window.clearTimeout(settleTimer);
		};
	}, [
		activityRevealRequest,
		activityRevealSignature,
		activityScrollBlock,
		consumeActivityRevealRequest,
		latestActivityEntryId,
	]);

	return (
		<WorkItemSection
			headingAction={(
				<JiraActivityViewControl
					filter={filter}
					filterMode="jira"
					menuAlign="end"
					onFilterChange={setFilter}
					onSortOrderChange={setSortOrder}
					sortOrder={sortOrder}
				/>
			)}
			headingVisible
			id="activity"
			label="Activity"
		>
			<div ref={activityRootRef} className="min-w-0 max-w-full" data-jira-work-item-activity>
				<JiraActivity
					actors={reactionActors}
					className="min-w-0 gap-2"
					composer={null}
					currentUser={JIRA_WORK_ITEM_CURRENT_USER}
					entries={entries}
					filter={filter}
					hideHeader
					onAddCommentToChat={handleAddCommentToChat}
					onAddReplyToChat={handleAddReplyToChat}
					onFilterChange={setFilter}
					onOpenPullRequest={onOpenPullRequest}
					onSortOrderChange={setSortOrder}
					onSubmitReply={handleSubmitReply}
					onToggleReaction={handleToggleReaction}
					onViewSession={(item) => actions.openSession(item.id)}
					sortOrder={sortOrder}
				/>
			</div>
		</WorkItemSection>
	);
}
