import type { PulseSnapshot } from "@/components/blocks/jira-kanban/experimental/pulse/types";

/**
 * The board's "new insights since your last visit" nudge — selection and copy.
 *
 * Two different things in this repo are called "Insights", and they do not
 * share a model:
 *
 * - **Board Insights** (here) is a Pulse *mode*. Its unit is a `PulseSnapshot`,
 *   and its unread count *decays*: a watermark (`lastViewedAt`) moves forward
 *   when the reader opens Pulse, so yesterday's three become today's zero.
 * - **Work-item Insights** is a *tab* on the work-item modal. Its unit is a
 *   `JiraInsightCheckpoint`, and it never decays — every checkpoint stays in
 *   the list whether or not anyone read it.
 *
 * Reaching for the wrong one is the trap: a checkpoint is not a snapshot, and a
 * tab has no watermark to advance. This module only speaks the board's dialect.
 *
 * One more rule the copy depends on: **dismissing the nudge marks nothing
 * read.** Only opening Pulse advances the watermark (see `markTimelineViewed`
 * in `./timeline-activity`). A dismissed nudge is expected to come back with
 * the same count on the next visit — that is the design, not a bug.
 *
 * Both the visible pill copy and the toggle's screen-reader label are owned
 * here so they cannot drift apart; `PulseModeToggle` consumes
 * `formatInsightsToggleAriaLabel` rather than building its own string.
 */

/** The nudge card lists at most this many snapshots; the rest become overflow. */
export const INSIGHTS_NUDGE_MAX_ROWS = 3;

/**
 * The unread rule, kept byte-for-byte in step with
 * `countUnviewedTimelineSnapshots` in `./timeline-activity`: a missing or
 * unparseable watermark means nothing has been viewed yet, so every snapshot
 * counts. A contract test asserts the two never disagree.
 */
function resolveViewedMs(lastViewedAt: string | null | undefined): number | null {
	if (lastViewedAt === null || lastViewedAt === undefined) {
		return null;
	}
	const viewedMs = Date.parse(lastViewedAt);
	return Number.isFinite(viewedMs) ? viewedMs : null;
}

/** Unparseable snapshot clocks sort last rather than throwing or reordering. */
function timestampRank(snapshot: Pick<PulseSnapshot, "timestamp">): number {
	const timestampMs = Date.parse(snapshot.timestamp);
	return Number.isFinite(timestampMs) ? timestampMs : Number.POSITIVE_INFINITY;
}

function compareOldestFirst(left: PulseSnapshot, right: PulseSnapshot): number {
	const leftRank = timestampRank(left);
	const rightRank = timestampRank(right);
	if (leftRank !== rightRank) {
		return leftRank < rightRank ? -1 : 1;
	}
	// Ties — including two unparseable clocks — break on id so repeated calls
	// with the same input always produce the same order.
	if (left.id === right.id) {
		return 0;
	}
	return left.id < right.id ? -1 : 1;
}

/**
 * Snapshots strictly newer than `lastViewedAt`, oldest → newest.
 *
 * Narrative order, not recency order: these are moments in a week, and the card
 * reads forward from where the reader left off.
 */
export function selectUnviewedSnapshots(
	snapshots: readonly PulseSnapshot[],
	lastViewedAt: string | null | undefined,
): readonly PulseSnapshot[] {
	const viewedMs = resolveViewedMs(lastViewedAt);
	const unviewed = snapshots.filter((snapshot) => {
		if (viewedMs === null) {
			return true;
		}
		const timestampMs = Date.parse(snapshot.timestamp);
		return Number.isFinite(timestampMs) && timestampMs > viewedMs;
	});
	return unviewed.sort(compareOldestFirst);
}

/**
 * The oldest unviewed snapshot — the deep-link target for the card's primary
 * action, so opening Pulse resumes where the reader stopped rather than
 * dropping them at the end of the week.
 */
export function firstUnviewedSnapshot(
	snapshots: readonly PulseSnapshot[],
	lastViewedAt: string | null | undefined,
): PulseSnapshot | null {
	return selectUnviewedSnapshots(snapshots, lastViewedAt)[0] ?? null;
}

export interface InsightsNudgeRows {
	/** At most `INSIGHTS_NUDGE_MAX_ROWS`, oldest → newest. */
	rows: readonly PulseSnapshot[];
	/** How many unviewed snapshots did not fit. `0` when everything fits. */
	overflowCount: number;
	/** Every unviewed snapshot, capped or not — this is the pill's number. */
	totalCount: number;
}

export function selectInsightsNudgeRows(
	snapshots: readonly PulseSnapshot[],
	lastViewedAt: string | null | undefined,
): InsightsNudgeRows {
	const unviewed = selectUnviewedSnapshots(snapshots, lastViewedAt);
	const rows = unviewed.slice(0, INSIGHTS_NUDGE_MAX_ROWS);
	return {
		rows,
		overflowCount: unviewed.length - rows.length,
		totalCount: unviewed.length,
	};
}

/** Visible pill and card copy. Empty string when there is nothing to announce. */
export function formatInsightsNudgeLabel(count: number): string {
	if (!Number.isFinite(count) || count <= 0) {
		return "";
	}
	return count === 1 ? "1 new insight" : `${count} new insights`;
}

/**
 * The Insights toggle's screen-reader label.
 *
 * Deliberately worded differently from the visible pill — "update" is the
 * long-standing string on this control and changing it is a separate decision.
 * The point of moving it here is that it can no longer silently drift from
 * `formatInsightsNudgeLabel`.
 */
export function formatInsightsToggleAriaLabel(count: number): string | undefined {
	if (!Number.isFinite(count) || count <= 0) {
		return undefined;
	}
	return count === 1
		? "Insights, 1 new update since you last viewed"
		: `Insights, ${count} new updates since you last viewed`;
}
