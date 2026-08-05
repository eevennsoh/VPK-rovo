"use client";

// oxlint-disable react-doctor/only-export-components -- This module intentionally exports colocated component API, variant contracts, context contracts, or metadata used by consumers.

// oxlint-disable react-doctor/prefer-tag-over-role -- This file uses ARIA roles for custom generated visuals or composite widgets where the suggested native tag would change semantics or behavior.

import { cloneElement, isValidElement, useId, useState, type ComponentProps, type ReactElement } from "react";
import Image from "next/image";
import CrossIcon from "@atlaskit/icon/core/cross";
import PageIcon from "@atlaskit/icon/core/page";
import PriorityHighestIcon from "@atlaskit/icon/core/priority-highest";
import PriorityHighIcon from "@atlaskit/icon/core/priority-high";
import PriorityMediumIcon from "@atlaskit/icon/core/priority-medium";
import PriorityLowIcon from "@atlaskit/icon/core/priority-low";
import PriorityMinorIcon from "@atlaskit/icon/core/priority-minor";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Icon } from "@/components/ui/icon";
import { IconTile } from "@/components/ui/icon-tile";
import { AtlassianLogo, CustomLogo, type AtlassianLogoName, type LogoProps } from "@/components/ui/logo";
import { BrandLogoMark } from "@/components/ui/logo-mark";
import { LogoThirdParty } from "@/components/ui/logo-third-party";
import type { ThirdPartyLogoName } from "@/components/ui/data/logo-third-party-data";
import { Lozenge, LozengeDropdownTrigger, type LozengeProps } from "@/components/ui/lozenge";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

export type SmartLinkVariant =
	| "confluence"
	| "jira"
	| "team"
	| "goal"
	| "project"
	| "loom"
	| "article"
	| "file"
	| "generic";

/** Inline chip size: "small" renders a 12px label, "large" a 16px label. */
export type SmartLinkSize = "small" | "large";

export type SmartLinkVisual =
	| { kind: "atlassian"; name: AtlassianLogoName }
	| { kind: "third-party"; name: ThirdPartyLogoName }
	| { kind: "image"; src: string; alt: string }
	| { kind: "avatar"; src: string; alt: string }
	| { kind: "icon"; icon: ReactElement }
	| { kind: "icon-tile"; icon: ReactElement; tone?: SmartLinkTone }
	| { kind: "text"; label: string; tone?: SmartLinkTone };

export type SmartLinkTone = "neutral" | "information" | "discovery" | "magenta" | "warning";

export interface SmartLinkProvider {
	name: string;
	logo?: SmartLinkVisual;
}

export interface SmartLinkMetadata {
	label: string;
	tone?: SmartLinkTone;
	icon?: ReactElement;
	/** When set, renders as a trailing-metric lozenge (leading icon + metric badge). */
	metric?: string | number;
	metricVariant?: LozengeProps["variant"];
}

export interface SmartLinkAvatar {
	name: string;
	src?: string;
}

export interface SmartLinkPreviewImage {
	kind: "image" | "brand-panel";
	src?: string;
	alt?: string;
	title?: string;
	tone?: SmartLinkTone;
}

export interface SmartLinkAction {
	id: string;
	label: string;
	icon: ReactElement;
	onSelect?: (item: SmartLinkItem, action: SmartLinkAction) => void;
}

export interface SmartLinkItem {
	id: string;
	href: string;
	title: string;
	variant: SmartLinkVariant;
	provider: SmartLinkProvider;
	icon: SmartLinkVisual;
	description?: string;
	metadata?: ReadonlyArray<SmartLinkMetadata>;
	avatars?: ReadonlyArray<SmartLinkAvatar>;
	avatarOverflow?: number;
	previewImage?: SmartLinkPreviewImage;
	assignee?: SmartLinkAvatar;
	author?: SmartLinkAvatar;
	date?: string;
	priority?: SmartLinkPriority;
	status?: {
		label: string;
		variant?: LozengeProps["variant"];
		/** Render a trailing metric badge inside the status lozenge (e.g. a goal score). */
		metric?: string | number;
		/** Render the status as an interactive lozenge dropdown (Jira-style). */
		options?: ReadonlyArray<{ label: string; variant?: LozengeProps["variant"] }>;
	};
	dueDate?: string;
	actions?: ReadonlyArray<SmartLinkAction>;
}

export type SmartLinkPriority = "highest" | "high" | "medium" | "low" | "lowest";

export interface SmartLinkProps {
	item: SmartLinkItem;
	side?: React.ComponentProps<typeof HoverCardContent>["side"];
	align?: React.ComponentProps<typeof HoverCardContent>["align"];
	alignOffset?: React.ComponentProps<typeof HoverCardContent>["alignOffset"];
	positionerClassName?: React.ComponentProps<typeof HoverCardContent>["positionerClassName"];
	/** Inline chip size: "small" (12px label, default) or "large" (16px label). */
	size?: SmartLinkSize;
	/** When true, render the item's status as a lozenge at the end of the inline chip. */
	showStatus?: boolean;
	openDelay?: number;
	closeDelay?: number;
	onOpenChange?: (open: boolean) => void;
	onActionSelect?: (action: SmartLinkAction, item: SmartLinkItem) => void;
	onRemove?: () => void;
	removeVariant?: "overlay";
	removeButtonLabel?: string;
	className?: string;
	contentClassName?: string;
}

export interface SmartLinkCardProps {
	item: SmartLinkItem;
	onActionSelect?: (action: SmartLinkAction, item: SmartLinkItem) => void;
	className?: string;
}

type SmartLinkVisualSize = "trigger" | "card" | "footer";
type AtlaskitIconSize = "small" | "medium";
type SmartLinkIconTileSize = NonNullable<ComponentProps<typeof IconTile>["size"]>;
type SmartLinkIconTileVariant = NonNullable<ComponentProps<typeof IconTile>["variant"]>;

const toneClasses: Record<SmartLinkTone, string> = {
	neutral: "bg-bg-neutral text-icon-subtle",
	information: "bg-bg-information-subtler text-icon-information",
	discovery: "bg-bg-discovery-subtler text-icon-discovery",
	magenta: "bg-bg-accent-magenta-subtler text-icon-accent-magenta",
	warning: "bg-bg-warning text-icon-warning",
};

const toneIconTileVariants: Record<SmartLinkTone, SmartLinkIconTileVariant> = {
	neutral: "gray",
	information: "blue",
	discovery: "purple",
	magenta: "magenta",
	warning: "yellow",
};

const visualLogoSizes: Record<SmartLinkVisualSize, NonNullable<LogoProps["size"]>> = {
	trigger: "xxsmall",
	card: "small",
	footer: "xxsmall",
};

const visualIconSizes: Record<SmartLinkVisualSize, AtlaskitIconSize> = {
	trigger: "small",
	card: "medium",
	footer: "small",
};

const visualIconTileSizes: Record<SmartLinkVisualSize, SmartLinkIconTileSize> = {
	trigger: "xxsmall",
	card: "small",
	footer: "xxsmall",
};

// Inline chip geometry per size. `small` keeps the original VPK Tag metrics
// (12px label on a 20px pill); `large` scales the label to 16px on a 28px pill
// for prominent references.
const triggerSizeClasses: Record<SmartLinkSize, string> = {
	small: "h-5 gap-1 ps-px pe-[3px] text-xs leading-4",
	large: "h-7 gap-1.5 ps-1 pe-1 text-base leading-6",
};

// Icon wrapper size. App logos (AtlassianLogo/BrandLogoMark) render an
// intrinsically 16px glyph at the trigger size, so both chip sizes keep a 16px
// wrapper that hugs the glyph — a larger box leaves dead space to the right of
// the left-aligned SVG. `[&>*]:size-full` stretches the logo's container span to
// the wrapper (a no-op at 16px, but keeps other visual kinds filling the box).
const triggerVisualClasses: Record<SmartLinkSize, string> = {
	small: "size-4 [&>svg]:size-4",
	large: "size-4 [&>svg]:size-4",
};

// Status lozenge height per chip size so it fits inside the pill's inner height
// without being clipped by the chip's `overflow-hidden`.
const triggerStatusClasses: Record<SmartLinkSize, string> = {
	small: "h-4 text-[11px]",
	large: "h-5 text-xs",
};

// Right padding when a status lozenge trails the label. A bare-text chip pads the
// right more than its top/bottom gap; the lozenge already carries its own inset,
// so tighten the right padding per size until the gap beside it equals the chip's
// top/bottom gap (each value = top/bottom gap − 1px chip border).
const triggerStatusPaddingClasses: Record<SmartLinkSize, string> = {
	small: "pe-px", // 1px pad + 1px border = 2px, matching the 2px top/bottom gap
	large: "pe-[3px]", // 3px pad + 1px border = 4px, matching the 4px top/bottom gap
};

// Goal chips tint their leading icon to match the trailing status lozenge tone
// (e.g. an "On track"/success goal renders a green target), so the icon and
// score lozenge read as one status signal. Keyed by the item's status variant.
const goalIconToneClasses: Record<NonNullable<LozengeProps["variant"]>, string> = {
	neutral: "text-icon-subtle",
	success: "text-icon-success",
	danger: "text-icon-danger",
	information: "text-icon-information",
	discovery: "text-icon-discovery",
	warning: "text-icon-warning",
	"accent-red": "text-icon-accent-red",
	"accent-orange": "text-icon-accent-orange",
	"accent-yellow": "text-icon-accent-yellow",
	"accent-lime": "text-icon-accent-lime",
	"accent-green": "text-icon-accent-green",
	"accent-teal": "text-icon-accent-teal",
	"accent-blue": "text-icon-accent-blue",
	"accent-purple": "text-icon-accent-purple",
	"accent-magenta": "text-icon-accent-magenta",
	"accent-gray": "text-icon-accent-gray",
};

const previewToneClasses: Record<SmartLinkTone, string> = {
	neutral: "bg-bg-neutral text-text",
	information: "bg-blue-700 text-white",
	discovery: "bg-purple-700 text-white",
	magenta: "bg-bg-accent-magenta-subtler text-text-accent-magenta-bolder",
	warning: "bg-bg-warning text-text-warning-bolder",
};

function cloneIcon(icon: ReactElement, iconSize?: AtlaskitIconSize, className?: string) {
	if (!isValidElement(icon)) {
		return icon;
	}

	const iconElement = icon as ReactElement<{ color?: string; label?: string; className?: string; size?: AtlaskitIconSize }>;

	return cloneElement(iconElement, {
		color: "currentColor",
		label: "",
		size: iconSize,
		className: cn(className, iconElement.props.className),
	});
}

function renderVisual(visual: SmartLinkVisual, size: SmartLinkVisualSize = "card", iconClassName?: string) {
	const logoSize = visualLogoSizes[size];
	const iconSize = visualIconSizes[size];
	const iconTileElement = size === "trigger" ? "span" : "div";

	if (visual.kind === "atlassian") {
		return <AtlassianLogo name={visual.name} label="" size={logoSize} withUsageBorder />;
	}

	if (visual.kind === "third-party") {
		return size === "trigger" ? (
			<BrandLogoMark frame="chip" name={visual.name} label="" />
		) : (
			<LogoThirdParty name={visual.name} size={logoSize} />
		);
	}

	if (visual.kind === "image") {
		return size === "trigger" ? (
			<BrandLogoMark frame="chip" src={visual.src} label={visual.alt} />
		) : (
			<CustomLogo src={visual.src} label={visual.alt} size={logoSize} />
		);
	}

	if (visual.kind === "avatar") {
		// Project references use a rounded-square avatar in the front slot (chip and
		// card), matching how project avatars render across the app.
		return (
			<Avatar shape="square" size={size === "card" ? "sm" : "xs"}>
				<AvatarImage alt={visual.alt} src={visual.src} />
				<AvatarFallback>{getInitials(visual.alt)}</AvatarFallback>
			</Avatar>
		);
	}

	if (visual.kind === "icon") {
		return (
			<IconTile
				as={iconTileElement}
				aria-hidden
				className={iconClassName}
				icon={<Icon aria-hidden render={cloneIcon(visual.icon, iconSize)} />}
				label=""
				size={visualIconTileSizes[size]}
				variant="transparent"
			/>
		);
	}

	if (visual.kind === "text") {
		const tileSize = size === "trigger" || size === "footer" ? "size-4 text-[11px]" : "size-6 text-xs";
		return (
			<span
				className={cn(
					"inline-flex shrink-0 items-center justify-center rounded-sm font-bold leading-none",
					tileSize,
					toneClasses[visual.tone ?? "neutral"],
				)}
			>
				{visual.label}
			</span>
		);
	}

	return (
		<IconTile
			as={iconTileElement}
			aria-hidden
			icon={<Icon aria-hidden render={cloneIcon(visual.icon, iconSize)} />}
			label=""
			size={visualIconTileSizes[size]}
			variant={toneIconTileVariants[visual.tone ?? "neutral"]}
		/>
	);
}

function SmartLinkTrigger({
	item,
	open,
	removable = false,
	size = "small",
	showStatus = false,
	className,
	...props
}: Readonly<
	{ item: SmartLinkItem; open: boolean; removable?: boolean; size?: SmartLinkSize; showStatus?: boolean } & ComponentProps<"a">
>) {
	const status = showStatus ? item.status : undefined;
	// A goal chip's leading target icon takes the status lozenge tone so the icon
	// and score badge read as one signal (e.g. green target + "On track" 0.7).
	const goalIconTone =
		item.variant === "goal" && status ? goalIconToneClasses[status.variant ?? "neutral"] : null;

	return (
		<a
			{...props}
			aria-describedby={open ? `smart-link-card-${item.id}` : undefined}
			className={cn(
				// Extends the VPK Tag visual contract: the small size keeps the same
				// compact pill metrics (h-5, text-xs/leading-4, rounded-sm) so the
				// inline chip sits on a single text line; the large size scales the
				// label to 16px. Per-size gaps/padding live in triggerSizeClasses.
				"group/smart-link relative inline-flex min-w-0 shrink-0 items-center self-start overflow-hidden rounded-sm border border-border bg-bg-neutral-subtle py-0 align-middle font-normal text-link no-underline outline-none transition-[background-color,border-color,box-shadow] duration-fast ease-out hover:border-border-selected hover:bg-bg-neutral-subtle-hovered focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
				triggerSizeClasses[size],
				// Match the gap beside a trailing status lozenge to the chip's
				// top/bottom gap (see triggerStatusPaddingClasses).
				status ? triggerStatusPaddingClasses[size] : null,
				// Cap the chip at the parent's available width (`max-w-full`) so a long
				// label truncates in place instead of pushing a trailing status lozenge
				// outside the container. Without a status the chip keeps its own
				// content-hugging cap so short inline references stay compact.
				status ? "max-w-full" : "max-w-[11.25rem]",
				open && "border-border-selected",
				className,
			)}
			href={item.href}
		>
			<span
				className={cn(
					"flex shrink-0 items-center justify-center [&>*]:size-full",
					triggerVisualClasses[size],
				)}
			>
				{renderVisual(item.icon, "trigger", goalIconTone ?? undefined)}
			</span>
			<span
				className={cn(
					"min-w-0 grow truncate whitespace-nowrap",
					removable &&
						!status &&
						"group-hover/smart-link-remove:[mask-image:linear-gradient(to_right,#000_calc(100%-2.25rem),transparent_calc(100%-1.25rem))] group-focus-within/smart-link-remove:[mask-image:linear-gradient(to_right,#000_calc(100%-2.25rem),transparent_calc(100%-1.25rem))] group-hover/smart-link-remove:[-webkit-mask-image:linear-gradient(to_right,#000_calc(100%-2.25rem),transparent_calc(100%-1.25rem))] group-focus-within/smart-link-remove:[-webkit-mask-image:linear-gradient(to_right,#000_calc(100%-2.25rem),transparent_calc(100%-1.25rem))]",
				)}
				data-smart-link-text
			>
				{item.title}
			</span>
			{status ? (
				<Lozenge
					className={cn(
						"shrink-0",
						triggerStatusClasses[size],
						removable &&
							"group-hover/smart-link-remove:[mask-image:linear-gradient(to_right,#000_calc(100%-1.5rem),transparent_calc(100%-1rem))] group-focus-within/smart-link-remove:[mask-image:linear-gradient(to_right,#000_calc(100%-1.5rem),transparent_calc(100%-1rem))] group-hover/smart-link-remove:[-webkit-mask-image:linear-gradient(to_right,#000_calc(100%-1.5rem),transparent_calc(100%-1rem))] group-focus-within/smart-link-remove:[-webkit-mask-image:linear-gradient(to_right,#000_calc(100%-1.5rem),transparent_calc(100%-1rem))]",
					)}
					metric={status.metric}
					variant={status.variant ?? "neutral"}
				>
					{status.label}
				</Lozenge>
			) : null}
		</a>
	);
}

function SmartLinkAvatarStack({
	avatars,
	overflow,
}: Readonly<{ avatars?: ReadonlyArray<SmartLinkAvatar>; overflow?: number }>) {
	if (!avatars?.length) {
		return null;
	}

	return (
		<div className="flex items-center pl-0.5">
			{avatars.slice(0, 3).map((avatar, index) => (
				<Avatar
					key={avatar.name}
					className={cn(index > 0 && "-ml-2")}
					label={avatar.name}
					size="sm"
				>
					{avatar.src ? <AvatarImage alt={avatar.name} src={avatar.src} /> : null}
					<AvatarFallback>{getInitials(avatar.name)}</AvatarFallback>
				</Avatar>
			))}
			{overflow ? (
				<span className="-ml-1 inline-flex size-6 items-center justify-center rounded-full bg-bg-neutral text-xs leading-4 text-text">
					+{overflow}
				</span>
			) : null}
		</div>
	);
}

function getInitials(name: string) {
	return name
		.split(/\s+/u)
		.map((part) => part[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();
}

const priorityPresentations: Record<SmartLinkPriority, { icon: ReactElement; label: string }> = {
	highest: { icon: <PriorityHighestIcon label="" color={token("color.icon.danger")} />, label: "Highest" },
	high: { icon: <PriorityHighIcon label="" color={token("color.icon.danger")} />, label: "High" },
	medium: { icon: <PriorityMediumIcon label="" color={token("color.icon.warning")} />, label: "Medium" },
	low: { icon: <PriorityLowIcon label="" color={token("color.icon.information")} />, label: "Low" },
	lowest: { icon: <PriorityMinorIcon label="" color={token("color.icon.information")} />, label: "Minor" },
};

function SmartLinkAssigneeAvatar({ assignee }: Readonly<{ assignee: SmartLinkAvatar }>) {
	return (
		<Avatar label={assignee.name} size="sm">
			{assignee.src ? <AvatarImage alt={assignee.name} src={assignee.src} /> : null}
			<AvatarFallback>{getInitials(assignee.name)}</AvatarFallback>
		</Avatar>
	);
}

function SmartLinkPriorityIndicator({ priority }: Readonly<{ priority: SmartLinkPriority }>) {
	const presentation = priorityPresentations[priority];

	return (
		<span className="inline-flex items-center gap-1 text-sm leading-5 text-text-subtle">
			<Icon render={presentation.icon} aria-hidden />
			{presentation.label}
		</span>
	);
}

const lozengeToBadgeVariant: Partial<Record<NonNullable<LozengeProps["variant"]>, BadgeProps["variant"]>> = {
	neutral: "neutral",
	success: "success",
	danger: "danger",
	warning: "warning",
	information: "information",
	discovery: "discovery",
};

function badgeVariantForLozenge(variant: NonNullable<LozengeProps["variant"]>): BadgeProps["variant"] {
	return lozengeToBadgeVariant[variant] ?? "neutral";
}

function SmartLinkStatusDropdown({
	status,
}: Readonly<{ status: NonNullable<SmartLinkItem["status"]> }>) {
	const [selected, setSelected] = useState({ label: status.label, variant: status.variant ?? "neutral" });
	const options = status.options ?? [];

	if (!options.length) {
		const variant = status.variant ?? "neutral";

		return (
			<Lozenge className={cn(status.metric != null && "pr-px")} variant={variant}>
				{status.label}
				{status.metric != null ? (
					<Badge className="ml-1 min-w-0" variant={badgeVariantForLozenge(variant)}>
						{status.metric}
					</Badge>
				) : null}
			</Lozenge>
		);
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<LozengeDropdownTrigger
						aria-label={`Status: ${selected.label}`}
						maxWidth="160px"
						variant={selected.variant}
					/>
				}
			>
				{selected.label}
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="w-44 p-0" sideOffset={6}>
				<DropdownMenuGroup className="p-0 py-2">
					{options.map((option) => (
						<DropdownMenuItem
							aria-current={option.label === selected.label ? "true" : undefined}
							className={cn(
								"rounded-none border-l-2 border-l-transparent px-0 py-2.5 pl-2.5",
								option.label === selected.label && "border-l-border-selected bg-bg-neutral",
							)}
							key={option.label}
							onSelect={() => setSelected({ label: option.label, variant: option.variant ?? "neutral" })}
						>
							<Lozenge variant={option.variant ?? "neutral"}>{option.label}</Lozenge>
						</DropdownMenuItem>
					))}
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function MetadataPill({ metadata }: Readonly<{ metadata: SmartLinkMetadata }>) {
	if (metadata.metric != null) {
		// Icon-only metrics (e.g. reactions, comment counts) render as a bare
		// icon + number, not wrapped in a lozenge/badge.
		if (!metadata.label) {
			return (
				<span className="inline-flex min-h-5 items-center gap-1 text-sm leading-5 text-text-subtle">
					{metadata.icon ? <Icon render={cloneIcon(metadata.icon, "small")} aria-hidden /> : null}
					{metadata.metric}
				</span>
			);
		}

		const variant = metadata.metricVariant ?? "neutral";

		return (
			<Lozenge
				className="pr-0.5"
				icon={metadata.icon ? <Icon render={cloneIcon(metadata.icon, "small")} aria-hidden /> : undefined}
				variant={variant}
			>
				{metadata.label}
				<Badge className="ml-1 min-w-0" variant="neutral">
					{metadata.metric}
				</Badge>
			</Lozenge>
		);
	}

	return (
		<span
			className={cn(
				"inline-flex min-h-5 items-center gap-1 text-sm leading-5 text-text-subtle",
				metadata.tone ? cn("rounded-md px-1.5", toneClasses[metadata.tone]) : null,
			)}
		>
			{metadata.icon ? <Icon render={cloneIcon(metadata.icon, "small")} /> : null}
			{metadata.label}
		</span>
	);
}

function SmartLinkMetadataRow({ item }: Readonly<{ item: SmartLinkItem }>) {
	const hasMetadata = Boolean(item.metadata?.length);
	const hasGoalDetails = item.status || item.dueDate;
	const hasIssueDetails = item.assignee || item.priority;
	const hasAuthorDetails = item.author || item.date;

	if (!item.avatars?.length && !hasMetadata && !hasGoalDetails && !hasIssueDetails && !hasAuthorDetails) {
		return null;
	}

	return (
		<div className="flex min-w-0 flex-wrap items-center gap-2 text-sm leading-5 text-text-subtle">
			<SmartLinkAvatarStack avatars={item.avatars} overflow={item.avatarOverflow} />
			{item.assignee ? <SmartLinkAssigneeAvatar assignee={item.assignee} /> : null}
			{item.author ? (
				<span className="inline-flex min-w-0 items-center gap-2">
					<SmartLinkAssigneeAvatar assignee={item.author} />
					<span className="truncate">{item.author.name}</span>
				</span>
			) : null}
			{item.author && item.date ? <span aria-hidden>·</span> : null}
			{item.date ? <span className="truncate">{item.date}</span> : null}
			{item.metadata?.map((metadata, index) => (
				<span className="inline-flex items-center gap-2" key={`${metadata.label}-${index}`}>
					{index > 0 ? <span aria-hidden>·</span> : null}
					<MetadataPill metadata={metadata} />
				</span>
			))}
			{item.status ? <SmartLinkStatusDropdown status={item.status} /> : null}
			{item.priority ? <SmartLinkPriorityIndicator priority={item.priority} /> : null}
			{item.dueDate ? (
				<span className="inline-flex h-5 items-center rounded-sm border border-border-bold bg-surface px-1.5 text-xs leading-4 text-text">
					{item.dueDate}
				</span>
			) : null}
		</div>
	);
}

function SmartLinkPreviewMedia({ image }: Readonly<{ image: SmartLinkPreviewImage }>) {
	if (image.kind === "image" && image.src) {
		return (
			<div className="relative h-[180px] w-full overflow-hidden bg-bg-neutral">
				<Image
					alt={image.alt ?? ""}
					className="object-cover"
					fill
					src={image.src}
					sizes="400px"
				/>
			</div>
		);
	}

	return (
		<div
			className={cn(
				"flex h-[180px] w-full items-center justify-center px-8 text-center text-4xl font-bold leading-none",
				previewToneClasses[image.tone ?? "neutral"],
			)}
		>
			{image.title}
		</div>
	);
}

function SmartLinkActionRow({
	action,
	item,
	onActionSelect,
}: Readonly<{
	action: SmartLinkAction;
	item: SmartLinkItem;
	onActionSelect?: (action: SmartLinkAction, item: SmartLinkItem) => void;
}>) {
	const handleClick = () => {
		action.onSelect?.(item, action);
		onActionSelect?.(action, item);
	};

	return (
		<button
			className="flex min-h-8 w-full cursor-pointer items-center gap-3 bg-transparent px-4 py-1.5 text-left text-sm leading-5 text-text-subtle outline-none transition-colors duration-fast ease-out hover:bg-bg-neutral-subtle-hovered focus-visible:bg-bg-neutral-subtle-hovered focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/50"
			onClick={handleClick}
			type="button"
		>
			<IconTile
				aria-hidden
				className="text-icon-subtle"
				icon={cloneIcon(action.icon, "small")}
				label=""
				size="small"
				variant="transparent"
			/>
			<span className="truncate">{action.label}</span>
		</button>
	);
}

function SmartLinkFooter({ provider }: Readonly<{ provider: SmartLinkProvider }>) {
	return (
		<div className="flex items-center gap-1 px-5 pt-2 pb-4 text-xs leading-4 text-text-subtlest">
			{provider.logo ? renderVisual(provider.logo, "footer") : null}
			<span className="truncate">{provider.name}</span>
		</div>
	);
}

export function SmartLinkCard({
	item,
	onActionSelect,
	className,
}: Readonly<SmartLinkCardProps>) {
	const titleId = useId();

	return (
		<div
			aria-labelledby={titleId}
			className={cn("w-[400px] overflow-hidden rounded-lg bg-surface-overlay text-text shadow-2xl", className)}
			id={`smart-link-card-${item.id}`}
			role="group"
		>
			{item.previewImage ? <SmartLinkPreviewMedia image={item.previewImage} /> : null}
			<div className="flex flex-col gap-2 px-4 pt-4 pb-2">
				<div className="flex min-w-0 items-center gap-2">
					<span className="inline-flex shrink-0 items-center">{renderVisual(item.icon, "card")}</span>
					<h3 id={titleId} className="line-clamp-2 min-w-0 flex-1 text-sm font-semibold leading-5 text-link">
						{item.title}
					</h3>
				</div>
				<SmartLinkMetadataRow item={item} />
			</div>
			{item.description ? (
				<div className="px-4 py-1">
					<p className="line-clamp-3 text-sm leading-5 text-text">
						{item.description}
					</p>
				</div>
			) : null}
			{item.actions?.length ? (
				<div className="flex w-full flex-col py-1">
					{item.actions.map((action) => (
						<SmartLinkActionRow
							action={action}
							item={item}
							key={action.id}
							onActionSelect={onActionSelect}
						/>
					))}
				</div>
			) : null}
			<SmartLinkFooter provider={item.provider} />
		</div>
	);
}

export function SmartLink({
	item,
	side = "bottom",
	align = "start",
	alignOffset,
	positionerClassName,
	size = "small",
	showStatus = false,
	openDelay = 120,
	closeDelay = 80,
	onOpenChange,
	onActionSelect,
	onRemove,
	removeVariant,
	removeButtonLabel,
	className,
	contentClassName,
}: Readonly<SmartLinkProps>) {
	const [open, setOpen] = useState(false);
	const isRemovableOverlay = Boolean(onRemove) && removeVariant === "overlay";

	const handleOpenChange = (nextOpen: boolean) => {
		setOpen(nextOpen);
		onOpenChange?.(nextOpen);
	};

	const hoverCard = (
		<HoverCard
			closeDelay={closeDelay}
			onOpenChange={handleOpenChange}
			open={open}
			openDelay={openDelay}
		>
			<HoverCardTrigger
				render={
					<SmartLinkTrigger
						className={className}
						item={item}
						open={open}
						removable={isRemovableOverlay}
						showStatus={showStatus}
						size={size}
					/>
				}
			/>
			<HoverCardContent
				align={align}
				alignOffset={alignOffset}
				className="w-auto border-0 bg-transparent p-0 text-text shadow-none"
				positionerClassName={positionerClassName}
				side={side}
				sideOffset={8}
			>
				<SmartLinkCard
					className={contentClassName}
					item={item}
					onActionSelect={onActionSelect}
				/>
			</HoverCardContent>
		</HoverCard>
	);

	if (!isRemovableOverlay) {
		return hoverCard;
	}

	return (
		<span className="group/smart-link-remove relative inline-flex min-w-0 max-w-full shrink-0 self-start">
			{hoverCard}
			<button
				aria-label={removeButtonLabel ?? `Remove ${item.title}`}
				className="pointer-events-none absolute end-0.5 top-1/2 inline-flex size-4 -translate-y-1/2 items-center justify-center rounded-xs border-0 bg-transparent text-text opacity-0 transition-[opacity,background-color] duration-fast ease-out-practical motion-reduce:transition-none hover:bg-bg-neutral-subtle-hovered active:bg-bg-neutral-subtle-pressed focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none group-hover/smart-link-remove:pointer-events-auto group-hover/smart-link-remove:opacity-100 group-focus-within/smart-link-remove:pointer-events-auto group-focus-within/smart-link-remove:opacity-100"
				data-slot="smart-link-remove-overlay-button"
				onClick={(event) => {
					event.stopPropagation();
					onRemove?.();
				}}
				type="button"
			>
				<Icon render={<CrossIcon label="" size="small" color="currentColor" />} aria-hidden />
			</button>
		</span>
	);
}

export const SMART_LINK_FALLBACK_ICON = { kind: "icon-tile", icon: <PageIcon label="" size="medium" /> } satisfies SmartLinkVisual;
