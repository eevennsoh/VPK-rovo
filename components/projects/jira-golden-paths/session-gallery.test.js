const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const read = (rel) => readFileSync(join(__dirname, rel), "utf8");
const PAGE_SOURCE = read("page.tsx");
const GALLERY_ITEMS_SOURCE = read("data/gallery-items.ts");
const SCREENS_SOURCE = read("data/session-screens.ts");
const STAGE_SOURCE = read("components/session-stage.tsx");
const FOR_YOU_STAGE_SOURCE = read("components/for-you-stage.tsx");
const SHARED_FOR_YOU_STAGE_SOURCE = read("../shared/components/for-you-stage-layout.tsx");
const ASX_PAGE_SOURCE = read("../asx/page.tsx");
const TERMINAL_BEAT_SCREEN_SOURCE = read("components/terminal-beat-screen.tsx");
const TERMINAL_LIVE_SCREEN_SOURCE = read("components/terminal-live-screen.tsx");
const TERMINAL_STAGE_SOURCE = read("components/terminal-stage.tsx");
const TERMINAL_CHROME_SOURCE = read("components/terminal-stage-chrome.tsx");
const TERMINAL_CLAUDE_PANE_SOURCE = read("components/terminal-stage-claude-pane.tsx");
const TERMINAL_JIRA_PANE_SOURCE = read("components/terminal-stage-jira-pane.tsx");
const TERMINAL_HOOK_SOURCE = read("hooks/use-terminal-demo.ts");
const NAV_HOOK_SOURCE = read("hooks/use-screen-navigator.ts");

test("Gallery exposes exactly Carl's local and Sarah's global session cards", () => {
	const ids = [...GALLERY_ITEMS_SOURCE.matchAll(/id:\s*"([^"]+)"/gu)].map((match) => match[1]);
	assert.deepEqual(ids, ["local-session", "global-session"]);
	assert.match(GALLERY_ITEMS_SOURCE, /title:\s*"Carl's local session"/u);
	assert.match(GALLERY_ITEMS_SOURCE, /title:\s*"Sarah's global session"/u);
	assert.match(GALLERY_ITEMS_SOURCE, /titleLines:\s*\["Carl's", "local session"\]/u);
	assert.match(GALLERY_ITEMS_SOURCE, /titleLines:\s*\["Sarah's", "global session"\]/u);
});

test("Each card defines its own ordered set of screens to navigate", () => {
	assert.match(SCREENS_SOURCE, /export const LOCAL_SESSION_SCREENS: readonly SessionScreen\[\]/u);
	assert.match(SCREENS_SOURCE, /export const GLOBAL_SESSION_SCREENS: readonly SessionScreen\[\]/u);
	for (const [id, design, scenario] of [
		["global-1", "kanban", "global-assignment"],
		["global-2", "rovo", "blocked-question"],
		["global-3", "for-you", "human-review"],
	]) {
		assert.match(
			SCREENS_SOURCE,
			new RegExp(`id: "${id}"[\\s\\S]*?design: "${design}"[\\s\\S]*?scenario: "${scenario}"`, "u"),
		);
	}
	assert.match(SCREENS_SOURCE, /export type SessionScreenDesign = "for-you" \| "kanban" \| "rovo";/u);
	assert.match(STAGE_SOURCE, /screen\?\.design === "rovo"/u);
	assert.match(STAGE_SOURCE, /<RovoStage key=\{screen\.id\} \/>/u);
	assert.doesNotMatch(SCREENS_SOURCE, /scenario: "pr-review"/u);
	assert.doesNotMatch(STAGE_SOURCE, /QueueStage|design === "queue"/u);
	assert.match(STAGE_SOURCE, /screen\?\.design === "for-you"/u);
	assert.match(
		STAGE_SOURCE,
		/<ForYouStage key=\{screen\.id\} \/>/u,
	);
	assert.doesNotMatch(SCREENS_SOURCE, /global-4|design: "work-item"|completed-timeline/u);
	assert.doesNotMatch(STAGE_SOURCE, /WorkItemStage|workItemController|design === "work-item"/u);
});

test("Local session drives the TwG setup live and resumes review beats after Kanban", () => {
	// Screens 0–6 share the live presenter: initial terminal, split, command,
	// backlog, issue inspection, work-context handoff, and line-by-line delivery.
	// Post-review work uses frozen snapshots.
	const liveBeats = [...SCREENS_SOURCE.matchAll(/liveBeat:\s*(\d+)/gu)].map((match) => Number(match[1]));
	assert.deepEqual(liveBeats, [0, 1, 2, 3, 4, 5, 6]);
	const frozenBeats = [...SCREENS_SOURCE.matchAll(/terminalBeat:\s*(\d+)/gu)].map((match) => Number(match[1]));
	assert.deepEqual(frozenBeats, [7, 8, 9, 10]);
	assert.match(
		SCREENS_SOURCE,
		/id: "local-7"[\s\S]*?scenario: "local-review"[\s\S]*?id: "local-8"[^\n]+terminalBeat: 7/u,
	);
	assert.match(
		SCREENS_SOURCE,
		/local-11[^\n]+terminalBeat: 10[\s\S]*?id: "local-12"[\s\S]*?scenario: "local-completed"/u,
	);

	// The stage routes live screens to the shared presenter and frozen screens to
	// the static snapshot.
	assert.match(STAGE_SOURCE, /screen\?\.liveBeat != null/u);
	assert.match(STAGE_SOURCE, /<TerminalLiveScreen targetBeat=\{screen\.liveBeat\} \/>/u);
	assert.match(STAGE_SOURCE, /screen\?\.terminalBeat != null/u);
	assert.match(STAGE_SOURCE, /<TerminalBeatScreen key=\{screen\.id\} beat=\{screen\.terminalBeat\} \/>/u);

	// The first post-review screen is stable; later screens start from the
	// preceding settled beat and animate only their destination beat.
	assert.match(
		TERMINAL_BEAT_SCREEN_SOURCE,
		/const initialSettledBeat = shouldReduceMotion \|\| beat === FIRST_POST_REVIEW_BEAT \? beat : beat - 1;/u,
	);
	assert.match(TERMINAL_BEAT_SCREEN_SOURCE, /useTerminalDemo\(true, \{ initialSettledBeat, keyboard: false \}\)/u);
	assert.match(TERMINAL_BEAT_SCREEN_SOURCE, /if \(state\.settled && settledBeat < beat\) advance\(\);/u);
	assert.match(TERMINAL_BEAT_SCREEN_SOURCE, /<TerminalStage controller=\{controller\} \/>/u);

	// The live run reuses the real presenter animation, with the card owning the
	// arrow keys (keyboard off) and driving advance/stepBack to the target beat.
	assert.match(TERMINAL_LIVE_SCREEN_SOURCE, /useTerminalDemo\(true, \{ keyboard: false \}\)/u);
	assert.match(TERMINAL_LIVE_SCREEN_SOURCE, /<TerminalStage controller=\{controller\} \/>/u);
	assert.match(
		TERMINAL_CLAUDE_PANE_SOURCE,
		/<StateGlyph status="working" className="shrink-0 text-\[#D97757\]" \/>/u,
	);
	assert.match(TERMINAL_CLAUDE_PANE_SOURCE, /<span>Working…<\/span>/u);
});

test("Post-review terminal screens share the line-by-line output reveal timing", () => {
	assert.match(TERMINAL_HOOK_SOURCE, /const OUTPUT_MS_PER_LINE = 250; \/\/ duration-slow/u);
	assert.match(TERMINAL_HOOK_SOURCE, /initialSettledBeat\?: number;/u);
	assert.match(TERMINAL_HOOK_SOURCE, /shouldReduceMotion[\s\S]*dispatch\(\{ type: "finish-beat" \}\);/u);
});

test("Active terminal output reuses the reduced-motion-safe ASCII working glyph", () => {
	assert.match(TERMINAL_CHROME_SOURCE, /active && span\.text === "⏺ "/u);
	assert.match(TERMINAL_CHROME_SOURCE, /<StateGlyph status="working" \/>/u);
	assert.match(TERMINAL_CLAUDE_PANE_SOURCE, /const activeLine = pane\.working \? currentLine : undefined;/u);
	assert.match(TERMINAL_CLAUDE_PANE_SOURCE, /active=\{line === activeLine\}/u);
});

test("Page wires the session stage + top-bar screen navigator per card", () => {
	assert.match(PAGE_SOURCE, /title="Jira Golden Paths"/u);
	assert.match(PAGE_SOURCE, /<SessionScreenControls\s+screens=\{activeCard\.screens\}\s+controller=\{activeCard\.controller\}\s+\/>/u);
	assert.match(
		PAGE_SOURCE,
		/<SessionStage[\s\S]*controller=\{card\.controller\}[\s\S]*screens=\{card\.screens\}[\s\S]*\/>/u,
	);
	assert.doesNotMatch(PAGE_SOURCE, /WorkItemControls|workItemController|useWorkItemStageController/u);
	assert.match(PAGE_SOURCE, /open=\{dockOpen\}/u);
	assert.match(PAGE_SOURCE, /onOpenChange=\{setDockOpen\}/u);
	assert.doesNotMatch(PAGE_SOURCE, /onReset=\{handleReset\}|controller\.reset\(\)/u);
});

test("Entering the Global Rovo screen restores the default agent and greeting", () => {
	assert.match(PAGE_SOURCE, /const \{ resetAgentToRovo, resetChat \} = useRovoChat\(\);/u);
	assert.match(
		PAGE_SOURCE,
		/if \(screen\?\.design !== "rovo"\) return;\s*resetAgentToRovo\(\);\s*resetChat\(\);/u,
	);
	assert.match(PAGE_SOURCE, /<ResetRovoChatOnEntry screen=\{activeScreen\} \/>/u);
});

test("Global For you fills the stage with the complete Jira shell", () => {
	assert.match(
		FOR_YOU_STAGE_SOURCE,
		/<JiraForYouShell shellHeight="parent" \/>/u,
	);
	assert.match(FOR_YOU_STAGE_SOURCE, /h-full min-h-0 w-screen/u);
	assert.doesNotMatch(FOR_YOU_STAGE_SOURCE, /dockOpen|pb-56|pb-8/u);
	assert.doesNotMatch(FOR_YOU_STAGE_SOURCE, /JiraForYouWorkspace|JGP_FOR_YOU_SECTIONS|JgpRovoOverlay|JiraForYouPage/u);
	assert.match(ASX_PAGE_SOURCE, /<ForYouStageLayout dockOpen=\{dockOpen\} onItemClick=\{handleItemClick\} \/>/u);
	assert.doesNotMatch(ASX_PAGE_SOURCE, /<JiraForYouPage/u);
	assert.match(
		SHARED_FOR_YOU_STAGE_SOURCE,
		/<JiraForYouPage onItemClick=\{onItemClick\} onView=\{onView\} sections=\{sections\} tabs=\{tabs\} \/>/u,
	);
});

test("Page gives Jira Golden Paths a shaded Rovo-purple gallery palette", () => {
	assert.match(PAGE_SOURCE, /const ROVO_PURPLE_PALETTE(?:: GalleryPalette)? = \["#5E2C9D", "#7A3BB3", "#9850CC", "#AF59E1"\];/u);
	assert.match(PAGE_SOURCE, /palette=\{ROVO_PURPLE_PALETTE\}/u);
});

test("Page defaults Terminal to a locally controllable dark subtree theme", () => {
	assert.match(PAGE_SOURCE, /activeScreen\?\.section === "Terminal"/u);
	assert.match(PAGE_SOURCE, /useState<"dark" \| "light">\("dark"\)/u);
	assert.match(PAGE_SOURCE, /"data-subtree-theme": ""/u);
	assert.match(PAGE_SOURCE, /"data-color-mode": terminalTheme/u);
	assert.match(
		PAGE_SOURCE,
		/"data-theme": `\$\{terminalTheme\}:\$\{terminalTheme\} spacing:spacing typography:typography shape:shape`/u,
	);
	assert.match(PAGE_SOURCE, /bg-surface" \{\.\.\.subtreeThemeProps\}/u);
	assert.match(PAGE_SOURCE, /theme=\{isTerminalSection \? terminalTheme : undefined\}/u);
	assert.match(
		PAGE_SOURCE,
		/onThemeCycle=\{isTerminalSection \? handleTerminalThemeCycle : undefined\}/u,
	);
	assert.match(PAGE_SOURCE, /current === "dark" \? "light" : "dark"/u);
});

test("Terminal frame and panes follow the route-owned light or dark theme", () => {
	assert.match(TERMINAL_STAGE_SOURCE, /border-border bg-surface-raised[^"]*text-text/u);
	assert.match(
		TERMINAL_STAGE_SOURCE,
		/className=\{cn\("w-px", state\.split \? "bg-border" : "bg-transparent"\)\}/u,
	);
	assert.doesNotMatch(TERMINAL_STAGE_SOURCE, /TERMINAL_FRAME_ZINC_VARS|--ds-/u);

	for (const source of [
		TERMINAL_STAGE_SOURCE,
		TERMINAL_CHROME_SOURCE,
		TERMINAL_CLAUDE_PANE_SOURCE,
		TERMINAL_JIRA_PANE_SOURCE,
	]) {
		assert.doesNotMatch(source, /(?:bg|border|text)-zinc-/u);
	}
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

test("Section dropdown inherits the active gallery subtree theme", () => {
	// The Terminal section themes the gallery subtree dark. Keep this popup's
	// portal within that subtree instead of mounting it under the light body.
	assert.match(STAGE_SOURCE, /<DropdownMenuContent align="center" portalled=\{false\}>/u);
});

test("Section dropdown opening does not add another flex gap to the centered controls", () => {
	assert.match(STAGE_SOURCE, /<div className="flex items-center text-sm text-text">/u);
	assert.match(STAGE_SOURCE, /size="icon-compact"\s+className="mr-2"\s+aria-label="Previous screen"/u);
	assert.match(
		STAGE_SOURCE,
		/className="mr-2 flex items-center gap-1 rounded-sm px-1 py-0\.5 tabular-nums/u,
	);
});

test("Local session opens the Kanban section with the real board design", () => {
	// The sixth screen is the "Kanban" section rendering the Kanban board design.
	assert.match(SCREENS_SOURCE, /design:\s*"kanban"/u);
	assert.match(SCREENS_SOURCE, /export type SessionScreenDesign = "for-you" \| "kanban" \| "rovo";/u);
	// The stage routes a `design: "kanban"` screen to the real KanbanStage,
	// keyed by screen id so it mounts fresh when navigated to.
	assert.match(STAGE_SOURCE, /screen\?\.design === "kanban"/u);
	assert.match(STAGE_SOURCE, /<KanbanStage key=\{screen\.id\} scenario=\{scenario\} \/>/u);
	assert.match(
		STAGE_SOURCE,
		/screen\.scenario === "local-completed" \|\| screen\.scenario === "global-assignment"/u,
	);

	// The Kanban/Rovo design stages call `useRovoChat`, so the JGP tree must be
	// wrapped in a RovoChatProvider (not reliant on an ancestor route).
	assert.match(PAGE_SOURCE, /import \{ RovoChatProvider \} from "@\/app\/contexts\/context-rovo-chat";/u);
	// The provider receives the JGP agent profiles so local personas (rfp-drafter,
	// service-impact-agent, …) resolve instead of falling back to default Rovo.
	assert.match(PAGE_SOURCE, /<RovoChatProvider agentProfiles=\{JGP_CHAT_AGENT_PROFILES\}>/u);
	assert.match(PAGE_SOURCE, /import \{ JGP_CHAT_AGENT_PROFILES \} from "\.\/data\/agent-chat-data";/u);
});

test("Top-bar label counts position within the current section", () => {
	// Local has seven opening Terminal screens, one Kanban screen, four resumed
	// Terminal screens, then Kanban again. Global adds Kanban, one Rovo screen,
	// and For you.
	// The counter resets per run (U+00B7 middle dot), even when a section name is reused later.
	const sections = [...SCREENS_SOURCE.matchAll(/section:\s*"([^"]+)"/gu)].map((match) => match[1]);
	assert.deepEqual(sections, [
		"Terminal",
		"Terminal",
		"Terminal",
		"Terminal",
		"Terminal",
		"Terminal",
		"Terminal",
		"Kanban",
		"Terminal",
		"Terminal",
		"Terminal",
		"Terminal",
		"Kanban",
		"Kanban",
		"Rovo",
		"For you",
	]);
	// Section-scoped, contiguous-run label with a middle dot; plain fallback when
	// a screen has no section.
	assert.match(STAGE_SOURCE, /if \(total === 1\) return section;/u);
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
