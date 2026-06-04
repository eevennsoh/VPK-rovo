"use client";

import { useMemo, useState } from "react";

import { List, type ListColumn } from "@/components/ui-custom/list";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Lozenge } from "@/components/ui/lozenge";
import { cn } from "@/lib/utils";
import EditIcon from "@atlaskit/icon/core/edit";
import PinFilledIcon from "@atlaskit/icon/core/pin-filled";
import PinIcon from "@atlaskit/icon/core/pin";

const OWNER_AVATAR_SRC = "/avatar-user/venn/venn.png";

// The first column flexes; the rest are fixed so the name truncates rather than
// the metadata/action columns.
const AGENT_LIST_COLUMNS: readonly ListColumn[] = [
	{},
	{ className: "w-[92px]" },
	{ className: "w-[72px]" },
	{ className: "w-[116px]" },
	{ className: "w-[72px]" },
];

interface DemoAgent {
	id: string;
	name: string;
	avatarSrc?: string;
	userCount: number;
	version: "V1" | "Draft";
	modified: string;
}

const DEMO_AGENTS: readonly DemoAgent[] = [
	{
		id: "release-notes",
		name: "Release Notes Writer",
		userCount: 1,
		version: "V1",
		modified: "2 hrs ago",
	},
	{
		id: "standup-bot",
		name: "Standup Summarizer",
		userCount: 1,
		version: "Draft",
		modified: "1 day ago",
	},
	{
		id: "triage",
		name: "Bug Triage Assistant",
		userCount: 1,
		version: "V1",
		modified: "3 days ago",
	},
];

function formatUserCount(count: number): string {
	return `${count} ${count === 1 ? "user" : "users"}`;
}

export default function ListDemo() {
	const [pinnedIds, setPinnedIds] = useState<ReadonlySet<string>>(
		() => new Set(),
	);

	const sortedAgents = useMemo(() => {
		return [...DEMO_AGENTS].sort((a, b) => {
			const aPinned = pinnedIds.has(a.id);
			const bPinned = pinnedIds.has(b.id);
			if (aPinned !== bPinned) {
				return aPinned ? -1 : 1;
			}
			return 0;
		});
	}, [pinnedIds]);

	const togglePinned = (id: string) => {
		setPinnedIds((current) => {
			const next = new Set(current);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
	};

	return (
		<List.Root aria-labelledby="list-demo-heading" className="mx-auto max-w-2xl">
			<List.Heading id="list-demo-heading">My agents</List.Heading>
			<List.Table columns={AGENT_LIST_COLUMNS}>
				{sortedAgents.map((agent) => {
					const isPinned = pinnedIds.has(agent.id);
					const revealOnHover =
						"opacity-0 transition-opacity duration-fast group-hover/row:opacity-100 focus-visible:opacity-100";

					return (
						<List.Row key={agent.id}>
							<List.Cell edge="leading">
								<div className="flex min-w-0 items-center gap-3">
									<Avatar
										aria-hidden="true"
										shape="hexagon"
										size="sm"
										className="shrink-0 after:border-0"
									>
										{agent.avatarSrc ? (
											<AvatarImage alt="" src={agent.avatarSrc} />
										) : null}
										<AvatarFallback>
											{agent.name.slice(0, 2).toUpperCase()}
										</AvatarFallback>
									</Avatar>
									<span className="min-w-0 truncate font-medium text-text">
										{agent.name}
									</span>
								</div>
							</List.Cell>
							<List.Cell className="text-text-subtle">
								{formatUserCount(agent.userCount)}
							</List.Cell>
							<List.Cell>
								<Lozenge
									variant={agent.version === "V1" ? "success" : "neutral"}
								>
									{agent.version}
								</Lozenge>
							</List.Cell>
							<List.Cell>
								<div className="flex items-center gap-2">
									<Avatar aria-hidden="true" size="sm">
										<AvatarImage alt="" src={OWNER_AVATAR_SRC} />
										<AvatarFallback>V</AvatarFallback>
									</Avatar>
									<span className="whitespace-nowrap text-text">
										{agent.modified}
									</span>
								</div>
							</List.Cell>
							<List.Cell edge="trailing">
								<div className="flex justify-end gap-[4px]">
									<Button
										aria-label={`Edit ${agent.name}`}
										className={cn("size-7", revealOnHover)}
										size="icon"
										type="button"
										variant="ghost"
									>
										<Icon aria-hidden render={<EditIcon label="" size="small" />} />
									</Button>
									<Button
										aria-label={`${isPinned ? "Unpin" : "Pin"} ${agent.name}`}
										aria-pressed={isPinned}
										className={cn(
											"size-7 aria-pressed:border-transparent! aria-pressed:bg-transparent! aria-pressed:text-text-subtle! aria-pressed:[&_svg]:text-icon-subtle!",
											isPinned ? "opacity-100" : revealOnHover,
										)}
										onClick={() => togglePinned(agent.id)}
										size="icon"
										type="button"
										variant="ghost"
									>
										<Icon
											aria-hidden
											render={
												isPinned ? (
													<PinFilledIcon label="" size="small" />
												) : (
													<PinIcon label="" size="small" />
												)
											}
										/>
									</Button>
								</div>
							</List.Cell>
						</List.Row>
					);
				})}
			</List.Table>
		</List.Root>
	);
}

export function ListDemoBasic() {
	const columns: readonly ListColumn[] = [{}, { className: "w-[140px]" }];
	return (
		<List.Root className="max-w-md">
			<List.Table columns={columns}>
				<List.Row>
					<List.Cell edge="leading" className="font-medium text-text">
						Design review
					</List.Cell>
					<List.Cell edge="trailing" className="text-text-subtle">
						Sarah Chen
					</List.Cell>
				</List.Row>
				<List.Row>
					<List.Cell edge="leading" className="font-medium text-text">
						API integration
					</List.Cell>
					<List.Cell edge="trailing" className="text-text-subtle">
						Alex Kim
					</List.Cell>
				</List.Row>
			</List.Table>
		</List.Root>
	);
}

export function ListDemoWithStatus() {
	const columns: readonly ListColumn[] = [
		{},
		{ className: "w-[120px]" },
		{ className: "w-[112px]" },
	];
	return (
		<List.Root aria-labelledby="list-demo-status-heading" className="max-w-lg">
			<List.Heading id="list-demo-status-heading">Sprint backlog</List.Heading>
			<List.Table columns={columns}>
				<List.Row>
					<List.Cell edge="leading" className="truncate font-medium text-text">
						PROJ-123: Add user authentication
					</List.Cell>
					<List.Cell className="text-text-subtle">Sarah Chen</List.Cell>
					<List.Cell edge="trailing">
						<Lozenge variant="information">In progress</Lozenge>
					</List.Cell>
				</List.Row>
				<List.Row>
					<List.Cell edge="leading" className="truncate font-medium text-text">
						PROJ-124: Update dashboard layout
					</List.Cell>
					<List.Cell className="text-text-subtle">Alex Kim</List.Cell>
					<List.Cell edge="trailing">
						<Lozenge variant="success">Done</Lozenge>
					</List.Cell>
				</List.Row>
				<List.Row>
					<List.Cell edge="leading" className="truncate font-medium text-text">
						PROJ-125: Fix production error
					</List.Cell>
					<List.Cell className="text-text-subtle">Jordan Lee</List.Cell>
					<List.Cell edge="trailing">
						<Lozenge variant="danger">Critical</Lozenge>
					</List.Cell>
				</List.Row>
			</List.Table>
		</List.Root>
	);
}
