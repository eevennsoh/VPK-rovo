/**
 * Parse fixture/demo CI check details like "Running for 6s" or "Running for 1m 12s"
 * into an initial elapsed-seconds offset for a live timer. Returns null when the
 * copy is not a live "Running for …" duration (queued/passed/failed/custom text).
 */
export function parseRunningCheckElapsedSeconds(details: string): number | null {
	const match = /^Running for (?:(\d+)m(?:\s+(\d+)s)?|(\d+)s)$/u.exec(details.trim());
	if (!match) {
		return null;
	}

	if (match[3] !== undefined) {
		return Number(match[3]);
	}

	const minutes = Number(match[1]);
	const seconds = match[2] !== undefined ? Number(match[2]) : 0;
	return minutes * 60 + seconds;
}
