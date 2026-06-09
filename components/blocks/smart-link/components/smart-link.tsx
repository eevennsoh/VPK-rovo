"use client";

import { cloneElement, isValidElement, useId, useState, type ComponentProps, type ReactElement } from "react";
import Image from "next/image";
import GrowDiagonalIcon from "@atlaskit/icon/core/grow-diagonal";
import PageIcon from "@atlaskit/icon/core/page";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Icon } from "@/components/ui/icon";
import { AtlassianLogo, type AtlassianLogoName } from "@/components/ui/logo";
import { Lozenge, type LozengeProps } from "@/components/ui/lozenge";
import { cn } from "@/lib/utils";

export type SmartLinkVariant =
	| "confluence"
	| "jira"
	| "team"
	| "goal"
	| "loom"
	| "article"
	| "file"
	| "generic";

export type SmartLinkVisual =
	| { kind: "atlassian"; name: AtlassianLogoName }
	| { kind: "image"; src: string; alt: string }
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
	status?: {
		label: string;
		variant?: LozengeProps["variant"];
	};
	score?: string;
	dueDate?: string;
	actions?: ReadonlyArray<SmartLinkAction>;
}

export interface SmartLinkProps {
	item: SmartLinkItem;
	side?: React.ComponentProps<typeof HoverCardContent>["side"];
	align?: React.ComponentProps<typeof HoverCardContent>["align"];
	openDelay?: number;
	closeDelay?: number;
	onOpenChange?: (open: boolean) => void;
	onActionSelect?: (action: SmartLinkAction, item: SmartLinkItem) => void;
	className?: string;
	contentClassName?: string;
}

export interface SmartLinkCardProps {
	item: SmartLinkItem;
	onActionSelect?: (action: SmartLinkAction, item: SmartLinkItem) => void;
	className?: string;
}

const toneClasses: Record<SmartLinkTone, string> = {
	neutral: "bg-bg-neutral text-icon-subtle",
	information: "bg-bg-information-subtler text-icon-information",
	discovery: "bg-bg-discovery-subtler text-icon-discovery",
	magenta: "bg-bg-accent-magenta-subtler text-icon-accent-magenta",
	warning: "bg-bg-warning text-icon-warning",
};

const previewToneClasses: Record<SmartLinkTone, string> = {
	neutral: "bg-bg-neutral text-text",
	information: "bg-blue-700 text-white",
	discovery: "bg-purple-700 text-white",
	magenta: "bg-bg-accent-magenta-subtler text-text-accent-magenta-bolder",
	warning: "bg-bg-warning text-text-warning-bolder",
};

const variantPreviewLabels: Record<SmartLinkVariant, string> = {
	confluence: "Preview",
	jira: "Preview",
	team: "Preview",
	goal: "Preview",
	loom: "Preview",
	article: "Preview",
	file: "Preview",
	generic: "Preview",
};

function cloneIcon(icon: ReactElement, className?: string) {
	if (!isValidElement(icon)) {
		return icon;
	}

	const iconElement = icon as ReactElement<{ color?: string; label?: string; className?: string }>;

	return cloneElement(iconElement, {
		color: "currentColor",
		label: "",
		className: cn(className, iconElement.props.className),
	});
}

function renderVisual(visual: SmartLinkVisual, size: "trigger" | "card" | "footer" = "card") {
	const imageSize = size === "trigger" || size === "footer" ? 16 : 24;
	const logoSize = size === "trigger" || size === "footer" ? "xxsmall" : "small";

	if (visual.kind === "atlassian") {
		return <AtlassianLogo name={visual.name} size={logoSize} />;
	}

	if (visual.kind === "image") {
		return (
			<Image
				alt={visual.alt}
				className="shrink-0"
				height={imageSize}
				src={visual.src}
				width={imageSize}
			/>
		);
	}

	if (visual.kind === "icon") {
		return <Icon className="size-5 text-icon-subtle" render={cloneIcon(visual.icon)} />;
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
		<span
			className={cn(
				"inline-flex size-6 shrink-0 items-center justify-center rounded-tile",
				toneClasses[visual.tone ?? "neutral"],
			)}
		>
			<Icon className="size-4" render={cloneIcon(visual.icon)} />
		</span>
	);
}

function SmartLinkPreviewBadge({
	open,
	variant,
}: Readonly<{ open: boolean; variant: SmartLinkVariant }>) {
	return (
		<span
			className={cn(
				"pointer-events-none -ml-1 inline-flex h-6 shrink-0 items-center gap-1 rounded-md bg-bg-neutral px-1.5 text-sm leading-5 text-text-subtle transition-opacity duration-fast ease-out",
				open ? "opacity-100" : "opacity-0 group-hover/smart-link:opacity-100 group-focus/smart-link:opacity-100",
			)}
		>
			<Icon className="size-4" render={<GrowDiagonalIcon label="" size="small" />} />
			<span>{variantPreviewLabels[variant]}</span>
		</span>
	);
}

function SmartLinkTrigger({
	item,
	open,
	className,
	...props
}: Readonly<{ item: SmartLinkItem; open: boolean } & ComponentProps<"a">>) {
	return (
		<a
			{...props}
			aria-describedby={`smart-link-card-${item.id}`}
			className={cn(
				"group/smart-link inline-flex max-w-full items-center gap-1 overflow-hidden rounded-md border border-border bg-surface px-1.5 py-0.5 align-baseline text-link no-underline outline-none transition-[background-color,border-color,box-shadow] duration-fast ease-out hover:border-border-selected hover:bg-surface-hovered focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
				open && "border-border-selected",
				className,
			)}
			href={item.href}
		>
			<span className="inline-flex shrink-0 items-center justify-center">{renderVisual(item.icon, "trigger")}</span>
			<SmartLinkPreviewBadge open={open} variant={item.variant} />
			<span className="min-w-0 truncate text-xl leading-7">{item.title}</span>
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

function MetadataPill({ metadata }: Readonly<{ metadata: SmartLinkMetadata }>) {
	return (
		<span
			className={cn(
				"inline-flex min-h-5 items-center gap-1 rounded-md px-1.5 text-sm leading-5 text-text-subtle",
				metadata.tone ? toneClasses[metadata.tone] : null,
			)}
		>
			{metadata.icon ? <Icon className="size-4" render={cloneIcon(metadata.icon)} /> : null}
			{metadata.label}
		</span>
	);
}

function SmartLinkMetadataRow({ item }: Readonly<{ item: SmartLinkItem }>) {
	const hasMetadata = Boolean(item.metadata?.length);
	const hasGoalDetails = item.status || item.score || item.dueDate;

	if (!item.avatars?.length && !hasMetadata && !hasGoalDetails) {
		return null;
	}

	return (
		<div className="flex min-w-0 flex-wrap items-center gap-2 text-sm leading-5 text-text-subtle">
			<SmartLinkAvatarStack avatars={item.avatars} overflow={item.avatarOverflow} />
			{item.metadata?.map((metadata) => (
				<MetadataPill key={metadata.label} metadata={metadata} />
			))}
			{item.status ? (
				<Lozenge variant={item.status.variant ?? "neutral"}>
					{item.status.label}
				</Lozenge>
			) : null}
			{item.score ? (
				<span className="inline-flex h-5 items-center rounded-sm border border-border-bold bg-bg-neutral px-1 text-xs leading-4 text-text">
					{item.score}
				</span>
			) : null}
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
			className="flex min-h-8 w-full cursor-pointer items-center gap-3 rounded-sm bg-transparent px-4 py-1.5 text-left text-sm leading-5 text-text outline-none transition-colors duration-fast ease-out hover:bg-bg-neutral-subtle-hovered focus-visible:bg-bg-neutral-subtle-hovered focus-visible:ring-3 focus-visible:ring-ring/50"
			onClick={handleClick}
			type="button"
		>
			<Icon className="size-5 text-icon" render={cloneIcon(action.icon)} />
			<span className="truncate">{action.label}</span>
		</button>
	);
}

function SmartLinkFooter({ provider }: Readonly<{ provider: SmartLinkProvider }>) {
	return (
		<div className="flex items-center gap-1 px-4 pt-2 pb-4 text-sm leading-5 text-text-subtlest">
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
					<span className="shrink-0">{renderVisual(item.icon, "card")}</span>
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
	openDelay = 120,
	closeDelay = 80,
	onOpenChange,
	onActionSelect,
	className,
	contentClassName,
}: Readonly<SmartLinkProps>) {
	const [open, setOpen] = useState(false);

	const handleOpenChange = (nextOpen: boolean) => {
		setOpen(nextOpen);
		onOpenChange?.(nextOpen);
	};

	return (
		<HoverCard
			closeDelay={closeDelay}
			onOpenChange={handleOpenChange}
			open={open}
			openDelay={openDelay}
		>
			<HoverCardTrigger render={<SmartLinkTrigger className={className} item={item} open={open} />} />
			<HoverCardContent
				align={align}
				className="w-auto border-0 bg-transparent p-0 text-text shadow-none"
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
}

export const SMART_LINK_FALLBACK_ICON = { kind: "icon-tile", icon: <PageIcon label="" size="medium" /> } satisfies SmartLinkVisual;
