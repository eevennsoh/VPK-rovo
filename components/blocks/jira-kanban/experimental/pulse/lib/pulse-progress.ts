import type { PulseProgressSegment, PulseProgressTone } from "@/components/blocks/jira-kanban/experimental/pulse/types";

/**
 * Progress arithmetic for the scope brief.
 *
 * Both scope variants draw the same bar — an epic's roll-up and a sprint's
 * commitment — so the percentages come from one place. Bands are authored as
 * counts and converted here, never in a component: a renderer that divides
 * inline ends up with three independently rounded numbers that add to 99 or
 * 101, and the bar shows a hairline of track where a band should have closed.
 *
 * Rounding uses largest remainder: floor every band, then hand the leftover
 * whole percent to the bands with the largest fractional parts. The result
 * always sums to exactly 100 for a non-empty total, so the bands tile the
 * track with no seam and no overflow.
 */

export interface PulseProgressBand {
	tone: PulseProgressTone;
	label: string;
	count: number;
	/** Integer percent of the total. Bands sum to exactly 100. */
	percent: number;
}

export interface PulseProgressModel {
	total: number;
	/** How many of `total` are done — the numerator the percentage hides. */
	doneCount: number;
	/** Integer percent complete — the number printed beside the bar. */
	donePercent: number;
	/** Authored order, preserved. Zero-count bands are dropped. */
	bands: readonly PulseProgressBand[];
	/** Sentence for `aria-label` / `<title>`, e.g. "62% done: 13 of 21 items". */
	summary: string;
}

/** Percent of a whole, floored, with an empty whole reading as zero. */
function toFlooredPercent(count: number, total: number): number {
	return total <= 0 ? 0 : Math.floor((count / total) * 100);
}

/**
 * Distribute the rounding remainder so the bands sum to exactly 100.
 *
 * Ties go to the earlier band. The order the caller authored is the reading
 * order — done, then in progress, then not started — so a tie resolving
 * forward nudges the completed end of the bar rather than the empty end,
 * which is the direction a reader is least likely to notice.
 */
function distributeRemainder(
	segments: readonly PulseProgressSegment[],
	total: number,
): readonly number[] {
	const floored = segments.map((segment) => toFlooredPercent(segment.count, total));
	let remainder = 100 - floored.reduce((sum, percent) => sum + percent, 0);
	if (total <= 0 || remainder <= 0) {
		return floored;
	}

	const byFraction = segments
		.map((segment, index) => ({
			index,
			fraction: (segment.count / total) * 100 - floored[index],
		}))
		.sort((left, right) => (
			right.fraction - left.fraction || left.index - right.index
		));

	const adjusted = [...floored];
	for (const candidate of byFraction) {
		if (remainder <= 0) {
			break;
		}
		adjusted[candidate.index] += 1;
		remainder -= 1;
	}
	return adjusted;
}

/** Plural-safe noun for the summary sentence. */
function toItemNoun(count: number): string {
	return count === 1 ? "item" : "items";
}

export function toPulseProgressModel(
	segments: readonly PulseProgressSegment[],
): PulseProgressModel {
	const total = segments.reduce((sum, segment) => sum + Math.max(0, segment.count), 0);
	const percents = distributeRemainder(segments, total);
	const bands = segments
		.map((segment, index) => ({
			tone: segment.tone,
			label: segment.label,
			count: segment.count,
			percent: percents[index] ?? 0,
		}))
		.filter((band) => band.count > 0);
	const doneCount = segments
		.filter((segment) => segment.tone === "done")
		.reduce((sum, segment) => sum + segment.count, 0);
	const donePercent = bands
		.filter((band) => band.tone === "done")
		.reduce((sum, band) => sum + band.percent, 0);

	return {
		total,
		doneCount,
		donePercent,
		bands,
		summary: total === 0
			? "Nothing tracked yet"
			: `${donePercent}% done — ${doneCount} of ${total} ${toItemNoun(total)}`,
	};
}

/**
 * The scale a row's bar is drawn at, relative to the widest row.
 *
 * The epic reference sizes each child's bar by how much work it holds, so a
 * four-item stream cannot read as loud as a forty-item one. Returned as a
 * fraction of the track; a floor keeps the smallest row wide enough to still
 * show three bands rather than collapsing into a dot.
 */
export function toPulseProgressScale(
	total: number,
	largestTotal: number,
	minimumScale = 0.22,
): number {
	if (largestTotal <= 0 || total <= 0) {
		return minimumScale;
	}
	return Math.max(minimumScale, Math.min(1, total / largestTotal));
}
