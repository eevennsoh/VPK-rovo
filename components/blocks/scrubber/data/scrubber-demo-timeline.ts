/**
 * Demo rail — one sprint week of the `PAY` Payments SDK v2 migration.
 *
 * Monday 17 August through Friday 21 August 2026, the same week the Pulse
 * fixture narrates, so the two surfaces read as one product rather than two
 * unrelated samples. Seven majors, each a decision the week actually turned on;
 * two or three minors under each, one per section of that outcome's detail.
 *
 * Headings are terse because the sliding pill is narrow and shows one line:
 * "Wallet cut", not "The wallet UI was cut on a latency cost". Labels are the
 * spoken name and therefore carry the date stamp the heading omits — a screen
 * reader user sweeping the rail hears when, not just what.
 *
 * Every date and time string is pre-formatted here on purpose. Formatting at
 * render time drifts between server and client and produces a hydration
 * mismatch on a control whose whole job is to be swept immediately.
 *
 * Nothing is muted: the muted treatment encodes "filtered out", and a demo with
 * no filter control that ships dimmed marks reads as a rendering bug. A
 * consumer that owns a filter sets `muted` on the groups it hides.
 */

import {
	buildScrubberEntries,
	type ScrubberEntry,
	type ScrubberGroup,
} from "@/components/blocks/scrubber/lib/scrubber-entries";

export const SCRUBBER_DEMO_GROUPS: readonly ScrubberGroup[] = [
	{
		id: "pay-scope",
		heading: "Scope agreed",
		label: "Scope agreed, Mon 17 Aug, 08:12",
		children: [
			{ id: "pay-scope-artifacts", heading: "Artifacts", label: "Scope agreed — artifacts" },
			{ id: "pay-scope-input", heading: "Needs input", label: "Scope agreed — needs input" },
			{ id: "pay-scope-actions", heading: "Next best actions", label: "Scope agreed — next best actions" },
		],
	},
	{
		id: "pay-spike",
		heading: "Spike lands",
		label: "Spike lands, Mon 17 Aug, 17:55",
		children: [
			{ id: "pay-spike-artifacts", heading: "Artifacts", label: "Spike lands — artifacts" },
			{ id: "pay-spike-input", heading: "Needs input", label: "Spike lands — needs input" },
		],
	},
	{
		id: "pay-sandbox",
		heading: "Sandbox bounce",
		label: "Sandbox bounce, Tue 18 Aug, 11:05",
		children: [
			{ id: "pay-sandbox-artifacts", heading: "Artifacts", label: "Sandbox bounce — artifacts" },
			{ id: "pay-sandbox-input", heading: "Needs input", label: "Sandbox bounce — needs input" },
			{ id: "pay-sandbox-actions", heading: "Next best actions", label: "Sandbox bounce — next best actions" },
		],
	},
	{
		id: "pay-night-shift",
		heading: "Night shift",
		label: "Night shift, Wed 19 Aug, 02:30",
		children: [
			{ id: "pay-night-shift-artifacts", heading: "Artifacts", label: "Night shift — artifacts" },
			{ id: "pay-night-shift-input", heading: "Needs input", label: "Night shift — needs input" },
			{ id: "pay-night-shift-actions", heading: "Next best actions", label: "Night shift — next best actions" },
		],
	},
	{
		id: "pay-wallet-cut",
		heading: "Wallet cut",
		label: "Wallet cut, Wed 19 Aug, 15:20",
		children: [
			{ id: "pay-wallet-cut-artifacts", heading: "Artifacts", label: "Wallet cut — artifacts" },
			{ id: "pay-wallet-cut-input", heading: "Needs input", label: "Wallet cut — needs input" },
		],
	},
	{
		id: "pay-rollback",
		heading: "Rollback proven",
		label: "Rollback proven, Thu 20 Aug, 09:45",
		children: [
			{ id: "pay-rollback-artifacts", heading: "Artifacts", label: "Rollback proven — artifacts" },
			{ id: "pay-rollback-actions", heading: "Next best actions", label: "Rollback proven — next best actions" },
		],
	},
	{
		id: "pay-adapter-deleted",
		heading: "Adapter deleted",
		label: "Adapter deleted, Fri 21 Aug, 17:30",
		children: [
			{ id: "pay-adapter-deleted-artifacts", heading: "Artifacts", label: "Adapter deleted — artifacts" },
			{ id: "pay-adapter-deleted-input", heading: "Needs input", label: "Adapter deleted — needs input" },
			{ id: "pay-adapter-deleted-actions", heading: "Next best actions", label: "Adapter deleted — next best actions" },
		],
	},
];

/**
 * The flat rail the demo renders.
 *
 * Built once at module scope rather than in the component: the offsets depend
 * only on the group shape, so recomputing them per render would hand the rail a
 * new array identity on every pointer pixel, and every hook that takes `entries`
 * as a dependency would see a fresh input each time. The marks themselves stay
 * cheap for a different reason — the swell is driven by motion values rather
 * than React state, so a sweep does not re-render them at all.
 */
export const SCRUBBER_DEMO_ENTRIES: readonly ScrubberEntry[] = buildScrubberEntries(SCRUBBER_DEMO_GROUPS);
