"use client";

import { useCallback } from "react";

import CrossIcon from "@atlaskit/icon/core/cross";
import HourglassIcon from "@atlaskit/icon-lab/core/hourglass";

import { ScrubberRail } from "@/components/blocks/scrubber/components/scrubber-rail";
import { SCRUBBER_DEMO_ENTRIES } from "@/components/blocks/scrubber/data/scrubber-demo-timeline";
import {
	useScrubberComposer,
	type ScrubberComposerMode,
} from "@/components/blocks/scrubber/hooks/use-scrubber-composer";
import type { ScrubberEntry } from "@/components/blocks/scrubber/lib/scrubber-entries";
import { FloatingComposer } from "@/components/projects/shared/components/floating-composer";
import { RovoComposerActionButton } from "@/components/projects/shared/components/rovo-composer-send-controls";
import { floatingComposerTextareaClassName } from "@/components/projects/shared/components/rovo-composer-styles";
import { PromptInputButton, PromptInputTextarea } from "@/components/ui-custom/prompt-input";
import { cn } from "@/lib/utils";

/**
 * The rail's cell, pinned to the height of the editor cell it replaces.
 *
 * 36px is what the idle editor row measures — its `min-h-8` floor plus the
 * editor's own line box — so an `h-9` cell keeps the composer exactly the same
 * height in both modes. That matters more than it sounds: the Timeline pill the
 * user just clicked sits on this row, and a row that changed height would move
 * the control out from under the cursor at the moment of the click.
 *
 * The rail block measures 36px too (a 14px rail above a 22px pill row, gap
 * collapsed), so it fills the cell exactly without stretching it. Anything
 * taller is the swell itself: a major's rule reaches 46px and its focus ring
 * adds 4 more, and that deliberately overflows the composer rather than
 * reserving 36px of dead space only a hovering pointer ever uses.
 * `allowOverflow` is what lets it escape uncut.
 */
const RAIL_CELL = "relative h-9 w-full";
const RAIL_BLOCK = "absolute inset-x-0 bottom-0 gap-0";

/**
 * The mode toggle, and the way back out.
 *
 * `aria-pressed` is doing real work: it is both the announced state and the
 * entire selected treatment, because the shared button base already paints
 * `aria-pressed:bg-bg-selected` / `text-text-selected`. Nothing here hand-rolls
 * a pressed style.
 *
 * ADS ships its icon color as unlayered Compiled CSS (`color: currentColor`),
 * which outranks every layered Tailwind utility no matter the specificity — a
 * `[&_svg]:text-*` class would silently do nothing. Inheriting is what we want:
 * `currentColor` carries the button's pressed text color into the glyph.
 */
function ScrubberTimelineToggle({ isTimeline, onToggle }: Readonly<{ isTimeline: boolean; onToggle: () => void }>) {
	return (
		<PromptInputButton
			aria-label="Timeline"
			aria-pressed={isTimeline}
			onClick={onToggle}
			size="sm"
			tooltip="Scrub the timeline"
			variant="ghost"
		>
			<HourglassIcon color="currentColor" label="" />
			<span>Timeline</span>
		</PromptInputButton>
	);
}

function ScrubberExitButton({ onExit }: Readonly<{ onExit: () => void }>) {
	return (
		<PromptInputButton aria-label="Exit timeline" onClick={onExit} size="icon-sm" tooltip="Exit timeline" variant="ghost">
			<CrossIcon color="currentColor" label="" />
		</PromptInputButton>
	);
}

export interface ScrubberComposerProps {
	/** The rail. Defaults to the demo timeline so the block renders standalone. */
	entries?: readonly ScrubberEntry[];
	/** Committed entry index. Supply it to control the rail; omit to let the composer own it. */
	activeIndex?: number;
	onActiveIndexChange?: (index: number) => void;
	onSubmit?: (prompt: string) => void;
	placeholder?: string;
	defaultMode?: ScrubberComposerMode;
	className?: string;
}

/**
 * A prompt composer whose editor row can be swapped for a scrubbable notch rail.
 *
 * The `⌛ Timeline` pill is a toggle, not a launcher: it stays in the leading slot
 * in both modes and reads as pressed while the rail is up, so the way back is the
 * control you came in through. The trailing send control becomes a close.
 *
 * The `FloatingComposer` shell stays mounted across the toggle — only the editor
 * cell and the trailing control change — so the form, its chrome, and its position
 * on screen never move underneath the click.
 *
 * Two constraints the shell imposes on this swap:
 *
 * - `layout="compact"` while scrubbing. The rail must replace the editor *cell*,
 *   not take a row of its own: `stacked` would give it a full-width row above the
 *   controls and drop the Timeline pill onto a second row, moving the control the
 *   user is mid-click on. `compact` also skips the `auto` path's measurement
 *   probe, which hunts for a `textarea` or `[contenteditable]` inside the cell and
 *   polls every 50ms until one appears — with the rail in that cell, never.
 * - `allowOverflow`. The shell's `InputGroup` is `overflow-hidden` by default,
 *   which would clip both the swelling rules and half of a mark's focus ring.
 */
export function ScrubberComposer({
	activeIndex,
	className,
	defaultMode = "idle",
	entries = SCRUBBER_DEMO_ENTRIES,
	onActiveIndexChange,
	onSubmit,
	placeholder = "Ask, @mention, or / for actions",
}: Readonly<ScrubberComposerProps>) {
	const composer = useScrubberComposer({ activeIndex, defaultMode, onActiveIndexChange });
	const { consumeFocusRestore, draft, isTimeline, mode, selectIndex, setDraft, setMode, toggleMode } = composer;

	const handleSelect = useCallback(
		(id: string) => {
			const index = entries.findIndex((entry) => entry.id === id);
			if (index >= 0) {
				selectIndex(index);
			}
		},
		[entries, selectIndex],
	);

	const handleSubmit = useCallback(() => {
		const prompt = draft.trim();
		// The rail owns the row while scrubbing; there is no draft to send.
		if (isTimeline || prompt.length === 0) {
			return;
		}
		onSubmit?.(prompt);
		setDraft("");
	}, [draft, isTimeline, onSubmit, setDraft]);

	return (
		<div className={cn("w-full", className)} data-mode={mode} data-slot="scrubber-composer">
			<FloatingComposer
				actions={
					isTimeline ? (
						<ScrubberExitButton onExit={() => setMode("idle")} />
					) : (
						<RovoComposerActionButton
							canSubmit={draft.trim().length > 0}
							composerStatus="ready"
							onStop={() => undefined}
							showSubmitWhenEmpty
							submitDisabled={onSubmit === undefined}
						/>
					)
				}
				addButton={<ScrubberTimelineToggle isTimeline={isTimeline} onToggle={toggleMode} />}
				allowOverflow
				aria-label="Ask Rovo"
				layout={isTimeline ? "compact" : "auto"}
				onSubmit={handleSubmit}
			>
				{isTimeline ? (
					<div className={RAIL_CELL}>
						<ScrubberRail
							activeIndex={composer.activeIndex}
							ariaLabel="Timeline"
							axis="x"
							className={RAIL_BLOCK}
							entries={entries}
							onSelect={handleSelect}
						/>
					</div>
				) : (
					<PromptInputTextarea
						aria-label="Ask Rovo"
						className={cn(floatingComposerTextareaClassName, "text-sm leading-5")}
						onChange={(event) => setDraft(event.currentTarget.value)}
						onEditorReady={(editor) => {
							if (consumeFocusRestore()) {
								editor.commands.focus("end");
							}
						}}
						placeholder={placeholder}
						value={draft}
					/>
				)}
			</FloatingComposer>
		</div>
	);
}
