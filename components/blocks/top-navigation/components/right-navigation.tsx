"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { token } from "@/lib/tokens";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";
import { RightNavigationActions } from "./right-navigation-actions";
import { TOP_NAV_OVERFLOW_BREAKPOINT_PX } from "../layout-constants";

type Product = "admin" | "agents" | "home" | "jira" | "confluence" | "rovo" | "search" | "studio";

interface RightNavigationProps {
	product: Product;
	availableWidth: number;
	hideRovoAction?: boolean;
	forceShowRovoAction?: boolean;
	isChatOpen?: boolean;
	onToggleChat: () => void;
	onToggleTheme: () => void;
}

export function RightNavigation({
	product,
	availableWidth,
	hideRovoAction = false,
	forceShowRovoAction = false,
	isChatOpen = false,
	onToggleChat,
	onToggleTheme,
}: Readonly<RightNavigationProps>) {
	const [isOverflowOpen, setIsOverflowOpen] = useState(false);
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
	if (availableWidth < TOP_NAV_OVERFLOW_BREAKPOINT_PX) {
		return (
			<div style={containerStyle}>
				<Popover open={isOverflowOpen} onOpenChange={setIsOverflowOpen}>
					<PopoverTrigger
						render={
							<Button aria-label="More" size="icon" variant="outline">
								<ShowMoreHorizontalIcon
									label=""
									color={isOverflowOpen ? token("color.icon.selected") : token("color.icon.subtle")}
								/>
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
