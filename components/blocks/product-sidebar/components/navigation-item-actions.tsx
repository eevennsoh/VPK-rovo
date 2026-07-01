"use client";

import { token } from "@/lib/tokens";
import { Button } from "@/components/ui/button";
import AddIcon from "@atlaskit/icon/core/add";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";

interface NavigationItemActionsProps {
	label: string;
}

export function NavigationItemActions({ label }: Readonly<NavigationItemActionsProps>) {
	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				gap: token("space.050"),
				marginRight: token("space.025"),
			}}
		>
			<Button
				aria-label={`Add to ${label}`}
				size="icon"
				type="button"
				variant="ghost"
				onClick={(event) => {
					event.stopPropagation();
				}}
			>
				<AddIcon label="" size="small" />
			</Button>
			<Button
				aria-label={`More actions for ${label}`}
				size="icon"
				type="button"
				variant="ghost"
				onClick={(event) => {
					event.stopPropagation();
				}}
			>
				<ShowMoreHorizontalIcon label="" size="small" />
			</Button>
		</div>
	);
}
