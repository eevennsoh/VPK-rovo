import { formatRelativeTime } from "@/lib/elapsed-time";

const SESSION_TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
	hour: "numeric",
	minute: "2-digit",
	timeZone: "UTC",
});

/** Deterministic, locale-stable label for a session activity timestamp. */
export function formatSessionTimestamp(createdAtMs: number, referenceTimeMs?: number): string {
	if (referenceTimeMs !== undefined) {
		const elapsedSeconds = Math.max(0, Math.floor((referenceTimeMs - createdAtMs) / 1000));
		return formatRelativeTime(elapsedSeconds);
	}

	return SESSION_TIME_FORMATTER.format(new Date(createdAtMs));
}
