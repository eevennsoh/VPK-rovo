"use client";

import { useState } from "react";

import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";

import type { AgentSessionItem } from "@/components/blocks/agent-session";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { Switch } from "@/components/ui/switch";

import { collectLinkableAgentSessions, linkAllAgentSessions } from "./agent-session-column-overflow";

function suppressMenuDismissal(event: { preventDefault: () => void }) {
	event.preventDefault();
}

export interface AgentSessionColumnOverflowMenuProps {
	capturedItemIds?: ReadonlySet<string>;
	getSuggestedWorkItemKey?: (item: AgentSessionItem) => string | undefined;
	getSuggestedWorkItemKeys?: (item: AgentSessionItem) => readonly string[] | undefined;
	items: readonly AgentSessionItem[];
	onLinkWorkItem?: (item: AgentSessionItem, workItemKey?: string) => void;
	title: string;
}

function OverflowToggleRow({
	checked,
	label,
	onCheckedChange,
}: Readonly<{
	checked: boolean;
	label: string;
	onCheckedChange: (enabled: boolean) => void;
}>) {
	return (
		<DropdownMenuItem
			closeOnClick={false}
			className="text-text [&>span:last-child]:h-auto [&_[data-slot=switch]]:pointer-events-auto [&_[data-slot=switch]_svg]:size-full"
			elemAfter={(
				<Switch
					aria-label={`${checked ? "Disable" : "Enable"} ${label}`}
					checked={checked}
					onCheckedChange={onCheckedChange}
					onMouseDown={suppressMenuDismissal}
					onPointerDown={suppressMenuDismissal}
					size="sm"
				/>
			)}
			onSelect={() => {
				onCheckedChange(!checked);
			}}
		>
			{label}
		</DropdownMenuItem>
	);
}

/**
 * Header overflow for the untracked-work column: Link all suggestions,
 * then the Auto sync / Suggest link preferences.
 */
export function AgentSessionColumnOverflowMenu({
	capturedItemIds,
	getSuggestedWorkItemKey,
	getSuggestedWorkItemKeys,
	items,
	onLinkWorkItem,
	title,
}: Readonly<AgentSessionColumnOverflowMenuProps>) {
	const [autoSync, setAutoSync] = useState(true);
	const [autoLink, setAutoLink] = useState(true);
	const canLinkAll = onLinkWorkItem !== undefined
		&& collectLinkableAgentSessions(items, capturedItemIds).length > 0;

	const handleLinkAll = () => {
		if (onLinkWorkItem === undefined) {
			return;
		}

		linkAllAgentSessions(items, {
			capturedItemIds,
			getSuggestedWorkItemKey,
			getSuggestedWorkItemKeys,
			onLinkWorkItem,
		});
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button
						aria-label={`${title} column actions`}
						data-agent-session-column-overflow=""
						size="icon-compact"
						type="button"
						variant="ghost"
					/>
				}
			>
				<Icon className="text-icon-subtle" render={<ShowMoreHorizontalIcon label="" />} />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuGroup>
					<DropdownMenuItem disabled={!canLinkAll} onSelect={handleLinkAll}>
						Link all suggestions
					</DropdownMenuItem>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<OverflowToggleRow
						checked={autoSync}
						label="Auto sync"
						onCheckedChange={setAutoSync}
					/>
					<OverflowToggleRow
						checked={autoLink}
						label="Suggest link"
						onCheckedChange={setAutoLink}
					/>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
