"use client";

import type { ReactNode } from "react";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import ChevronUpIcon from "@atlaskit/icon/core/chevron-up";
import DevicesIcon from "@atlaskit/icon/core/devices";
import RetryIcon from "@atlaskit/icon/core/retry";
import ThemeIcon from "@atlaskit/icon/core/theme";

import { Icon } from "@/components/ui/icon";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
	/**
	 * Resets the currently selected prototype to its initial state.
	 */
	onReset: () => void;
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
	onReset,
}: Readonly<GalleryToggleProps>) {
	const { theme, setTheme } = useTheme();
	const themeLabel = getThemeLabel(theme);
	const galleryToggleLabel = open ? "Close gallery" : "Open gallery";

	return (
		<div
			className={cn(
				// Anchored top-right, independent of the bottom-pinned strip.
				"fixed top-4 right-4 z-40 inline-flex items-center gap-2",
				className,
			)}
		>
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger
						render={
							<button
								type="button"
								aria-label="Reset"
								onClick={onReset}
								className={GALLERY_CONTROL_BUTTON_CLASS_NAME}
							>
								<GalleryControlSquircle>
									<Icon render={<RetryIcon label="" color="currentColor" size="small" />} />
								</GalleryControlSquircle>
							</button>
						}
					/>
					<TooltipContent side="bottom">Reset</TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger
						render={
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
						}
					/>
					<TooltipContent side="bottom">{themeLabel}</TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger
						render={
							<button
								type="button"
								aria-expanded={open}
								aria-label={galleryToggleLabel}
								onClick={onToggle}
								className={GALLERY_CONTROL_BUTTON_CLASS_NAME}
							>
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
						}
					/>
					<TooltipContent side="bottom">{galleryToggleLabel}</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		</div>
	);
}
