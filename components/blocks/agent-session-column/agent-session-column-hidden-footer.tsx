"use client";

import ChevronRightIcon from "@atlaskit/icon/core/chevron-right";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

/**
 * Sticky-by-flex sibling under the session list: Work hidden N, with a trailing
 * chevron that opens the hidden-work view. Lives outside the scrollport so it
 * cannot be clipped by overflow.
 */
export function AgentSessionColumnHiddenFooter({
	hiddenCount,
	onOpen,
}: Readonly<{
	hiddenCount: number;
	onOpen: () => void;
}>) {
	const sessionWord = hiddenCount === 1 ? "session" : "sessions";

	return (
		<Button
			aria-label={`Show ${hiddenCount} hidden ${sessionWord}`}
			className="w-full shrink-0 justify-between text-xs font-medium"
			onClick={onOpen}
			size="compact"
			type="button"
			variant="ghost"
		>
			Work hidden {hiddenCount}
			<Icon
				className="text-icon-subtle"
				data-icon="inline-end"
				render={<ChevronRightIcon label="" />}
			/>
		</Button>
	);
}
