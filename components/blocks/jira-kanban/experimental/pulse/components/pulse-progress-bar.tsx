"use client";

import { toPulseProgressModel, type PulseProgressModel } from "@/components/blocks/jira-kanban/experimental/pulse/lib/pulse-progress";
import type { PulseProgressSegment, PulseProgressTone } from "@/components/blocks/jira-kanban/experimental/pulse/types";
import { cn } from "@/lib/utils";

/**
 * The scope brief's progress bar — one shape, drawn once.
 *
 * Both scope variants lean on it: a sprint's commitment and an epic's roll-up
 * are the same three-state question, so they get the same three bands in the
 * same three colours and a reader learns the encoding once. The epic's child
 * rows scale the whole track by how much work each row holds, which is why
 * width is a prop rather than always 100%.
 *
 * Colours come from the chart accent ramp rather than the semantic status
 * ramp: these are categorical bands on a figure, and ADS has no `bold`
 * background token for success or information to sit beside `bg-bg-neutral`.
 * `token-priority.md` puts decorative hue classes exactly here.
 *
 * The bar is a single `role="img"` with one sentence, not a row of divs each
 * announcing a percentage. A screen reader should hear "62% done — 25 of 40
 * items" once, the way a sighted reader takes the bar in at a glance.
 */

const BAND_FILL: Record<PulseProgressTone, string> = {
	done: "bg-green-400",
	progress: "bg-blue-400",
	todo: "bg-bg-neutral",
};

/**
 * Bands are pill-capped at the ends of the track and square where they meet,
 * so the bar reads as one object rather than three stacked lozenges. 3px of
 * white between bands is what separates them — the same seam the reference
 * uses, and the only thing keeping green and blue from vibrating against each
 * other at this weight.
 */
const BAND_SEAM = "outline-2 outline-surface";

export interface PulseProgressBarProps {
	segments: readonly PulseProgressSegment[];
	/** Fraction of the available track this bar occupies, 0–1. */
	scale?: number;
	/** Track height. `regular` is the roll-up; `compact` is a child row. */
	size?: "regular" | "compact";
	/** Overrides the derived sentence when the caller has a better one. */
	label?: string;
	className?: string;
}

const TRACK_HEIGHT = {
	regular: "h-2.5",
	compact: "h-2",
} as const;

export function PulseProgressBar({
	segments,
	scale = 1,
	size = "regular",
	label,
	className,
}: Readonly<PulseProgressBarProps>) {
	const model = toPulseProgressModel(segments);
	if (model.total === 0) {
		return null;
	}

	return (
		<div
			aria-label={label ?? model.summary}
			className={cn("flex w-full min-w-0", className)}
			role="img"
		>
			<div
				className={cn(
					"flex min-w-0 overflow-hidden rounded-full",
					TRACK_HEIGHT[size],
					// The track only shows where a `todo` band does not reach, which is
					// never — the bands tile to exactly 100. It is here so a rounding
					// change can never open a transparent gap onto the page surface.
					"bg-bg-neutral",
				)}
				style={{ width: `${Math.round(scale * 1000) / 10}%` }}
			>
				{model.bands.map((band, index) => (
					<div
						className={cn(
							BAND_FILL[band.tone],
							// Round the outer ends only, and let the seam do the rest.
							index === 0 ? "rounded-l-full" : null,
							index === model.bands.length - 1 ? "rounded-r-full" : null,
							index > 0 ? BAND_SEAM : null,
						)}
						key={band.tone}
						style={{ width: `${band.percent}%` }}
					/>
				))}
			</div>
		</div>
	);
}

/**
 * The band read-out under the roll-up bar: label above, percentage below, each
 * percentage carrying its band's colour so the legend *is* the key.
 *
 * The reference prints three bare percentages — "Done 24% / In progress 38% /
 * Not started 38%" — of a total it never states, which is a number a reader
 * cannot act on and, worse, two identical 38%s sitting side by side meaning
 * different things. The count rides along here for that reason.
 *
 * The lock-up above owns the headline count-and-denominator; this owns the
 * split. Neither repeats the other's number, which is what stops the same
 * figure appearing twice at two near-identical sizes sixty pixels apart.
 *
 * The columns sit on a fixed track rather than sizing to their labels, so the
 * three read as a table and not as three loose word-widths.
 */
const BAND_TEXT: Record<PulseProgressTone, string> = {
	done: "text-green-600",
	progress: "text-blue-600",
	todo: "text-text-subtle",
};

export function PulseProgressLegend({
	model,
	className,
	unit = "items",
}: Readonly<{ model: PulseProgressModel; className?: string; unit?: string }>) {
	if (model.bands.length === 0) {
		return null;
	}
	return (
		<dl className={cn("flex min-w-0 flex-wrap gap-y-3", className)}>
			{model.bands.map((band) => (
				<div className="w-[8.5rem] min-w-0 shrink-0" key={band.tone}>
					<dt className="truncate text-xs leading-4 font-semibold text-text-subtlest">{band.label}</dt>
					<dd className="mt-1 flex items-baseline gap-1.5">
						<span
							className={cn(
								"text-[22px] leading-7 font-medium tracking-[-0.02em] tabular-nums",
								BAND_TEXT[band.tone],
							)}
						>
							{band.percent}%
						</span>
						<span className="truncate text-xs leading-4 text-text-subtlest tabular-nums">
							{`${band.count} ${unit}`}
						</span>
					</dd>
				</div>
			))}
		</dl>
	);
}

export { toPulseProgressModel };
