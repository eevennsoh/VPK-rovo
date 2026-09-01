"use client";

import { Omnibar } from "@/components/blocks/omnibar/components/omnibar";
import type { OmnibarState } from "@/components/blocks/omnibar/hooks/use-omnibar-state";
import { SCRUBBER_DEMO_ENTRIES } from "@/components/blocks/scrubber/data/scrubber-demo-timeline";

export { Omnibar, type OmnibarProps } from "@/components/blocks/omnibar/components/omnibar";

/**
 * Demo host for the Omnibar.
 *
 * The bar defaults to `positioning="container"`, so this page supplies the `relative`
 * ancestor and a bounded height that stands in for a real prototype screen.
 *
 * `timeline` is opt-in on the block, so the page opts in: without it there is no
 * Timeline context pill to show. The demo rail is the same one-sprint-week fixture the
 * standalone Scrubber block ships, so the two read as one product.
 */
export default function OmnibarPage({
	defaultState,
	timeline = "none",
}: Readonly<{
	defaultState?: OmnibarState;
	/** `none` hides the toggle entirely; the two axes pick the rail's geometry. */
	timeline?: "none" | "x" | "y";
}>): React.ReactElement {
	const copy = timeline === "none"
		? "Hover the pill to expand it. Click into the bar to keep it open while you type, then use the panel button to dock the conversation on the right."
		: "Hover the pill to expand it, then press Timeline. The rail sweeps under the pointer — marks swell around it and the pill names where you are. Your draft comes back when you leave.";

	return (
		<div className="relative h-[720px] w-full overflow-hidden rounded-lg bg-surface-sunken">
			<div className="flex h-full w-full items-center justify-center px-6">
				<p className="max-w-md text-center text-sm text-text-subtlest">{copy}</p>
			</div>
			<Omnibar
				defaultState={defaultState}
				defaultTimelineOpen={timeline !== "none"}
				// Without a consumer the send control is disabled by contract, which makes the
				// catalog preview look broken rather than opinionated. The Scrubber demo host
				// takes the same no-op for the same reason.
				onSubmit={() => undefined}
				timelineAxis={timeline === "none" ? undefined : timeline}
				timelineEntries={timeline === "none" ? undefined : SCRUBBER_DEMO_ENTRIES}
			/>
		</div>
	);
}
