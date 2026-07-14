"use client";

import * as React from "react";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { SidebarNavItem, SidebarNavItemAction } from "@/components/ui-custom/sidebar-nav-item";
import { Tile } from "@/components/ui/tile";
import { STARRED_PROJECTS, JIRA_EXTERNAL_LINKS } from "../data/jira-navigation";
import AddIcon from "@atlaskit/icon/core/add";
import AlignTextLeftIcon from "@atlaskit/icon/core/align-text-left";
import AppsIcon from "@atlaskit/icon/core/apps";
import ChartTrendIcon from "@atlaskit/icon/core/chart-trend";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import ChevronRightIcon from "@atlaskit/icon/core/chevron-right";
import ClockIcon from "@atlaskit/icon/core/clock";
import DashboardIcon from "@atlaskit/icon/core/dashboard";
import LinkExternalIcon from "@atlaskit/icon/core/link-external";
import PersonAvatarIcon from "@atlaskit/icon/core/person-avatar";
import PlanIcon from "@atlaskit/icon/core/list-checklist";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";
import SpacesIcon from "@atlaskit/icon-lab/core/spaces";
import StarUnstarredIcon from "@atlaskit/icon/core/star-unstarred";
import BoardIcon from "@atlaskit/icon/core/board";
import FolderIcon from "@atlaskit/icon/core/folder-closed";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export type JiraSidebarSessionStatus = "queued" | "running" | "needs-input";

export interface JiraSidebarSessionItem {
	agentAvatarSrc?: string;
	agentName: string;
	id: string;
	status: JiraSidebarSessionStatus;
	title: string;
}

export interface JiraSidebarSessionNavigation {
	activeSessionId: string;
	onSelectSession: (sessionId: string) => void;
	sessionsBySpaceId: Readonly<Record<string, readonly JiraSidebarSessionItem[]>>;
}

interface JiraSidebarNavItem {
	actions?: React.ReactNode;
	hasChevron?: boolean;
	hasExternalLink?: boolean;
	icon: React.ReactNode;
	isExpanded?: boolean;
	isSelected?: boolean;
	label: string;
	onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

interface JiraSidebarProps {
	selectedItem: string;
	onSelectItem: (item: string) => void;
	sessionNavigation?: JiraSidebarSessionNavigation;
}

const SESSION_STATUS_LABELS: Record<JiraSidebarSessionStatus, string> = {
	queued: "Queued",
	running: "Running",
	"needs-input": "Needs input",
};

function JiraSessionAvatar({ session }: Readonly<{ session: JiraSidebarSessionItem }>) {
	const fallback = session.agentName
		.split(/\s+/u)
		.map((part) => part[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();

	return (
		<Avatar label={session.agentName} shape="hexagon" size="sm">
			{session.agentAvatarSrc ? <AvatarImage alt="" src={session.agentAvatarSrc} /> : null}
			<AvatarFallback>{fallback}</AvatarFallback>
		</Avatar>
	);
}

function JiraSessionStatus({ status }: Readonly<{ status: JiraSidebarSessionStatus }>) {
	if (status === "running") {
		return <Spinner aria-label="Running" size="xs" className="text-icon-information" />;
	}

	return (
		<span
			aria-label={SESSION_STATUS_LABELS[status]}
			className={cn(
				"size-2 rounded-full",
				status === "needs-input" ? "bg-bg-warning-bold" : "bg-bg-neutral-bold",
			)}
		/>
	);
}

function JiraSidebarSection({
	children,
	title,
}: Readonly<{
	children: React.ReactNode;
	title?: string;
}>) {
	return (
		<div className="flex flex-col gap-1">
			{title ? (
				<div className="px-1.5 text-xs font-semibold leading-4 text-text-subtlest">
					{title}
				</div>
			) : null}
			<div className="flex flex-col">{children}</div>
		</div>
	);
}

function JiraSidebarExpandableLeadingIcon({
	icon,
	isExpanded,
}: Readonly<{
	icon: React.ReactNode;
	isExpanded: boolean;
}>) {
	return (
		<span className="flex items-center justify-center">
			<span className="flex items-center justify-center group-hover/sidebar-nav-item:hidden">
				{icon}
			</span>
			<span className="hidden items-center justify-center group-hover/sidebar-nav-item:flex">
				{isExpanded ? <ChevronDownIcon label="" size="small" /> : <ChevronRightIcon label="" size="small" />}
			</span>
		</span>
	);
}

function JiraSidebarActions() {
	const handleActionClick: React.MouseEventHandler<HTMLButtonElement> = (event) => {
		event.stopPropagation();
	};

	return (
		<>
			<SidebarNavItemAction
				aria-label="Add"
				className="opacity-0 transition-opacity duration-normal ease-out group-hover/sidebar-nav-item:opacity-100 focus-visible:opacity-100"
				onClick={handleActionClick}
			>
				<AddIcon label="" size="small" />
			</SidebarNavItemAction>
			<SidebarNavItemAction
				aria-label="More"
				className="opacity-0 transition-opacity duration-normal ease-out group-hover/sidebar-nav-item:opacity-100 focus-visible:opacity-100"
				onClick={handleActionClick}
			>
				<ShowMoreHorizontalIcon label="" size="small" />
			</SidebarNavItemAction>
		</>
	);
}

function JiraProjectAvatar({
	label = "",
	src,
}: Readonly<{
	label?: string;
	size?: "small" | "medium";
	src: string;
}>) {
	const isDecorative = label === "";

	return (
		<Tile
			aria-hidden={isDecorative ? true : undefined}
			label={label || "Project avatar"}
			variant="transparent"
			size="small"
			isSnug
		>
			<Image alt={label} aria-hidden={isDecorative ? true : undefined} className="object-contain" height={20} src={src} width={20} />
		</Tile>
	);
}

function JiraSidebarRow({
	actions,
	hasChevron = false,
	hasExternalLink = false,
	icon,
	isExpanded,
	isSelected = false,
	label,
	onClick,
}: Readonly<JiraSidebarNavItem>) {
	const leading = hasChevron ? (
		<JiraSidebarExpandableLeadingIcon icon={icon} isExpanded={isExpanded ?? false} />
	) : (
		icon
	);

	return (
		<SidebarNavItem
			actions={actions}
			isExpanded={isExpanded}
			isSelected={isSelected}
			label={label}
			leading={leading}
			leadingSize="medium"
			meta={hasExternalLink ? <LinkExternalIcon label="" size="small" /> : null}
			onClick={onClick}
		/>
	);
}

export function JiraSidebar({
	selectedItem,
	onSelectItem,
	sessionNavigation,
}: Readonly<JiraSidebarProps>) {
	const router = useRouter();
	const [isSpacesExpanded, setIsSpacesExpanded] = useState(true);
	const [expandedSpaceIds, setExpandedSpaceIds] = useState<ReadonlySet<string>>(
		() => new Set(sessionNavigation ? [STARRED_PROJECTS[0]?.id].filter((id): id is string => Boolean(id)) : []),
	);
	const selectItem = (item: string, href?: string) => {
		onSelectItem(item);
		if (href) {
			router.push(href);
		}
	};
	const toggleSpace = (spaceId: string) => {
		setExpandedSpaceIds((current) => {
			const next = new Set(current);
			if (next.has(spaceId)) {
				next.delete(spaceId);
			} else {
				next.add(spaceId);
			}
			return next;
		});
	};

	return (
		<nav aria-label="Jira" className="flex shrink-0 flex-col gap-3">
			<JiraSidebarSection>
				<JiraSidebarRow
					icon={<PersonAvatarIcon label="" />}
					label="For you"
					isSelected={selectedItem === "For you"}
					onClick={() => selectItem("For you")}
				/>
				<JiraSidebarRow
					icon={<ClockIcon label="" />}
					label="Recent"
					hasChevron
					onClick={() => selectItem("Recent")}
				/>
				<JiraSidebarRow
					icon={<StarUnstarredIcon label="" />}
					label="Starred"
					hasChevron
					onClick={() => selectItem("Starred")}
				/>
				<JiraSidebarRow
					icon={<BoardIcon label="" />}
					label="Sprint Board"
					isSelected={selectedItem === "Sprint Board"}
					onClick={() => selectItem("Sprint Board", "/sprint-board")}
				/>
				<JiraSidebarRow
					icon={<FolderIcon label="" />}
					label="Projects"
					isSelected={selectedItem === "Projects"}
					onClick={() => selectItem("Projects", "/projects")}
				/>
				<JiraSidebarRow
					icon={<ChartTrendIcon label="" />}
					label="Analytics"
					isSelected={selectedItem === "Analytics"}
					onClick={() => selectItem("Analytics", "/analytics")}
				/>
			</JiraSidebarSection>

			<JiraSidebarSection>
				<JiraSidebarRow
					icon={<AppsIcon label="" />}
					label="Apps"
					hasChevron
					isExpanded={false}
					onClick={() => selectItem("Apps")}
				/>
				<JiraSidebarRow
					actions={<JiraSidebarActions />}
					icon={<PlanIcon label="" />}
					label="Plans"
					hasChevron
					isExpanded={false}
					onClick={() => selectItem("Plans")}
				/>
				<JiraSidebarRow
					actions={<JiraSidebarActions />}
					icon={<SpacesIcon label="" />}
					label="Spaces"
					hasChevron
					isExpanded={isSpacesExpanded}
					onClick={() => setIsSpacesExpanded((prev) => !prev)}
				/>
			</JiraSidebarSection>

			{isSpacesExpanded ? (
				<JiraSidebarSection title="Starred">
					<div className="flex flex-col pl-3">
						{STARRED_PROJECTS.map((project) => {
							const sessions = sessionNavigation?.sessionsBySpaceId[project.id] ?? [];
							const hasSessions = sessions.length > 0;
							const isExpanded = hasSessions && expandedSpaceIds.has(project.id);

							return (
								<div key={project.id}>
									<SidebarNavItem
										label={project.name}
										leading={hasSessions ? (
											<JiraSidebarExpandableLeadingIcon
												icon={<JiraProjectAvatar src={project.imageSrc} />}
												isExpanded={isExpanded}
											/>
										) : <JiraProjectAvatar src={project.imageSrc} />}
										leadingSize="medium"
										isExpanded={hasSessions ? isExpanded : undefined}
										isSelected={!hasSessions && selectedItem === project.name}
										onClick={() => {
											selectItem(project.name);
											if (hasSessions) toggleSpace(project.id);
										}}
										className="min-h-7"
									/>
									{isExpanded ? (
										<div className="flex flex-col pl-4">
											{sessions.map((session) => (
												<SidebarNavItem
													key={session.id}
													className="min-h-10"
													description={`${session.agentName} · ${SESSION_STATUS_LABELS[session.status]}`}
													isSelected={sessionNavigation?.activeSessionId === session.id}
													label={session.title}
													leading={<JiraSessionAvatar session={session} />}
													leadingSize="medium"
													meta={<JiraSessionStatus status={session.status} />}
													onClick={() => sessionNavigation?.onSelectSession(session.id)}
												/>
											))}
										</div>
									) : null}
								</div>
							);
						})}
						<SidebarNavItem
							label="View all plans"
							leading={<AlignTextLeftIcon label="" />}
							leadingSize="medium"
							onClick={() => selectItem("View all plans")}
							className="min-h-7"
						/>
					</div>
					<JiraSidebarRow
						icon={<DashboardIcon label="" />}
						label="Dashboards"
						onClick={() => selectItem("Dashboards")}
					/>
				</JiraSidebarSection>
			) : null}

			<JiraSidebarSection>
				{JIRA_EXTERNAL_LINKS.map((link) => (
					<JiraSidebarRow
						key={link.id}
						icon={<link.icon label="" />}
						label={link.label}
						hasExternalLink
						onClick={() => selectItem(link.label, link.href)}
					/>
				))}
			</JiraSidebarSection>

			<JiraSidebarSection>
				<JiraSidebarRow
					icon={<ShowMoreHorizontalIcon label="" />}
					label="More"
					onClick={() => selectItem("More")}
				/>
			</JiraSidebarSection>
		</nav>
	);
}
