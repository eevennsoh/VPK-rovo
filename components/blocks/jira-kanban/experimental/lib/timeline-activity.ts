import type { PulseSnapshot, PulseTimeline } from "@/components/blocks/jira-kanban/experimental/pulse/types";

/**
 * Timeline activity since the reader last opened Pulse.
 *
 * The unread pill on Insights is a count of snapshots newer than
 * `lastViewedAt`. The seed is the demo "previous visit": after the night-shift
 * snapshot and before the rest of the week, so the board opens with unread
 * activity instead of an always-on stub.
 */

export const EXPERIMENTAL_BOARD_LAST_VIEWED_AT = "2026-08-19T12:00:00.000Z";

export function latestTimelineTimestamp(
	snapshots: readonly Pick<PulseSnapshot, "timestamp">[],
): string | null {
	let latest: string | null = null;
	let latestMs = Number.NEGATIVE_INFINITY;
	for (const snapshot of snapshots) {
		const timestampMs = Date.parse(snapshot.timestamp);
		if (!Number.isFinite(timestampMs) || timestampMs <= latestMs) {
			continue;
		}
		latest = snapshot.timestamp;
		latestMs = timestampMs;
	}
	return latest;
}

export function countUnviewedTimelineSnapshots(
	snapshots: readonly Pick<PulseSnapshot, "timestamp">[],
	lastViewedAt: string | null,
): number {
	if (lastViewedAt === null) {
		return snapshots.length;
	}
	const viewedMs = Date.parse(lastViewedAt);
	if (!Number.isFinite(viewedMs)) {
		return snapshots.length;
	}
	return snapshots.filter((snapshot) => {
		const timestampMs = Date.parse(snapshot.timestamp);
		return Number.isFinite(timestampMs) && timestampMs > viewedMs;
	}).length;
}

export function markTimelineViewed(
	timeline: Pick<PulseTimeline, "snapshots">,
	viewedAt: string = latestTimelineTimestamp(timeline.snapshots) ?? new Date().toISOString(),
): string {
	return viewedAt;
}
