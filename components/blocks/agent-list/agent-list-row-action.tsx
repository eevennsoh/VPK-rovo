"use client";

import type { MouseEvent, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

/** One hover-revealed row control. With an icon it is icon-only. */
export type AgentListRowAction = Readonly<{
	disabled?: boolean;
	icon?: ReactNode;
	label: string;
	onClick: () => void;
}>;

export function AgentListRowActionButton({
	action,
}: Readonly<{ action: AgentListRowAction }>) {
	const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
		event.stopPropagation();
		action.onClick();
	};

	if (action.icon === undefined) {
		return (
			<Button
				disabled={action.disabled}
				onClick={handleClick}
				size="compact"
				type="button"
				variant="outline"
			>
				{action.label}
			</Button>
		);
	}

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger
					render={
						<Button
							aria-label={action.label}
							disabled={action.disabled}
							onClick={handleClick}
							size="icon-compact"
							type="button"
							variant="outline"
						/>
					}
				>
					{action.icon}
				</TooltipTrigger>
				<TooltipContent>{action.label}</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}
