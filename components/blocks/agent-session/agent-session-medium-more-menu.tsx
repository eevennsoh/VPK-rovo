"use client";

import { useState } from "react";

import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

function stopSessionDrag(event: { stopPropagation: () => void }) {
	event.stopPropagation();
}

export function AgentSessionMediumMoreMenu({
	label,
	onCreateWorkItem,
	onSubtasks,
}: Readonly<{
	label: string;
	onCreateWorkItem?: () => void;
	onSubtasks?: () => void;
}>) {
	const [open, setOpen] = useState(false);
	const hasSubtasks = onSubtasks !== undefined;
	const hasCreateWorkItem = onCreateWorkItem !== undefined;

	if (!hasSubtasks && !hasCreateWorkItem) {
		return null;
	}

	return (
		<DropdownMenu onOpenChange={setOpen} open={open}>
			<span
				className={cn(
					"flex h-6 w-0 shrink-0 overflow-hidden transition-[width] duration-fast ease-out-practical motion-reduce:transition-none",
					"group-hover/session-card:w-6 group-has-[:focus-visible]/session-card:w-6",
					open ? "w-6" : null,
				)}
			>
				<DropdownMenuTrigger
					render={(
						<Button
							aria-label={`More actions for ${label} session`}
							className={cn(
								"pointer-events-none opacity-0 transition-opacity duration-fast ease-out-practical motion-reduce:transition-none",
								"group-hover/session-card:pointer-events-auto group-hover/session-card:opacity-100",
								"group-has-[:focus-visible]/session-card:pointer-events-auto group-has-[:focus-visible]/session-card:opacity-100",
								open ? "pointer-events-auto opacity-100" : null,
							)}
							data-popup-open={open || undefined}
							onPointerDown={stopSessionDrag}
							size="icon-compact"
							type="button"
							variant="ghost"
						/>
					)}
				>
					<Icon render={<ShowMoreHorizontalIcon label="" size="small" color="currentColor" />} />
				</DropdownMenuTrigger>
			</span>
			<DropdownMenuContent align="end" className="min-w-0 w-max">
				<DropdownMenuItem disabled={!hasSubtasks} onSelect={() => onSubtasks?.()}>
					Add as a subtask
				</DropdownMenuItem>
				<DropdownMenuItem disabled={!hasCreateWorkItem} onSelect={() => onCreateWorkItem?.()}>
					Create new
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
