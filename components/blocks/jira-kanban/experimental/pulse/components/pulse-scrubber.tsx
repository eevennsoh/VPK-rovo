"use client";

import { useRef, type KeyboardEvent, type PointerEvent, type RefObject } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform, type MotionValue } from "motion/react";

import type {
	PulseOutlineEntry,
} from "@/components/blocks/jira-kanban/experimental/pulse/lib/pulse-outline";
import type { PulseSnapshot } from "@/components/blocks/jira-kanban/experimental/pulse/types";
import {
	POINTER_AWAY,
	RULE_WEIGHT,
	toMagnification,
	toMarkLabel,
	toMarkState,
	toNearestEntryIndex,
	toWeekdayLabel,
	type PulseMarkState,
	type PulseRuleWeight,
} from "@/components/blocks/jira-kanban/experimental/pulse/lib/pulse-marks";
import { cn } from "@/lib/utils";

/**
 * Pulse scrubber — the outline of one continuous article.
 *
 * Pulse renders every insight on the page, one after another, and this is that
 * document's outline rather than a control with a model of its own. It draws
 * exactly the entries `buildPulseOutline` produced, so the ruler and the prose
 * can never disagree: every mark is a real anchor in the article, and selecting
 * one scrolls the reader to it.
 *
 * Two ranks. **Insight** marks are the long majors, one per snapshot, evenly
 * spaced — spacing counts insights, not elapsed time, because a work item can
 * run a quarter or close in an afternoon and real timestamps would cluster four
 * marks into a morning and leave a weekend of dead rail. **Section** marks are
 * the short minors inside an insight — artifacts, needs attention, next best
 * actions — spread through the gap their insight owns. Both are selectable.
 *
 * The ruler is scrubbed by pointer, not just clicked: moving along it selects
 * the nearest entry, and the rules swell around the pointer with a distance
 * falloff so the ruler answers the hand before the article does. Click and the
 * keyboard still commit, which is what touch and assistive tech use.
 *
 * `PulseScrubber` is the vertical column the three-column layout carries from
 * `lg` up; `PulseScrubberCompact` is the same outline laid horizontally for the
 * stacked layout below it.
 */

const KEY_DELTAS: Readonly<Record<string, number | undefined>> = {
	ArrowDown: 1,
	ArrowRight: 1,
	ArrowUp: -1,
	ArrowLeft: -1,
};

/**
 * The frozen `PulseScrubberProps` in `types.ts` still describes the snapshot-at-
 * a-time scrubber this replaced, and that file is a read-only contract. The
 * outline shape is declared here instead: the ruler consumes outline entries and
 * reports the entry the reader asked for, and `snapshots` is carried only so the
 * pill can put a weekday and a clock on the current insight.
 */
export interface PulseScrubberViewProps {
	/** The document outline, in reading order. Drawn exactly as given. */
	entries: readonly PulseOutlineEntry[];
	/** Index into `entries` of the entry currently being read. */
	activeEntryIndex: number;
	/** Scroll the article to an outline entry. */
	onSelectEntry: (id: string) => void;
	/** Indexed by `entry.snapshotIndex` — supplies the pill's date and clock. */
	snapshots: readonly PulseSnapshot[];
	/** SNAPSHOT indexes where the filtered member was active; others render muted. */
	highlightedIndexes: ReadonlySet<number>;
	/** Set while a member filter is on — changes mark emphasis only. */
	isFiltered: boolean;
	/** Name of the filtered member, used to explain a muted mark out loud. */
	filteredMemberName?: string | null;
}

/**
 * "Mon 17 Aug" → "Mon". The pill lives inside an 88px column, so it carries the
 * weekday and the clock; the full date stays in each mark's accessible name.
 */
const MAGNIFY_IN = { duration: 0.15, ease: [0.4, 1, 0.6, 1] } as const; // duration-normal + ease-out-practical
const MAGNIFY_OUT = { duration: 0.1, ease: [0.6, 0, 0.8, 0.6] } as const; // duration-fast + ease-in

/**
 * Pointer scrubbing plus the swell, sharing one pointer position.
 *
 * Two cadences on purpose. `pointerOffset` updates every frame and drives the
 * rules through motion values, which write straight to the DOM — twenty-eight
 * rules re-rendering through React on every mouse pixel would stall the whole
 * column. The article only moves when the nearest entry actually changes, so a
 * fast sweep does not strobe the page.
 *
 * `magnify` is animated separately so the swell fades out on leave rather than
 * snapping. It is a plain 0–1 scalar and the parked pointer is a finite -1: an
 * Infinity or NaN here would poison the motion value permanently.
 */
function usePointerScrub(
	entries: readonly PulseOutlineEntry[],
	activeEntryIndex: number,
	onSelectEntry: (id: string) => void,
	axis: "x" | "y",
) {
	const railRef = useRef<HTMLDivElement | null>(null);
	const railSizeRef = useRef(1);
	const pointerOffset = useMotionValue(POINTER_AWAY);
	const magnify = useMotionValue(0);

	function readOffset(event: PointerEvent<HTMLDivElement>): number | null {
		const rail = railRef.current;
		if (!rail) {
			return null;
		}
		const rect = rail.getBoundingClientRect();
		const size = axis === "y" ? rect.height : rect.width;
		if (size <= 0) {
			return null;
		}
		railSizeRef.current = size;
		const position = axis === "y" ? event.clientY - rect.top : event.clientX - rect.left;
		return Math.min(Math.max(position / size, 0), 1);
	}

	function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
		// Touch has no hover: a finger sliding here is a page scroll, and
		// scrubbing under it would hijack the gesture. Tap still commits.
		if (event.pointerType === "touch") {
			return;
		}
		const offset = readOffset(event);
		if (offset === null) {
			return;
		}
		pointerOffset.set(offset);
		if (magnify.get() !== 1) {
			animate(magnify, 1, MAGNIFY_IN);
		}
		const nearest = toNearestEntryIndex(entries, offset);
		if (nearest !== null && nearest !== activeEntryIndex) {
			onSelectEntry(entries[nearest].id);
		}
	}

	function handlePointerLeave() {
		// The scrubbed position is sticky. Rewinding the article on leave would
		// snap the reader back every time the pointer crossed into the prose.
		animate(magnify, 0, MAGNIFY_OUT).then(() => {
			pointerOffset.set(POINTER_AWAY);
		});
	}

	return { handlePointerLeave, handlePointerMove, magnify, pointerOffset, railRef, railSizeRef };
}

/**
 * Roving-tabindex navigation over the whole outline, shared by both axes.
 *
 * Arrows step from the mark that has focus, not from the reading position. The
 * two are the same the moment Tab lands on the ruler, but selecting scrolls the
 * article and the reading position only catches up on the next frame — stepping
 * from the reading position would drop a keypress whenever key repeat outran it.
 */
function useOutlineNavigation(
	entries: readonly PulseOutlineEntry[],
	activeEntryIndex: number,
	onSelectEntry: (id: string) => void,
) {
	const markRefs = useRef<Array<HTMLButtonElement | null>>([]);

	function moveTo(index: number) {
		if (entries.length === 0) {
			return;
		}
		const next = Math.min(Math.max(index, 0), entries.length - 1);
		onSelectEntry(entries[next].id);
		markRefs.current[next]?.focus();
	}

	function toOriginIndex(): number {
		const focused = markRefs.current.findIndex((node) => node !== null && node === document.activeElement);
		return focused === -1 ? activeEntryIndex : focused;
	}

	function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
		if (event.key === "Home" || event.key === "End") {
			event.preventDefault();
			moveTo(event.key === "Home" ? 0 : entries.length - 1);
			return;
		}
		const delta = KEY_DELTAS[event.key];
		if (delta === undefined) {
			return;
		}
		event.preventDefault();
		moveTo(toOriginIndex() + delta);
	}

	return { handleKeyDown, markRefs, moveTo };
}

/**
 * One rule, sized by its distance from the pointer.
 *
 * `useTransform` keeps this off React's render path: the value lands on the
 * element directly, so the whole ruler responds at frame rate while the
 * component tree stays still. Under reduced motion the pointer handlers are
 * never attached, so `pointerOffset` stays parked and every rule renders — and
 * stays — at exactly its resting weight. One code path, no second geometry to
 * keep in sync.
 */
function PulseRule({
	axis,
	className,
	magnify,
	offset,
	pointerOffset,
	railSizeRef,
	weight,
}: Readonly<{
	axis: "x" | "y";
	className?: string;
	magnify: MotionValue<number>;
	offset: number;
	pointerOffset: MotionValue<number>;
	railSizeRef: RefObject<number>;
	weight: PulseRuleWeight;
}>) {
	const falloff = useTransform([pointerOffset, magnify], ([pointer, amount]: number[]) => {
		if (pointer < 0 || amount <= 0) {
			return 0;
		}
		return toMagnification(Math.abs(offset - pointer) * railSizeRef.current) * amount;
	});
	const length = useTransform(falloff, (value) => weight.rest + (weight.peak - weight.rest) * value);
	const opacity = useTransform(falloff, (value) => weight.restOpacity + (weight.peakOpacity - weight.restOpacity) * value);

	return (
		<motion.span
			aria-hidden="true"
			className={className}
			style={axis === "y" ? { width: length, opacity } : { height: length, opacity }}
		/>
	);
}

/** One selectable mark: an insight major or a section minor. */
function PulseMark({
	axis,
	entry,
	hint,
	isActive,
	label,
	magnify,
	markRef,
	onSelect,
	pointerOffset,
	railSizeRef,
	state,
	tabbable,
}: Readonly<{
	axis: "x" | "y";
	entry: PulseOutlineEntry;
	/** Shown on hover beside a vertical insight mark; `null` suppresses it. */
	hint: string | null;
	isActive: boolean;
	label: string;
	magnify: MotionValue<number>;
	markRef: (node: HTMLButtonElement | null) => void;
	onSelect: () => void;
	pointerOffset: MotionValue<number>;
	railSizeRef: RefObject<number>;
	state: PulseMarkState;
	/** The one mark Tab reaches — see `usePulseOutlineView`. */
	tabbable: boolean;
}>) {
	return (
		<button
			ref={markRef}
			type="button"
			role="option"
			aria-selected={isActive}
			tabIndex={tabbable ? 0 : -1}
			onClick={onSelect}
			style={axis === "y" ? { top: `${entry.offset * 100}%` } : { left: `${entry.offset * 100}%` }}
			// The active pill paints after the marks, so a focused mark has to be
			// lifted above it or its ring is half-covered.
			className={cn(
				"group/mark focus-visible:ring-ring absolute flex rounded-xs outline-none focus-visible:z-10 focus-visible:ring-2",
				axis === "y" ? "left-0 h-5 w-11 -translate-y-1/2 items-center" : "bottom-0 h-6 w-6 -translate-x-1/2 flex-col justify-end",
			)}
		>
			<span className="sr-only">{label}</span>
			<PulseRule
				axis={axis}
				className={axis === "y" ? "bg-text absolute left-0 h-px" : "bg-text absolute bottom-0 left-1/2 w-px -translate-x-1/2"}
				magnify={magnify}
				offset={entry.offset}
				pointerOffset={pointerOffset}
				railSizeRef={railSizeRef}
				weight={RULE_WEIGHT[entry.kind][state]}
			/>
			{hint === null ? null : (
				<span
					aria-hidden="true"
					className="text-text-subtlest duration-normal ease-out-practical absolute top-1/2 left-5 -translate-y-1/2 text-[11px] leading-none font-medium whitespace-nowrap opacity-0 transition-opacity group-hover/mark:opacity-100 group-focus-visible/mark:opacity-100 motion-reduce:transition-none"
				>
					{hint}
				</span>
			)}
		</button>
	);
}

const PILL = "bg-primary text-primary-foreground inline-flex items-center rounded-full px-2 py-1.5 text-[11px] leading-none font-medium whitespace-nowrap";

/**
 * Everything both orientations derive from the props: the muted set, the mark
 * states, and the insight the pill is speaking for. A section never gets its own
 * pill — it borrows its insight's, parked at the section's own offset, so the
 * pill reads as "you are here, inside this insight".
 *
 * `tabbable` is clamped rather than tied to `isActive`. Roving tabindex only
 * works if exactly one mark carries `tabIndex={0}`; an active index that fell
 * outside the outline — an empty article, a filter that shortened it mid-frame —
 * would otherwise leave the whole ruler unreachable by Tab.
 */
function usePulseOutlineView({
	activeEntryIndex,
	entries,
	filteredMemberName,
	highlightedIndexes,
	isFiltered,
	snapshots,
}: Readonly<PulseScrubberViewProps>) {
	const activeEntry = entries[activeEntryIndex] ?? null;
	const activeSnapshot = activeEntry === null ? null : (snapshots[activeEntry.snapshotIndex] ?? null);
	const focusIndex = Math.min(Math.max(activeEntryIndex, 0), entries.length - 1);
	const marks = entries.map((entry, index) => {
		const isMuted = isFiltered ? !highlightedIndexes.has(entry.snapshotIndex) : false;
		return {
			entry,
			isActive: index === activeEntryIndex,
			label: toMarkLabel(entry, snapshots[entry.snapshotIndex], isMuted, filteredMemberName),
			state: toMarkState(isMuted, index === activeEntryIndex),
			tabbable: index === focusIndex,
		};
	});
	return { activeEntry, activeSnapshot, marks };
}

export function PulseScrubber(props: Readonly<PulseScrubberViewProps>) {
	const { activeEntryIndex, entries, onSelectEntry, snapshots } = props;
	const { activeEntry, activeSnapshot, marks } = usePulseOutlineView(props);
	const { handleKeyDown, markRefs, moveTo } = useOutlineNavigation(entries, activeEntryIndex, onSelectEntry);
	const shouldReduceMotion = useReducedMotion();
	const { handlePointerLeave, handlePointerMove, magnify, pointerOffset, railRef, railSizeRef } = usePointerScrub(
		entries,
		activeEntryIndex,
		onSelectEntry,
		"y",
	);

	return (
		<div
			ref={railRef}
			role="listbox"
			aria-label="Article outline"
			aria-orientation="vertical"
			onKeyDown={handleKeyDown}
			onPointerMove={shouldReduceMotion ? undefined : handlePointerMove}
			onPointerLeave={shouldReduceMotion ? undefined : handlePointerLeave}
			className="relative h-full min-h-[24rem] w-22"
		>
			{marks.map(({ entry, isActive, label, state, tabbable }, index) => (
				<PulseMark
					key={entry.id}
					axis="y"
					entry={entry}
					// The clock belongs to the insight, and only when the pill is not
					// already sitting on that mark saying the same thing.
					hint={entry.kind === "insight" && !isActive ? (snapshots[entry.snapshotIndex]?.timeLabel ?? null) : null}
					isActive={isActive}
					label={label}
					magnify={magnify}
					markRef={(node) => {
						markRefs.current[index] = node;
					}}
					onSelect={() => moveTo(index)}
					pointerOffset={pointerOffset}
					railSizeRef={railSizeRef}
					state={state}
					tabbable={tabbable}
				/>
			))}
			{activeEntry === null || activeSnapshot === null ? null : (
				<div
					aria-hidden="true"
					style={{ top: `${activeEntry.offset * 100}%` }}
					// Parked over the tail of the active mark, so the rule reads as a
					// leader line into the pill and the pill still clears the prose.
					className="duration-medium ease-in-out pointer-events-none absolute left-2 -translate-y-1/2 transition-[top] motion-reduce:transition-none"
				>
					<span className={PILL}>{`${toWeekdayLabel(activeSnapshot.dateLabel)} ${activeSnapshot.timeLabel}`}</span>
				</div>
			)}
		</div>
	);
}

/**
 * The same outline, laid horizontally for the stacked layout below `lg`. Same
 * entries, same single insight pill — the pill slides along the scale and pins
 * itself inside the ends instead of overhanging them.
 */
export function PulseScrubberCompact(props: Readonly<PulseScrubberViewProps>) {
	const { activeEntryIndex, entries, onSelectEntry } = props;
	const { activeEntry, activeSnapshot, marks } = usePulseOutlineView(props);
	const { handleKeyDown, markRefs, moveTo } = useOutlineNavigation(entries, activeEntryIndex, onSelectEntry);
	const shouldReduceMotion = useReducedMotion();
	const { handlePointerLeave, handlePointerMove, magnify, pointerOffset, railRef, railSizeRef } = usePointerScrub(
		entries,
		activeEntryIndex,
		onSelectEntry,
		"x",
	);

	return (
		<div className="flex min-w-0 flex-col gap-1.5">
			<div
				ref={railRef}
				role="listbox"
				aria-label="Article outline"
				aria-orientation="horizontal"
				onKeyDown={handleKeyDown}
				onPointerMove={shouldReduceMotion ? undefined : handlePointerMove}
				onPointerLeave={shouldReduceMotion ? undefined : handlePointerLeave}
				className="relative h-3.5 min-w-0"
			>
				{marks.map(({ entry, isActive, label, state, tabbable }, index) => (
					<PulseMark
						key={entry.id}
						axis="x"
						entry={entry}
						hint={null}
						isActive={isActive}
						label={label}
						magnify={magnify}
						markRef={(node) => {
							markRefs.current[index] = node;
						}}
						onSelect={() => moveTo(index)}
						pointerOffset={pointerOffset}
						railSizeRef={railSizeRef}
						state={state}
						tabbable={tabbable}
					/>
				))}
			</div>
			<div aria-hidden="true" className="relative h-[22px] min-w-0">
				{activeEntry === null || activeSnapshot === null ? null : (
					<div
						style={{ left: `${activeEntry.offset * 100}%`, transform: `translateX(-${activeEntry.offset * 100}%)` }}
						className="duration-medium ease-in-out absolute top-0 transition-[left,transform] motion-reduce:transition-none"
					>
						<span className={PILL}>{`${activeSnapshot.dateLabel} · ${activeSnapshot.timeLabel}`}</span>
					</div>
				)}
			</div>
		</div>
	);
}
