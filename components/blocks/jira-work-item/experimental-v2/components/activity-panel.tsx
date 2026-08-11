"use client";

import {
	createContext,
	use,
	useEffect,
	useEffectEvent,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
	type ReactNode,
} from "react";
import { useReducedMotion } from "motion/react";

import { JiraActivity } from "@/components/blocks/jira-activity";
import type {
	JiraActivityActor,
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
import { useActivityChatComments } from "@/components/blocks/jira-work-item/experimental-v2/context-activity-chat-comments";
import { useJiraWorkItem } from "@/components/blocks/jira-work-item/experimental-v2/context-jira-work-item";
import { useMetadataRail } from "@/components/blocks/jira-work-item/experimental-v2/context-metadata-rail";
import {
	applyActivitySessionThreadPresentation,
	composeActivitySessionThread,
	JIRA_WORK_ITEM_CURRENT_USER,
	mapActivityEventsToJiraEntries,
	type ActivitySessionThreadConfig,
} from "@/components/blocks/jira-work-item/experimental-v2/lib/jira-activity-adapter";

/**
 * Orchestration reveals the prompt comment ~1.5s after an agent-mention submit.
 * Keep `requestRevealLatestActivity` alive long enough for that row to become
 * latest and receive scroll, instead of settling on the prior intake event.
 */
const ACTIVITY_REVEAL_SETTLE_MS = 2_000;

/**
 * Sort/filter chrome that ActivityPanel publishes so MetadataRail can place the
 * control on the Details/Activity toggle row instead of the sticky feed header.
 */
export type ActivityRailChrome = {
	count: number;
	filterMode: "work-item" | "sort-only";
	sortOrder: JiraActivitySortOrder;
	filter: JiraActivityFilter;
	onSortOrderChange: (next: JiraActivitySortOrder) => void;
	onFilterChange: (next: JiraActivityFilter) => void;
};

type ActivityRailChromeContextValue = {
	setChrome: (chrome: ActivityRailChrome | null) => void;
};

const ActivityRailChromeContext = createContext<ActivityRailChromeContextValue | null>(null);

export function ActivityRailChromeProvider({
	setChrome,
	children,
}: Readonly<{
	setChrome: (chrome: ActivityRailChrome | null) => void;
	children: ReactNode;
}>) {
	const value = useMemo(() => ({ setChrome }), [setChrome]);
	return (
		<ActivityRailChromeContext value={value}>
			{children}
		</ActivityRailChromeContext>
	);
}

/** Returns the chrome setter when rendered under MetadataRail; otherwise null. */
export function useSetActivityRailChrome(): ActivityRailChromeContextValue["setChrome"] | null {
	return use(ActivityRailChromeContext)?.setChrome ?? null;
}

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
 * composer remains pinned by ExperimentalWorkItemLayout. "Add to chat" attaches
 * comments as pills on that sticky activity composer (multi-select).
 *
 * When mounted under MetadataRail, sort/filter chrome and the activity count are
 * published to the rail toggle row and the sticky feed header is omitted.
 */
export function ActivityPanel({
	activitySessionThread,
	onOpenPullRequest,
	railChromeEnabled = true,
}: Readonly<{
	activitySessionThread?: ActivitySessionThreadConfig;
	/** Opens the same in-app PR detail as Review pull request / PR resource select. */
	onOpenPullRequest?: (entry: JiraActivityEventEntry) => void;
	railChromeEnabled?: boolean;
}>) {
	const { state, meta, actions } = useJiraWorkItem();
	const { addComment: addActivityChatComment } = useActivityChatComments();
	const {
		activityRevealRequest,
		consumeActivityRevealRequest,
	} = useMetadataRail();
	const setActivityRailChrome = useSetActivityRailChrome();
	const hideHeader = setActivityRailChrome != null;
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
	const reactionActors = useMemo(() => {
		const actorDirectory = new Map<string, JiraActivityActor>();
		for (const entry of mapActivityEventsToJiraEntries(meta.activityEvents, activityReferenceTimeMs)) {
			actorDirectory.set(entry.actor.id, entry.actor);
			if (entry.kind === "comment") {
				for (const reply of entry.replies ?? []) {
					actorDirectory.set(reply.actor.id, reply.actor);
				}
			}
		}
		return [...actorDirectory.values()];
	}, [activityReferenceTimeMs, meta.activityEvents]);
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

	useLayoutEffect(() => {
		if (!setActivityRailChrome || !railChromeEnabled) return undefined;
		setActivityRailChrome({
			count: entries.length,
			filter,
			filterMode: "work-item",
			onFilterChange: setFilter,
			onSortOrderChange: setSortOrder,
			sortOrder,
		});
		return () => setActivityRailChrome(null);
	}, [entries.length, filter, railChromeEnabled, setActivityRailChrome, sortOrder]);

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
		// The Activity slot stays mounted while Details is shown (`hidden`/`inert`).
		// scrollIntoView is a no-op on display:none trees — wait until the tab is visible.
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
		<div ref={activityRootRef} className="min-w-0 max-w-full" data-jira-work-item-activity>
			<JiraActivity
				actors={reactionActors}
				className="min-w-0 gap-2"
				composer={null}
				currentUser={JIRA_WORK_ITEM_CURRENT_USER}
				entries={entries}
				filter={hideHeader ? filter : undefined}
				hideHeader={hideHeader}
				headerClassName={
					hideHeader
						? undefined
						: "sticky top-0 z-10 flex min-h-8 items-center bg-surface-overlay [container-type:scroll-state]"
				}
				headerScrollFade={!hideHeader}
				onAddCommentToChat={handleAddCommentToChat}
				onAddReplyToChat={handleAddReplyToChat}
				onFilterChange={hideHeader ? setFilter : undefined}
				onOpenPullRequest={onOpenPullRequest}
				onSortOrderChange={hideHeader ? setSortOrder : undefined}
				onSubmitReply={handleSubmitReply}
				onToggleReaction={handleToggleReaction}
				onViewSession={(item) => actions.openSession(item.id)}
				sortOrder={hideHeader ? sortOrder : undefined}
			/>
		</div>
	);
}
