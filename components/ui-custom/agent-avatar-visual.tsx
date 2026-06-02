"use client";

import Image from "next/image";

import { AtlassianLogo, type AtlassianLogoName, type LogoProps } from "@/components/ui/logo";

/** Maps a square pixel size to the nearest ADS logo size token. */
const PX_TO_LOGO_SIZE: Record<number, LogoProps["size"]> = {
	16: "xxsmall",
	20: "xsmall",
	24: "small",
	32: "medium",
	40: "large",
	48: "xlarge",
};

export interface AgentAvatarVisualProps {
	avatarSrc?: string;
	/** When set, renders the ADS brand logo instead of an `avatarSrc` image. */
	logoName?: AtlassianLogoName;
	label?: string;
	/** Square pixel size for both the image and the logo. */
	sizePx: number;
	className?: string;
	loading?: "eager" | "lazy";
}

/**
 * Renders an agent's avatar as either the ADS brand logo (when `logoName` is set)
 * or a static image (`avatarSrc`). Returns null when neither is provided.
 */
export function AgentAvatarVisual({
	avatarSrc,
	logoName,
	label,
	sizePx,
	className,
	loading,
}: Readonly<AgentAvatarVisualProps>) {
	if (logoName) {
		return <AtlassianLogo name={logoName} size={PX_TO_LOGO_SIZE[sizePx] ?? "small"} themeAware label={label} />;
	}

	return avatarSrc ? (
		<Image
			alt=""
			aria-hidden
			className={className}
			height={sizePx}
			loading={loading}
			src={avatarSrc}
			width={sizePx}
		/>
	) : null;
}
