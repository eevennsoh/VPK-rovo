"use client";

import Image from "next/image";

import { AtlassianLogo, type AtlassianLogoName, type LogoProps } from "@/components/ui/logo";
import { LogoThirdParty } from "@/components/ui/logo-third-party";
import type { ThirdPartyLogoName } from "@/components/ui/data/logo-third-party-data";

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
	/** When set, renders the upstream `@atlassian/logo-third-party` mark (3P brands). */
	brandName?: ThirdPartyLogoName;
	label?: string;
	/** Square pixel size for both the image and the logo. */
	sizePx: number;
	className?: string;
	loading?: "eager" | "lazy";
}

/**
 * Renders an agent's avatar as the ADS brand logo (`logoName`), the upstream
 * third-party package mark (`brandName`), or a static image (`avatarSrc`).
 * Returns null when none is provided.
 */
export function AgentAvatarVisual({
	avatarSrc,
	logoName,
	brandName,
	label,
	sizePx,
	className,
	loading,
}: Readonly<AgentAvatarVisualProps>) {
	if (logoName) {
		return <AtlassianLogo name={logoName} size={PX_TO_LOGO_SIZE[sizePx] ?? "small"} themeAware label={label} />;
	}

	if (brandName) {
		return <LogoThirdParty name={brandName} size={PX_TO_LOGO_SIZE[sizePx] ?? "small"} label={label ?? ""} />;
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
