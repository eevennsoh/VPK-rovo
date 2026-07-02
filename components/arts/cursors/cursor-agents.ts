/**
 * Companion-cursor palette, in swatch order: blue, orange, purple, lime.
 *
 * The hex + label values mirror `ROVO_COLOR_SWATCHES` from `@/lib/rovo-colors`
 * one-to-one; they are inlined here (rather than imported) so this module stays
 * runnable directly under `node --test` type-stripping, which cannot resolve the
 * `@/` alias. Keep these in sync with `ROVO_COLOR_SWATCHES` if the palette moves.
 */
const AGENT_SWATCHES = [
	{ label: "blue-600", hex: "#1868DB" },
	{ label: "orange-300", hex: "#FCA700" },
	{ label: "purple-500", hex: "#AF59E1" },
	{ label: "lime-400", hex: "#6A9A23" },
] as const;

/**
 * A single companion cursor "agent" that fans out from the pointer: its solid
 * paint color, a short send-off word, and a few made-up thinking traces the
 * working-team tooltip cycles through.
 */
export interface CursorAgent {
	/** Short agent codename shown alongside the cursor. */
	name: string;
	/** Solid arrow fill hex, sourced from ROVO_COLOR_SWATCHES. */
	color: string;
	/** Human-readable swatch label (e.g. "blue-600"). */
	colorLabel: string;
	/** Concise send-off word displayed as the cursor launches. */
	launchWord: string;
	/** Short agenty thinking traces the tooltip cycles through. */
	traces: string[];
}

/**
 * The companion cursors, in swatch order: blue, orange, purple, lime. Hex and
 * label are always read from AGENT_SWATCHES (a local mirror of
 * ROVO_COLOR_SWATCHES) so the palette stays in sync.
 */
export const CURSOR_AGENTS: readonly CursorAgent[] = [
	{
		name: "Scout",
		color: AGENT_SWATCHES[0].hex,
		colorLabel: AGENT_SWATCHES[0].label,
		launchWord: "On it.",
		traces: [
			"Tracing the auth flow",
			"Mapping the routes",
			"Reading the entry point",
		],
	},
	{
		name: "Forge",
		color: AGENT_SWATCHES[1].hex,
		colorLabel: AGENT_SWATCHES[1].label,
		launchWord: "Building.",
		traces: [
			"Wiring the components",
			"Scaffolding the module",
			"Stitching the props",
		],
	},
	{
		name: "Sage",
		color: AGENT_SWATCHES[2].hex,
		colorLabel: AGENT_SWATCHES[2].label,
		launchWord: "Thinking.",
		traces: [
			"Weighing the trade-offs",
			"Checking the edge cases",
			"Naming things carefully",
		],
	},
	{
		name: "Sweep",
		color: AGENT_SWATCHES[3].hex,
		colorLabel: AGENT_SWATCHES[3].label,
		launchWord: "Tidying.",
		traces: [
			"Pruning the dead code",
			"Folding in the tests",
			"Polishing the diff",
		],
	},
] as const;

/** Number of companion cursors that fan out from the pointer. */
export const CURSOR_AGENT_COUNT = CURSOR_AGENTS.length;
