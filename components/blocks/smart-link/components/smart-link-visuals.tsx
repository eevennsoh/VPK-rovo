"use client";

// oxlint-disable react-doctor/only-export-components -- This module intentionally exports colocated component API, variant contracts, context contracts, or metadata used by consumers.

// How a smart link paints its visuals: the front-slot glyph (logo, tile, avatar,
// or text mark), the tone lookups those slots read from, and the card's preview
// media. Kept out of `smart-link.tsx` so that file owns composition and behavior
// while this one owns presentation — and so neither crosses the file-size budget.

import { cloneElement, type ComponentProps, type ReactElement } from "react";
import Image from "next/image";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Icon } from "@/components/ui/icon";
import { IconTile } from "@/components/ui/icon-tile";
import { AtlassianLogo, CustomLogo, type LogoProps } from "@/components/ui/logo";
import { BrandLogoMark } from "@/components/ui/logo-mark";
import { LogoThirdParty } from "@/components/ui/logo-third-party";
import { type LozengeProps } from "@/components/ui/lozenge";
import { cn } from "@/lib/utils";

import type {
	SmartLinkItem,
	SmartLinkPreviewImage,
	SmartLinkTone,
	SmartLinkVisual,
} from "@/components/blocks/smart-link/components/smart-link-types";

export type SmartLinkVisualSize = "trigger" | "card" | "footer";
export type AtlaskitIconSize = "small" | "medium";
type SmartLinkIconTileSize = NonNullable<ComponentProps<typeof IconTile>["size"]>;
type SmartLinkIconTileVariant = NonNullable<ComponentProps<typeof IconTile>["variant"]>;

export const toneClasses: Record<SmartLinkTone, string> = {
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

// Goals and pull requests tint their leading glyph to match the status lozenge
// tone, so the icon and the status read as one signal (a green target beside
// "On track"; a green pull-request glyph beside "Open"). Keyed by status variant.
const statusIconToneClasses: Record<NonNullable<LozengeProps["variant"]>, string> = {
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

/**
 * The leading-glyph tint for variants whose icon should echo their status tone.
 * Returns `undefined` for every other variant, which keeps the glyph's own color.
 */
export function statusIconTone(
	variant: SmartLinkItem["variant"],
	status: SmartLinkItem["status"],
): string | undefined {
	if (!status || (variant !== "goal" && variant !== "pull-request")) {
		return undefined;
	}
	return statusIconToneClasses[status.variant ?? "neutral"];
}

export function cloneIcon(icon: ReactElement, iconSize?: AtlaskitIconSize, className?: string) {
	const iconElement = icon as ReactElement<{ color?: string; label?: string; className?: string; size?: AtlaskitIconSize }>;

	return cloneElement(iconElement, {
		color: "currentColor",
		label: "",
		size: iconSize,
		className: cn(className, iconElement.props.className),
	});
}

export function getInitials(name: string) {
	return name
		.split(/\s+/u)
		.map((part) => part[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();
}

export function renderVisual(visual: SmartLinkVisual, size: SmartLinkVisualSize = "card", iconClassName?: string) {
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

export function SmartLinkPreviewMedia({ image }: Readonly<{ image: SmartLinkPreviewImage }>) {
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
