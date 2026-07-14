"use client";

import type { ReactNode } from "react";

import { Avatar, AvatarFallback, AvatarImage, type AvatarProps } from "@/components/ui/avatar";
import { AtlassianLogo, type AtlassianLogoName, type LogoProps } from "@/components/ui/logo";
import { LogoThirdParty } from "@/components/ui/logo-third-party";
import type { ThirdPartyLogoName } from "@/components/ui/data/logo-third-party-data";
import { cn } from "@/lib/utils";

/** Maps a square pixel size to the nearest ADS logo size token. */
const PX_TO_LOGO_SIZE: Record<number, LogoProps["size"]> = {
	16: "xxsmall",
	20: "xsmall",
	24: "small",
	32: "medium",
	40: "large",
	48: "xlarge",
};

/** Maps a square pixel size to the nearest Avatar size token. */
const PX_TO_AVATAR_SIZE: Record<number, NonNullable<AvatarProps["size"]>> = {
	16: "xs",
	20: "sm",
	24: "sm",
	32: "default",
	40: "lg",
	48: "xl",
};

/** Agent brand marks stay inset while the hexagon owns the visible frame. */
const PX_TO_INSET_LOGO_SIZE: Record<number, LogoProps["size"]> = {
	16: "xxsmall",
	20: "xxsmall",
	24: "xsmall",
	32: "xsmall",
	40: "xsmall",
	48: "small",
};

/** Third-party marks use a larger 24px glyph in directory and docs avatars. */
const PX_TO_EXTERNAL_LOGO_SIZE: Record<number, LogoProps["size"]> = {
	16: "xxsmall",
	20: "xxsmall",
	24: "small",
	32: "small",
	40: "small",
	48: "small",
};

const PX_TO_INSET_IMAGE_CLASS_NAME: Record<number, string> = {
	16: "size-3",
	20: "size-3",
	24: "size-5",
	32: "size-5",
	40: "size-5",
	48: "size-5",
};

const avatarSizeFromPx = (px: number): NonNullable<AvatarProps["size"]> => PX_TO_AVATAR_SIZE[px] ?? "sm";

export interface AgentAvatarVisualProps {
	avatarSrc?: string;
	/** When set, renders the ADS brand logo instead of an `avatarSrc` image. */
	logoName?: AtlassianLogoName;
	/** When set, renders the upstream `@atlassian/logo-third-party` mark (3P brands). */
	brandName?: ThirdPartyLogoName;
	label?: string;
	/** Square pixel size for both the image and the logo. */
	sizePx: number;
	/** Inset an image mark instead of rendering it full-bleed. `/2p/` assets are inset automatically. */
	inset?: boolean;
	/** Initials shown when no visual source is available. */
	fallbackText?: string;
	/** Avatar overlays such as company or project badges. */
	children?: ReactNode;
	avatarClassName?: string;
	className?: string;
	loading?: "eager" | "lazy";
}

/**
 * Renders every agent identity through the shared hexagon avatar. 1P agent art
 * stays full-bleed; 2P partner marks are inset from `/public/2p`; and 3P marks
 * use the borderless glyph from `@atlassian/logo-third-party`.
 */
export function AgentAvatarVisual({
	avatarSrc,
	logoName,
	brandName,
	label,
	sizePx,
	inset = false,
	fallbackText,
	children,
	avatarClassName,
	className,
	loading,
}: Readonly<AgentAvatarVisualProps>) {
	if (!avatarSrc && !logoName && !brandName && !fallbackText) return null;

	const isSecondPartyAgent = avatarSrc?.startsWith("/2p/") ?? false;
	const isThirdPartyAgent = Boolean(brandName);
	const isExternalAgent = isSecondPartyAgent || isThirdPartyAgent;
	const hasWhiteBackdrop = isExternalAgent || logoName === "atlassian";
	const shouldInsetImage = inset || isExternalAgent;
	const insetImageClassName = PX_TO_INSET_IMAGE_CLASS_NAME[sizePx] ?? "size-4";
	const insetLogoSize = PX_TO_INSET_LOGO_SIZE[sizePx] ?? PX_TO_LOGO_SIZE[sizePx] ?? "xxsmall";
	const externalLogoSize = PX_TO_EXTERNAL_LOGO_SIZE[sizePx] ?? insetLogoSize;
	const visual = logoName ? (
		<AtlassianLogo label="" name={logoName} size={insetLogoSize} themeAware />
	) : brandName ? (
		<LogoThirdParty borderless label="" name={brandName} size={externalLogoSize} />
	) : avatarSrc ? (
		<>
			<AvatarImage
				alt=""
				className={cn(shouldInsetImage ? insetImageClassName : "size-full", "object-contain", className)}
				loading={loading}
				src={avatarSrc}
			/>
			{fallbackText ? <AvatarFallback>{fallbackText}</AvatarFallback> : null}
		</>
	) : (
		<AvatarFallback>{fallbackText}</AvatarFallback>
	);

	return (
		<Avatar className={avatarClassName} label={label} shape="hexagon" size={avatarSizeFromPx(sizePx)}>
			{hasWhiteBackdrop ? (
				<span className="flex size-full items-center justify-center bg-[#fff]">{visual}</span>
			) : (
				visual
			)}
			{children}
		</Avatar>
	);
}
