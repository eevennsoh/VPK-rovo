"use client";

import { type MouseEvent, type ReactElement, type ReactNode } from "react";
import Image from "next/image";
import AiModelIcon from "@atlaskit/icon-lab/core/ai-model";
import ArrowUpRightIcon from "@atlaskit/icon/core/arrow-up-right";
import ChartTrendUpIcon from "@atlaskit/icon/core/chart-trend-up";
import CheckCircleIcon from "@atlaskit/icon/core/check-circle";
import ClipboardIcon from "@atlaskit/icon/core/clipboard";
import ClockIcon from "@atlaskit/icon/core/clock";
import CommentIcon from "@atlaskit/icon/core/comment";
import EditIcon from "@atlaskit/icon/core/edit";
import EyeOpenIcon from "@atlaskit/icon/core/eye-open";
import FlagFilledIcon from "@atlaskit/icon/core/flag-filled";
import PeopleGroupIcon from "@atlaskit/icon/core/people-group";
import SearchIcon from "@atlaskit/icon/core/search";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";
import StatusVerifiedIcon from "@atlaskit/icon/core/status-verified";
import TaskIcon from "@atlaskit/icon/core/task";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Tile } from "@/components/ui/tile";
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
			size="icon-xs"
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
			<Avatar
				aria-hidden
				className="absolute top-6 left-4 h-12 w-[42px]"
				shape="hexagon"
				size="xl"
			>
				<AvatarImage alt="" aria-hidden className="object-contain" src={avatarSrc} />
				<AvatarFallback />
				{avatarBadge}
			</Avatar>
			{/* Surface ring sits over the avatar as an unclipped sibling — rendering it as an
			    Avatar child would route it through the hexagon clip-path and slice the stroke. */}
			<svg
				aria-hidden="true"
				className="pointer-events-none absolute top-6 left-4 h-12 w-[42px] overflow-visible"
				focusable="false"
				viewBox="0 0 43 48"
			>
				<path
					className="stroke-surface"
					d={BANNER_HEXAGON_PATH}
					fill="none"
					strokeWidth={2}
					vectorEffect="non-scaling-stroke"
				/>
			</svg>
		</div>
	);
}

export type CardDirectoryCapabilityIcon =
	| "action"
	| "brief"
	| "check"
	| "clock"
	| "comment"
	| "draft"
	| "goal"
	| "people"
	| "review"
	| "search"
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
			return <ArrowUpRightIcon label="" />;
		case "brief":
			return <ClipboardIcon label="" />;
		case "check":
			return <CheckCircleIcon label="" />;
		case "clock":
			return <ClockIcon label="" />;
		case "comment":
			return <CommentIcon label="" />;
		case "draft":
			return <EditIcon label="" />;
		case "goal":
			return <FlagFilledIcon label="" />;
		case "people":
			return <PeopleGroupIcon label="" />;
		case "review":
			return <EyeOpenIcon label="" />;
		case "search":
			return <SearchIcon label="" />;
		case "trend":
			return <ChartTrendUpIcon label="" />;
		case "work":
			return <TaskIcon label="" />;
		default:
			return <AiModelIcon label="" />;
	}
}

/**
 * Feature list — borderless icon-tile rows (one per capability). Scrolling is
 * owned by the enclosing card body, so this list just flows at its natural height.
 */
export function CardDirectoryCapabilities({ label, items }: Readonly<CardDirectoryCapabilitiesProps>) {
	return (
		<div className="flex flex-col gap-1" data-slot="card-directory-capabilities">
			{label ? <span className="text-xs font-semibold leading-4 text-text-subtlest">{label}</span> : null}
			<ul className="flex flex-col gap-1">
				{items.map((item) => {
					const capability = getCapabilityItem(item);

					return (
						<li key={capability.label} className="flex items-center gap-2">
							<Tile aria-hidden className="shrink-0 text-icon-subtle" label="" size="small" variant="neutral">
								<Icon render={getCapabilityIcon(capability.icon)} aria-hidden />
							</Tile>
							<span className="min-w-0 flex-1 truncate text-sm leading-5 text-text">{capability.label}</span>
						</li>
					);
				})}
			</ul>
		</div>
	);
}
