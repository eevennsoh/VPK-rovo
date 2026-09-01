"use client";

import { ScrubberComposer } from "@/components/blocks/scrubber/components/scrubber-composer";
import type { ScrubberComposerMode } from "@/components/blocks/scrubber/hooks/use-scrubber-composer";

export {
	ScrubberComposer,
	type ScrubberComposerProps,
} from "@/components/blocks/scrubber/components/scrubber-composer";
export { ScrubberRail, type ScrubberRailProps } from "@/components/blocks/scrubber/components/scrubber-rail";

/**
 * Demo host for the Scrubber.
 *
 * The composer is a floating surface, so this page supplies the two things a real
 * screen would: a sunken backdrop it can float above, and a bounded column so the
 * rail's twenty-five marks sit at a believable density rather than stretched
 * across a full-width viewport.
 */
export default function ScrubberPage({
	defaultMode,
}: Readonly<{ defaultMode?: ScrubberComposerMode }>): React.ReactElement {
	return (
		<div className="flex w-full justify-center rounded-lg bg-surface-sunken px-6 py-10">
			<div className="flex w-full max-w-[720px] flex-col gap-4">
				<p className="text-sm text-text-subtlest">
					Press <span className="text-text-subtle">Timeline</span> to swap the editor for the notch rail, then sweep it —
					marks swell around the pointer and the pill names where you are. Closing the rail brings your draft back.
				</p>
				<ScrubberComposer defaultMode={defaultMode} onSubmit={() => undefined} />
			</div>
		</div>
	);
}
