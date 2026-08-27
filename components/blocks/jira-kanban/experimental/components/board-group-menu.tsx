"use client";

// oxlint-disable react-doctor/jsx-no-jsx-as-prop -- DropdownMenuTrigger uses a render-node so the Group button owns the visual state.
import GroupIcon from "@atlaskit/icon-lab/core/group";

import { BOARD_GROUP_OPTIONS } from "../data/board-group-options";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";

interface BoardGroupMenuProps {
	compact?: boolean;
	surfaceLabel?: string;
}

/**
 * Production Group picker chrome. Rows close the menu; they do not regroup
 * the board.
 */
export function BoardGroupMenu({
	compact = false,
	surfaceLabel = "board",
}: Readonly<BoardGroupMenuProps>) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button
						aria-label={`Group ${surfaceLabel}`}
						size={compact ? "icon" : undefined}
						variant="outline"
					/>
				}
			>
				<Icon render={<GroupIcon label="" />} />
				{compact ? null : "Group"}
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="min-w-0 w-max">
				{BOARD_GROUP_OPTIONS.map((option) => (
					<DropdownMenuItem key={option.id} onSelect={() => undefined}>
						{option.label}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
