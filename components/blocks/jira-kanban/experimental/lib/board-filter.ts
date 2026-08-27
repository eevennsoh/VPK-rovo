import type { PulseSnapshot, PulseTimeline } from "@/components/blocks/jira-kanban/experimental/pulse/types";

/**
 * Experimental board filter model.
 *
 * Field value selections are multi-select. Days is a single preset (or a custom
 * inclusive range) because the windows overlap. The demo clock is pinned to the
 * Pulse fixture week so "Today" is not an empty stub against wall-clock August 26.
 */

export const BOARD_FILTER_DEMO_NOW_ISO = "2026-08-21T18:00:00.000Z";

export const BOARD_FILTER_VALUE_FIELD_IDS = [
	"project",
	"parent",
	"sprint",
	"assignee",
	"status",
	"work-type",
	"labels",
] as const;

export const BOARD_FILTER_FIELD_IDS = [
	...BOARD_FILTER_VALUE_FIELD_IDS,
	"days",
] as const;

export type BoardFilterValueFieldId = (typeof BOARD_FILTER_VALUE_FIELD_IDS)[number];
export type BoardFilterFieldId = (typeof BOARD_FILTER_FIELD_IDS)[number];

export const BOARD_FILTER_DAYS_PRESETS = [
	"today",
	"yesterday",
	"last-3-days",
	"last-7-days",
	"last-30-days",
	"custom",
] as const;

export type BoardFilterDaysPreset = (typeof BOARD_FILTER_DAYS_PRESETS)[number];

export interface BoardFilterDaysSelection {
	preset: BoardFilterDaysPreset | null;
	customEnd?: string;
	customStart?: string;
}

export type BoardFilterValueSelections = Readonly<
	Record<BoardFilterValueFieldId, readonly string[]>
>;

export interface BoardFilterDaysRange {
	end: Date;
	start: Date;
}

export const EMPTY_BOARD_FILTER_VALUE_SELECTIONS: BoardFilterValueSelections = {
	assignee: [],
	labels: [],
	parent: [],
	project: [],
	sprint: [],
	status: [],
	"work-type": [],
};

export const EMPTY_BOARD_FILTER_DAYS: BoardFilterDaysSelection = { preset: null };

function startOfUtcDay(date: Date): Date {
	return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function endOfUtcDay(date: Date): Date {
	return new Date(Date.UTC(
		date.getUTCFullYear(),
		date.getUTCMonth(),
		date.getUTCDate(),
		23,
		59,
		59,
		999,
	));
}

function shiftUtcDays(date: Date, days: number): Date {
	return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function parseIsoDate(isoDate: string): Date | null {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(isoDate);
	if (!match) {
		return null;
	}
	const year = Number(match[1]);
	const month = Number(match[2]);
	const day = Number(match[3]);
	const date = new Date(Date.UTC(year, month - 1, day));
	if (
		date.getUTCFullYear() !== year
		|| date.getUTCMonth() !== month - 1
		|| date.getUTCDate() !== day
	) {
		return null;
	}
	return date;
}

export function resolveBoardFilterDaysRange(
	selection: BoardFilterDaysSelection,
	now: Date,
): BoardFilterDaysRange | null {
	if (selection.preset === null) {
		return null;
	}
	if (selection.preset === "custom") {
		if (!selection.customStart || !selection.customEnd) {
			return null;
		}
		const start = parseIsoDate(selection.customStart);
		const end = parseIsoDate(selection.customEnd);
		if (!start || !end) {
			return null;
		}
		return start.getTime() <= end.getTime()
			? { end: endOfUtcDay(end), start: startOfUtcDay(start) }
			: { end: endOfUtcDay(start), start: startOfUtcDay(end) };
	}

	const todayStart = startOfUtcDay(now);
	if (selection.preset === "today") {
		return { end: endOfUtcDay(now), start: todayStart };
	}
	if (selection.preset === "yesterday") {
		const yesterday = shiftUtcDays(todayStart, -1);
		return { end: endOfUtcDay(yesterday), start: yesterday };
	}

	const lookbackDays = selection.preset === "last-3-days"
		? 3
		: selection.preset === "last-7-days"
			? 7
			: 30;
	return {
		end: endOfUtcDay(now),
		start: shiftUtcDays(todayStart, -(lookbackDays - 1)),
	};
}

export function isTimestampInDaysRange(
	timestamp: string,
	range: BoardFilterDaysRange,
): boolean {
	const timestampMs = Date.parse(timestamp);
	return Number.isFinite(timestampMs)
		&& timestampMs >= range.start.getTime()
		&& timestampMs <= range.end.getTime();
}

export function filterPulseTimelineByDays(
	timeline: PulseTimeline,
	selection: BoardFilterDaysSelection,
	now: Date,
): PulseTimeline {
	const range = resolveBoardFilterDaysRange(selection, now);
	if (!range) {
		return timeline;
	}
	return {
		...timeline,
		snapshots: timeline.snapshots.filter((snapshot: PulseSnapshot) => (
			isTimestampInDaysRange(snapshot.timestamp, range)
		)),
	};
}

export function countBoardFilterSelections(
	values: BoardFilterValueSelections,
	days: BoardFilterDaysSelection,
): number {
	const valueCount = BOARD_FILTER_VALUE_FIELD_IDS.reduce(
		(total, fieldId) => total + values[fieldId].length,
		0,
	);
	const hasDays = days.preset !== null && (
		days.preset !== "custom" || Boolean(days.customStart && days.customEnd)
	);
	return valueCount + (hasDays ? 1 : 0);
}

export function toggleBoardFilterValue(
	values: BoardFilterValueSelections,
	fieldId: BoardFilterValueFieldId,
	valueId: string,
): BoardFilterValueSelections {
	const current = values[fieldId];
	const nextValues = current.includes(valueId)
		? current.filter((id) => id !== valueId)
		: [...current, valueId];
	return { ...values, [fieldId]: nextValues };
}

export function clearBoardFilterField(
	values: BoardFilterValueSelections,
	days: BoardFilterDaysSelection,
	fieldId: BoardFilterFieldId,
): { days: BoardFilterDaysSelection; values: BoardFilterValueSelections } {
	if (fieldId === "days") {
		return { days: EMPTY_BOARD_FILTER_DAYS, values };
	}
	return { days, values: { ...values, [fieldId]: [] } };
}

export function toLocalIsoDate(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}
