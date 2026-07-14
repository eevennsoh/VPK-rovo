"use client";

import type { ReactNode } from "react";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import ChevronUpIcon from "@atlaskit/icon/core/chevron-up";
import DevicesIcon from "@atlaskit/icon/core/devices";
import ThemeIcon from "@atlaskit/icon/core/theme";

import { Icon } from "@/components/ui/icon";
import { useTheme } from "@/components/utils/theme-wrapper";
import Squircle from "@/components/website/demos/visual/shaders/squircle";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

// 32×32 squircle icon button.
const TOGGLE_SIZE = 32;
const GALLERY_CONTROL_BUTTON_CLASS_NAME =
	"inline-flex cursor-pointer border-0 bg-transparent p-0 text-icon-inverse outline-none transition-opacity duration-normal ease-out-practical hover:opacity-90 active:opacity-80 motion-reduce:transition-none rounded-[10px] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

type GalleryTheme = "light" | "dark" | "system";

export interface GalleryToggleProps {
	open: boolean;
	onToggle: () => void;
	className?: string;
}

function getThemeLabel(theme: GalleryTheme): string {
	if (theme === "light") return "Light";
	if (theme === "dark") return "Dark";
	return "System";
}

function getNextTheme(theme: GalleryTheme): GalleryTheme {
	if (theme === "light") return "dark";
	if (theme === "dark") return "system";
	return "light";
}

function renderThemeIcon(theme: GalleryTheme) {
	return theme === "system" ? (
		<DevicesIcon label="" color="currentColor" size="small" />
	) : (
		<ThemeIcon label="" color="currentColor" size="small" />
	);
}

function GalleryControlSquircle({ children }: Readonly<{ children: ReactNode }>) {
	return (
		<Squircle
			width={TOGGLE_SIZE}
			height={TOGGLE_SIZE}
			strokeWidth={0}
			fillColor={token("color.background.neutral.bold")}
			style={{ boxShadow: token("elevation.shadow.overlay") }}
		>
			{children}
		</Squircle>
	);
}

export function GalleryToggle({
	open,
	onToggle,
	className,
}: Readonly<GalleryToggleProps>) {
	const { theme, setTheme } = useTheme();
	const themeLabel = getThemeLabel(theme);

	return (
		<div
			className={cn(
				// Anchored top-right, independent of the bottom-pinned strip.
				"fixed top-4 right-4 z-40 inline-flex items-center gap-2",
				className,
			)}
		>
			<button
				type="button"
				aria-label={`Cycle theme, current theme: ${themeLabel}`}
				onClick={() => setTheme(getNextTheme(theme))}
				className={GALLERY_CONTROL_BUTTON_CLASS_NAME}
			>
				<GalleryControlSquircle>
					<Icon render={renderThemeIcon(theme)} />
				</GalleryControlSquircle>
			</button>

			<button
				type="button"
				aria-expanded={open}
				// Icon-only control → needs an explicit accessible name (it also states the
				// action + current state).
				aria-label={open ? "Close gallery" : "Open gallery"}
				onClick={() => onToggle()}
				className={GALLERY_CONTROL_BUTTON_CLASS_NAME}
			>
				{/* Dark "inverse" squircle matching the Rovo floating button: the
				    color.background.neutral.bold token is DARK in light mode and LIGHT in
				    dark mode, carrying the same subtle overlay drop shadow. The chevron
				    points UP to reveal the strip (closed) and DOWN to dismiss it (open). */}
				<GalleryControlSquircle>
					<Icon
						render={
							open ? (
								<ChevronDownIcon label="" color="currentColor" size="small" />
							) : (
								<ChevronUpIcon label="" color="currentColor" size="small" />
							)
						}
					/>
				</GalleryControlSquircle>
			</button>
		</div>
	);
}
