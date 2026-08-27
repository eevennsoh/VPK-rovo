"use client";

import { useId, type RefCallback } from "react";

import { PulseProgressBar, PulseProgressLegend } from "@/components/blocks/jira-kanban/experimental/pulse/components/pulse-progress-bar";
import { PulseSectionLabel } from "@/components/blocks/jira-kanban/experimental/pulse/components/pulse-signals";
import { MEASURE } from "@/components/blocks/jira-kanban/experimental/pulse/components/pulse-story";
import {
	HEADLINE_STYLE,
	PULSE_EYEBROW,
	PULSE_ITEM_BODY,
	PULSE_ITEM_TITLE,
	PULSE_ROW,
	PULSE_ROW_KEY_TRACK,
} from "@/components/blocks/jira-kanban/experimental/pulse/components/pulse-type";
import {
	toPulseProgressModel,
	toPulseProgressScale,
} from "@/components/blocks/jira-kanban/experimental/pulse/lib/pulse-progress";
import type { PulseEpicChild, PulseEpicScope } from "@/components/blocks/jira-kanban/experimental/pulse/types";
import { cn } from "@/lib/utils";

/**
 * The epic scope brief — the opening page of the article once the reader has
 * narrowed it to one epic.
 *
 * Jira already answers this question with a panel: a bordered card titled "Epic
 * progress", a stack of blue links, a right-aligned percentage, and under each
 * link a three-band bar whose *width* encodes how much work that child holds.
 * The width encoding is the good idea in that panel and it survives here intact
 * — a four-item stream must not read as loud as a fourteen-item one. Everything
 * around it is re-set in the article's voice.
 *
 * Three things changed on the way across, and each is a bet that the article
 * wins:
 *
 * 1. The card is gone. Structure comes from a hanging key gutter and the
 *    hairline under each row, which is what the rest of Pulse uses. A boxed
 *    panel dropped into a continuous essay reads as a foreign widget; a ruled
 *    list reads as a table inside the essay, which is what it is.
 * 2. The keys hang in the left margin on their own reserved track rather than
 *    running into the name as one blue link. Names then start at exactly one x
 *    for every row — including the keyless "everything else" summary, which in
 *    the reference is the one row that visibly breaks the pattern by not being
 *    a link. Here it is simply a quieter row at the same indent, and the bars
 *    hang off the name column so each row is one block: identifier in the
 *    margin, claim and figure in the column.
 * 3. Nothing is a link. There is no href in the scope contract and no callback
 *    in this component's, and eight lines of blue inside body copy is noise the
 *    editorial column cannot afford. The key is the identifier; the reader who
 *    needs the item has it.
 *
 * The percentage sits in a fixed-width track so the whole column lands on one
 * x, and the roll-up's own "N% done" is flush to that same right edge — the
 * total sitting directly above the parts it sums. Every number is tabular so
 * the column never shivers between rows.
 *
 * No motion. Nothing here enters, leaves, or responds to a pointer: the brief
 * is a static opening spread, and per the should-I-animate gate an entrance
 * that carries no information is just latency in front of the reader.
 */

/**
 * The reserved right-hand track every percentage lands in. Wide enough for
 * "100% done" at 14px tabular, so the column's x position is a constant rather
 * than a function of whichever row happens to be widest today.
 */
const PERCENT_TRACK = "w-[4.5rem] shrink-0 text-right text-sm leading-5 text-text-subtle tabular-nums";

interface PulseEpicStreamRow {
	child: PulseEpicChild;
	donePercent: number;
	/** Fraction of the track this row's bar is drawn at, 0–1. */
	scale: number;
	summary: string;
}

/**
 * One stream: key in the margin, name and percentage on the title line, and the
 * proportional bar beneath them inside the name column.
 *
 * `min-w-0` rides every flexible wrapper and `shrink-0` holds the percentage
 * track, so a very long stream name spends its overflow on an ellipsis instead
 * of shoving the percentage off its x position.
 */
function PulseEpicStreamItem({ child, donePercent, scale, summary }: Readonly<PulseEpicStreamRow>) {
	const hasKey = child.key.trim() !== "";

	return (
		<li className={cn(PULSE_ROW, "min-w-0")}>
			{/* Kept even when empty: the track is what holds every name on one x. */}
			<span aria-hidden={!hasKey} className={PULSE_ROW_KEY_TRACK}>
				{hasKey ? child.key : ""}
			</span>
			<div className="min-w-0 flex-1">
				<div className="flex min-w-0 items-baseline gap-4">
					{/* `flex-1` is what actually right-aligns the column. A reserved
					    `shrink-0` track only fixes the percentage's *width*; without a
					    growing name beside it the pair floats left as one clump and
					    every row's percentage lands on a different x — the one thing
					    the reference gets unarguably right. */}
					<p
						className={cn("min-w-0 flex-1 truncate", hasKey ? PULSE_ITEM_TITLE : PULSE_ITEM_BODY)}
						title={child.name}
					>
						{child.name}
					</p>
					<span className={PERCENT_TRACK}>{`${donePercent}% done`}</span>
				</div>
				<PulseProgressBar
					className="mt-2.5"
					label={`${child.name} — ${summary}`}
					scale={scale}
					segments={child.segments}
					size="compact"
				/>
			</div>
		</li>
	);
}

/** The closing colophon: three numbers, in the story's own ruled `dl` rhythm. */
function PulseEpicFacts({ items, streams, target }: Readonly<{ items: number; streams: number; target: string }>) {
	return (
		<dl className={cn("mt-10 min-w-0 border-t border-border", MEASURE)}>
			{[
				{ id: "items", label: "Items", value: `${items}` },
				{ id: "streams", label: "Streams", value: `${streams}` },
				{ id: "target", label: "Target", value: target },
			].map((fact) => (
				<div
					className="flex min-w-0 items-baseline justify-between gap-6 border-b border-border py-2.5 last:border-b-0"
					key={fact.id}
				>
					<dt className={cn("min-w-0 truncate", PULSE_ITEM_BODY)}>{fact.label}</dt>
					<dd className="shrink-0 text-[18px] leading-6 font-medium tracking-[-0.01em] text-text tabular-nums">
						{fact.value}
					</dd>
				</div>
			))}
		</dl>
	);
}

export function PulseEpicBrief({
	scope,
	anchorRef,
	anchorId,
}: Readonly<{
	scope: PulseEpicScope;
	anchorRef?: RefCallback<HTMLElement>;
	anchorId: string;
}>) {
	const baseId = useId();
	const headingId = `${baseId}-pulse-epic-brief-title`;
	const streamsId = `${baseId}-pulse-epic-brief-streams`;

	const rollup = toPulseProgressModel(scope.segments);
	// Derived once, in one pass: every child's model, then the widest of them,
	// then each row's scale against that width. Re-deriving per row is how a
	// list ends up ranked against five different denominators.
	const childModels = scope.children.map((child) => ({
		child,
		model: toPulseProgressModel(child.segments),
	}));
	const largestChildTotal = childModels.reduce((largest, entry) => Math.max(largest, entry.model.total), 0);

	return (
		<section aria-labelledby={headingId} className="flex min-w-0 flex-col">
			<div id={anchorId} ref={anchorRef}>
				<div className={cn("flex min-h-6 min-w-0 items-baseline gap-4", MEASURE)}>
					<p className={cn("min-w-0 truncate", PULSE_EYEBROW)}>{`Epic · ${scope.key}`}</p>
					<p className={cn("ml-auto shrink-0", PULSE_EYEBROW)}>
						<span className="sr-only">Target date: </span>
						<span className="text-text-subtle">{scope.targetDate}</span>
						<span aria-hidden className="text-text-subtlest"> · </span>
						<span className="font-normal text-text-subtlest">{scope.targetNote}</span>
					</p>
				</div>

				<h2 className={cn("mt-7 text-pretty text-text", MEASURE)} id={headingId} style={HEADLINE_STYLE}>
					{scope.name}
				</h2>

				<p className={cn("mt-4 text-pretty", PULSE_ITEM_BODY, MEASURE)}>{scope.goal}</p>

				{/* The roll-up lock-up: the whole epic as one bar, its total flush to
				    the same right edge the stream percentages use, and the band
				    breakdown underneath. The total repeats the legend's done band on
				    purpose — a bar with no printed number makes the reader measure it,
				    and the legend without a total makes them add. */}
				<div className={cn("mt-8 flex min-w-0 items-center gap-5", MEASURE)}>
					<PulseProgressBar className="min-w-0 flex-1" segments={scope.segments} />
					<p className="shrink-0 text-[22px] leading-7 font-medium tracking-[-0.02em] text-text tabular-nums">
						{/* The count and its denominator, not the percentage: the legend
						    below already carries the done percentage, and the same figure
						    twice at two near-identical sizes sixty pixels apart reads as a
						    duplication rather than as a hierarchy. The stream rows below
						    are percentages, so this is where the reader learns what the
						    percentages are percentages *of*. */}
						{`${rollup.doneCount} of ${rollup.total}`}
						<span className="text-text-subtle"> items done</span>
					</p>
				</div>
				<PulseProgressLegend className={cn("mt-5", MEASURE)} model={rollup} />
			</div>

			<section aria-labelledby={streamsId} className={cn("mt-10 min-w-0", MEASURE)}>
				<PulseSectionLabel id={streamsId}>Streams</PulseSectionLabel>
				<ul className="mt-3 flex flex-col">
					{childModels.map((entry) => (
						<PulseEpicStreamItem
							child={entry.child}
							donePercent={entry.model.donePercent}
							key={entry.child.id}
							scale={toPulseProgressScale(entry.model.total, largestChildTotal)}
							summary={entry.model.summary}
						/>
					))}
				</ul>
			</section>

			<PulseEpicFacts items={rollup.total} streams={scope.children.length} target={scope.targetDate} />
		</section>
	);
}
