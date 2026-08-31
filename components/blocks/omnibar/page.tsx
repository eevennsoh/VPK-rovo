"use client";

import { Omnibar } from "@/components/blocks/omnibar/components/omnibar";
import type { OmnibarState } from "@/components/blocks/omnibar/hooks/use-omnibar-state";

export { Omnibar, type OmnibarProps } from "@/components/blocks/omnibar/components/omnibar";

/**
 * Demo host for the Omnibar.
 *
 * The bar defaults to `positioning="container"`, so this page supplies the `relative`
 * ancestor and a bounded height that stands in for a real prototype screen.
 */
export default function OmnibarPage({
	defaultState,
}: Readonly<{ defaultState?: OmnibarState }>): React.ReactElement {
	return (
		<div className="relative h-[720px] w-full overflow-hidden rounded-lg bg-surface-sunken">
			<div className="flex h-full w-full items-center justify-center px-6">
				<p className="max-w-md text-center text-sm text-text-subtlest">
					Hover the pill to expand it. Click into the bar to keep it open while you type,
					then use the panel button to dock the conversation on the right.
				</p>
			</div>
			<Omnibar defaultState={defaultState} />
		</div>
	);
}
