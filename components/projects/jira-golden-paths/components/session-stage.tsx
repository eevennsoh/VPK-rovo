"use client";

import ChevronLeftIcon from "@atlaskit/icon/core/chevron-left";
import ChevronRightIcon from "@atlaskit/icon/core/chevron-right";

import { Button } from "@/components/ui/button";
import type { ScreenNavigatorController } from "../hooks/use-screen-navigator";
import type { SessionScreen } from "../data/session-screens";
import { KanbanStage } from "./kanban-stage";
import { TerminalBeatScreen } from "./terminal-beat-screen";
import { TerminalLiveScreen } from "./terminal-live-screen";

// ---------------------------------------------------------------------------
// The Local/Global session cards share one presenter: an ordered set of screens
// navigated left/right. Mirrors the terminal demo's beat stepping (see
// `TerminalControls` / `useTerminalDemo`) — the gallery top bar shows position +
// prev/next, and the stage renders the current screen. Screens are placeholders
// for now (big titles); swap real golden-path designs in via
// `../data/session-screens.ts`.
// ---------------------------------------------------------------------------

/**
 * Position label for the top bar. When the active screen belongs to a section,
 * it reads `<section> · <position-in-section> of <count-in-section>` (e.g.
 * `Terminal · 1 of 4`) so the counter resets per section as more sections are
 * added. The position is measured within the CONTIGUOUS run of same-section
 * screens around the active one, so a section name reused in a later block still
 * counts from 1. Screens without a section fall back to `Screen N of M`.
 */
function sectionLabel(screens: readonly SessionScreen[], index: number): string {
	const activeIndex = Math.min(Math.max(index, 0), screens.length - 1);
	const section = screens[activeIndex]?.section;
	if (!section) {
		return `Screen ${Math.min(index + 1, screens.length)} of ${screens.length}`;
	}
	let start = activeIndex;
	while (start > 0 && screens[start - 1]?.section === section) start -= 1;
	let end = activeIndex;
	while (end < screens.length - 1 && screens[end + 1]?.section === section) end += 1;
	const position = activeIndex - start + 1;
	const total = end - start + 1;
	// U+00B7 MIDDLE DOT between the section name and its position.
	return `${section} \u00b7 ${position} of ${total}`;
}

/** Left/right screen navigator rendered in the gallery top bar (`topBarCenter`). */
export function SessionScreenControls({
	screens,
	controller,
}: Readonly<{
	screens: readonly SessionScreen[];
	controller: ScreenNavigatorController;
}>): React.ReactElement {
	const { index, canPrev, canNext, prev, next } = controller;

	return (
		<div className="flex items-center gap-2 text-sm text-text">
			<Button
				type="button"
				variant="outline"
				size="icon-compact"
				aria-label="Previous screen"
				onClick={prev}
				disabled={!canPrev}
			>
				<ChevronLeftIcon label="" size="small" />
			</Button>
			<span className="tabular-nums">{sectionLabel(screens, index)}</span>
			<Button
				type="button"
				variant="outline"
				size="icon-compact"
				aria-label="Next screen"
				onClick={next}
				disabled={!canNext}
			>
				<ChevronRightIcon label="" size="small" />
			</Button>
		</div>
	);
}

/**
 * Renders the active card's current screen:
 *   - `design` → a named golden-path design pattern from its own stage
 *     component (e.g. "kanban" → `KanbanStage`), keyed by screen id so it mounts
 *     fresh when navigated to.
 *   - `liveBeat` → the LIVE Terminal presenter, reconciled to that beat. The
 *     component is intentionally NOT keyed by screen id, so a run of live
 *     screens shares one persistent presenter instance and animates between
 *     beats (split, typing, output, board) as the card steps.
 *   - `terminalBeat` → the Terminal demo frozen at that beat (keyed by screen id
 *     so each is a fresh, discrete snapshot).
 *   - otherwise → a placeholder big title.
 */
export function SessionStage({
	screens,
	controller,
}: Readonly<{
	screens: readonly SessionScreen[];
	controller: ScreenNavigatorController;
}>): React.ReactElement {
	const screen = screens[controller.index] ?? screens[0];

	if (screen?.design === "kanban") {
		return <KanbanStage key={screen.id} />;
	}

	if (screen?.liveBeat != null) {
		return <TerminalLiveScreen targetBeat={screen.liveBeat} />;
	}

	if (screen?.terminalBeat != null) {
		return <TerminalBeatScreen key={screen.id} beat={screen.terminalBeat} />;
	}

	return (
		<div className="flex h-full w-full items-center justify-center">
			<h2 className="text-center font-semibold text-4xl tracking-tight text-text sm:text-6xl">
				{screen?.title}
			</h2>
		</div>
	);
}
