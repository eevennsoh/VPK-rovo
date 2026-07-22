/**
 * Screen sets for the two Jira Golden Paths gallery cards.
 *
 * Each session card ("Local session", "Global session") walks through an ordered
 * set of screens, navigated left/right from the gallery top bar — see
 * `SessionScreenControls` in `../components/session-stage.tsx` and the
 * `useScreenNavigator` hook. Mirrors the terminal demo's beat stepping, but over
 * a static screen list.
 *
 * A screen renders one of four ways (see `SessionStage`):
 *   - `design` set → a named golden-path design pattern rendered from a
 *     dedicated stage component (e.g. "kanban" → `KanbanStage`, the real Jira
 *     Kanban board). Use for a full designed screen that is not the terminal.
 *   - `liveBeat` set → part of a contiguous run of screens driven by the LIVE
 *     Terminal presenter (`useTerminalDemo`). `liveBeat` is the 1-indexed beat
 *     this screen settles at, with `0` meaning the initial, un-split terminal
 *     (before any beat). Stepping the card forward/back plays the real terminal
 *     animation (split, typing, output reveal, board staggering) between beats
 *     rather than jumping between frozen snapshots.
 *   - `terminalBeat` set → the Terminal demo frozen at that 1-indexed beat
 *     (beat 1 = the first beat). Static snapshot, not the live presenter demo.
 *     Use for a screen that is NOT contiguous with the live run.
 *   - otherwise → a placeholder big title. Swap in real golden-path designs by
 *     replacing the title/description, pointing a screen at `design` /
 *     `liveBeat` / `terminalBeat`, or extending `SessionStage` to render richer
 *     content per screen id (the original pattern stages under `../components/`
 *     are kept as building blocks).
 */
/** Named golden-path design patterns a screen can render (see `SessionStage`). */
export type SessionScreenDesign = "kanban";

export interface SessionScreen {
	id: string;
	title: string;
	description?: string;
	/**
	 * Render a named design pattern from its dedicated stage component instead of
	 * the terminal / placeholder (e.g. "kanban" → `KanbanStage`).
	 */
	design?: SessionScreenDesign;
	/**
	 * The section this screen belongs to (e.g. "Terminal"). Consecutive screens
	 * sharing a section are counted together — the gallery top bar shows
	 * `<section> · <position-in-section> of <count-in-section>` — so as more
	 * sections are added later, the counter resets per section instead of running
	 * across the whole card. Screens without a section fall back to a plain count.
	 */
	section?: string;
	/**
	 * Drive this screen with the LIVE Terminal presenter, settled at this
	 * 1-indexed beat (`0` = the initial, un-split terminal). Screens carrying
	 * `liveBeat` must form a contiguous run in ascending order so the shared
	 * presenter can animate forward/back between them.
	 */
	liveBeat?: number;
	/** Render the Terminal demo frozen at this 1-indexed beat instead of the placeholder title. */
	terminalBeat?: number;
}

// The Local session walks through the Terminal demo. Screens 0–3 are driven by
// the live presenter so stepping forward plays the real animation: the initial
// un-split terminal (beat 0), the split (beat 1), the connect command typed but
// NOT yet run (beat 2 — a deliberate pause point to talk about the command),
// and the connected dashboard (beat 3). The fifth screen is a frozen snapshot of
// the later "needs input" board (beat 7) — non-contiguous with the live run, so
// it stays a static slide. The sixth screen opens the "Kanban" section: the real
// Jira Kanban board design (light chrome; the Terminal-section dark mode does not
// apply here).
export const LOCAL_SESSION_SCREENS: readonly SessionScreen[] = [
	{ id: "local-0", section: "Terminal", title: "Local session · Terminal beat 0", liveBeat: 0 },
	{ id: "local-1", section: "Terminal", title: "Local session · Terminal beat 1", liveBeat: 1 },
	{ id: "local-2", section: "Terminal", title: "Local session · connect typed", liveBeat: 2 },
	{ id: "local-3", section: "Terminal", title: "Local session · connected dashboard", liveBeat: 3 },
	{ id: "local-4", section: "Terminal", title: "Local session · Terminal beat 7", terminalBeat: 7 },
	{ id: "local-5", section: "Kanban", title: "Local session · Kanban board", design: "kanban" },
];

export const GLOBAL_SESSION_SCREENS: readonly SessionScreen[] = [
	{ id: "global-1", title: "Global session · Screen 1" },
	{ id: "global-2", title: "Global session · Screen 2" },
	{ id: "global-3", title: "Global session · Screen 3" },
];
