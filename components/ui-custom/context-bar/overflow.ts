/**
 * Pure width-fitting math shared by `ContextBarTagGroup`. Kept dependency-free so
 * it can be unit-tested without rendering motion/popover code.
 *
 * Given the measured intrinsic width of each pill, the container's available
 * width, the width of the trailing "show more" overflow button, and the flex
 * gap between items, returns how many leading items should stay visible. The
 * remaining items collapse behind the overflow button.
 */
export function computeContextBarOverflow(
	itemWidths: readonly number[],
	containerWidth: number,
	overflowWidth: number,
	gap: number,
	// When the overflow button is always rendered (e.g. some items are collapsed
	// behind it by default), skip the fast path so its width is reserved exactly
	// once here — pre-shrinking the container before calling would double-count it.
	alwaysReserveOverflow = false,
): number {
	const total = itemWidths.length;
	if (total === 0) {
		return 0;
	}
	// Until the container has been measured, render everything so the measurement
	// layer can settle (the layout effect re-runs once a real width is known).
	if (containerWidth <= 0) {
		return total;
	}

	// Fast path: everything fits without needing an overflow button. Skipped when
	// the trailing button is always present, so the reservation below still runs.
	if (!alwaysReserveOverflow) {
		let used = 0;
		for (let i = 0; i < total; i++) {
			used += itemWidths[i] + (i > 0 ? gap : 0);
		}
		if (used <= containerWidth) {
			return total;
		}
	}

	// Otherwise reserve room for the trailing overflow button and fit as many
	// leading items as possible alongside it.
	let fitted = 0;
	let used = 0;
	for (let i = 0; i < total; i++) {
		const next = itemWidths[i] + (fitted > 0 ? gap : 0);
		if (used + next + gap + overflowWidth <= containerWidth) {
			used += next;
			fitted++;
		} else {
			break;
		}
	}
	return fitted;
}
