import type { PulseBurndownPoint } from "@/components/blocks/jira-kanban/experimental/pulse/types";

/**
 * Burndown geometry for the sprint brief.
 *
 * The figure is a hand-drawn SVG rather than a charting library: it is seven
 * to sixteen points, it is not interactive, and Pulse has no other chart. A
 * path is a few dozen lines here and nothing in the bundle, where a chart
 * runtime would be the single largest thing this feature adds to the route.
 *
 * Everything the component needs is computed here so the geometry is testable
 * without a DOM. The component only receives strings and numbers and puts them
 * on attributes.
 */

export interface PulseBurndownGridLine {
	/** Y in view units, top-down. */
	y: number;
	/** Axis label, e.g. "60". */
	label: string;
	/** The zero line is painted a step stronger than the rest. */
	isBaseline: boolean;
}

export interface PulseBurndownGeometry {
	/** Remaining-work polyline over the days that have actually closed. */
	linePath: string;
	/** The same line closed down to the baseline, for the fill. */
	areaPath: string;
	/** Straight ideal line: full commitment at the open, zero at the close. */
	guidelinePath: string;
	/** X of the last closed day — where "today" is marked. Null if none. */
	todayX: number | null;
	gridLines: readonly PulseBurndownGridLine[];
	/** Top of the scale in points, after headroom. */
	yMax: number;
	/** Painted axis ends. */
	firstLabel: string;
	lastLabel: string;
	/** Inner plot box, so the component can place the axis gutter. */
	plot: { left: number; right: number; top: number; bottom: number };
}

export interface PulseBurndownOptions {
	points: readonly PulseBurndownPoint[];
	/** Points committed when the sprint opened — the guideline's origin. */
	totalPoints: number;
	width: number;
	height: number;
	/** Reserved for the y-axis labels. */
	gutterLeft?: number;
	/** Reserved above the highest value so the line never touches the edge. */
	padTop?: number;
	/** Number of horizontal rules, including the baseline. */
	gridCount?: number;
}

/** Round a scale top up to something a reader can divide in their head. */
function toNiceCeiling(value: number, steps: number): number {
	if (value <= 0) {
		return steps;
	}
	const rawStep = value / steps;
	const magnitude = 10 ** Math.floor(Math.log10(rawStep));
	const normalized = rawStep / magnitude;
	const niceStep = (normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10) * magnitude;
	return Math.ceil(value / niceStep) * niceStep;
}

/** Trim float noise so two identical geometries stringify identically. */
function toFixedUnit(value: number): number {
	return Math.round(value * 100) / 100;
}

export function buildPulseBurndownGeometry({
	points,
	totalPoints,
	width,
	height,
	gutterLeft = 28,
	padTop = 8,
	gridCount = 5,
}: PulseBurndownOptions): PulseBurndownGeometry {
	const left = gutterLeft;
	const right = width;
	const top = padTop;
	const bottom = height;
	const plot = { left, right, top, bottom };
	const steps = Math.max(1, gridCount - 1);

	const closed = points.filter(
		(point): point is PulseBurndownPoint & { remaining: number } => point.remaining !== null,
	);
	const peak = closed.reduce((highest, point) => Math.max(highest, point.remaining), totalPoints);
	const yMax = toNiceCeiling(peak, steps);

	const spanX = Math.max(1, points.length - 1);
	const toX = (index: number) => toFixedUnit(left + ((right - left) * index) / spanX);
	const toY = (value: number) => toFixedUnit(bottom - ((bottom - top) * value) / (yMax || 1));

	const closedCoordinates = points
		.map((point, index) => ({ point, index }))
		.filter((entry) => entry.point.remaining !== null)
		.map((entry) => ({ x: toX(entry.index), y: toY(entry.point.remaining as number) }));

	const linePath = closedCoordinates.length === 0
		? ""
		: closedCoordinates
			.map((coordinate, index) => `${index === 0 ? "M" : "L"}${coordinate.x} ${coordinate.y}`)
			.join(" ");

	const firstCoordinate = closedCoordinates[0];
	const lastCoordinate = closedCoordinates[closedCoordinates.length - 1];
	const areaPath = firstCoordinate === undefined || lastCoordinate === undefined
		? ""
		: `${linePath} L${lastCoordinate.x} ${toFixedUnit(bottom)} L${firstCoordinate.x} ${toFixedUnit(bottom)} Z`;

	const guidelinePath = `M${toX(0)} ${toY(totalPoints)} L${toX(points.length - 1)} ${toY(0)}`;

	const gridLines: PulseBurndownGridLine[] = Array.from({ length: gridCount }, (_, index) => {
		const value = (yMax / steps) * (steps - index);
		return {
			y: toY(value),
			label: String(Math.round(value)),
			isBaseline: index === gridCount - 1,
		};
	});

	return {
		linePath,
		areaPath,
		guidelinePath,
		todayX: lastCoordinate?.x ?? null,
		gridLines,
		yMax,
		firstLabel: points[0]?.label ?? "",
		lastLabel: points[points.length - 1]?.label ?? "",
		plot,
	};
}

/**
 * Whether the team is ahead of, on, or behind the guideline right now.
 *
 * The reference prints a scope-change banner but never says whether the sprint
 * is actually going to land; that is the one thing a lead reads a burndown to
 * find out, so the brief says it in words above the figure.
 */
export type PulseBurndownVerdict = "ahead" | "on-track" | "behind";

export function toPulseBurndownVerdict({
	points,
	totalPoints,
	tolerance = 0.05,
}: Readonly<{
	points: readonly PulseBurndownPoint[];
	totalPoints: number;
	/** Fraction of the commitment that still counts as on track. */
	tolerance?: number;
}>): PulseBurndownVerdict {
	const lastClosedIndex = points.reduce(
		(found, point, index) => (point.remaining === null ? found : index),
		-1,
	);
	const actual = points[lastClosedIndex]?.remaining;
	if (lastClosedIndex < 0 || actual === null || actual === undefined || totalPoints <= 0) {
		return "on-track";
	}

	const spanX = Math.max(1, points.length - 1);
	const ideal = totalPoints * (1 - lastClosedIndex / spanX);
	const drift = (actual - ideal) / totalPoints;
	if (drift > tolerance) {
		return "behind";
	}
	if (drift < -tolerance) {
		return "ahead";
	}
	return "on-track";
}
