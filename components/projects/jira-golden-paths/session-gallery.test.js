const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const read = (rel) => readFileSync(join(__dirname, rel), "utf8");
const PAGE_SOURCE = read("page.tsx");
const GALLERY_ITEMS_SOURCE = read("data/gallery-items.ts");
const SCREENS_SOURCE = read("data/session-screens.ts");
const STAGE_SOURCE = read("components/session-stage.tsx");
const TERMINAL_BEAT_SCREEN_SOURCE = read("components/terminal-beat-screen.tsx");
const TERMINAL_LIVE_SCREEN_SOURCE = read("components/terminal-live-screen.tsx");
const NAV_HOOK_SOURCE = read("hooks/use-screen-navigator.ts");

test("Gallery exposes exactly the Local and Global session cards", () => {
	const ids = [...GALLERY_ITEMS_SOURCE.matchAll(/id:\s*"([^"]+)"/gu)].map((match) => match[1]);
	assert.deepEqual(ids, ["local-session", "global-session"]);
	assert.match(GALLERY_ITEMS_SOURCE, /title:\s*"Local session"/u);
	assert.match(GALLERY_ITEMS_SOURCE, /title:\s*"Global session"/u);
});

test("Each card defines its own ordered set of screens to navigate", () => {
	assert.match(SCREENS_SOURCE, /export const LOCAL_SESSION_SCREENS: readonly SessionScreen\[\]/u);
	assert.match(SCREENS_SOURCE, /export const GLOBAL_SESSION_SCREENS: readonly SessionScreen\[\]/u);
});

test("Local session drives beats 0–3 live and freezes beat 7", () => {
	// Screens 0–3 share the live presenter (liveBeat 0 = initial un-split
	// terminal, 1 = split, 2 = connect command typed but not run, 3 = connected
	// dashboard); the non-contiguous beat 7 (needs-input board) stays frozen.
	const liveBeats = [...SCREENS_SOURCE.matchAll(/liveBeat:\s*(\d+)/gu)].map((match) => Number(match[1]));
	assert.deepEqual(liveBeats, [0, 1, 2, 3]);
	const frozenBeats = [...SCREENS_SOURCE.matchAll(/terminalBeat:\s*(\d+)/gu)].map((match) => Number(match[1]));
	assert.deepEqual(frozenBeats, [7]);

	// The stage routes live screens to the shared presenter and frozen screens to
	// the static snapshot.
	assert.match(STAGE_SOURCE, /screen\?\.liveBeat != null/u);
	assert.match(STAGE_SOURCE, /<TerminalLiveScreen targetBeat=\{screen\.liveBeat\} \/>/u);
	assert.match(STAGE_SOURCE, /screen\?\.terminalBeat != null/u);
	assert.match(STAGE_SOURCE, /<TerminalBeatScreen key=\{screen\.id\} beat=\{screen\.terminalBeat\} \/>/u);

	// The frozen screen is a static, non-interactive snapshot of one beat.
	assert.match(TERMINAL_BEAT_SCREEN_SOURCE, /createStaticTerminalController\(beat\)/u);
	assert.match(TERMINAL_BEAT_SCREEN_SOURCE, /<TerminalStage controller=\{controller\} \/>/u);

	// The live run reuses the real presenter animation, with the card owning the
	// arrow keys (keyboard off) and driving advance/stepBack to the target beat.
	assert.match(TERMINAL_LIVE_SCREEN_SOURCE, /useTerminalDemo\(true, \{ keyboard: false \}\)/u);
	assert.match(TERMINAL_LIVE_SCREEN_SOURCE, /<TerminalStage controller=\{controller\} \/>/u);
});

test("Page wires the session stage + top-bar screen navigator per card", () => {
	assert.match(PAGE_SOURCE, /title="Jira Golden Paths"/u);
	assert.match(PAGE_SOURCE, /<SessionScreenControls\s+screens=\{activeCard\.screens\}\s+controller=\{activeCard\.controller\}\s+\/>/u);
	assert.match(PAGE_SOURCE, /<SessionStage screens=\{card\.screens\} controller=\{card\.controller\} \/>/u);
	assert.match(PAGE_SOURCE, /onReset=\{handleReset\}/u);
});

test("Page gives Jira Golden Paths a shaded Rovo-purple gallery palette", () => {
	assert.match(PAGE_SOURCE, /const ROVO_PURPLE_PALETTE(?:: GalleryPalette)? = \["#5E2C9D", "#7A3BB3", "#9850CC", "#AF59E1"\];/u);
	assert.match(PAGE_SOURCE, /palette=\{ROVO_PURPLE_PALETTE\}/u);
});

test("Page forces ADS dark subtree theming while in the Terminal section", () => {
	// Mirrors the /asx Terminal pattern: flip the gallery chrome to dark tokens
	// via ADS subtree theming when the active screen's section is "Terminal".
	assert.match(PAGE_SOURCE, /activeScreen\?\.section === "Terminal"/u);
	assert.match(PAGE_SOURCE, /"data-subtree-theme": ""/u);
	assert.match(PAGE_SOURCE, /"data-color-mode": "dark"/u);
	assert.match(
		PAGE_SOURCE,
		/"data-theme": "dark:dark spacing:spacing typography:typography shape:shape"/u,
	);
	// Applied to the gallery root wrapper (so the fixed dock inherits it too).
	assert.match(PAGE_SOURCE, /bg-surface" \{\.\.\.subtreeThemeProps\}/u);
});

test("Page adds gated ←/→ keyboard stepping for the active card", () => {
	assert.match(PAGE_SOURCE, /event\.key === "ArrowRight"/u);
	assert.match(PAGE_SOURCE, /event\.key === "ArrowLeft"/u);
	// Must bail on focused interactive controls so the top-bar arrows and dock
	// tiles keep their own key handling.
	assert.match(PAGE_SOURCE, /if \(isInteractiveTarget\(event\.target\)\) return;/u);
});

test("Screen controls provide clickable prev/next that disable at the bounds", () => {
	assert.match(STAGE_SOURCE, /aria-label="Previous screen"/u);
	assert.match(STAGE_SOURCE, /aria-label="Next screen"/u);
	assert.match(STAGE_SOURCE, /onClick=\{prev\}/u);
	assert.match(STAGE_SOURCE, /onClick=\{next\}/u);
	assert.match(STAGE_SOURCE, /disabled=\{!canPrev\}/u);
	assert.match(STAGE_SOURCE, /disabled=\{!canNext\}/u);
	assert.match(STAGE_SOURCE, /\{sectionLabel\(screens, index\)\}/u);
});

test("Local session opens the Kanban section with the real board design", () => {
	// The sixth screen is the "Kanban" section rendering the Kanban board design.
	assert.match(SCREENS_SOURCE, /design:\s*"kanban"/u);
	assert.match(SCREENS_SOURCE, /export type SessionScreenDesign = "kanban";/u);
	// The stage routes a `design: "kanban"` screen to the real KanbanStage,
	// keyed by screen id so it mounts fresh when navigated to.
	assert.match(STAGE_SOURCE, /screen\?\.design === "kanban"/u);
	assert.match(STAGE_SOURCE, /<KanbanStage key=\{screen\.id\} \/>/u);

	// The Kanban/Rovo design stages call `useRovoChat`, so the JGP tree must be
	// wrapped in a RovoChatProvider (not reliant on an ancestor route).
	assert.match(PAGE_SOURCE, /import \{ RovoChatProvider \} from "@\/app\/contexts\/context-rovo-chat";/u);
	// The provider receives the JGP agent profiles so local personas (rfp-drafter,
	// service-impact-agent, …) resolve instead of falling back to default Rovo.
	assert.match(PAGE_SOURCE, /<RovoChatProvider agentProfiles=\{JGP_CHAT_AGENT_PROFILES\}>/u);
	assert.match(PAGE_SOURCE, /import \{ JGP_CHAT_AGENT_PROFILES \} from "\.\/data\/agent-chat-data";/u);
});

test("Top-bar label counts position within the current section", () => {
	// The five Terminal screens then one Kanban screen — so the label reads
	// `Terminal · <n> of 5` across the run, then `Kanban · 1 of 1`. The counter
	// resets per section (U+00B7 middle dot).
	const sections = [...SCREENS_SOURCE.matchAll(/section:\s*"([^"]+)"/gu)].map((match) => match[1]);
	assert.deepEqual(sections, ["Terminal", "Terminal", "Terminal", "Terminal", "Terminal", "Kanban"]);
	// Section-scoped, contiguous-run label with a middle dot; plain fallback when
	// a screen has no section.
	assert.match(STAGE_SOURCE, /\$\{section\} \\u00b7 \$\{position\} of \$\{total\}/u);
	assert.match(STAGE_SOURCE, /screens\[start - 1\]\?\.section === section/u);
	assert.match(STAGE_SOURCE, /screens\[end \+ 1\]\?\.section === section/u);
	assert.match(STAGE_SOURCE, /Screen \$\{Math\.min\(index \+ 1, screens\.length\)\} of \$\{screens\.length\}/u);
});

test("Screen navigator clamps at both ends (no wrap)", () => {
	assert.match(NAV_HOOK_SOURCE, /Math\.min\(Math\.max\(value, 0\), Math\.max\(count - 1, 0\)\)/u);
	assert.match(NAV_HOOK_SOURCE, /canPrev: index > 0/u);
	assert.match(NAV_HOOK_SOURCE, /canNext: index < count - 1/u);
});
