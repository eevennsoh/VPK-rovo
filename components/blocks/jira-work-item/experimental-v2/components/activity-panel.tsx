"use client";

import {
	createContext,
	use,
	useEffect,
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
	JiraActivityFilter,
	JiraActivityReaction,
	JiraActivityReply,
	JiraActivitySortOrder,
} from "@/components/blocks/jira-activity";
import { toggleReaction } from "@/components/blocks/jira-activity/lib/jira-activity-reducer";
import { SESSION_EPOCH_MS } from "@/components/blocks/jira-work-item/data/session-fixtures";
import { useJiraWorkItem } from "@/components/blocks/jira-work-item/experimental-v2/context-jira-work-item";
import {
	composeActivitySessionThread,
	JIRA_WORK_ITEM_CURRENT_USER,
	mapActivityEventsToJiraEntries,
	type ActivitySessionThreadConfig,
} from "@/components/blocks/jira-work-item/experimental-v2/lib/jira-activity-adapter";

/**
 * Sort/filter chrome that ActivityPanel publishes so MetadataRail can place the
 * control on the Details/Activity toggle row instead of the sticky feed header.
 */
export type ActivityRailChrome = {
	count: number;
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
	return (
		<ActivityRailChromeContext value={{ setChrome }}>
			{children}
		</ActivityRailChromeContext>
	);
}

/** Returns the chrome setter when rendered under MetadataRail; otherwise null. */
function useSetActivityRailChrome(): ActivityRailChromeContextValue["setChrome"] | null {
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
 * composer remains pinned by ExperimentalWorkItemLayout. Agent comment actions
 * open the corresponding floating session surface.
 *
 * When mounted under MetadataRail, sort/filter chrome and the activity count are
 * published to the rail toggle row and the sticky feed header is omitted.
 */
export function ActivityPanel({
	activitySessionThread,
}: Readonly<{
	activitySessionThread?: ActivitySessionThreadConfig;
}>) {
	const { state, meta, actions } = useJiraWorkItem();
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
		() => mapActivityEventsToJiraEntries(composedActivityEvents, activityReferenceTimeMs, meta.activityEvents),
		[activityReferenceTimeMs, composedActivityEvents, meta.activityEvents],
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
		if (!setActivityRailChrome) return undefined;
		setActivityRailChrome({
			count: entries.length,
			filter,
			onFilterChange: setFilter,
			onSortOrderChange: setSortOrder,
			sortOrder,
		});
		return () => setActivityRailChrome(null);
	}, [entries.length, filter, setActivityRailChrome, sortOrder]);

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
		if (
			!autoScrollEnabled
			|| !latestActivityEntryId
			|| !activityRevealSignature
			|| lastScrolledActivitySignatureRef.current === activityRevealSignature
		) {
			return undefined;
		}

		const animationFrame = requestAnimationFrame(() => {
			const target = Array.from(
				activityRootRef.current?.querySelectorAll<HTMLElement>("[data-jira-activity-entry-id]") ?? [],
			).find((entry) => entry.dataset.jiraActivityEntryId === latestActivityEntryId);
			if (!target) {
				return;
			}

			lastScrolledActivitySignatureRef.current = activityRevealSignature;
			target.scrollIntoView({
				behavior: shouldReduceMotion ? "auto" : "smooth",
				block: "nearest",
			});
		});

		return () => cancelAnimationFrame(animationFrame);
	}, [activityRevealSignature, autoScrollEnabled, latestActivityEntryId, shouldReduceMotion]);

	return (
		<div ref={activityRootRef} data-jira-work-item-activity>
			<JiraActivity
				actors={reactionActors}
				className="gap-2"
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
				onFilterChange={hideHeader ? setFilter : undefined}
				onSortOrderChange={hideHeader ? setSortOrder : undefined}
				onSubmitReply={handleSubmitReply}
				onToggleReaction={handleToggleReaction}
				onViewSession={(item) => actions.openSession(item.id)}
				sortOrder={hideHeader ? sortOrder : undefined}
			/>
		</div>
	);
}
