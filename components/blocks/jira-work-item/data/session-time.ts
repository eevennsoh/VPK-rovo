const SESSION_TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
	hour: "numeric",
	minute: "2-digit",
	timeZone: "UTC",
});

const SESSION_RELATIVE_TIME_FORMATTER = new Intl.RelativeTimeFormat("en-US", {
	numeric: "always",
});

/** Deterministic, locale-stable label for a session activity timestamp. */
export function formatSessionTimestamp(createdAtMs: number, referenceTimeMs?: number): string {
	if (referenceTimeMs !== undefined) {
		const elapsedSeconds = Math.max(0, Math.floor((referenceTimeMs - createdAtMs) / 1000));
		if (elapsedSeconds < 60) return "Just now";

		const elapsedMinutes = Math.floor(elapsedSeconds / 60);
		if (elapsedMinutes < 60) return SESSION_RELATIVE_TIME_FORMATTER.format(-elapsedMinutes, "minute");

		const elapsedHours = Math.floor(elapsedMinutes / 60);
		if (elapsedHours < 24) return SESSION_RELATIVE_TIME_FORMATTER.format(-elapsedHours, "hour");

		return SESSION_RELATIVE_TIME_FORMATTER.format(-Math.floor(elapsedHours / 24), "day");
	}

	return SESSION_TIME_FORMATTER.format(new Date(createdAtMs));
}
