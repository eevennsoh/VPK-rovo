"use client";

import { type MouseEvent, type ReactElement, type ReactNode } from "react";
import Image from "next/image";
import AiModelIcon from "@atlaskit/icon-lab/core/ai-model";
import ArrowUpRightIcon from "@atlaskit/icon/core/arrow-up-right";
import BacklogIcon from "@atlaskit/icon/core/backlog";
import BoardIcon from "@atlaskit/icon/core/board";
import BookWithBookmarkIcon from "@atlaskit/icon/core/book-with-bookmark";
import BranchIcon from "@atlaskit/icon/core/branch";
import CalendarIcon from "@atlaskit/icon/core/calendar";
import ChartBarIcon from "@atlaskit/icon/core/chart-bar";
import ChartBubbleIcon from "@atlaskit/icon/core/chart-bubble";
import ChartPieIcon from "@atlaskit/icon/core/chart-pie";
import ChartTrendUpIcon from "@atlaskit/icon/core/chart-trend-up";
import CheckCircleIcon from "@atlaskit/icon/core/check-circle";
import ClipboardIcon from "@atlaskit/icon/core/clipboard";
import ClockIcon from "@atlaskit/icon/core/clock";
import CommentIcon from "@atlaskit/icon/core/comment";
import CompassIcon from "@atlaskit/icon/core/compass";
import DashboardIcon from "@atlaskit/icon/core/dashboard";
import DataNumberIcon from "@atlaskit/icon/core/data-number";
import DiscoveryIcon from "@atlaskit/icon/core/discovery";
import EditIcon from "@atlaskit/icon/core/edit";
import EpicIcon from "@atlaskit/icon/core/epic";
import EyeOpenIcon from "@atlaskit/icon/core/eye-open";
import FilterIcon from "@atlaskit/icon/core/filter";
import FlagFilledIcon from "@atlaskit/icon/core/flag-filled";
import HighlightIcon from "@atlaskit/icon/core/highlight";
import IncidentIcon from "@atlaskit/icon/core/incident";
import LightbulbIcon from "@atlaskit/icon/core/lightbulb";
import LinkIcon from "@atlaskit/icon/core/link";
import ListBulletedIcon from "@atlaskit/icon/core/list-bulleted";
import ListChecklistIcon from "@atlaskit/icon/core/list-checklist";
import MegaphoneIcon from "@atlaskit/icon/core/megaphone";
import ObjectiveIcon from "@atlaskit/icon/core/objective";
import OnCallIcon from "@atlaskit/icon/core/on-call";
import PageIcon from "@atlaskit/icon/core/page";
import PeopleGroupIcon from "@atlaskit/icon/core/people-group";
import PinIcon from "@atlaskit/icon/core/pin";
import PulseIcon from "@atlaskit/icon/core/pulse";
import QuestionCircleIcon from "@atlaskit/icon/core/question-circle";
import QuotationMarkIcon from "@atlaskit/icon/core/quotation-mark";
import RefreshIcon from "@atlaskit/icon/core/refresh";
import RoadmapIcon from "@atlaskit/icon/core/roadmap";
import ScalesIcon from "@atlaskit/icon/core/scales";
import SearchIcon from "@atlaskit/icon/core/search";
import ShieldIcon from "@atlaskit/icon/core/shield";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";
import StatusVerifiedIcon from "@atlaskit/icon/core/status-verified";
import SubtasksIcon from "@atlaskit/icon/core/subtasks";
import SupportIcon from "@atlaskit/icon/core/support";
import TargetIcon from "@atlaskit/icon/core/target";
import TaskIcon from "@atlaskit/icon/core/task";
import TextIcon from "@atlaskit/icon/core/text";
import TimelineIcon from "@atlaskit/icon/core/timeline";
import TransitionIcon from "@atlaskit/icon/core/transition";
import TranslateIcon from "@atlaskit/icon/core/translate";
import WarningIcon from "@atlaskit/icon/core/warning";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

/** Compact count formatter — 1500 → "1.5K", 12000 → "12K". */
export function formatCompact(value: number): string {
	if (value >= 10000) return `${Math.round(value / 1000)}K`;
	if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
	return `${value}`;
}

export interface CardDirectoryHeaderProps {
	/** Leading visual — hexagon avatar, icon tile, app logo, or rich icon. Omit when the visual lives elsewhere (e.g. a `CardDirectoryBanner`). */
	leading?: ReactNode;
	title: string;
	/** Attribution line under the title (e.g. `CardDirectoryByline`). */
	byline?: ReactNode;
	/** Trailing action revealed on hover/focus (e.g. `CardDirectoryMoreButton`). */
	action?: ReactNode;
}

export function CardDirectoryHeader({ leading, title, byline, action }: Readonly<CardDirectoryHeaderProps>) {
	return (
		// Center the title against the leading visual for single-line headers; top-align
		// once a byline adds a second line so the avatar tops with the name.
		<div
			className={cn("flex gap-2", byline ? "items-start" : "items-center")}
			data-slot="card-directory-header"
		>
			{leading ? <span className="shrink-0">{leading}</span> : null}
			<div className="min-w-0 flex-1">
				<h3 className="truncate text-text" style={{ font: token("font.heading.xsmall") }}>
					{title}
				</h3>
				{byline ?? null}
			</div>
			{action ?? null}
		</div>
	);
}

export interface CardDirectoryBylineProps {
	publisher: string;
	verified?: boolean;
}

export function CardDirectoryByline({ publisher, verified = false }: Readonly<CardDirectoryBylineProps>) {
	return (
		<p
			className="flex items-center gap-1 text-xs leading-4 text-text-subtle"
			data-slot="card-directory-byline"
		>
			<span>By</span>
			<span className="truncate text-link">{publisher}</span>
			{verified ? (
				<Icon
					className="text-icon-information"
					render={<StatusVerifiedIcon label="Verified" size="small" color="currentColor" />}
				/>
			) : null}
		</p>
	);
}

export interface CardDirectoryMoreButtonProps {
	label: string;
	onClick?: () => void;
}

export function CardDirectoryMoreButton({ label, onClick }: Readonly<CardDirectoryMoreButtonProps>) {
	const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
		event.stopPropagation();
		onClick?.();
	};

	return (
		<Button
			aria-label={label}
			className="size-6 shrink-0 cursor-pointer opacity-0 transition-opacity duration-fast ease-out group-hover/card:opacity-100 group-focus-within/card:opacity-100"
			onClick={handleClick}
			size="icon-compact"
			type="button"
			variant="ghost"
		>
			<Icon render={<ShowMoreHorizontalIcon label="" size="small" color="currentColor" />} />
		</Button>
	);
}

export function CardDirectoryDescription({
	className,
	children,
}: Readonly<{ className?: string; children: ReactNode }>) {
	return (
		<p
			className={cn("line-clamp-2 min-h-10 text-sm leading-5 text-text", className)}
			data-slot="card-directory-description"
		>
			{children}
		</p>
	);
}

export function CardDirectoryFooter({
	className,
	children,
}: Readonly<{ className?: string; children: ReactNode }>) {
	return (
		<div
			className={cn("flex items-center gap-4 text-xs leading-4 text-text-subtlest", className)}
			data-slot="card-directory-footer"
		>
			{children}
		</div>
	);
}

export interface CardDirectoryStatProps {
	/** Raw Atlaskit icon element; wrapped in the 12px stat-icon treatment. */
	icon: ReactElement;
	children: ReactNode;
}

export function CardDirectoryStat({ icon, children }: Readonly<CardDirectoryStatProps>) {
	return (
		<span className="inline-flex items-center gap-1" data-slot="card-directory-stat">
			<Icon className="size-3 text-icon-subtlest [&_svg]:size-3" render={icon} />
			{children}
		</span>
	);
}

export function CardDirectorySection({
	label,
	children,
}: Readonly<{ label: string; children: ReactNode }>) {
	return (
		<div className="flex flex-col gap-1" data-slot="card-directory-section">
			<span className="text-xs font-semibold leading-4 text-text-subtlest">{label}</span>
			{children}
		</div>
	);
}

// Cover-banner styling, mirrored from `AgentProfileCover` in `components/ui-custom/agent.tsx`.
// Kept local so the card-directory module stays self-contained and doesn't pull in the large
// agent module — the same color map is duplicated there and in the agent-card block.
const BANNER_HEXAGON_PATH =
	"M19.01 0.922148C20.24 0.212148 21.76 0.212148 23 0.922148L40 10.6921C41.24 11.4021 42.01 12.7321 42.01 14.1621V33.6721C42.01 35.1021 41.24 36.4221 40 37.1421L23 46.9121C21.77 47.6221 20.25 47.6221 19.01 46.9121L2.01 37.1321C0.77 36.4221 0 35.0921 0 33.6621V14.1621C0 12.7321 0.77 11.4121 2.01 10.6921L19.01 0.922148Z";
const DEFAULT_BANNER_COVER_COLOR = "#1868DB";
const BANNER_COVER_COLORS: Record<string, string> = {
	"dev-agents": "#82B536",
	"product-agents": "#BF63F3",
	"service-agents": "#FFC716",
	"strategy-agents": "#FCA700",
	"teamwork-agents": DEFAULT_BANNER_COVER_COLOR,
};

function getBannerCoverColor(avatarSrc: string | undefined): string {
	const category = avatarSrc?.match(/\/avatar-agent\/([^/]+)\//u)?.[1];
	return (category ? BANNER_COVER_COLORS[category] : undefined) ?? DEFAULT_BANNER_COVER_COLOR;
}

export interface CardDirectoryBannerProps {
	avatarSrc: string;
	/** Override the avatar-category-derived cover color. */
	backgroundColor?: string;
	/** Optional badge overlaid on the foreground avatar. */
	avatarBadge?: ReactNode;
}

/**
 * Full-bleed cover banner — a colored strip with a bleeding avatar and a hexagon-outlined
 * avatar overhanging the bottom edge. The parent card clips the top corners.
 */
export function CardDirectoryBanner({ avatarSrc, avatarBadge, backgroundColor }: Readonly<CardDirectoryBannerProps>) {
	const coverColor = backgroundColor ?? getBannerCoverColor(avatarSrc);

	return (
		<div
			className="relative shrink-0 overflow-hidden bg-surface"
			data-slot="card-directory-banner"
		>
			<div className="relative h-12 overflow-hidden" style={{ backgroundColor: coverColor }}>
				<Image
					alt=""
					aria-hidden
					className="absolute top-1/2 left-[88%] h-48 w-[168px] -translate-x-1/2 -translate-y-1/2 opacity-95"
					height={192}
					src={avatarSrc}
					width={168}
				/>
			</div>
			<div aria-hidden className="h-6" />
			{/* The avatar art (`public/avatar-agent/*`) is itself a full-bleed hexagon drawn with
			    the exact `BANNER_HEXAGON_PATH`, so we render it directly (like `AgentProfileCover`)
			    rather than routing it through the Avatar hexagon shape, whose square-derived clip
			    sliced the art and floated its outline. The surface ring is drawn over the art and
			    centered on the hexagon edge — its inner half sits on the avatar, its outer half
			    lifts it off the colored cover. Art and stroke share one viewBox and the same
			    default (meet) scaling so they stay flush. The wrapper recreates the `group/avatar`
			    + `data-size` contract the badge sizes against. */}
			<div aria-hidden className="group/avatar absolute top-6 left-4 h-12 w-[42px]" data-size="xl">
				<Image alt="" aria-hidden className="absolute inset-0 size-full object-contain" height={48} src={avatarSrc} width={42} />
				<svg
					aria-hidden="true"
					className="stroke-surface pointer-events-none absolute inset-0 size-full overflow-visible"
					focusable="false"
					viewBox="0 0 43 48"
				>
					<path d={BANNER_HEXAGON_PATH} fill="none" strokeWidth={2} vectorEffect="non-scaling-stroke" />
				</svg>
				{avatarBadge}
			</div>
		</div>
	);
}

export type CardDirectoryCapabilityIcon =
	| "action"
	| "alert"
	| "board"
	| "book"
	| "branch"
	| "brief"
	| "bubble"
	| "calendar"
	| "chartBar"
	| "chartPie"
	| "check"
	| "checklist"
	| "clock"
	| "comment"
	| "compass"
	| "dashboard"
	| "data"
	| "dependency"
	| "discovery"
	| "document"
	| "draft"
	| "epic"
	| "filter"
	| "goal"
	| "handoff"
	| "highlight"
	| "incident"
	| "lightbulb"
	| "list"
	| "megaphone"
	| "milestone"
	| "objective"
	| "onCall"
	| "people"
	| "pulse"
	| "queue"
	| "question"
	| "quote"
	| "refresh"
	| "review"
	| "roadmap"
	| "scales"
	| "search"
	| "shield"
	| "subtasks"
	| "support"
	| "target"
	| "text"
	| "timeline"
	| "translate"
	| "trend"
	| "work";

export interface CardDirectoryCapability {
	icon?: CardDirectoryCapabilityIcon;
	label: string;
}

export interface CardDirectoryCapabilitiesProps {
	/** Optional section label above the list. Omit to render the bare list. */
	label?: string;
	/** Capability lines rendered as a scrollable icon-tile feature list. */
	items: readonly (string | CardDirectoryCapability)[];
}

function getCapabilityItem(item: string | CardDirectoryCapability): CardDirectoryCapability {
	return typeof item === "string" ? { label: item } : item;
}

function getCapabilityIcon(icon: CardDirectoryCapabilityIcon | undefined): ReactElement {
	switch (icon) {
		case "action":
			return <ArrowUpRightIcon label="" size="small" />;
		case "alert":
			return <WarningIcon label="" size="small" />;
		case "board":
			return <BoardIcon label="" size="small" />;
		case "book":
			return <BookWithBookmarkIcon label="" size="small" />;
		case "branch":
			return <BranchIcon label="" size="small" />;
		case "brief":
			return <ClipboardIcon label="" size="small" />;
		case "bubble":
			return <ChartBubbleIcon label="" size="small" />;
		case "calendar":
			return <CalendarIcon label="" size="small" />;
		case "chartBar":
			return <ChartBarIcon label="" size="small" />;
		case "chartPie":
			return <ChartPieIcon label="" size="small" />;
		case "check":
			return <CheckCircleIcon label="" size="small" />;
		case "checklist":
			return <ListChecklistIcon label="" size="small" />;
		case "clock":
			return <ClockIcon label="" size="small" />;
		case "comment":
			return <CommentIcon label="" size="small" />;
		case "compass":
			return <CompassIcon label="" size="small" />;
		case "dashboard":
			return <DashboardIcon label="" size="small" />;
		case "data":
			return <DataNumberIcon label="" size="small" />;
		case "dependency":
			return <LinkIcon label="" size="small" />;
		case "discovery":
			return <DiscoveryIcon label="" size="small" />;
		case "document":
			return <PageIcon label="" size="small" />;
		case "draft":
			return <EditIcon label="" size="small" />;
		case "epic":
			return <EpicIcon label="" size="small" />;
		case "filter":
			return <FilterIcon label="" size="small" />;
		case "goal":
			return <FlagFilledIcon label="" size="small" />;
		case "handoff":
			return <TransitionIcon label="" size="small" />;
		case "highlight":
			return <HighlightIcon label="" size="small" />;
		case "incident":
			return <IncidentIcon label="" size="small" />;
		case "lightbulb":
			return <LightbulbIcon label="" size="small" />;
		case "list":
			return <ListBulletedIcon label="" size="small" />;
		case "megaphone":
			return <MegaphoneIcon label="" size="small" />;
		case "milestone":
			return <PinIcon label="" size="small" />;
		case "objective":
			return <ObjectiveIcon label="" size="small" />;
		case "onCall":
			return <OnCallIcon label="" size="small" />;
		case "people":
			return <PeopleGroupIcon label="" size="small" />;
		case "pulse":
			return <PulseIcon label="" size="small" />;
		case "queue":
			return <BacklogIcon label="" size="small" />;
		case "question":
			return <QuestionCircleIcon label="" size="small" />;
		case "quote":
			return <QuotationMarkIcon label="" size="small" />;
		case "refresh":
			return <RefreshIcon label="" size="small" />;
		case "review":
			return <EyeOpenIcon label="" size="small" />;
		case "roadmap":
			return <RoadmapIcon label="" size="small" />;
		case "scales":
			return <ScalesIcon label="" size="small" />;
		case "search":
			return <SearchIcon label="" size="small" />;
		case "shield":
			return <ShieldIcon label="" size="small" />;
		case "subtasks":
			return <SubtasksIcon label="" size="small" />;
		case "support":
			return <SupportIcon label="" size="small" />;
		case "target":
			return <TargetIcon label="" size="small" />;
		case "text":
			return <TextIcon label="" size="small" />;
		case "timeline":
			return <TimelineIcon label="" size="small" />;
		case "translate":
			return <TranslateIcon label="" size="small" />;
		case "trend":
			return <ChartTrendUpIcon label="" size="small" />;
		case "work":
			return <TaskIcon label="" size="small" />;
		default:
			return <AiModelIcon label="" size="small" />;
	}
}

/**
 * Feature list — borderless rows (one per capability), each a plain 16px icon
 * beside its label. Scrolling is owned by the enclosing card body, so this list
 * just flows at its natural height.
 */
export function CardDirectoryCapabilities({ label, items }: Readonly<CardDirectoryCapabilitiesProps>) {
	return (
		<div className="flex flex-col gap-1" data-slot="card-directory-capabilities">
			{label ? <span className="text-xs font-semibold leading-4 text-text-subtlest">{label}</span> : null}
			<TooltipProvider>
				<ul className="flex flex-col gap-1">
					{items.map((item) => {
						const capability = getCapabilityItem(item);

						return (
							// Labels truncate in the fixed-width card body, so surface the full
							// string on hover. Screen readers already get it from the DOM text.
							<Tooltip key={capability.label}>
								<TooltipTrigger render={<li className="flex items-center gap-2" />}>
									<Icon
										aria-hidden
										className="size-4 shrink-0 text-icon-subtlest"
										render={getCapabilityIcon(capability.icon)}
									/>
									<span className="min-w-0 flex-1 truncate text-sm leading-5 text-text">{capability.label}</span>
								</TooltipTrigger>
								<TooltipContent>{capability.label}</TooltipContent>
							</Tooltip>
						);
					})}
				</ul>
			</TooltipProvider>
		</div>
	);
}
