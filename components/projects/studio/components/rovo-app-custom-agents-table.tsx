"use client";

import { useMemo, useState } from "react";
import type { StudioSessionAgentEntry } from "@/app/contexts/context-rovo-chat";
import { getStudioSessionAgentDisplayName } from "@/app/contexts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { Lozenge } from "@/components/ui/lozenge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import ArrowUpIcon from "@atlaskit/icon/core/arrow-up";
import DeleteIcon from "@atlaskit/icon/core/delete";
import EditIcon from "@atlaskit/icon/core/edit";
import PinFilledIcon from "@atlaskit/icon/core/pin-filled";
import PinIcon from "@atlaskit/icon/core/pin";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";

const STUDIO_CUSTOM_AGENT_OWNER_AVATAR_SRC = "/avatar-user/venn/venn.png";

interface StudioCustomAgentsTableProps {
	entries: readonly StudioSessionAgentEntry[];
	onDeleteAgent: (agentId: string) => void;
	onEditAgent: (agentId: string) => void;
}

function formatRelativeModifiedTime(timestamp: number): string {
	if (!Number.isFinite(timestamp) || timestamp <= 0) {
		return "Just now";
	}

	const elapsedMs = Math.max(0, Date.now() - timestamp);
	const elapsedMinutes = Math.floor(elapsedMs / 60_000);
	if (elapsedMinutes < 1) {
		return "Just now";
	}
	if (elapsedMinutes < 60) {
		return `${elapsedMinutes} min ago`;
	}

	const elapsedHours = Math.floor(elapsedMinutes / 60);
	if (elapsedHours < 24) {
		return `${elapsedHours} hr${elapsedHours === 1 ? "" : "s"} ago`;
	}

	const elapsedDays = Math.floor(elapsedHours / 24);
	if (elapsedDays < 14) {
		return `${elapsedDays} day${elapsedDays === 1 ? "" : "s"} ago`;
	}

	const elapsedWeeks = Math.floor(elapsedDays / 7);
	return `${elapsedWeeks} week${elapsedWeeks === 1 ? "" : "s"} ago`;
}

function getVersionLabel(entry: StudioSessionAgentEntry): string {
	return entry.publishStatus === "published" ? "V1" : "Draft";
}

function getVersionVariant(entry: StudioSessionAgentEntry): "success" | "neutral" {
	return entry.publishStatus === "published" ? "success" : "neutral";
}

export function StudioCustomAgentsTable({
	entries,
	onDeleteAgent,
	onEditAgent,
}: Readonly<StudioCustomAgentsTableProps>) {
	const [pinnedAgentIds, setPinnedAgentIds] = useState<ReadonlySet<string>>(() => new Set());
	const sortedEntries = useMemo(() => {
		return [...entries].sort((a, b) => {
			const aPinned = pinnedAgentIds.has(a.profile.id);
			const bPinned = pinnedAgentIds.has(b.profile.id);
			if (aPinned !== bPinned) {
				return aPinned ? -1 : 1;
			}
			return b.lastTouchedAt - a.lastTouchedAt;
		});
	}, [entries, pinnedAgentIds]);

	const togglePinned = (agentId: string) => {
		setPinnedAgentIds((current) => {
			const next = new Set(current);
			if (next.has(agentId)) {
				next.delete(agentId);
			} else {
				next.add(agentId);
			}
			return next;
		});
	};

	return (
		<section aria-labelledby="studio-custom-agents-heading" className="mx-auto mt-10 w-full max-w-[1280px]">
			<h2 id="studio-custom-agents-heading" className="sr-only">
				Custom agents
			</h2>
			<Table className="min-w-[760px]">
				<TableHeader>
					<TableRow className="hover:bg-transparent">
						<TableHead className="w-full px-4">
							<span className="inline-flex items-center gap-1">
								Name
								<ArrowUpIcon label="" size="small" />
							</span>
						</TableHead>
						<TableHead className="w-[120px] px-4">Active users</TableHead>
						<TableHead className="w-[96px] px-4">Version</TableHead>
						<TableHead className="w-[180px] px-4">
							<span className="inline-flex items-center gap-1">
								Last modified
								<ArrowUpIcon label="" size="small" />
							</span>
						</TableHead>
						<TableHead className="w-[104px] px-2 text-right">
							<span className="sr-only">Actions</span>
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{sortedEntries.map((entry) => {
						const agentName = getStudioSessionAgentDisplayName(entry);
						const isPinned = pinnedAgentIds.has(entry.profile.id);

						return (
							<TableRow key={entry.profile.id} className="h-14">
								<TableCell className="px-4">
									<div className="flex min-w-0 items-center gap-3">
										<Avatar aria-hidden="true" shape="hexagon" size="sm" className="shrink-0 after:border-0">
											{entry.profile.avatarSrc ? <AvatarImage alt="" src={entry.profile.avatarSrc} /> : null}
											<AvatarFallback>{(agentName || "UA").slice(0, 2).toUpperCase()}</AvatarFallback>
										</Avatar>
										<span className="min-w-0 truncate font-medium text-text">
											{agentName || "Untitled agent"}
										</span>
									</div>
								</TableCell>
								<TableCell className="px-4 text-text-disabled">—</TableCell>
								<TableCell className="px-4">
									<Lozenge variant={getVersionVariant(entry)}>
										{getVersionLabel(entry)}
									</Lozenge>
								</TableCell>
								<TableCell className="px-4">
									<div className="flex items-center gap-2">
										<Avatar aria-hidden="true" size="sm">
											<AvatarImage alt="" src={STUDIO_CUSTOM_AGENT_OWNER_AVATAR_SRC} />
											<AvatarFallback>V</AvatarFallback>
										</Avatar>
										<span className="whitespace-nowrap text-text">
											{formatRelativeModifiedTime(entry.lastTouchedAt)}
										</span>
									</div>
								</TableCell>
								<TableCell className="px-2">
									<div className="flex justify-end gap-1">
										<DropdownMenu modal={false}>
											<DropdownMenuTrigger
												render={
													<Button aria-label={`More actions for ${agentName || "Untitled agent"}`} className="size-7" size="icon" type="button" variant="ghost" />
												}
											>
												<Icon aria-hidden render={<ShowMoreHorizontalIcon label="" size="small" />} />
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end" positionerClassName="z-[760]">
												<DropdownMenuGroup>
													<DropdownMenuItem elemBefore={<EditIcon label="" />} onSelect={() => onEditAgent(entry.profile.id)}>
														Edit agent
													</DropdownMenuItem>
													<DropdownMenuItem variant="destructive" elemBefore={<DeleteIcon label="" />} onSelect={() => onDeleteAgent(entry.profile.id)}>
														Delete agent
													</DropdownMenuItem>
												</DropdownMenuGroup>
											</DropdownMenuContent>
										</DropdownMenu>
										<Button aria-label={`Edit ${agentName || "Untitled agent"}`} className="size-7" onClick={() => onEditAgent(entry.profile.id)} size="icon" type="button" variant="ghost">
											<Icon aria-hidden render={<EditIcon label="" size="small" />} />
										</Button>
										<Button
											aria-label={`${isPinned ? "Unpin" : "Pin"} ${agentName || "Untitled agent"}`}
											aria-pressed={isPinned}
											className="size-7 aria-pressed:border-transparent! aria-pressed:bg-transparent! aria-pressed:text-text-subtle! aria-pressed:[&_svg]:text-icon-subtle!"
											onClick={() => togglePinned(entry.profile.id)}
											size="icon"
											type="button"
											variant="ghost"
										>
											<Icon aria-hidden render={isPinned ? <PinFilledIcon label="" size="small" /> : <PinIcon label="" size="small" />} />
										</Button>
									</div>
								</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
		</section>
	);
}
