"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useIsMounted } from "@/components/hooks/use-is-mounted";
import { token } from "@/lib/tokens";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";
import { RightNavigationActions } from "./right-navigation-actions";
import { TOP_NAV_OVERFLOW_BREAKPOINT_PX } from "../layout-constants";

type Product = "admin" | "agents" | "home" | "jira" | "confluence" | "rovo" | "search" | "studio";

interface RightNavigationProps {
	product: Product;
	windowWidth: number;
	hideRovoAction?: boolean;
	forceShowRovoAction?: boolean;
	isChatOpen?: boolean;
	onToggleChat: () => void;
	/** When provided, renders a theme-toggle button. Omitted in the Figma cluster. */
	onToggleTheme?: () => void;
}

export function RightNavigation({
	product,
	windowWidth,
	hideRovoAction = false,
	forceShowRovoAction = false,
	isChatOpen = false,
	onToggleChat,
	onToggleTheme,
}: Readonly<RightNavigationProps>) {
	const [isOverflowOpen, setIsOverflowOpen] = useState(false);
	// Gate the responsive collapse on mount: `windowWidth` is 0 during SSR and the
	// first client paint, so `0 < BREAKPOINT` would briefly render the "…" overflow
	// before the real width arrives (a flash on desktop). Until mounted, render the
	// full inline cluster (server + first client render agree → no hydration
	// mismatch); only collapse once we have a real, genuinely-narrow measurement.
	const isMounted = useIsMounted();
	const productSuppressesRovoAction = product === "rovo" || product === "studio";
	const showRovoAction = !hideRovoAction && (!productSuppressesRovoAction || forceShowRovoAction);
	const containerStyle = {
		display: "flex",
		alignItems: "center",
		gap: token("space.050"),
		flexShrink: 0,
		justifyContent: "flex-end",
		marginLeft: "8px",
	};

	const actions = (
		<RightNavigationActions
			showRovoAction={showRovoAction}
			isChatOpen={isChatOpen}
			onToggleChat={onToggleChat}
			onToggleTheme={onToggleTheme}
		/>
	);

	// Narrow widths: collapse the entire right cluster into a single "…" popover
	// that renders the same actions in a horizontal row (matches production).
	if (isMounted && windowWidth < TOP_NAV_OVERFLOW_BREAKPOINT_PX) {
		return (
			<div style={containerStyle}>
				<Popover open={isOverflowOpen} onOpenChange={setIsOverflowOpen}>
					<PopoverTrigger
						render={
							<Button aria-label="More" size="icon" variant="outline">
								<ShowMoreHorizontalIcon label="" color={token("color.icon.subtle")} />
							</Button>
						}
					/>
					<PopoverContent
						side="bottom"
						align="end"
						sideOffset={8}
						className="flex w-auto flex-row items-center gap-1 p-1"
					>
						{actions}
					</PopoverContent>
				</Popover>
			</div>
		);
	}

	return <div style={containerStyle}>{actions}</div>;
}
